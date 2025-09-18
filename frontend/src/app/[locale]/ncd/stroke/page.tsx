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
    Brain,
} from "lucide-react";

const HERO_IMG = "/stroke-hero.jpg";

export default function StrokePage() {
    const t = useTranslations("stroke");
    const facts: string[] = t.raw("facts");

    return (
        <main className="min-h-screen max-w-6xl mx-auto bg-white">
            {/* Hero */}
            {/* <section className="relative isolate">
                <div className="relative h-[320px] w-full overflow-hidden">
                    <Image src={HERO_IMG} alt="" fill priority className="object-cover" />
                    <div
                        aria-hidden
                        className="absolute inset-0 bg-purple-600/70"
                    />
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
                                <Brain className="h-5 w-5" />
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight">{t("title")}</h1>
                            <p className="mt-3 max-w-3xl text-base text-white/90">{t("subtitle")}</p>
                        </div>
                    </div>
                </div>
            </section> */}
            <section className="relative w-full bg-violet-50 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
                    <svg aria-hidden width="100%" height="180" viewBox="0 0 1200 180" preserveAspectRatio="none">
                        <path d="M0,90 L1200,90" stroke="rgb(221,214,254)" strokeWidth="1" opacity="0.2" fill="none" />
                        <defs>
                            <path id="ecg-purple" d="
          M0,90 L80,90 L110,50 L130,150 L150,90
          L210,90 L240,42 L260,150 L280,90
          L350,90 L380,55 L400,150 L420,90
          L500,90 L530,48 L550,150 L570,90
          L650,90 L680,45 L700,150 L720,90
          L800,90 L830,52 L850,150 L870,90
          L950,90 L980,40 L1000,150 L1020,90
          L1100,90 L1130,48 L1150,150 L1170,90
          L1200,90" />
                        </defs>
                        <use href="#ecg-purple" stroke="rgb(139,92,246)" strokeWidth="6" opacity="0.10" fill="none" />
                        <use href="#ecg-purple" stroke="rgb(221,214,254)" strokeWidth="2" fill="none" strokeLinecap="round" />
                        <circle r="5" fill="rgb(124,58,237)">
                            <animateMotion dur="3.4s" repeatCount="indefinite"><mpath href="#ecg-purple" /></animateMotion>
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
                                    className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-violet-500 shadow-md md:h-20 md:w-20">
                                    <Brain className="h-8 w-8 text-white md:h-10 md:w-10" />
                                </motion.div>
                            </motion.div>
                            <motion.h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-6xl">
                                {t("title")}
                            </motion.h1>
                        </div>
                        <motion.p className="mt-3 max-w-2xl text-base text-gray-800 font-medium md:text-lg">
                            {t("subtitle", { count: "1.4" })}
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
                            <div className="absolute -left-2 top-0 h-full w-1 rounded bg-fuchsia-500" />
                            <div className="rounded-2xl bg-fuchsia-50 p-5 pl-6">
                                <p className="mb-2 text-sm font-semibold text-fuchsia-700">{t("keyFacts")}</p>
                                <ul className="list-disc space-y-1 pl-5 text-base text-fuchsia-900">
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
                                src="https://www.youtube.com/embed/-NJm4TJ2it0?si=aPyjcMV5FuvV3SFY"
                                title="Stroke explainer"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                referrerPolicy="strict-origin-when-cross-origin"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-10 grid gap-4 md:grid-cols-3">
                    <StatCard value={t("stats.cases")} label={t("stats.casesLabel")} footnote="New stroke cases per year" />
                    <StatCard value={t("stats.deathsPercent")} label={t("stats.deathsLabel")} footnote="MOH Malaysia 2021" />
                    <StatCard value={t("stats.rank")} label={t("stats.rankLabel")} footnote="Of deaths in Malaysia" />
                </div>

                {/* Types */}
                <div className="mt-10 grid gap-6 md:grid-cols-2">
                    <div className="rounded-2xl border border-fuchsia-200 p-6">
                        <h4 className="text-xl font-semibold">{t("types.ischemicTitle")}</h4>
                        <p className="mt-3 text-base leading-7 text-muted-foreground">{t("types.ischemicDesc")}</p>
                        <div className="mt-4 rounded-lg bg-fuchsia-100 px-4 py-3 text-sm text-fuchsia-800">
                            {t("types.ischemicNote")}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-fuchsia-200 p-6">
                        <h4 className="text-xl font-semibold">{t("types.hemorrhagicTitle")}</h4>
                        <p className="mt-3 text-base leading-7 text-muted-foreground">{t("types.hemorrhagicDesc")}</p>
                        <div className="mt-4 rounded-lg bg-fuchsia-100 px-4 py-3 text-sm text-fuchsia-800">
                            {t("types.hemorrhagicNote")}
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

/* ---------- Sub-nav (stroke tabs) ---------- */
function SubNav() {
    const t = useTranslations("stroke.tabs");
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
        const offset = isMobile ? 96 : 120; // keep this as your true sticky offset
        const y = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: "smooth" });
        history.replaceState(null, "", `#${id}`);
    };

    // IntersectionObserver: use the SAME top offset as scrolling
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

    // (Optional) Scroll fallback for iOS/short sections
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
                    aria-label="Stroke sections"
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
                                ? "border-purple-200 bg-purple-500 text-white"
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
function StatCard({ value, label, footnote }: { value: string; label: string; footnote?: string }) {
    return (
        <Card>
            <CardContent className="flex items-center justify-between gap-4 p-6">
                <div className="text-center w-full">
                    <p className="text-3xl text-fuchsia-600 font-bold">{value}</p>
                    <p className="mt-1 text-sm font-medium">{label}</p>
                    {footnote && <p className="mt-1 text-xs text-muted-foreground">{footnote}</p>}
                </div>
            </CardContent>
        </Card>
    );
}

