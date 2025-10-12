"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplet, HeartPulse, Activity, ScanHeart, Brain } from "lucide-react";
import Link from "next/link";

// recharts (client-side)
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    BarChart,
    Bar,
    Legend,
} from "recharts";

/* ----------------------------- Types & helpers ----------------------------- */
type XY = { x: number; y: number };
type Series = { number: XY[]; percent: XY[] };
type LocationSeries = Record<string, Series>;
type StatsResponse = {
    locations: string[];
    years: number[];
    series: Record<"Global" | "Malaysia", LocationSeries>;
};
const COLORS = {
    line: "#0ea5e9",         // cyan-500
    grid: "#e5e7eb",         // slate-200
    cvd: "#f6b92aff",     // red-500
    dia: "#ef4444",         // emerald-500
    str: "#8b5cf6",          // violet-500
};

function numberFmt(n: number) {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return `${n}`;
}
const pct = (v?: number) => (v == null ? "" : `${v.toFixed(1)}%`);

function prepLineData(loc: LocationSeries) {
    const ncd = loc["Non-communicable diseases"];
    return ncd?.number?.map((p) => ({ year: p.x, ncd: p.y })) ?? [];
}
function prepBarData(loc: LocationSeries) {

    const dia = loc["Diabetes mellitus"]?.percent ?? [];
    const cvd = loc["Cardiovascular diseases"]?.percent ?? [];
    const str = loc["Stroke"]?.percent ?? [];

    const byYear = new Map<number, { year: number; cvd?: number; dia?: number; str?: number }>();
    for (const arr of [dia, cvd, str]) {
        for (const { x } of arr) if (!byYear.has(x)) byYear.set(x, { year: x });
    }

    for (const { x, y } of dia) byYear.get(x)!.dia = y * 100;
    for (const { x, y } of cvd) byYear.get(x)!.cvd = y * 100;
    for (const { x, y } of str) byYear.get(x)!.str = y * 100;

    return Array.from(byYear.values())
        .sort((a, b) => a.year - b.year)
        .slice(-7);
}

