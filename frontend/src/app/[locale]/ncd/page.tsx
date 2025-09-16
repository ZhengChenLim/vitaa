"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplet, HeartPulse, Activity } from "lucide-react";

export default function NcdPage() {
    const t = useTranslations("NCD");

    const diseases = [
        {
            key: "diabetes",
            icon: <Droplet className="h-6 w-6" />,
            title: t("diabetesTitle"),
            desc: t("diabetesDesc"),
            prevalence: t("diabetesPrev"),
            color: "text-white",
            bgColor: "bg-[#FF5A5A]",
            cardbg: "bg-[#FF5A5A]/10",
        },
        {
            key: "hypertension",
            icon: <HeartPulse className="h-6 w-6" />,
            title: t("hypertensionTitle"),
            desc: t("hypertensionDesc"),
            prevalence: t("hypertensionPrev"),
            color: "text-white",
            bgColor: "bg-yellow-400",
            cardbg: "bg-yellow-100",
        },
        {
            key: "stroke",
            icon: <Activity className="h-6 w-6" />,
            title: t("strokeTitle"),
            desc: t("strokeDesc"),
            prevalence: t("strokePrev"),
            color: "text-white",
            bgColor: "bg-emerald-400",
            cardbg: "bg-emerald-100",
        },
    ];

    return (
        <main className="px-4 max-w-6xl mx-auto space-y-12">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-2xl bg-[url('/library-hero.jpg')] bg-cover bg-center">
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
                <p className="mt-2 text-center text-sm text-muted-foreground">
                    {t("typesSubtitle")}
                </p>

                <div className="mt-6 grid gap-6 md:grid-cols-3">
                    {diseases.map((d, i) => (
                        <Card key={i} className={`flex flex-col justify-between ${d.cardbg} border-0 shadow-sm`}>
                            
                            <CardHeader className="flex flex-row items-center gap-3 bg-white p-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${d.bgColor} ${d.color}`}>
                                    {d.icon}
                                </div>
                                <CardTitle>{d.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="text-base">
                                <p className="mb-3">{d.desc}</p>
                                <p className="font-medium text-emerald-600">{d.prevalence}</p>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full">
                                    {t("learnMore")}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>
        </main>
    );
}
