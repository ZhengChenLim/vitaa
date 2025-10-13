'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  MapContainer, TileLayer, Marker, Popup, useMap,
  GeoJSON as RLGeoJSON, Pane,
} from 'react-leaflet';
import * as L from 'leaflet';
import type { GeoJSON as LGeoJSON } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

/* -------------------------------- Types -------------------------------- */
type AqiItem = {
  state: string;
  aqi: number;
  city: string;
  dominentpol: string;
  time: string;
};
type AqiResponse = { status: 'ok' | string; results: AqiItem[] };

type FeatureProps = Record<string, any>;
type GeoFeature = Feature<Geometry, FeatureProps>;
type GeoFC = FeatureCollection<Geometry, FeatureProps>;

/* ---------------------- .env-aware API base + join ---------------------- */
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000').replace(/\/+$/, '');
const apiJoin = (base: string, path: string) => `${base}/${path.replace(/^\/+/, '')}`;

/* ------------------------- Name canon & helpers ------------------------- */
const canon = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u2011-\u2015]/g, '-')   // normalize dashes
    .replace(/[^a-z0-9]+/g, ' ')        // keep letters/digits -> spaces
    .trim()
    .replace(/\s+/g, ' ');

const ALIASES: Record<string, string> = {
  'pulau pinang': 'penang',
  'wp kuala lumpur': 'kuala lumpur',
  'w p kuala lumpur': 'kuala lumpur',
  'wilayah persekutuan kuala lumpur': 'kuala lumpur',
  'wp labuan': 'labuan',
  'labuan': 'labuan',
  'wilayah persekutuan labuan': 'labuan',
  'putrajaya': 'putrajaya',
  'wp putrajaya': 'putrajaya',
  'w p putrajaya': 'putrajaya',
  'malacca': 'melaka',
  'melaka': 'melaka',
};

const stateKey = (raw: string) => {
  const c = canon(raw);
  return ALIASES[c] ?? c;
};

const featureStateKey = (props: FeatureProps) =>
  stateKey(
    (props?.shapeName ??
      props?.name ??
      props?.NAME ??
      props?.state ??
      '') as string
  );

const titleCase = (k: string) => k.replace(/\b\w/g, (t) => t.toUpperCase());

/* ------------------------- AQI color & utilities ------------------------ */
const aqiColor = (aqi: number) =>
  aqi <= 50 ? '#2ecc71' :
    aqi <= 100 ? '#f1c40f' :
      aqi <= 150 ? '#e67e22' :
        aqi <= 200 ? '#e74c3c' :
          aqi <= 300 ? '#8e44ad' : '#7f1d1d';

const aqiLabel = (aqi: number) =>
  aqi <= 50 ? 'Good' :
    aqi <= 100 ? 'Moderate' :
      aqi <= 150 ? 'Unhealthy (Sensitive)' :
        aqi <= 200 ? 'Unhealthy' :
          aqi <= 300 ? 'Very Unhealthy' : 'Hazardous';