function KPICards({
    locTitle,
    loc,
    t,
}: {
    locTitle: string;
    loc: LocationSeries;
    t: ReturnType<typeof useTranslations>;
}) {
    const last = (arr: XY[]) => arr[arr.length - 1]?.y ?? 0;
    const cvd = last(loc["Cardiovascular diseases"]?.percent ?? []) * 100;
    const dia = last(loc["Diabetes mellitus"]?.percent ?? []) * 100;
    const str = last(loc["Stroke"]?.percent ?? []) * 100;

    const items = [
        { key: "dia", label: t("diabetes"), value: pct(dia), color: COLORS.dia },
        { key: "cvd", label: t("cardio"), value: pct(cvd), color: COLORS.cvd },
        { key: "str", label: t("stroke"), value: pct(str), color: COLORS.str },
    ] as const;

    return (
        <>
            <h3 className="text-xl font-semibold tracking-tight">{locTitle}</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
                {items.map((k) => (
                    <Card key={k.key} className="border-slate-200/70">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2">
                                <span
                                    className="inline-block h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: k.color }}
                                />
                                <div className="text-sm font-medium text-slate-800">{k.label}</div>
                            </div>
                            <div
                                className="mt-2 text-3xl font-extrabold"
                                style={{ color: k.color }}
                            >
                                {k.value}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">{t("ofTotalDeaths")}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </>
    );
}
function LinePanel({
    title,
    data,
    hint,
}: {
    title: string;
    data: { year: number; ncd: number }[];
    hint?: string;
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
                            <YAxis tickFormatter={numberFmt} tick={{ fontSize: 12 }} />
                            <Tooltip
                                formatter={(value: number | string) => {
                                    const num = typeof value === "number" ? value : Number(value);
                                    return numberFmt(num); // string is a valid ReactNode
                                }}
                                labelFormatter={(l) => `${l}`}
                            />
                            {/* no explicit colors */}
                            <Line type="monotone" dataKey="ncd" strokeWidth={2} dot={false} stroke={COLORS.line} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
            </CardContent>
        </Card>
    );
}

function BarsPanel({
    title,
    data,
    t,
}: {
    title: string;
    data: { year: number; cvd?: number; dia?: number; str?: number }[];
    t: ReturnType<typeof useTranslations>;
}) {
    const nameMap: Record<string, string> = {
        cvd: t("cardio"),
        dia: t("diabetes"),
        str: t("stroke"),
    };

    return (
        <Card className="border-slate-200/70">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="h-64 w-full">
                    <ResponsiveContainer>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={(n) => `${n}%`} tick={{ fontSize: 12 }} />
                            <Tooltip
                                formatter={(value: number | string, name: string) => {
                                    const num = typeof value === "number" ? value : Number(value);
                                    const label = nameMap[name] ?? name;
                                    return [pct(num), label] as [React.ReactNode, string];
                                }}
                                labelFormatter={(l) => `${l}`}
                            />
                            <Legend formatter={(value) => nameMap[value as string] ?? value} />
                            <Bar dataKey="cvd" name={nameMap.cvd} fill={COLORS.cvd} />
                            <Bar dataKey="dia" name={nameMap.dia} fill={COLORS.dia} />
                            <Bar dataKey="str" name={nameMap.str} fill={COLORS.str} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

/* ---------------------------------- Page ---------------------------------- */
export default function NcdPage() {
    const t = useTranslations("NCD");

    const [data, setData] = useState<StatsResponse | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8001'
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/ncd/stats-series`);
                if (!res.ok) throw new Error("Failed to load stats");
                const j = (await res.json()) as StatsResponse;
                setData(j);
            } catch (e: any) {
                setErr(e?.message ?? "Error");
            }
        })();
    }, []);

    const globalLoc = data?.series?.Global;
    const myLoc = data?.series?.Malaysia;

    const globalLine = useMemo(() => (globalLoc ? prepLineData(globalLoc) : []), [globalLoc]);
    const myLine = useMemo(() => (myLoc ? prepLineData(myLoc) : []), [myLoc]);

    const globalBars = useMemo(() => (globalLoc ? prepBarData(globalLoc) : []), [globalLoc]);
    const myBars = useMemo(() => (myLoc ? prepBarData(myLoc) : []), [myLoc]);

    return (
        <main className="px-4 max-w-6xl mx-auto space-y-12">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-2xl bg-[url('/library-hero.jpg')] bg-cover bg-center mt-8">
                <div className="backdrop-brightness-50 p-8 md:p-36 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow">
                        {t("title")}
                    </h1>
                    <p className="mt-2 max-w-4xl text-white/90">{t("subtitle")}</p>
                </div>
            </section>

            {/* Understanding NCDs */}
            <section className="mx-auto mt-12 max-w-6xl">
                <h2 className="text-center text-2xl font-semibold">{t("understanding")}</h2>

                <div className="mt-8 grid gap-8 md:grid-cols-2">
                    <div className="space-y-3 ">
                        <h3 className="text-xl font-medium">{t("whatHeading")}</h3>
                        <div className="space-y-2">
                            <p className="text-base text-muted-foreground leading-relaxed">{t("whatP1")}</p>
                            <p className="text-base text-muted-foreground leading-relaxed">{t("whatP2")}</p>
                        </div>
                    </div>

                    <div className="rounded-xl shadow-sm overflow-hidden">
                        <iframe
                            width="560"
                            height="315"
                            src="https://www.youtube.com/embed/BWolWB3tSEU?si=ZJAxetpyFK-8RQsB"
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                        />
                    </div>
                </div>
            </section>

            {/* NCDs vs Communicable */}
            <section className="mx-auto p-4 max-w-6xl bg-[#F4F9F6]">
                <h2 className="text-center text-2xl font-semibold">{t("ncdVsCd")}</h2>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">{t("ncdTitle")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground">
                                <li>{t("ncdPoint1")}</li>
                                <li>{t("ncdPoint2")}</li>
                                <li>{t("ncdPoint3")}</li>
                                <li>{t("ncdExamples")}</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">{t("cdTitle")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside space-y-2 text-base text-muted-foreground">
                                <li>{t("cdPoint1")}</li>
                                <li>{t("cdPoint2")}</li>
                                <li>{t("cdPoint3")}</li>
                                <li>{t("cdExamples")}</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Types */}
            <section className="mx-auto mt-12 max-w-6xl">
                <h2 className="text-center text-2xl font-semibold">{t("typesTitle")}</h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">{t("typesSubtitle")}</p>

                <div className="mt-6 grid gap-6 md:grid-cols-3">
                    {/* Diabetes */}
                    <Card className="relative flex flex-col justify-between rounded-lg border-0 shadow-sm overflow-hidden">
                        <span className="absolute inset-x-0 top-0 h-2 bg-red-500" />
                        <CardHeader className="flex flex-row items-center gap-3 bg-white p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                                <Droplet className="h-5 w-5" />
                            </div>
                            <CardTitle>{t("diabetesTitle")}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-base">
                            <p className="mb-3">{t("diabetesDesc")}</p>
                            <p className="font-medium text-emerald-600">{t("diabetesPrev")}</p>
                        </CardContent>
                        <CardFooter>
                            <Link href="/ncd/diabetes" className="w-full">
                                <Button variant="outline" className="w-full">
                                    {t("learnMore")}
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* Hypertension */}
                    <Card className="relative flex flex-col justify-between rounded-lg border-0 shadow-sm overflow-hidden">
                        <span className="absolute inset-x-0 top-0 h-2 bg-yellow-500" />
                        <CardHeader className="flex flex-row items-center gap-3 bg-white p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
                                <ScanHeart className="h-5 w-5" />
                            </div>
                            <CardTitle>{t("hypertensionTitle")}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-base">
                            <p className="mb-3">{t("hypertensionDesc")}</p>
                            <p className="font-medium text-emerald-600">{t("hypertensionPrev")}</p>
                        </CardContent>
                        <CardFooter>
                            <Link href="/ncd/hypertension" className="w-full">
                                <Button variant="outline" className="w-full">
                                    {t("learnMore")}
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* Stroke */}
                    <Card className="relative flex flex-col justify-between rounded-lg border-0 shadow-sm overflow-hidden">
                        <span className="absolute inset-x-0 top-0 h-2 bg-purple-500" />
                        <CardHeader className="flex flex-row items-center gap-3 bg-white p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                                <Brain className="h-5 w-5" />
                            </div>
                            <CardTitle>{t("strokeTitle")}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-base">
                            <p className="mb-3">{t("strokeDesc")}</p>
                            <p className="font-medium text-emerald-600">{t("strokePrev")}</p>
                        </CardContent>
                        <CardFooter>
                            <Link href="/ncd/stroke" className="w-full">
                                <Button variant="outline" className="w-full" >
                                    {t("learnMore")}
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                </div>
            </section>

            {/* ----------------- NEW: Global & Malaysia NCD Statistics ---------------- */}
            <section className="mx-auto mt-4 max-w-6xl">
                <h2 className="text-center text-2xl font-semibold">{t("globalStatsTitle")}</h2>
                <p className="mt-1 text-center text-sm text-muted-foreground">
                    {t("globalStatsSubtitle")}
                </p>

                {err && <p className="mt-3 text-center text-sm text-red-600">{err}</p>}
                {!data && !err && (
                    <p className="mt-3 text-center text-sm text-slate-500">{t("loading")}</p>
                )}

                {globalLoc && (
                    <div className="mt-6 space-y-6">
                        <KPICards
                            locTitle={t("latestShare")}
                            loc={globalLoc}
                            t={t}
                        />
                        <div className="grid gap-6 md:grid-cols-2">
                            <LinePanel title={t("lineGlobalTitle")} data={globalLine} hint={t("lineHint")} />
                            <BarsPanel title={t("barsGlobalTitle")} data={globalBars} t={t} />
                        </div>
                    </div>
                )}
            </section>

            <section className="mx-auto max-w-6xl">
                <div className="my-8 h-px w-full bg-slate-200/70" />
                <h2 className="text-center text-2xl font-semibold">{t("malaysiaStatsTitle")}</h2>
                <p className="mt-1 text-center text-sm text-muted-foreground">
                    {t("malaysiaStatsSubtitle")}
                </p>

                {myLoc && (
                    <div className="mt-6 space-y-6">
                        <KPICards locTitle={t("latestShare")} loc={myLoc} t={t} />
                        <div className="grid gap-6 md:grid-cols-2">
                            <LinePanel title={t("lineGlobalTitle")} data={myLine} />
                            <BarsPanel title={t("barsGlobalTitle")} data={myBars} t={t} />
                        </div>
                    </div>
                )}
            </section>

            <section className="mx-auto max-w-6xl mb-8">
                <div className="mt-10 rounded-2xl bg-rose-50 p-6 md:p-8 relative">
                    {/* left accent line */}
                    <span className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-rose-500" />
                    <h3 className="text-xl font-extrabold text-rose-700">{t("myChallenge.title")}</h3>

                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        <div>
                            <h4 className="text-sm font-semibold text-rose-700">{t("myChallenge.risingTitle")}</h4>
                            <ul className="mt-3 space-y-2 text-sm text-rose-900">
                                <li>• {t("myChallenge.r1")}</li>
                                <li>• {t("myChallenge.r2")}</li>
                                <li>• {t("myChallenge.r3")}</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-rose-700">{t("myChallenge.contribTitle")}</h4>
                            <ul className="mt-3 space-y-2 text-sm text-rose-900">
                                <li>• {t("myChallenge.c1")}</li>
                                <li>• {t("myChallenge.c2")}</li>
                                <li>• {t("myChallenge.c3")}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

        </main>
    );
}
