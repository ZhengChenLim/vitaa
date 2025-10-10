"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Wind, CloudFog, Bell, Shield, TrendingUp, Factory } from "lucide-react";

// recharts (client-side)
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

/* ----------------------------- Types & helpers ----------------------------- */
type XY = { x: number; y: number };

type Series = Record<string, XY[]>; // e.g., { "PM2.5": XY[], "AQI": XY[] }

type LocationSeries = Record<string, Series>; // e.g., { "Kuala Lumpur": Series, "Malaysia": Series }

export type AirStatsResponse = {
  locations: string[]; // ["Kuala Lumpur", "Malaysia"]
  years: number[]; // all years present
  series: LocationSeries; // keyed by location
};

const COLORS = {
  line: "#0ea5e9", // cyan-500
  grid: "#e5e7eb", // slate-200
  pm25: "#ef4444", // red-500
  aqi: "#8b5cf6", // violet-500
};

const numberFmt = (n: number) => (n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : `${n}`);

function prepLineData(loc: Series, key: string) {
  const arr = loc[key] ?? [];
  return arr.map((p) => ({ year: p.x, value: p.y }));
}

function round1(n: number | undefined) {
  return n == null ? "–" : (Math.round(n * 10) / 10).toFixed(1);
}

/* --------------------------------- UI bits -------------------------------- */
function KPI({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <Card className="border-slate-200/70">
      <CardContent className="p-5">
        <div className="text-sm font-medium text-slate-700">{label}</div>
        <div className="mt-1 flex items-end gap-1 text-3xl font-extrabold" style={{ color }}>
          <span>{value}</span>
          {unit && <span className="text-base text-slate-500">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function LinePanel({
  title,
  data,
  ySuffix,
  hint,
  color = COLORS.line,
}: {
  title: string;
  data: { year: number; value: number }[];
  ySuffix?: string;
  hint?: string;
  color?: string;
}) {
  return (
    <Card className="border-slate-200/70">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(n) => `${n}${ySuffix ?? ""}`} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v: number | string) => `${v}${ySuffix ?? ""}`}
                labelFormatter={(l) => `${l}`}
              />
              <Legend />
              <Line type="monotone" name={title} dataKey="value" strokeWidth={2} dot={false} stroke={color} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
      </CardContent>
    </Card>
  );
}

/* -------------------------- Map (dynamic import) -------------------------- */
const AirAqiMap = dynamic(() => import("@/components/AirAqiMap"), { ssr: false });

