"use client";

import * as React from "react";
import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import NextImage from "next/image";
import { Link } from "@/i18n/navigation";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge as ShadBadge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Calendar, HelpCircle, Timer, Award, Home } from "lucide-react";

/** ---------- Types ---------- */
type Challenge = {
    challenge_id: number;
    challenge: string;
    challenge_ms?: string;
    challenge_zh?: string;
    challenge_vi?: string;
};
type ChallengeAPI = Record<"Week 1" | "Week 2" | "Week 3" | "Week 4", Challenge[]>;
type CookieShape = {
    monthKey: string; 
    challenges: ChallengeAPI;
    selected: Record<number, boolean>;
    expiresAt: string; 
};

/** ---------- Date helpers ---------- */
const now = new Date();
const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const getEndOfMonth = (date = new Date()) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

/** ---------- Storage helpers (localStorage) ---------- */
const STORAGE_KEY = "vitaa_monthly_challenges";
function setStore(value: CookieShape) {
    const payload = { ...value, expiresAt: getEndOfMonth().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
function getStore(): CookieShape | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const decoded = JSON.parse(raw) as CookieShape;
        if (decoded.expiresAt && new Date() > new Date(decoded.expiresAt)) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
        if (decoded.monthKey !== monthKey) return null;
        if (!decoded.challenges || Object.keys(decoded.challenges).length === 0) return null;
        return decoded;
    } catch {
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

/** ---------- Badge drawing ---------- */
type Gradient = [string, string];
const GRADIENTS: Gradient[] = [
    ["#6366f1", "#a855f7"], // indigo → purple
    ["#06b6d4", "#3b82f6"], // cyan → blue
    ["#10b981", "#14b8a6"], // emerald → teal
    ["#8b5cf6", "#ec4899"], // violet → pink
];

function drawBadge(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    width: number,
    height: number,
    text: string,
    gradient: Gradient
) {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, gradient[0]);
    grad.addColorStop(1, gradient[1]);

    const fontSize = Math.round(width * 0.033);
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const textX = width / 2;
    const textY = Math.round(height * 0.66);

    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = Math.max(6, Math.round(width * 0.01));

    ctx.fillStyle = grad;
    ctx.fillText(text, textX, textY);

    ctx.lineWidth = Math.max(1, Math.round(width * 0.0015));
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.strokeText(text, textX, textY);
}

export default function QuizAndChallengesPage() {
    const t = useTranslations("challenges");
    const locale = useLocale();

    const [data, setData] = React.useState<ChallengeAPI | null>(null);
    const [selected, setSelected] = React.useState<Record<number, boolean>>({});
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const [badgeImage, setBadgeImage] = React.useState<HTMLImageElement | null>(null);
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [showBadge, setShowBadge] = React.useState(false);

    const downloadCanvasRef = React.useRef<HTMLCanvasElement | null>(null);

    const [gradientIndex, setGradientIndex] = React.useState<number>(() =>
        Math.floor(Math.random() * GRADIENTS.length)
    );

    const monthYearLabel = React.useMemo(
        () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(now),
        [locale]
    );

    const pickLocalized = React.useCallback(
        (c: Challenge) => {
            if (locale.startsWith("ms") && c.challenge_ms) return c.challenge_ms;
            if (locale.startsWith("zh") && c.challenge_zh) return c.challenge_zh;
            if (locale.startsWith("vi") && c.challenge_vi) return c.challenge_vi;
            return c.challenge;
        },
        [locale]
    );

    const API_URL = process.env.NEXT_PUBLIC_API_BASE
        ? `${process.env.NEXT_PUBLIC_API_BASE}/api/weekly-challenges/`
        : "http://127.0.0.1:8000/api/weekly-challenges/";
    
    useEffect(() => {
        const img = new window.Image();
        img.onload = () => setBadgeImage(img);
        img.src = "/vitaa-gpt-bg-removed.png";
    }, []);

    /** ---------- data load with expiry handling ---------- */
    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);

            let cached = getStore();

            if (!cached) {
                try {
                    const res = await fetch(API_URL, { cache: "no-store" });
                    if (!res.ok) throw new Error(`API ${res.status}`);

                    const apiData = (await res.json()) as ChallengeAPI;
                    const initialSelected: Record<number, boolean> = {};
                    Object.values(apiData).flat().forEach((c) => (initialSelected[c.challenge_id] = false));

                    cached = {
                        monthKey,
                        challenges: apiData,
                        selected: initialSelected,
                        expiresAt: getEndOfMonth().toISOString(),
                    };
                    setStore(cached);
                } catch (e: any) {
                    console.error("Failed to fetch challenges:", e);
                    setError(t("errors.load"));
                }
            }

            if (cached) {
                setData(cached.challenges);
                setSelected(cached.selected || {});
            }
            setLoading(false);
        })();
    }, [t]);

    // persist any changes
    useEffect(() => {
        if (!data || loading) return;
        setStore({ monthKey, challenges: data, selected, expiresAt: getEndOfMonth().toISOString() });
    }, [data, selected, loading]);

    const allCount = data ? Object.values(data).flat().length : 0;
    const completedCount = Object.values(selected).filter(Boolean).length;
    const allCompleted = allCount > 0 && completedCount === allCount;
    const progressPct = allCount > 0 ? (completedCount / allCount) * 100 : 0;

    function toggleChallenge(challengeId: number, checked: boolean) {
        setSelected((prev) => ({ ...prev, [challengeId]: checked }));
    }

    /** ---------- Direct badge download ---------- */
    async function generateBadge() {
        if (!badgeImage) {
            alert(t("errors.imageNotReady") || "Image not ready yet. Please try again.");
            return;
        }
        const canvas = downloadCanvasRef.current;
        if (!canvas) return;

        setIsDownloading(true);
        try {
            const idx = Math.floor(Math.random() * GRADIENTS.length);
            setGradientIndex(idx);

            const w = 1024;
            const h = 1024;
            canvas.width = w;
            canvas.height = h;

            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("No 2D context");

            drawBadge(ctx, badgeImage, w, h, monthYearLabel, GRADIENTS[idx]);

            const dataUrl = canvas.toDataURL("image/png", 1.0);
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `Vitaa-Challenge-Badge-${monthKey}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error(e);
            alert(t("errors.generate"));
        } finally {
            setIsDownloading(false);
        }
    }

    return (
        <main className="mx-auto max-w-6xl px-4 py-8">
            {/* ---------- BREADCRUMB ---------- */}
            <div className="mx-auto max-w-6xl px-4 text-gray-600">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                                    <Home className="h-4 w-4" />
                                    <span>{t("breadcrumbHome")}</span>
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="text-gray-400" />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="text-sm text-gray-700">
                                {t("breadcrumbQuiz")}
                            </BreadcrumbPage>


                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {/* ---------- TOP: Quiz Section (hero) ---------- */}
            <section className="rounded-2xl bg-white p-6 sm:p-8 mt-4">
                {/* Row 1: headline + image */}
                <div className="grid items-center gap-8 grid-cols-1 md:grid-cols-2 md:[grid-template-columns:1.25fr_0.9fr]">
                    {/* Left: copy */}
                    <div>
                        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-[-0.02em] text-slate-900">
                            {t("hero.title")}
                        </h1>
                        <p className="mt-4 text-base md:text-lg text-slate-700">
                            {t("hero.lead.1")}{" "}
                            <span className="bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent font-semibold">
                                {t("hero.lead.ncd")}
                            </span>{" "}
                            {t("hero.lead.2")}
                        </p>
                    </div>

                    {/* Right: image */}
                    <div className="relative w-full max-w-lg md:justify-self-end mx-auto md:mx-0">
                        <div className="overflow-hidden rounded-3xl ring-1 ring-slate-100 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.35)]">
                            <NextImage
                                src="/quiz-hero.png"
                                alt={t("hero.imgAlt") || "Quiz hero image"}
                                width={800}
                                height={600}
                                className="h-auto w-full object-cover"
                                priority
                            />
                        </div>
                    </div>
                </div>

                {/* Row 2: feature pills (full width) */}
                <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Pill 1 */}
                    <div className="rounded-2xl bg-white p-5 shadow-[0_10px_25px_-10px_rgba(0,0,0,0.15)] ring-1 ring-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                                <HelpCircle className="h-5 w-5 text-slate-700" />
                            </div>
                            <div className="text-base font-semibold text-slate-900">
                                {t("hero.pills.qTitle")}
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{t("hero.pills.qDesc")}</p>
                    </div>

                    {/* Pill 2 */}
                    <div className="rounded-2xl bg-white p-5 shadow-[0_10px_25px_-10px_rgba(0,0,0,0.15)] ring-1 ring-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                                <Timer className="h-5 w-5 text-slate-700" />
                            </div>
                            <div className="text-base font-semibold text-slate-900">
                                {t("hero.pills.tTitle")}
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{t("hero.pills.tDesc")}</p>
                    </div>

                    {/* Pill 3 */}
                    <div className="rounded-2xl bg-white p-5 shadow-[0_10px_25px_-10px_rgba(0,0,0,0.15)] ring-1 ring-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                                <Award className="h-5 w-5 text-slate-700" />
                            </div>
                            <div className="text-base font-semibold text-slate-900">
                                {t("hero.pills.rTitle")}
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{t("hero.pills.rDesc")}</p>
                    </div>
                </div>

                {/* Row 3: CTA centered */}
                <div className="mt-8 flex justify-center">
                    <Link href="/quiz">
                        <Button
                            size="lg"
                            className="rounded-2xl px-10 py-6 text-base font-semibold text-white shadow-lg
                 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                        >
                            {t("cta.start")}
                        </Button>
                    </Link>
                </div>
            </section>



            <div className="my-10 h-px w-full bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />

            {/* ---------- BOTTOM: Monthly Challenges ---------- */}
            <section className="rounded-3xl border border-emerald-100 bg-white/80 p-4 sm:p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_8px_30px_-12px_rgba(16,185,129,0.25)]">
                <div className="mb-6 flex flex-wrap items-center justify-center text-center gap-3">
                    <h2 className="text-3xl font-extrabold italic tracking-tight text-emerald-600 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
                        {t("challenges.title")}
                    </h2>
                    <span className="text-base text-slate-600">{t("challenges.for")}</span>

                    {/* Month/Year pill like screenshot */}
                    <ShadBadge
                        className="rounded-full px-4 py-2 text-base font-semibold
                 bg-lime-400 text-emerald-900 shadow-[0_6px_16px_-6px_rgba(132,204,22,0.9)]
                 ring-1 ring-lime-300/80"
                    >
                        {monthYearLabel}
                    </ShadBadge>
                </div>

                {loading && (
                    <div className="py-12 text-center">
                        <div className="animate-pulse text-slate-500">{t("loading")}</div>
                    </div>
                )}

                {!loading && error && <div className="py-8 text-center text-rose-700">{error}</div>}

                {!loading && !error && data && (
                    <>
                        {/* Cards grid */}
                        <div className="grid gap-8 md:grid-cols-2">
                            {(Object.entries(data) as [string, Challenge[]][]).map(([week, items]) => (
                                <Card
                                    key={week}
                                    className="overflow-hidden rounded-2xl border border-slate-200/70 shadow-[0_12px_30px_-18px_rgba(2,132,199,0.25)]"
                                >
                                    {/* header with plain bg, green text */}
                                    <CardHeader className="text-center">
                                        <CardTitle className="flex items-center gap-2 text-2xl font-bold text-emerald-500">
                                            <Calendar className="text-emerald-500" />
                                            {t(`weeks.${week.replace(" ", "").toLowerCase()}`)}
                                        </CardTitle>
                                    </CardHeader>

                                    {/* rows */}
                                    <CardContent className="p-0">
                                        {items.map((challenge, idx) => (
                                            <label
                                                key={challenge.challenge_id}
                                                className={[
                                                    "flex cursor-pointer items-center gap-3 px-4 py-4 text-base transition-colors",
                                                    "border-t border-slate-200/70",
                                                    "hover:bg-emerald-50/60",
                                                    idx === items.length - 1 ? "rounded-b-2xl" : "",
                                                ].join(" ")}
                                            >
                                                <Checkbox
                                                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                                    checked={!!selected[challenge.challenge_id]}
                                                    onCheckedChange={(checked) =>
                                                        toggleChallenge(challenge.challenge_id, Boolean(checked))
                                                    }
                                                />
                                                <span className="flex-1 leading-6 text-slate-800">
                                                    {pickLocalized(challenge)}
                                                </span>
                                            </label>
                                        ))}
                                    </CardContent>
                                </Card>

                            ))}
                        </div>

                        {/* footer: progress (left) + CTA centered under grid like screenshot */}
                        <div className="mt-8">
                            <div className="mx-auto flex max-w-2xl items-center justify-center gap-6">
                                <div className="hidden sm:flex items-center gap-4">
                                    <div className="text-base font-medium text-emerald-800">
                                        {t("progress", { completed: completedCount, total: allCount })}
                                    </div>
                                    <div className="h-2 w-36 overflow-hidden rounded-full bg-emerald-200">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-300"
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-center">
                                <Button
                                    size="lg"
                                    className="rounded-full px-8 py-6 text-base font-semibold text-white
                       shadow-[0_10px_24px_-12px_rgba(16,185,129,0.8)]
                       bg-gradient-to-r from-emerald-500 to-green-500
                       hover:from-emerald-600 hover:to-green-600
                       disabled:from-emerald-300 disabled:to-green-300"
                                    disabled={!allCompleted || !badgeImage}
                                    onClick={() => {
                                        setGradientIndex(Math.floor(Math.random() * GRADIENTS.length));
                                        setShowBadge(true);
                                    }}
                                >
                                    {t("cta.getPrize")}
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                <canvas ref={downloadCanvasRef} className="hidden" />
            </section>


            {/* ---------- Badge Modal (no preview) ---------- */}
            <Dialog open={showBadge && allCompleted} onOpenChange={setShowBadge}>
                <DialogContent className="max-w-lg border-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 p-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-rose-900">🎉 {t("badge.title")}</DialogTitle>
                            <DialogDescription className="text-base text-rose-700">
                                {t("badge.desc", { monthYear: monthYearLabel })}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-4 space-y-3">
                            <div className="bg-white rounded-lg p-4 border-l-4 border-amber-500">
                                <p className="font-semibold text-rose-900">{t("badge.summaryTitle")}</p>
                                <p className="text-base text-rose-700">
                                    {t("badge.summary", { count: allCount, monthYear: monthYearLabel })}
                                </p>
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button
                                onClick={generateBadge}
                                disabled={isDownloading}
                                size="lg"
                                className="bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg"
                            >
                                {isDownloading ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                                        {t("badge.generating")}
                                    </>
                                ) : (
                                    <>{t("badge.download")}</>
                                )}
                            </Button>
                            <Button variant="outline" onClick={() => setShowBadge(false)} className="rounded-xl">
                                {t("badge.close")}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </main>
    );
}
