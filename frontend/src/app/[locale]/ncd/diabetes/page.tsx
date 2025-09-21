"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import React from "react";
import { motion } from "framer-motion";


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
} from "lucide-react";

const HERO_IMG = "/diabetes-hero.png";

export default function DiabetesPage() {
    const t = useTranslations("diabetes");
    const facts: string[] = t.raw("facts");

    return (
        <main className="min-h-screen max-w-6xl mx-auto bg-white">
            {/* Hero with BG image */}
            {/* <section className="relative isolate">
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
                                        <BreadcrumbPage className="text-white">
                                            {t("title")}
                                        </BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>

                    
                        <div className="mt-6 flex flex-1 flex-col items-center justify-center text-center text-white">
                            <div className="mb-5 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                                <Droplet className="h-10 w-10" />
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight">{t("title")}</h1>
                            <p className="mt-3 max-w-3xl text-base text-white/90">
                                {t("subtitle", { count: "3.9" })}
                            </p>
                        </div>
                    </div>
                </div>
            </section> */}

            <section className="relative w-full bg-red-50 overflow-hidden">
                {/* ECG background with animated dot */}
                <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
                    <svg
                        aria-hidden
                        width="100%"
                        height="180"
                        viewBox="0 0 1200 180"
                        preserveAspectRatio="none"
                    >
                        {/* soft baseline */}
                        <path
                            d="M0,90 L1200,90"
                            stroke="rgb(254,226,226)"
                            strokeWidth="1"
                            opacity="0.2"
                            fill="none"
                        />
                        {/* ECG waveform path */}
                        <defs>
                            <path id="ecg-path" d="
              M0,90 
              L100,90 L130,30 L150,150 L170,90 
              L260,90 L290,35 L310,150 L330,90 
              L420,90 L450,25 L470,150 L490,90 
              L580,90 L610,30 L630,150 L650,90 
              L740,90 L770,35 L790,150 L810,90
              L900,90 L930,25 L950,150 L970,90
              L1060,90 L1090,30 L1110,150 L1130,90 
              L1200,90" />
                        </defs>

                        {/* glow */}
                        <use href="#ecg-path"
                            stroke="rgb(239,68,68)"
                            strokeWidth="6"
                            opacity="0.10"
                            fill="none"
                        />
                        {/* main line */}
                        <use href="#ecg-path"
                            stroke="rgb(254,226,226)"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                        />

                        {/* moving dot that travels along the ECG */}
                        <circle r="5" fill="rgb(220,38,38)"> {/* red-600 */}
                            <animateMotion
                                dur="3.2s"
                                repeatCount="indefinite"
                                keyPoints="0;1"
                                keyTimes="0;1"
                                calcMode="linear"
                            >
                                <mpath href="#ecg-path" />
                            </animateMotion>
                            {/* optional: subtle pulsing of the dot */}
                            <animate
                                attributeName="r"
                                values="5;6;5"
                                dur="1.2s"
                                repeatCount="indefinite"
                            />
                        </circle>
                    </svg>
                </div>

                {/* Breadcrumb (gray/black) */}
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

                            <motion.div
                                initial={{ y: -140, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 520,
                                    damping: 26,
                                    mass: 0.8,
                                    duration: 0.6,
                                }}
                            >
                                <motion.div
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{
                                        duration: 1.2,
                                        repeat: Infinity,
                                        repeatType: "loop",
                                        ease: "easeInOut",
                                        delay: 0.2, 
                                    }}
                                    className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-md md:h-20 md:w-20"
                                >
                                    <Droplet className="h-8 w-8 text-white md:h-10 md:w-10" />
                                </motion.div>
                            </motion.div>

                            <motion.h1
                                initial={{ x: 40, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
                                className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-6xl"
                            >
                                {t("title")}
                            </motion.h1>
                        </div>

                        <motion.p
                            initial={{ y: 8, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 }}
                            className="mt-3 max-w-2xl text-base text-gray-800 font-medium md:text-lg"
                        >
                            {t("subtitle", { count: "3.9" })}
                        </motion.p>
                    </div>
                </div>
            </section>





            {/* Sub-navigation bar - outside hero section */}
            <SubNav />

            {/* Overview */}
            <section id="overview" className="scroll-mt-32 mx-auto max-w-6xl px-4 py-10">
                <div className="grid gap-10 md:grid-cols-[1fr_520px]">
                    {/* Left column */}
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{t("whatHeading")}</h2>
                        <p className="mt-4 text-base leading-7 text-muted-foreground">{t("whatDesc")}</p>

                        {/* Key facts box */}
                        <div className="relative mt-6">
                            <div className="absolute -left-2 top-0 h-full w-1 rounded bg-red-500" />
                            <div className="rounded-2xl bg-red-50 p-5 pl-6">
                                <p className="mb-2 text-sm font-semibold text-red-700">{t("keyFacts")}</p>
                                <ul className="list-disc space-y-1 pl-5 text-base text-red-900">
                                    {facts.map((f) => (
                                        <li key={f}>{f}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Right column (video) */}
                    <div className="rounded-xl shadow-sm">
                        <div className="aspect-video overflow-hidden rounded-xl">
                            <iframe
                                className="h-full w-full"
                                src="https://www.youtube.com/embed/2TWelC6SHr8?si=g5bYCSyk4tjit4un"
                                title="Glucose explainer"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-10 grid gap-4 md:grid-cols-3">
                    <StatCard
                        value="18.3%"
                        label={t("stats.adultPrevalence")}
                        footnote={t("stats.nhms")}
                        icon={<Activity className="h-4 w-4" />}
                    />
                    <StatCard
                        value="3.9M"
                        label={t("stats.adultsAffected")}
                        footnote={t("stats.estimate")}
                        icon={<Stethoscope className="h-4 w-4" />}
                    />
                    <StatCard
                        value="12.8%"
                        label={t("stats.totalDeaths")}
                        footnote={t("stats.moh")}
                        icon={<HeartPulse className="h-4 w-4" />}
                    />
                </div>

                {/* Types */}
                <div className="mt-10 grid gap-6 md:grid-cols-2">
                    <Card className="border-red-200">
                        <CardHeader>
                            <CardTitle>{t("type1.title")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-base text-muted-foreground">
                            <p>{t("type1.desc")}</p>
                            <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{t("type1.note")}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-200">
                        <CardHeader>
                            <CardTitle>{t("type2.title")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-base text-muted-foreground">
                            <p>{t("type2.desc")}</p>
                            <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
                                {t("type2.note")}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <SymptomsSection />
            <RiskSection />
            <PreventionSection />
            <ManagementSection />
        </main>
    );
}

/** ---- Sub-Nav (sticky bar with pills + icons) ---- */
function SubNav() {
    const t = useTranslations("diabetes.tabs");
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

    // Smooth scroll with sticky header offset (mobile-friendly)
    const handleClick = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        setCurrent(id); // <-- make it red immediately

        const el = document.getElementById(id);
        if (!el) return;
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        const offset = isMobile ? 96 : 120; 
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
                rootMargin: `${-topOffset}px 0px -40% 0px`, // <-- match scroll offset; gentler bottom band
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
                    aria-label="Diabetes sections"
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
                                ? "border-red-200 bg-red-500 text-white"
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


/** ---- Small stat card ---- */
function StatCard({
    value,
    label,
    footnote,
    icon,
}: {
    value: string;
    label: string;
    footnote?: string;
    icon?: React.ReactNode;
}) {
    return (
        <Card>
            <CardContent className="flex items-center justify-between gap-4 p-6">
                <div className="text-center w-full">
                    <p className="text-3xl text-red-500 font-bold">{value}</p>
                    <p className="mt-1 text-sm font-medium">{label}</p>
                    {footnote && <p className="mt-1 text-xs text-muted-foreground">{footnote}</p>}
                </div>
                {/* <div className="rounded-full bg-muted p-3">{icon}</div> */}
            </CardContent>
        </Card>
    );
}

/** ---- Symptoms Section (localized) ---- */
function SymptomsSection() {
    const t = useTranslations("diabetes.symptoms");
    const t1List: string[] = t.raw("type1.list");
    const t2List: string[] = t.raw("type2.list");

    return (
        <section id="symptoms" className="scroll-mt-32 mx-auto max-w-6xl px-4 py-10">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
                <p className="mt-2 text-base text-muted-foreground">{t("subtitle")}</p>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
                {/* Type 1 */}
                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="text-red-600">{t("type1.title")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <ul className="space-y-2">
                            {t1List.map((item) => (
                                <li
                                    key={item}
                                    className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-base text-red-900"
                                >
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">
                            {t("type1.note")}
                        </p>
                    </CardContent>
                </Card>

                {/* Type 2 */}
                <Card className="border-amber-200">
                    <CardHeader>
                        <CardTitle className="text-amber-700">{t("type2.title")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <ul className="space-y-2">
                            {t2List.map((item) => (
                                <li
                                    key={item}
                                    className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-base text-amber-900"
                                >
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900">
                            {t("type2.note")}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* When to see a doctor */}
            <div className="mt-10 rounded-2xl  bg-yellow-50 p-6">
                <div className="text-center">
                    <h3 className="text-lg font-semibold">{t("cta.title")}</h3>
                    <p className="mt-1 text-base text-muted-foreground">{t("cta.desc")}</p>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl bg-white p-5 text-center shadow-sm">
                        <div className="mx-auto mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                            <Stethoscope className="h-5 w-5 text-red-600" />
                        </div>
                        <p className="text-base font-semibold">{t("cta.immediate.title")}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{t("cta.immediate.desc")}</p>
                    </div>
                    <div className="rounded-xl bg-white p-5 text-center shadow-sm">
                        <div className="mx-auto mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-orange-100">
                            <Clock className="h-5 w-5 text-orange-600" />
                        </div>
                        <p className="text-base font-semibold">{t("cta.withinDays.title")}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{t("cta.withinDays.desc")}</p>
                    </div>
                    <div className="rounded-xl bg-white p-5 text-center shadow-sm">
                        <div className="mx-auto mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
                            <CalendarCheck2 className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-base font-semibold">{t("cta.routine.title")}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{t("cta.routine.desc")}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

/** ---- Risk Factors ---- */
function RiskSection() {
    const t = useTranslations("diabetes.risk");
    const genList: string[] = t.raw("genetic.list");
    const lifeList: string[] = t.raw("lifestyle.list");
    const items: string[] = t.raw("items");

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
                        className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-3 text-base text-red-900"
                    >
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{text}</span>
                    </div>
                ))}
            </div>

            <div className="mt-8 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 p-6">
                <h3 className="text-center text-lg font-semibold">
                    {t("my.title")}
                </h3>

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

/** ---- Prevention ---- */
function PreventionSection() {
    const t = useTranslations("diabetes.prevention");
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
                    <div key={text} className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-base text-emerald-900">
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        <span>{text}</span>
                    </div>
                ))}
                {itemsRight.map((text) => (
                    <div key={text} className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-base text-emerald-900">
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        <span>{text}</span>
                    </div>
                ))}
            </div>

            {/* Malaysian dietary recommendations */}
            <div className="mt-8 rounded-2xl bg-gradient-to-r from-green-50 to-cyan-50 p-6">
                <h3 className="text-center text-lg font-semibold">{t("diet.title")}</h3>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                                <CookingPot className="h-4 w-4 text-emerald-700" />
                            </span>
                            <CardTitle className="text-base">{t("diet.localTitle")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc space-y-1 pl-5 text-base text-muted-foreground">
                                {foodsLocal.map((v) => (
                                    <li key={v}>{v}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                                <Ban className="h-4 w-4 text-red-700" />
                            </span>
                            <CardTitle className="text-base">{t("diet.limitTitle")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc space-y-1 pl-5 text-base text-muted-foreground">
                                {foodsLimit.map((v) => (
                                    <li key={v}>{v}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                <Utensils className="h-4 w-4 text-blue-700" />
                            </span>
                            <CardTitle className="text-base">{t("diet.portionTitle")}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc space-y-1 pl-5 text-base text-muted-foreground">
                                {portion.map((v) => (
                                    <li key={v}>{v}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}

/** ---- Management ---- */
function ManagementSection() {
    const t = useTranslations("diabetes.management");
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
                    <div key={text} className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-base text-blue-900">
                        <HeartPulse className="h-4 w-4 shrink-0" />
                        <span>{text}</span>
                    </div>
                ))}
                {tipsRight.map((text) => (
                    <div key={text} className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-base text-blue-900">
                        <HeartPulse className="h-4 w-4 shrink-0" />
                        <span>{text}</span>
                    </div>
                ))}
            </div>

            {/* Targets / Meds / Check-ups */}
            <div className="mt-8 grid gap-4 md:grid-cols-3">
                {/* Blood Sugar Targets */}
                <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                            <Activity className="h-4 w-4 text-red-600" />
                        </span>
                        <CardTitle className="text-base text-red-700">
                            {t("panels.targetsTitle")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-base">
                            {targets.map((v) => (
                                <li
                                    key={v}
                                    className="rounded-md bg-[#F6F6FA] p-2 shadow-sm"
                                >
                                    {v}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Medication Types */}
                <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                            <Stethoscope className="h-4 w-4 text-green-700" />
                        </span>
                        <CardTitle className="text-base text-green-700">
                            {t("panels.medsTitle")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-base">
                            {meds.map((v) => (
                                <li
                                    key={v}
                                    className="rounded-md bg-[#F6F6FA] p-2 shadow-sm"
                                >
                                    {v}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Regular Check-ups */}
                <Card>
                    <CardHeader className="flex flex-row items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                            <CalendarCheck2 className="h-4 w-4 text-blue-700" />
                        </span>
                        <CardTitle className="text-base text-blue-700">
                            {t("panels.checksTitle")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-base">
                            {checks.map((v) => (
                                <li
                                    key={v}
                                    className="rounded-md bg-[#F6F6FA] p-2 shadow-sm"
                                >
                                    {v}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* CTA */}
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
