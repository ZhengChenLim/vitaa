"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Wind, CloudFog, Shield, Factory } from "lucide-react";

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
type Series = Record<string, XY[]>;            // { "PM2.5": XY[], "AQI": XY[] }
type LocationSeries = Record<string, Series>;  // { "Kuala Lumpur": Series, "Malaysia": Series }

export type AirStatsResponse = {
  locations: string[];
  years: number[];
  series: LocationSeries;
};

type AqiStateRow = {
  state: string;
  aqi: number;
  category?: string;
  updated?: string;
};

const COLORS = {
  line: "#0ea5e9", // cyan-500
  grid: "#e5e7eb", // slate-200
  pm25: "#ef4444", // red-500
  aqi: "#8b5cf6", // violet-500
};

function prepLineData(loc: Series, key: string) {
  const arr = loc[key] ?? [];
  return arr.map((p) => ({ year: p.x, value: p.y }));
}
function round1(n: number | undefined) {
  return n == null ? "–" : (Math.round(n * 10) / 10).toFixed(1);
}

function aqiToCategory(aqi: number): { label: string; cls: string } {
  // US EPA breakpoints (adjust if your API already provides category)
  if (aqi <= 50) return { label: "Good", cls: "bg-emerald-100 text-emerald-700" };
  if (aqi <= 100) return { label: "Moderate", cls: "bg-yellow-100 text-yellow-800" };
  if (aqi <= 150) return { label: "Unhealthy (SG)", cls: "bg-orange-100 text-orange-800" };
  if (aqi <= 200) return { label: "Unhealthy", cls: "bg-rose-100 text-rose-700" };
  if (aqi <= 300) return { label: "Very Unhealthy", cls: "bg-purple-100 text-purple-800" };
  return { label: "Hazardous", cls: "bg-slate-900 text-white" };
}

/* -------------------------- Map (dynamic import) -------------------------- */
const AirAqiMap = dynamic(() => import("@/components/AirAqiMap"), { ssr: false });


/* ---------------------------------- Page ---------------------------------- */
export default function AirQualityPage() {
  const t = useTranslations("AIR");


  // Table data for /api/aqi/all-states
  const [aqiRows, setAqiRows] = useState<AqiStateRow[] | null>(null);
  const [aqiErr, setAqiErr] = useState<string | null>(null);
  const [aqiLoading, setAqiLoading] = useState<boolean>(false);

  // Env-aware API base (fallback to local dev)
  const API_BASE = "http://127.0.0.1:8000";
  const apiJoin = (b: string, p: string) => `${b}/${p.replace(/^\/+/, "")}`;



  useEffect(() => {
  (async () => {
    setAqiLoading(true);
    setAqiErr(null);
    try {
      const res = await fetch(apiJoin(API_BASE, "/api/aqi/all-states"), { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load states AQI");
      const j = await res.json();

      // Match the map's expected structure
      if (j.status === 'ok' && Array.isArray(j.results)) {
        const rows: AqiStateRow[] = j.results.map((r: any) => ({
          state: r.state ?? "Unknown",
          aqi: Number(r.aqi ?? NaN),
          category: undefined, // Will be derived from AQI
          updated: r.time ?? undefined,
        }));
        
        // Filter invalid numbers, sort by AQI desc
        const validRows = rows.filter(r => Number.isFinite(r.aqi)).sort((a, b) => b.aqi - a.aqi);
        setAqiRows(validRows);
      } else {
        throw new Error("Unexpected API response structure");
      }
    } catch (e: any) {
      setAqiErr(e?.message ?? "Error");
      setAqiRows(null);
    } finally {
      setAqiLoading(false);
    }
  })();
}, [API_BASE]);


  return (
    <main className="px-4 max-w-6xl mx-auto space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-[url('/air-quality-hero.png')] bg-cover bg-center mt-8">
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
                <div className="mt-2 text-xl font-extrabold text-sky-600">{t("whyKpi1Value")}</div>
                <div className="mt-1 text-xs text-slate-500">{t("whyKpi1Hint")}</div>
              </CardContent>
            </Card>
            <Card className="border-slate-200/70">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <Shield className="h-4 w-4" />
                  {t("whyKpi2Label")}
                </div>
                <div className="mt-2 text-xl font-extrabold text-rose-600">{t("whyKpi2Value")}</div>
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

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Factory className="h-4 w-4" />
                {t("industryTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground leading-relaxed">
              <p>{t("industryP1")}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CloudFog className="h-4 w-4" />
                {t("hazeTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground leading-relaxed">
              <p>{t("hazeP1")}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Map + Table section */}
      <section className="mx-auto max-w-6xl mb-10">
        <div className="mt-10 rounded-2xl bg-white p-6 md:p-8">
          <h3 className="text-xl font-extrabold text-slate-800 text-center">
            {t("map.title", { default: "Malaysia Live AQI by State" })}
          </h3>
          <p className="text-center text-sm text-muted-foreground mt-1">
            {t("map.subtitle", {
              default:
                "States are color-coded by their latest AQI. Click a state to zoom and see details.",
            })}
          </p>

          <div className="mt-6">
            <AirAqiMap api={apiJoin(API_BASE, "/api/aqi/all-states")} />
          </div>

          {/* ▶️ New: States AQI table (button removed) */}
          <div className="mt-8 overflow-x-auto">
            <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50">
                <tr className="text-left text-sm text-slate-600">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">{t("table.state", { default: "State" })}</th>
                  <th className="px-4 py-3">{t("table.aqi", { default: "AQI" })}</th>
                  <th className="px-4 py-3">{t("table.category", { default: "Category" })}</th>
                  <th className="px-4 py-3">{t("table.updated", { default: "Updated" })}</th>
                </tr>
              </thead>
              <tbody>
                {aqiLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-sm text-slate-500 text-center">
                      {t("loading", { default: "Loading..." })}
                    </td>
                  </tr>
                )}
                {aqiErr && !aqiLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-sm text-red-600 text-center">
                      {aqiErr}
                    </td>
                  </tr>
                )}
                {!aqiLoading && !aqiErr && aqiRows?.length ? (
                  aqiRows.map((r, i) => {
                    const cat = r.category
                      ? { label: r.category, cls: "" }
                      : aqiToCategory(r.aqi);
                    const updated =
                      r.updated
                        ? new Date(r.updated).toLocaleString()
                        : "—";
                    return (
                      <tr key={`${r.state}-${i}`} className="border-t border-slate-200 text-sm">
                        <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{r.state}</td>
                        <td className="px-4 py-3 font-semibold">{Math.round(r.aqi)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cat.cls || "bg-slate-100 text-slate-700"}`}>
                            {cat.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{updated}</td>
                      </tr>
                    );
                  })
                ) : (
                  !aqiLoading &&
                  !aqiErr && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-sm text-slate-500 text-center">
                        {t("table.noData", { default: "No data available." })}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-slate-500">
              {t("table.note", {
                default:
                  "Sorted by AQI (highest first). Categories are inferred if not provided by the API.",
              })}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
