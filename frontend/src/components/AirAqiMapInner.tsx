'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@/components/ui/select';
import {
  MapContainer, TileLayer, Marker, Popup, useMap,
  GeoJSON as RLGeoJSON, Pane,
} from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

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

/* ------------------------- Helpers & constants ------------------------- */
const STATE_CENTROIDS: Record<string, [number, number]> = {
  Johor: [1.4927, 103.7414],
  Kedah: [6.1184, 100.3685],
  Kelantan: [6.1254, 102.2381],
  Melaka: [2.1896, 102.2501],
  'Negeri Sembilan': [2.7258, 101.9424],
  Pahang: [3.8126, 103.3256],
  Penang: [5.4164, 100.3327],
  'Pulau Pinang': [5.4164, 100.3327],
  Perak: [4.5921, 101.0901],
  Perlis: [6.443, 100.2043],
  Sabah: [5.978, 116.0753],
  Sarawak: [1.5533, 110.3592],
  Selangor: [3.0738, 101.5183],
  Terengganu: [5.3302, 103.1408],
  'Kuala Lumpur': [3.139, 101.6869],
  'W.P. Kuala Lumpur': [3.139, 101.6869],
  Putrajaya: [2.9264, 101.6964],
  Labuan: [5.2831, 115.2308],
};

// alias differences
const NAME_ALIASES: Record<string, string> = {
  'Pulau Pinang': 'Penang',
  'WP Kuala Lumpur': 'Kuala Lumpur',
  'W.P. Kuala Lumpur': 'Kuala Lumpur',
  'Wilayah Persekutuan Kuala Lumpur': 'Kuala Lumpur',
  'WP Labuan': 'Labuan',
  'WP Putrajaya': 'Putrajaya',
};
const normalize = (n: string) => NAME_ALIASES[n] ?? n;

// prefer stronger styling so polygons are clearly visible
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

/* ------------------------------- Component ------------------------------ */
export default function AirAqiMapInner({
  api = 'http://127.0.0.1:8000/api/aqi/all-states',
  geoUrl = '/geo/malaysia-states.geojson', // put your file here (public/geo/…)
}: { api?: string; geoUrl?: string }) {
  const [data, setData] = useState<AqiItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string>('');
  const [fc, setFc] = useState<GeoFC | null>(null);

  const [selectedBounds, setSelectedBounds] = useState<L.LatLngBounds | undefined>();
  const [allBounds, setAllBounds] = useState<L.LatLngBounds | undefined>();

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
        if (!gj?.features?.length) {
          console.warn('GeoJSON loaded but has no features');
        }
        setFc(gj);

        // compute bounds for all features on first load
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
  // Only states that exist both in GeoJSON and API
  const states = useMemo(() => {
    const geoNames = new Set<string>();
    fc?.features.forEach(f => {
      const n = normalize(
        (f.properties?.shapeName ??
         f.properties?.name ??
         f.properties?.NAME ??
         f.properties?.state ?? '') as string
      );
      if (n) geoNames.add(n);
    });
    const s = new Set<string>();
    data.forEach(d => {
      const n = normalize(d.state);
      if (geoNames.has(n)) s.add(n);
    });
    return Array.from(s).sort();
  }, [data, fc]);

  // Map state -> AQI object
  const aqiByState = useMemo(() => {
    const m = new Map<string, AqiItem>();
    data.forEach(d => m.set(normalize(d.state), d));
    return m;
  }, [data]);

  /* -------------------------------- Styling -------------------------------- */
  // style function must accept optional feature (react-leaflet typing)
  const styleFn: ((feature?: Feature<Geometry, FeatureProps>) => L.PathOptions) = (feature) => {
    const name = feature
      ? normalize(
          (feature.properties?.shapeName ??
           feature.properties?.name ??
           feature.properties?.NAME ??
           feature.properties?.state ?? '') as string
        )
      : '';

    const selected = !!selectedState && name === selectedState;
    const aqi = aqiByState.get(name)?.aqi ?? 0;
    const fill = selected ? aqiColor(aqi) : '#94a3b8';

    return {
      color: selected ? '#0f172a' : '#64748b', // border color
      weight: selected ? 2.5 : 1.5,
      fillColor: fill,
      fillOpacity: selected ? 0.55 : 0.22,
      opacity: 1,
    };
  };

  const onEachFeature = (feature: GeoFeature, layer: L.Layer) => {
    const name = normalize(
      (feature.properties?.shapeName ??
       feature.properties?.name ??
       feature.properties?.NAME ??
       feature.properties?.state ?? '') as string
    );
    if (!name) return;

    layer.on('click', () => {
      setSelectedState(name);
      const pathLayer = layer as L.Path & { getBounds?: () => L.LatLngBounds };
      const b = pathLayer.getBounds?.();
      if (b && b.isValid()) setSelectedBounds(b);
      else {
        const c = STATE_CENTROIDS[name];
        if (c) setSelectedBounds(L.latLngBounds([c, c]));
      }
    });

    layer.on('mouseover', () => {
      (layer as any).setStyle?.({ weight: 2.5, fillOpacity: selectedState === name ? 0.6 : 0.28 });
    });
    layer.on('mouseout', () => {
      (layer as any).setStyle?.(styleFn(feature));
    });
  };

  // Update bounds when dropdown changes
  useEffect(() => {
    if (!selectedState || !fc) {
      setSelectedBounds(undefined);
      return;
    }
    const target = fc.features.find(f => {
      const n = normalize(
        (f.properties?.shapeName ??
         f.properties?.name ??
         f.properties?.NAME ??
         f.properties?.state ?? '') as string
      );
      return n === selectedState;
    });
    if (target) {
      const layer = L.geoJSON(target as any);
      const b = layer.getBounds();
      if (b && b.isValid()) setSelectedBounds(b);
    } else {
      const c = STATE_CENTROIDS[selectedState];
      if (c) setSelectedBounds(L.latLngBounds([c, c]));
    }
  }, [selectedState, fc]);

  // Optional marker at center of selected state
  const selectedMarker = useMemo(() => {
    if (!selectedState) return null;
    const aqi = aqiByState.get(selectedState);
    const center =
      STATE_CENTROIDS[selectedState] ||
      (selectedBounds ? selectedBounds.getCenter() : undefined);
    if (!aqi || !center) return null;
    return { center, aqi };
  }, [selectedState, aqiByState, selectedBounds]);

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
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a state…" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            {[
              { c: aqiColor(30),  l: 'Good (0–50)' },
              { c: aqiColor(80),  l: 'Moderate (51–100)' },
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
          </div>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        {/* Map */}
        <div className="h-[460px] w-full overflow-hidden rounded-lg">
          <MapContainer center={[4.2105, 101.9758]} zoom={6} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            {/* Fit to bounds */}
            <FitToBounds bounds={fitBounds} />

            {/* Polygons above tiles */}
            <Pane name="polys" style={{ zIndex: 450 }}>
              {fc && (
                <RLGeoJSON
                  data={fc as any}
                  style={styleFn}
                  onEachFeature={onEachFeature}
                />
              )}
            </Pane>

            {/* Optional: marker with AQI details */}
            {selectedMarker && (
              <Marker position={selectedMarker.center} icon={circleIcon(aqiColor(selectedMarker.aqi.aqi))}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{selectedState}</div>
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

        {!selectedState && (
          <p className="text-xs text-slate-500">Select or click a state polygon to highlight it with its AQI color.</p>
        )}
      </CardContent>
    </Card>
  );
}