/* ---------- Symptoms (F.A.S.T.) ---------- */
function SymptomsSection() {
    const t = useTranslations("stroke.symptoms");
    const other: string[] = t.raw("otherList");
    const doList: string[] = t.raw("whatToDo.list");
    const dontList: string[] = t.raw("whatNotToDo.list");

    return (
        <section id="symptoms" className="scroll-mt-32 mx-auto max-w-6xl px-4 py-10">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
                <p className="mt-2 text-base text-muted-foreground">{t("subtitle")}</p>
            </div>

            {/* FAST cards */}
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6">
                <div className="grid gap-4 md:grid-cols-4">
                    <FastCard letter="F" title="Face" desc={t("fast.face")} desc2={t("fast.face2")} />
                    <FastCard letter="A" title="Arms" desc={t("fast.arms")} desc2={t("fast.arms2")} />
                    <FastCard letter="S" title="Speech" desc={t("fast.speech")} desc2={t("fast.speech2")} />
                    <FastCard letter="T" title="Time" desc={t("fast.time")} desc2={t("fast.time2")} />
                </div>

                <div className="mt-6 rounded-xl bg-rose-100 p-5 text-center text-rose-900">
                    <p className="text-base font-semibold">{t("emergencyAction")}</p>
                </div>
            </div>

            {/* Other symptoms */}
            <div className="mt-8 rounded-2xl border p-6">
                <h3 className="text-lg font-semibold">{t("otherTitle")}</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {other.map((v) => (
                        <div key={v} className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-3 text-base text-rose-900">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{v}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Do / Don't */}
            <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border p-6">
                    <h4 className="text-base font-semibold">{t("whatToDo.title")}</h4>
                    <ul className="mt-3 space-y-2 text-base">
                        {doList.map((v, i) => (
                            <li key={v} className="rounded-md bg-emerald-50 p-3">
                                <span className="font-semibold">{i + 1}. </span>
                                {v}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-2xl border p-6">
                    <h4 className="text-base font-semibold">{t("whatNotToDo.title")}</h4>
                    <ul className="mt-3 space-y-2 text-base">
                        {dontList.map((v, i) => (
                            <li key={v} className="rounded-md bg-zinc-50 p-3">
                                <span className="font-semibold">{i + 1}. </span>
                                {v}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}

function FastCard({ letter, title, desc, desc2 }: { letter: string; title: string; desc: string; desc2: string }) {
    return (
        <div className="rounded-xl bg-white p-5 shadow-sm text-center">
            <div className="mx-auto mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-bold">
                {letter}
            </div>
            <p className="text-base font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            <p className="mt-1 text-sm text-muted-foreground">{desc2}</p>
        </div>
    );
}

/* ---------- Risk ---------- */
function RiskSection() {
    const t = useTranslations("stroke.risk");
    const items: string[] = t.raw("list");
    const ethnic: string[] = t.raw("malaysianSpecific.ethnic");
    const lifestyle: string[] = t.raw("malaysianSpecific.lifestyle");

    return (
        <section id="risk" className="scroll-mt-32 mx-auto max-w-6xl px-4 py-10">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
                <p className="mt-2 text-base text-muted-foreground">
                    {useTranslations("stroke")("prevention.subtitle")}
                </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
                {items.map((text) => (
                    <div
                        key={text}
                        className="flex items-center gap-2 rounded-lg border border-fuchsia-100 bg-fuchsia-50 px-3 py-3 text-base text-fuchsia-900"
                    >
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{text}</span>
                    </div>
                ))}
            </div>

            <div className="mt-8 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 p-6">
                <h3 className="text-center text-lg font-semibold">{t("malaysianSpecific.title")}</h3>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl bg-white p-5 shadow-sm">
                        <p className="text-base font-semibold">Ethnic Variations</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-base text-muted-foreground">
                            {ethnic.map((v) => (
                                <li key={v}>{v}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-xl bg-white p-5 shadow-sm">
                        <p className="text-base font-semibold">Lifestyle Factors</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-base text-muted-foreground">
                            {lifestyle.map((v) => (
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
    const t = useTranslations("stroke.prevention");
    const list: string[] = t.raw("list");
    const include: string[] = t.raw("diet.include");
    const limit: string[] = t.raw("diet.limit");
    const cook: string[] = t.raw("diet.cookingTips");

    return (
        <section id="prevention" className="scroll-mt-32 mx-auto max-w-6xl px-4 py-10">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
                <p className="mt-2 text-base text-muted-foreground">{t("subtitle")}</p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
                {list.map((text) => (
                    <PreventionBullet key={text} text={text} />
                ))}
            </div>

            <div className="mt-8 rounded-2xl bg-gradient-to-r from-green-50 to-cyan-50 p-6">
                <h3 className="text-center text-lg font-semibold">{t("diet.title")}</h3>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <DietCard
                        iconBg="bg-emerald-100"
                        icon={<CookingPot className="h-4 w-4 text-emerald-700" />}
                        title={t("diet.title") + " — Include More"}
                        items={include}
                    />
                    <DietCard
                        iconBg="bg-red-100"
                        icon={<Ban className="h-4 w-4 text-red-700" />}
                        title="Limit"
                        items={limit}
                    />
                    <DietCard
                        iconBg="bg-blue-100"
                        icon={<Utensils className="h-4 w-4 text-blue-700" />}
                        title="Cooking Tips"
                        items={cook}
                    />
                </div>
            </div>
        </section>
    );
}

function PreventionBullet({ text }: { text: string }) {
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
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${iconBg}`}>{icon}</span>
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
    const t = useTranslations("stroke.management");
    const list: string[] = t.raw("list");
    const golden: string[] = t.raw("goldenHours.stages");
    const med: string[] = t.raw("secondary.medical");
    const life: string[] = t.raw("secondary.lifestyle");

    const rootT = useTranslations("stroke");

    return (
        <section id="management" className="scroll-mt-32 mx-auto max-w-6xl px-4 py-10">
            <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
                <p className="mt-2 text-base text-muted-foreground">{t("subtitle")}</p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
                {list.map((text) => (
                    <ManageBullet key={text} text={text} />
                ))}
            </div>

            {/* Golden hours */}
            <div className="mt-8 rounded-2xl bg-rose-50 p-6">
                <h3 className="text-center text-lg font-semibold">{t("goldenHours.title")}</h3>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                    {golden.map((v) => (
                        <Card key={v}>
                            <CardContent className="p-6 text-center">
                                <p className="text-base">{v}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Secondary prevention */}
            <div className="mt-8 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 p-6">
                <h3 className="text-center text-lg font-semibold">{rootT("management.secondary.title")}</h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <PanelCard
                        icon={<Activity className="h-4 w-4 text-red-600" />}
                        title="Medical Management"
                        items={med}
                    />
                    <PanelCard
                        icon={<ShieldCheck className="h-4 w-4 text-green-700" />}
                        title="Lifestyle Modifications"
                        items={life}
                    />
                </div>
            </div>

            {/* CTA */}
            <div className="mt-8 rounded-2xl border bg-white p-6 text-center">
                <p className="text-base text-muted-foreground">{useTranslations("stroke.cta")("desc")}</p>
                <div className="mt-4 flex flex-col gap-3 md:flex-row md:justify-center">
                    <Link
                        href="/planform"
                        className="rounded-full bg-emerald-500 px-5 py-2 text-base font-medium text-white hover:bg-emerald-600"
                    >
                        {useTranslations("stroke.cta")("buttons.diet")}
                    </Link>
                    <Link
                        href="/analysisform"
                        className="rounded-full bg-orange-500 px-5 py-2 text-base font-medium text-white hover:bg-orange-600"
                    >
                        {useTranslations("stroke.cta")("buttons.analysis")}
                    </Link>
                    <Link
                        href="/quiz"
                        className="rounded-full bg-blue-600 px-5 py-2 text-base font-medium text-white hover:bg-blue-700"
                    >
                        {useTranslations("stroke.cta")("buttons.quiz")}
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
