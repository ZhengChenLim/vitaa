"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
    Droplet,
    Info,
    HeartPulse,
    ShieldCheck,
    Stethoscope,
    Activity,
    Home,
    AlertTriangle,
    AlertCircle,
    Clock,
    CalendarCheck2,
    Ban,
    Utensils,
    CookingPot,
    ScanHeart,
} from "lucide-react";

const HERO_IMG = "/hypertension-hero.png";

export default function HypertensionPage() {
    const t = useTranslations("hypertension");
    const facts: string[] = t.raw("facts");

    return (
        <main className="min-h-screen max-w-6xl mx-auto bg-white">
            {/* Hero */}
            {/*
            <section className="relative isolate">
                <div className="relative h-[320px] w-full overflow-hidden">
                    <Image src={HERO_IMG} alt="" fill priority className="object-cover" />
                    <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col px-4">
                        
                        <div className="pt-4 text-white">
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink asChild>
                                            <Link
                                                href="/"
                                                className="inline-flex items-center gap-1.5 text-sm text-white hover:text-white/80"
                                            >
                                                <Home className="h-4 w-4" />
                                                {t("breadcrumbHome")}
                                            </Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="text-white" />
                                    <BreadcrumbItem>
                                        <BreadcrumbLink asChild>
                                            <Link
                                                href="/ncd"
                                                className="inline-flex items-center gap-1.5 text-sm text-white hover:text-white/80"
                                            >
                                                {t("breadcrumbLibrary")}
                                            </Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="text-white" />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage className="text-white">{t("title")}</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>

                        
                        <div className="mt-6 flex flex-1 flex-col items-center justify-center text-center text-white">
                            <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                                <HeartPulse className="h-5 w-5" />
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight">{t("title")}</h1>
                            <p className="mt-3 max-w-3xl text-base text-white/90">
                                {t("subtitle", { count: "6.4" })}
                            </p>
                        </div>
                    </div>
                </div>
            </section> */}
            <section className="relative w-full bg-orange-50 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
                    <svg aria-hidden width="100%" height="180" viewBox="0 0 1200 180" preserveAspectRatio="none">
                        <path d="M0,90 L1200,90" stroke="rgb(255,237,213)" strokeWidth="1" opacity="0.2" fill="none" />
                        <defs>
                            <path id="ecg-orange" d="
          M0,90 L90,90 L120,40 L140,145 L160,90
          L240,90 L270,35 L290,150 L310,90
          L380,90 L410,30 L430,150 L450,90
          L530,90 L560,45 L580,150 L600,90
          L680,90 L710,35 L730,150 L750,90
          L830,90 L860,28 L880,150 L900,90
          L980,90 L1010,40 L1030,150 L1050,90
          L1130,90 L1160,35 L1180,150 L1200,90" />
                        </defs>
                        <use href="#ecg-orange" stroke="rgb(249,115,22)" strokeWidth="6" opacity="0.10" fill="none" />
                        <use href="#ecg-orange" stroke="rgb(255,237,213)" strokeWidth="2" fill="none" strokeLinecap="round" />
                        <circle r="5" fill="rgb(234,88,12)">
                            <animateMotion dur="3s" repeatCount="indefinite"><mpath href="#ecg-orange" /></animateMotion>
                            <animate attributeName="r" values="5;6;5" dur="1.2s" repeatCount="indefinite" />
                        </circle>
                    </svg>
                </div>
                <div className="relative z-10 mx-auto max-w-6xl px-4 pt-4 text-gray-600">
                                    <Breadcrumb>
                                        <BreadcrumbList>
                                            <BreadcrumbItem>
                                                <BreadcrumbLink asChild>
                                                    <Link
                                                        href="/"
                                                        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800"
                                                    >
                                                        <Home className="h-4 w-4" />
                                                        {t("breadcrumbHome")}
                                                    </Link>
                                                </BreadcrumbLink>
                                            </BreadcrumbItem>
                                            <BreadcrumbSeparator className="text-gray-400" />
                                            <BreadcrumbItem>
                                                <BreadcrumbLink asChild>
                                                    <Link
                                                        href="/ncd"
                                                        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800"
                                                    >
                                                        {t("breadcrumbLibrary")}
                                                    </Link>
                                                </BreadcrumbLink>
                                            </BreadcrumbItem>
                                            <BreadcrumbSeparator className="text-gray-400" />
                                            <BreadcrumbItem>
                                                <BreadcrumbPage className="text-gray-900 font-medium">
                                                    {t("title")}
                                                </BreadcrumbPage>
                                            </BreadcrumbItem>
                                        </BreadcrumbList>
                                    </Breadcrumb>
                                </div>

                <div className="relative z-10 mx-auto max-w-6xl px-4 py-12">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center justify-center gap-4">
                            <motion.div initial={{ y: -140, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 520, damping: 26, mass: 0.8 }}>
                                <motion.div animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                                    className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-orange-500 shadow-md md:h-20 md:w-20">
                                    <ScanHeart className="h-8 w-8 text-white md:h-10 md:w-10" />
                                </motion.div>
                            </motion.div>
                            <motion.h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-6xl">
                                {t("title")}
                            </motion.h1>
                        </div>
                        <motion.p className="mt-3 max-w-2xl text-base text-gray-800 font-medium md:text-lg">
                            {t("subtitle", { count: "6.4" })}
                        </motion.p>
                    </div>
                </div>
            </section>

            {/* Sub-nav */}
            <SubNav />

            {/* Overview */}
            <section id="overview" className="scroll-mt-32 mx-auto max-w-6xl px-4 py-10">
                <div className="grid gap-10 md:grid-cols-[1fr_520px]">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{t("whatHeading")}</h2>
                        <p className="mt-4 text-base leading-7 text-muted-foreground">{t("whatDesc")}</p>

                        <div className="relative mt-6">
                            <div className="absolute -left-2 top-0 h-full w-1 rounded bg-orange-500" />
                            <div className="rounded-2xl bg-orange-50 p-5 pl-6">
                                <p className="mb-2 text-sm font-semibold text-orange-700">{t("keyFacts")}</p>
                                <ul className="list-disc space-y-1 pl-5 text-base text-orange-900">
                                    {facts.map((f) => (
                                        <li key={f}>{f}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Video */}
                    <div className="rounded-xl shadow-sm">
                        <div className="aspect-video overflow-hidden rounded-xl">
                            <iframe
                                className="h-full w-full"
                                src="https://www.youtube.com/embed/LnGB7U1xIuw?si=JWl3SmF7ad3rZATo"
                                title="Hypertension explainer"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-10 grid gap-4 md:grid-cols-3">
                    <StatCard value="30.0%" label={t("stats.adultPrevalence")} footnote={t("stats.nhms")} />
                    <StatCard value="6.4M" label={t("stats.adultsAffected")} footnote={t("stats.estimate")} />
                    <StatCard value="35.2%" label={t("stats.totalDeaths")} footnote={t("stats.moh")} />
                </div>

                <div className="mt-12">
                    <h3 className="text-center text-2xl font-bold tracking-tight">
                        {t("overview.bpReadings.title")}
                    </h3>

                    <div className="mt-6 grid gap-4 md:grid-cols-4">
                        {/* Normal */}
                        <div className="rounded-xl bg-green-100 px-5 py-5 shadow-sm">
                            <p className="text-center text-base font-semibold text-green-800">
                                {t("overview.bpReadings.normal.title")}
                            </p>
                            <p className="mt-1 text-center text-sm font-semibold text-green-800">
                                {t("overview.bpReadings.normal.range")}
                            </p>
                            <p className="mt-2 text-center text-sm text-green-900/80">
                                {t("overview.bpReadings.normal.note")}
                            </p>
                        </div>

                        {/* Elevated */}
                        <div className="rounded-xl bg-yellow-100 px-5 py-5 shadow-sm">
                            <p className="text-center text-base font-semibold text-yellow-800">
                                {t("overview.bpReadings.elevated.title")}
                            </p>
                            <p className="mt-1 text-center text-sm font-semibold text-yellow-800">
                                {t("overview.bpReadings.elevated.range")}
                            </p>
                            <p className="mt-2 text-center text-sm text-yellow-900/80">
                                {t("overview.bpReadings.elevated.note")}
                            </p>
                        </div>

                        {/* Stage 1 */}
                        <div className="rounded-xl bg-orange-100 px-5 py-5 shadow-sm">
                            <p className="text-center text-base font-semibold text-orange-800">
                                {t("overview.bpReadings.stage1.title")}
                            </p>
                            <p className="mt-1 text-center text-sm font-semibold text-orange-800">
                                {t("overview.bpReadings.stage1.range")}
                            </p>
                            <p className="mt-2 text-center text-sm text-orange-900/80">
                                {t("overview.bpReadings.stage1.note")}
                            </p>
                        </div>

                        {/* Stage 2 */}
                        <div className="rounded-xl bg-rose-200 px-5 py-5 shadow-sm">
                            <p className="text-center text-base font-semibold text-rose-900">
                                {t("overview.bpReadings.stage2.title")}
                            </p>
                            <p className="mt-1 text-center text-sm font-semibold text-rose-900">
                                {t("overview.bpReadings.stage2.range")}
                            </p>
                            <p className="mt-2 text-center text-sm text-rose-900/80">
                                {t("overview.bpReadings.stage2.note")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Primary vs Secondary cards */}
                <div className="mt-10 grid gap-6 md:grid-cols-2">
                    {/* Primary */}
                    <div className="rounded-2xl border border-orange-200 p-6">
                        <h4 className="text-xl font-semibold">{t("overview.types.primary.title")}</h4>
                        <p className="mt-3 text-base leading-7 text-muted-foreground">
                            {t("overview.types.primary.desc")}
                        </p>
                        <div className="mt-4 rounded-lg bg-orange-100 px-4 py-3 text-sm text-orange-800">
                            {t("overview.types.primary.note")}
                        </div>
                    </div>

                    {/* Secondary */}
                    <div className="rounded-2xl border border-orange-200 p-6">
                        <h4 className="text-xl font-semibold">{t("overview.types.secondary.title")}</h4>
                        <p className="mt-3 text-base leading-7 text-muted-foreground">
                            {t("overview.types.secondary.desc")}
                        </p>
                        <div className="mt-4 rounded-lg bg-orange-100 px-4 py-3 text-sm text-orange-800">
                            {t("overview.types.secondary.note")}
                        </div>
                    </div>
                </div>
            </section>

            <SymptomsSection />
            <RiskSection />
            <PreventionSection />
            <ManagementSection />
        </main>
    );
}

/* ---------- Sub-nav (uses hypertension tabs) ---------- */
function SubNav() {
    const t = useTranslations("hypertension.tabs");
    const sections = [
        { id: "overview", label: t("overview"), icon: <Info className="h-4 w-4" /> },
        { id: "symptoms", label: t("symptoms"), icon: <Stethoscope className="h-4 w-4" /> },
        { id: "risk", label: t("risk"), icon: <AlertTriangle className="h-4 w-4" /> },
        { id: "prevention", label: t("prevention"), icon: <ShieldCheck className="h-4 w-4" /> },
        { id: "management", label: t("management"), icon: <HeartPulse className="h-4 w-4" /> },
    ];

    const [current, setCurrent] = React.useState("overview");
    const scrollerRef = React.useRef<HTMLDivElement>(null);
    const barRef = React.useRef<HTMLDivElement>(null);

    const handleClick = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        setCurrent(id);

        const el = document.getElementById(id);
        if (!el) return;
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        const offset = isMobile ? 96 : 120; // keep this as your true sticky offset
        const y = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: "smooth" });
        history.replaceState(null, "", `#${id}`);
    };

    React.useEffect(() => {
        const ids = sections.map(s => s.id);
        const els = ids.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];
        if (!els.length) return;

        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        const topOffset = isMobile ? 96 : 120;
        const obs = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
                if (visible?.target?.id) setCurrent(visible.target.id);
            },
            {
                root: null,
                rootMargin: `${-topOffset}px 0px -40% 0px`, 
                threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
            }
        );

        els.forEach(el => obs.observe(el));
        return () => obs.disconnect();
    }, [sections]);


    React.useEffect(() => {
        const onScroll = () => {
            const isMobile = window.matchMedia("(max-width: 768px)").matches;
            const sticky = (isMobile ? 96 : 120) + 1;
            const y = window.scrollY + sticky;
            const candidates = sections.map(s => {
                const el = document.getElementById(s.id);
                return el ? { id: s.id, top: el.offsetTop } : null;
            }).filter(Boolean) as { id: string; top: number }[];
            const active = candidates.filter(c => c.top <= y).sort((a, b) => b.top - a.top)[0];
            if (active && active.id !== current) setCurrent(active.id);
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [current, sections]);

    React.useEffect(() => {
        const hash = window.location.hash.replace("#", "");
        if (hash) setCurrent(hash);
    }, []);

    return (
        <div
            ref={barRef}
            className="sticky top-[68px] z-40 w-full border-b bg-zinc-50/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-50/70"
        >
            <div className="mx-auto max-w-6xl px-4">
                <nav
                    ref={scrollerRef}
                    className="
            flex items-center gap-3 py-3 text-base
            overflow-x-auto md:overflow-x-visible
            snap-x snap-mandatory
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
          "
                    aria-label="Hypertension sections"
                >
                    {sections.map((s) => (
                        <Pill
                            key={s.id}
                            href={`#${s.id}`}
                            icon={s.icon}
                            active={current === s.id}
                            onClick={(e) => handleClick(e, s.id)}
                        >
                            {s.label}
                        </Pill>
                    ))}
                </nav>
            </div>
        </div>
    );
}
type PillProps = {
    href: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    active?: boolean;
    onClick?: (e: React.MouseEvent) => void;
};

function Pill({
    href,
    children,
    icon,
    active = false,
    onClick,
}: PillProps) {
    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <a
                        href={href}
                        onClick={onClick}
                        aria-current={active ? "page" : undefined}
                        className={[
                            "inline-flex items-center gap-2 rounded-full border px-4 py-2 transition-colors",
                            "whitespace-nowrap snap-start flex-shrink-0 select-none",
                            active
                                ? "border-orange-200 bg-orange-500 text-white"
                                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100",
                        ].join(" ")}
                    >
                        {icon}
                        {/* text hidden on mobile, visible from md breakpoint up */}
                        <span className="hidden md:inline text-[13px] font-medium">
                            {children}
                        </span>
                    </a>
                </TooltipTrigger>
                <TooltipContent side="top" className="md:hidden">
                    <p>{children}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/* ---------- Small stat card ---------- */
function StatCard({
    value,
    label,
    footnote,
}: {
    value: string;
    label: string;
    footnote?: string;
}) {
    return (
        <Card>
            <CardContent className="flex items-center justify-between gap-4 p-6">
                <div className="text-center w-full">
                    <p className="text-3xl text-orange-500 font-bold">{value}</p>
                    <p className="mt-1 text-sm font-medium">{label}</p>
                    {footnote && <p className="mt-1 text-xs text-muted-foreground">{footnote}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

/* ---------- Symptoms (hypertension) ---------- */
function SymptomsSection() {
    const t = useTranslations("hypertension.symptoms");
    const leftList: string[] = t.raw("left.list");
    const rightCards: { title: string; desc: string }[] = t.raw("right.cards");

    return (
        <section id="symptoms" className="scroll-mt-32 mx-auto max-w-6xl px-4 py-10">
            {/* Heading */}
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
                <p className="mt-2 text-base text-muted-foreground">{t("subtitle")}</p>
            </div>

            {/* Warning band */}
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6">
                <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
                    <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-100">
                        <AlertTriangle className="h-4 w-4 text-rose-700" />
                    </div>
                    <p className="text-base font-semibold text-rose-800">{t("warning.title")}</p>
                    <p className="mt-2 text-base text-rose-900/90">{t("warning.desc")}</p>
                </div>
            </div>

            {/* Two-column content */}
            <div className="mt-8 grid gap-6 md:grid-cols-2">
                {/* Left: symptoms list */}
                <div className="rounded-2xl border border-orange-200 p-5">
                    <p className="text-orange-700 font-semibold">{t("left.title")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t("left.lead")}</p>

                    <ul className="mt-4 space-y-3">
                        {leftList.map((item) => (
                            <li key={item}>
                                <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-base text-orange-900">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    <span>{item}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Right: emergency signs cards */}
                <div className="rounded-2xl border border-orange-200 p-5">
                    <p className="text-orange-700 font-semibold">{t("right.title")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t("right.lead")}</p>

                    <div className="mt-4 space-y-4">
                        {rightCards.map((c) => (
                            <div
                                key={c.title}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3"
                            >
                                <p className="text-base font-semibold text-rose-800">{c.title}</p>
                                <p className="mt-1 text-sm text-rose-900/90">{c.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Monitoring band */}
            <div className="mt-8 rounded-2xl bg-orange-50 p-6">
                <div className="text-center">
                    <h3 className="text-lg font-semibold">{t("monitor.title")}</h3>
                    <p className="mt-1 text-base text-muted-foreground">{t("monitor.subtitle")}</p>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {/* < 40 */}
                    <div className="rounded-xl bg-white p-5 text-center shadow-sm">
                        <div className="mx-auto mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-orange-100">
                            <Clock className="h-5 w-5 text-orange-700" />
                        </div>
                        <p className="text-base font-semibold">{t("monitor.u40.title")}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{t("monitor.u40.desc")}</p>
                    </div>

                    {/* 40+ */}
                    <div className="rounded-xl bg-white p-5 text-center shadow-sm">
                        <div className="mx-auto mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
                            <CalendarCheck2 className="h-5 w-5 text-green-700" />
                        </div>
                        <p className="text-base font-semibold">{t("monitor.o40.title")}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{t("monitor.o40.desc")}</p>
                    </div>

                    {/* High risk */}
                    <div className="rounded-xl bg-white p-5 text-center shadow-sm">
                        <div className="mx-auto mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-100">
                            <AlertTriangle className="h-5 w-5 text-rose-700" />
                        </div>
                        <p className="text-base font-semibold">{t("monitor.high.title")}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{t("monitor.high.desc")}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ---------- Risk ---------- */
function RiskSection() {
    const t = useTranslations("hypertension.risk");
    const items: string[] = t.raw("items");
    const genList: string[] = t.raw("genetic.list");
    const lifeList: string[] = t.raw("lifestyle.list");

    return (
        <section id="risk" className="scroll-mt-32 mx-auto max-w-6xl px-4 py-10">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
                <p className="mt-2 text-base text-muted-foreground">{t("subtitle")}</p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
                {items.map((text) => (
                    <div
                        key={text}
                        className="flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-3 py-3 text-base text-orange-900"
                    >
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{text}</span>
                    </div>
                ))}
            </div>

            <div className="mt-8 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 p-6">
                <h3 className="text-center text-lg font-semibold">{t("my.title")}</h3>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl bg-white p-5 shadow-sm">
                        <p className="text-base font-semibold">{t("genetic.title")}</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-base text-muted-foreground">
                            {genList.map((v) => (
                                <li key={v}>{v}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-xl bg-white p-5 shadow-sm">
                        <p className="text-base font-semibold">{t("lifestyle.title")}</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-base text-muted-foreground">
                            {lifeList.map((v) => (
                                <li key={v}>{v}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ---------- Prevention ---------- */
function PreventionSection() {
    const t = useTranslations("hypertension.prevention");
    const itemsLeft: string[] = t.raw("left");
    const itemsRight: string[] = t.raw("right");
    const foodsLocal: string[] = t.raw("diet.local");
    const foodsLimit: string[] = t.raw("diet.limit");
    const portion: string[] = t.raw("diet.portion");

    return (
        <section id="prevention" className="scroll-mt-32 mx-auto max-w-6xl px-4 py-10">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
                <p className="mt-2 text-base text-muted-foreground">{t("subtitle")}</p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
                {itemsLeft.map((text) => (
                    <Bullet key={text} text={text} />
                ))}
                {itemsRight.map((text) => (
                    <Bullet key={text} text={text} />
                ))}
            </div>

            <div className="mt-8 rounded-2xl bg-gradient-to-r from-green-50 to-cyan-50 p-6">
                <h3 className="text-center text-lg font-semibold">{t("diet.title")}</h3>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <DietCard
                        iconBg="bg-emerald-100"
                        icon={<CookingPot className="h-4 w-4 text-emerald-700" />}
                        title={t("diet.localTitle")}
                        items={foodsLocal}
                    />
                    <DietCard
                        iconBg="bg-red-100"
                        icon={<Ban className="h-4 w-4 text-red-700" />}
                        title={t("diet.limitTitle")}
                        items={foodsLimit}
                    />
                    <DietCard
                        iconBg="bg-blue-100"
                        icon={<Utensils className="h-4 w-4 text-blue-700" />}
                        title={t("diet.portionTitle")}
                        items={portion}
                    />
                </div>
            </div>
        </section>
    );
}

function Bullet({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-base text-emerald-900">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>{text}</span>
        </div>
    );
}

function DietCard({
    icon,
    iconBg,
    title,
    items,
}: {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    items: string[];
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-2">
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${iconBg}`}>
                    {icon}
                </span>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-base text-muted-foreground">
                    {items.map((v) => (
                        <li key={v}>{v}</li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

/* ---------- Management ---------- */
function ManagementSection() {
    const t = useTranslations("hypertension.management");
    const tipsLeft: string[] = t.raw("left");
    const tipsRight: string[] = t.raw("right");
    const targets: string[] = t.raw("targets");
    const meds: string[] = t.raw("meds");
    const checks: string[] = t.raw("checks");

    return (
        <section id="management" className="scroll-mt-32 mx-auto max-w-6xl px-4 py-10">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
                <p className="mt-2 text-base text-muted-foreground">{t("subtitle")}</p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
                {tipsLeft.map((text) => (
                    <ManageBullet key={text} text={text} />
                ))}
                {tipsRight.map((text) => (
                    <ManageBullet key={text} text={text} />
                ))}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
                <PanelCard icon={<Activity className="h-4 w-4 text-red-600" />} title={t("panels.targetsTitle")} items={targets} />
                <PanelCard icon={<Stethoscope className="h-4 w-4 text-green-700" />} title={t("panels.medsTitle")} items={meds} />
                <PanelCard icon={<CalendarCheck2 className="h-4 w-4 text-blue-700" />} title={t("panels.checksTitle")} items={checks} />
            </div>

            <div className="mt-8 rounded-2xl border bg-white p-6 text-center">
                <p className="text-base text-muted-foreground">{t("cta.blurb")}</p>
                <div className="mt-4 flex flex-col gap-3 md:flex-row md:justify-center">
                    <Link href="/planform" className="rounded-full bg-emerald-500 px-5 py-2 text-base font-medium text-white hover:bg-emerald-600">
                        {t("cta.plan")}
                    </Link>
                    <Link href="/analysisform" className="rounded-full bg-orange-500 px-5 py-2 text-base font-medium text-white hover:bg-orange-600">
                        {t("cta.analysis")}
                    </Link>
                    <Link href="/quiz" className="rounded-full bg-blue-600 px-5 py-2 text-base font-medium text-white hover:bg-blue-700">
                        {t("cta.quiz")}
                    </Link>
                </div>
            </div>
        </section>
    );
}

function ManageBullet({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-base text-blue-900">
            <HeartPulse className="h-4 w-4 shrink-0" />
            <span>{text}</span>
        </div>
    );
}

function PanelCard({
    icon,
    title,
    items,
}: {
    icon: React.ReactNode;
    title: string;
    items: string[];
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F1F5F9]">
                    {icon}
                </span>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 text-base">
                    {items.map((v) => (
                        <li key={v} className="rounded-md bg-[#F6F6FA] p-2 shadow-sm">
                            {v}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