/* ---------------------------------- Page ---------------------------------- */
export default function AirQualityPage() {
  const t = useTranslations("AIR");

  const [data, setData] = useState<AirStatsResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8001";

  useEffect(() => {
    (async () => {
      try {
        // Optional backend endpoint matching the NCD page pattern
        const res = await fetch(`${API_BASE}/api/air/summary-series`);
        if (!res.ok) throw new Error("Failed to load air quality stats");
        const j = (await res.json()) as AirStatsResponse;
        setData(j);
      } catch (e: any) {
        setErr(e?.message ?? "Error");
      }
    })();
  }, [API_BASE]);

  const kl = data?.series?.["Kuala Lumpur"]; // expects keys: PM2.5, AQI
  const my = data?.series?.["Malaysia"]; // national series (optional)

  const klPm25 = useMemo(() => (kl ? prepLineData(kl, "PM2.5") : []), [kl]);
  const klAqi = useMemo(() => (kl ? prepLineData(kl, "AQI") : []), [kl]);
  const myPm25 = useMemo(() => (my ? prepLineData(my, "PM2.5") : []), [my]);

  // Latest snapshots (fallbacks are examples from the brief)
  const latest = <T extends { year: number; value: number }>(arr: T[]) => arr[arr.length - 1]?.value;
  const latestKlPm25 = latest(klPm25) ?? 15.3;
  const latestMyPm25 = latest(myPm25) ?? 10;
  const latestKlAqi = latest(klAqi) ?? 88;

  return (
    <main className="px-4 max-w-6xl mx-auto space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-[url('/air-quality-hero.jpg')] bg-cover bg-center mt-8">
        <div className="backdrop-brightness-50 p-8 md:p-36 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow">{t("title")}</h1>
          <p className="mt-2 max-w-4xl mx-auto text-white/90">{t("subtitle")}</p>
        </div>
      </section>

      {/* Why Air Quality Matters */}
      <section className="mx-auto mt-12 max-w-6xl">
        <h2 className="text-center text-2xl font-semibold">{t("whyTitle")}</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-xl font-medium">{t("whyHeading")}</h3>
            <div className="space-y-2">
              <p className="text-base text-muted-foreground leading-relaxed">{t("whyP1")}</p>
              <p className="text-base text-muted-foreground leading-relaxed">{t("whyP2")}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-slate-200/70">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <Wind className="h-4 w-4" />
                  {t("whyKpi1Label")}
                </div>
                <div className="mt-2 text-3xl font-extrabold text-sky-600">{t("whyKpi1Value")}</div>
                <div className="mt-1 text-xs text-slate-500">{t("whyKpi1Hint")}</div>
              </CardContent>
            </Card>
            <Card className="border-slate-200/70">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <Shield className="h-4 w-4" />
                  {t("whyKpi2Label")}
                </div>
                <div className="mt-2 text-3xl font-extrabold text-rose-600">{t("whyKpi2Value")}</div>
                <div className="mt-1 text-xs text-slate-500">{t("whyKpi2Hint")}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Links to NCDs */}
      <section className="mx-auto p-4 max-w-6xl bg-[#F4F9F6] rounded-xl">
        <h2 className="text-center text-2xl font-semibold">{t("ncdLinkTitle")}</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">{t("ncdMechanismsTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground">
                <li>{t("ncdPoint1")}</li>
                <li>{t("ncdPoint2")}</li>
                <li>{t("ncdPoint3")}</li>
                <li>{t("ncdPoint4")}</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">{t("ncdExamplesTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground">
                <li>{t("ncdExample1")}</li>
                <li>{t("ncdExample2")}</li>
                <li>{t("ncdExample3")}</li>
                <li>{t("ncdExample4")}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Malaysia Reality */}
      <section className="mx-auto mt-4 max-w-6xl">
        <h2 className="text-center text-2xl font-semibold">{t("myRealityTitle")}</h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">{t("myRealitySubtitle")}</p>

        {err && <p className="mt-3 text-center text-sm text-red-600">{err}</p>}
        {!data && !err && <p className="mt-3 text-center text-sm text-slate-500">{t("loading")}</p>}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <KPI label={t("kpiKlPm25Label")} value={round1(latestKlPm25)} unit="µg/m³" color={COLORS.pm25} />
          <KPI label={t("kpiMyPm25Label")} value={round1(latestMyPm25)} unit="µg/m³" color={COLORS.pm25} />
          <KPI label={t("kpiKlAqiLabel")} value={round1(latestKlAqi)} unit="AQI" color={COLORS.aqi} />
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <LinePanel title={t("linePm25KlTitle")} data={klPm25} ySuffix=" µg/m³" hint={t("linePm25Hint")} color={COLORS.pm25} />
          <LinePanel title={t("lineAqiKlTitle")} data={klAqi} ySuffix=" AQI" hint={t("lineAqiHint")} color={COLORS.aqi} />
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Factory className="h-4 w-4" />{t("industryTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground leading-relaxed">
              <p>{t("industryP1")}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><CloudFog className="h-4 w-4" />{t("hazeTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground leading-relaxed">
              <p>{t("hazeP1")}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Map replaces Monitoring App CTA */}
      <section className="mx-auto max-w-6xl mb-10">
        <div className="mt-10 rounded-2xl bg-white p-6 md:p-8">
          <h3 className="text-xl font-extrabold text-slate-800 text-center">
            {t("map.title", { default: "Malaysia Live AQI by State" })}
          </h3>
          <p className="text-center text-sm text-muted-foreground mt-1">
            {t("map.subtitle", { default: "Pick a state to view its AQI on the map. Only the selected state is shown." })}
          </p>

          <div className="mt-6">
            <AirAqiMap api="http://127.0.0.1:8000/api/aqi/all-states" />
          </div>

          {/* Optional: keep links as secondary actions */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/resources/air-quality" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">{t("app.ctaSecondary")}</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