const circleIcon = (hex: string) =>
  L.divIcon({
    className: 'aqi-dot',
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:${hex};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,.2)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

function FitToBounds({ bounds }: { bounds?: L.LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [bounds, map]);
  return null;
}

/* ------------------------ Centroids (for marker) ------------------------ */
const STATE_CENTROIDS_DISPLAY: Record<string, [number, number]> = {
  Johor: [1.4927, 103.7414],
  Kedah: [6.1184, 100.3685],
  Kelantan: [6.1254, 102.2381],
  Melaka: [2.1896, 102.2501],
  'Negeri Sembilan': [2.7258, 101.9424],
  Pahang: [3.8126, 103.3256],
  Penang: [5.4164, 100.3327],
  Perak: [4.5921, 101.0901],
  Perlis: [6.443, 100.2043],
  Sabah: [5.978, 116.0753],
  Sarawak: [1.5533, 110.3592],
  Selangor: [3.0738, 101.5183],
  Terengganu: [5.3302, 103.1408],
  'Kuala Lumpur': [3.139, 101.6869],
  Putrajaya: [2.9264, 101.6964],
  Labuan: [5.2831, 115.2308],
};
const CENTROIDS_BY_KEY: Record<string, [number, number]> = Object.fromEntries(
  Object.entries(STATE_CENTROIDS_DISPLAY).map(([name, coords]) => [stateKey(name), coords])
);

/* ------------------------------- Component ------------------------------ */
export default function AirAqiMapInner({
  api = apiJoin(API_BASE, '/api/aqi/all-states'),
  geoUrl = '/geo/malaysia-states.geojson',
  showCityDot = true,
}: { api?: string; geoUrl?: string; showCityDot?: boolean }) {
  const [data, setData] = useState<AqiItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [selectedStateDisplay, setSelectedStateDisplay] = useState<string>('');
  const resetSelection = () => setSelectedStateDisplay('');
  const [fc, setFc] = useState<GeoFC | null>(null);

  const [selectedBounds, setSelectedBounds] = useState<L.LatLngBounds | undefined>();
  const [allBounds, setAllBounds] = useState<L.LatLngBounds | undefined>();

  // GeoJSON layer ref to force re-style on load
  const geoRef = useRef<L.GeoJSON<any>>(null);

  /* ------------------------------ Fetch data ------------------------------ */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(api, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load AQI data');
        const j = (await res.json()) as AqiResponse;
        if (j.status !== 'ok') throw new Error('API status not ok');
        setData(j.results || []);
      } catch (e: any) {
        console.error(e);
        setErr(e?.message ?? 'Error');
      }
    })();
  }, [api]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(geoUrl, { cache: 'force-cache' });
        if (!res.ok) throw new Error(`Failed to load GeoJSON: ${res.status} ${res.statusText}`);
        const gj = (await res.json()) as GeoFC;
        setFc(gj);
        const layer = L.geoJSON(gj as any);
        const b = layer.getBounds();
        if (b && b.isValid()) setAllBounds(b);
      } catch (e: any) {
        console.error(e);
        setErr(prev => prev ?? e?.message ?? 'Error');
      }
    })();
  }, [geoUrl]);

  /* ----------------------------- Derived state ---------------------------- */
  // Aggregate AQI per canonical state key (worst AQI if multiple)
  const aqiByState = useMemo(() => {
    const m = new Map<string, AqiItem>();
    for (const d of data) {
      const k = stateKey(d.state);
      const prev = m.get(k);
      if (!prev || d.aqi > prev.aqi) m.set(k, d);
    }
    return m;
  }, [data]);

  // Dropdown: only states that exist in BOTH datasets
  const statesDisplay = useMemo(() => {
    const geoKeys = new Set<string>();
    fc?.features.forEach(f => geoKeys.add(featureStateKey(f.properties || {})));
    const s = new Set<string>();
    for (const k of aqiByState.keys()) if (geoKeys.has(k)) s.add(titleCase(k));
    return Array.from(s).sort();
  }, [aqiByState, fc]);

  const selectedKey = stateKey(selectedStateDisplay);

  /* -------------------------------- Styling -------------------------------- */
  const styleFn: ((feature?: Feature<Geometry, FeatureProps>) => L.PathOptions) = (feature) => {
    const k = feature ? featureStateKey(feature.properties || {}) : '';
    const aqiVal = aqiByState.get(k)?.aqi;
    const hasData = typeof aqiVal === 'number' && !Number.isNaN(aqiVal);
    const isSelected = selectedKey && selectedKey === k;

    return {
      color: isSelected ? '#0f172a' : '#475569',
      weight: isSelected ? 2.8 : 1.6,
      fillColor: hasData ? aqiColor(aqiVal as number) : '#cbd5e1',
      fillOpacity: hasData ? 0.6 : 0.3,
      opacity: 1,
    };
  };

  const onEachFeature = (feature: GeoFeature, layer: L.Layer) => {
    const k = featureStateKey(feature.properties || {});
    if (!k) return;
    const display = titleCase(k);
    const aqiObj = aqiByState.get(k);

    (layer as any).bindTooltip(
      aqiObj
        ? `<div style="font-size:12px">
             <div style="font-weight:600">${display}</div>
             <div>AQI: ${aqiObj.aqi} — ${aqiLabel(aqiObj.aqi)}</div>
             <div>Dominant: ${(aqiObj.dominentpol || '-').toString().toUpperCase()}</div>
           </div>`
        : `<div style="font-size:12px"><strong>${display}</strong><div>No data</div></div>`,
      { sticky: true }
    );

    layer.on('click', () => {
      setSelectedStateDisplay(display);
      const pathLayer = layer as L.Path & { getBounds?: () => L.LatLngBounds };
      const b = pathLayer.getBounds?.();
      if (b && b.isValid()) setSelectedBounds(b);
      else {
        const c = CENTROIDS_BY_KEY[k];
        if (c) setSelectedBounds(L.latLngBounds([c, c]));
      }
    });

    layer.on('mouseover', () => (layer as any).setStyle?.({ weight: 2.8, fillOpacity: aqiObj ? 0.7 : 0.35 }));
    layer.on('mouseout', () => (layer as any).setStyle?.(styleFn(feature)));
  };

  // Zoom when dropdown changes
  useEffect(() => {
    if (!selectedStateDisplay || !fc) {
      setSelectedBounds(undefined);
      return;
    }
    const selKey = stateKey(selectedStateDisplay);
    const target = fc.features.find(f => featureStateKey(f.properties || {}) === selKey);
    if (target) {
      const b = L.geoJSON(target as any).getBounds();
      if (b && b.isValid()) setSelectedBounds(b);
    } else {
      const c = CENTROIDS_BY_KEY[selKey];
      if (c) setSelectedBounds(L.latLngBounds([c, c]));
    }
  }, [selectedStateDisplay, fc]);

  // Optional marker at selected state's centroid
  const selectedMarker = useMemo(() => {
    if (!showCityDot || !selectedKey) return null;
    const aqi = aqiByState.get(selectedKey);
    const center = CENTROIDS_BY_KEY[selectedKey];
    if (!aqi || !center) return null;
    return { center, aqi };
  }, [showCityDot, selectedKey, aqiByState]);

  // Force re-style when AQI or selection changes (no click needed)
  useEffect(() => {
    if (geoRef.current) {
      (geoRef.current as unknown as LGeoJSON).setStyle((f: any) => styleFn(f));
    }
  }, [fc, aqiByState, selectedKey]);

  // Also change key so Leaflet rebuilds paths if needed
  const aqiRenderKey = useMemo(() => {
    return data
      .map(d => `${stateKey(d.state)}:${d.aqi}`)
      .sort()
      .join('|');
  }, [data]);

  const fitBounds = selectedBounds ?? allBounds;

  /* --------------------------------- Render -------------------------------- */
  return (
    <Card className="border-slate-200/70">
      <CardContent className="p-4 space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <Label className="text-sm">State</Label>
            <div className="mt-1 w-64">
              <Select value={selectedStateDisplay || undefined} onValueChange={setSelectedStateDisplay}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a state…" />
                </SelectTrigger>
                <SelectContent className='z-[1000]'>
                  {statesDisplay.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedStateDisplay('')}
              className="text-slate-600 hover:text-slate-900"
              disabled={!selectedStateDisplay}
            >
              Reset
            </Button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            {[
              { c: aqiColor(30), l: 'Good (0–50)' },
              { c: aqiColor(80), l: 'Moderate (51–100)' },
              { c: aqiColor(130), l: 'USG (101–150)' },
              { c: aqiColor(180), l: 'Unhealthy (151–200)' },
              { c: aqiColor(250), l: 'Very Unhealthy (201–300)' },
              { c: aqiColor(400), l: 'Hazardous (300+)' },
            ].map((x) => (
              <span key={x.l} className="inline-flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: x.c }} />
                <span className="text-slate-600">{x.l}</span>
              </span>
            ))}
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-slate-300" />
              <span className="text-slate-600">No data</span>
            </span>
          </div>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        {/* Map */}
        <div className="h-[460px] w-full overflow-hidden rounded-lg">
          <MapContainer center={[4.2105, 101.9758]} zoom={6} scrollWheelZoom style={{ height: '100%', width: '100%' }}
            className='z-0'>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            <FitToBounds bounds={fitBounds} />

            <Pane name="polys" style={{ zIndex: 450 }}>
              {fc && (
                <RLGeoJSON
                  ref={geoRef as any}
                  key={aqiRenderKey + '|' + selectedKey}
                  data={fc as any}
                  style={styleFn}
                  onEachFeature={onEachFeature}
                />
              )}
            </Pane>

            {selectedMarker && (
              <Marker position={selectedMarker.center} icon={circleIcon(aqiColor(selectedMarker.aqi.aqi))}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{selectedStateDisplay}</div>
                    <div>{selectedMarker.aqi.city}</div>
                    <div className="mt-1">
                      <span className="font-medium">AQI:</span> {selectedMarker.aqi.aqi} — {aqiLabel(selectedMarker.aqi.aqi)}
                    </div>
                    <div className="mt-1">
                      <span className="font-medium">Dominant:</span> {selectedMarker.aqi.dominentpol?.toUpperCase?.() ?? '-'}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(selectedMarker.aqi.time).toLocaleString()}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {!selectedStateDisplay && (
          <p className="text-xs text-slate-500">
            States are color-coded by their latest AQI. Click a state or use the dropdown to zoom and see details.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
