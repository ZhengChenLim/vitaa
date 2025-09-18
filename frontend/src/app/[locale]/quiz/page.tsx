// app/quiz/page.tsx
"use client";

import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation"; // or "next/link" if not using next-intl helper
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

type Question = {
  id: number;
  topic: string;
  question: string;
  question_ms?: string;
  question_zh?: string;
  question_vi?: string;
  option_a: string; option_a_ms?: string; option_a_zh?: string; option_a_vi?: string;
  option_b: string; option_b_ms?: string; option_b_zh?: string; option_b_vi?: string;
  option_c: string; option_c_ms?: string; option_c_zh?: string; option_c_vi?: string;
  option_d: string; option_d_ms?: string; option_d_zh?: string; option_d_vi?: string;
  correct_option: "A" | "B" | "C" | "D";
};

type ApiResponse = {
  topics: string[];
  count_by_topic: Record<string, number>;
  total: number;               // 25
  questions: Question[];       // 25
};

const API_URL = process.env.NEXT_PUBLIC_API_BASE
  ? `${process.env.NEXT_PUBLIC_API_BASE}/api/ncd-quiz/questions`
  : "http://127.0.0.1:8000/api/ncd-quiz/questions";

const PER_SECTION = 5; // 5 sections × 5 questions

export default function QuizPage() {
  const t = useTranslations("quiz");
  const locale = useLocale();

  const [data, setData] = React.useState<ApiResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // section index 0..4
  const [section, setSection] = React.useState(0);
  // answers keyed by question id -> "A" | "B" | "C" | "D"
  const [answers, setAnswers] = React.useState<Record<number, "A" | "B" | "C" | "D" | "">>({});

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(API_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json: ApiResponse = await res.json();
        setData(json);
      } catch (e: any) {
        setError(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const localeSuffix =
    locale === "ms" ? "_ms" : locale === "zh" ? "_zh" : locale === "vi" ? "_vi" : "";

  const getLocalized = (q: Question, base: keyof Question & string) => {
    const locKey = (base + localeSuffix) as keyof Question;
    const loc = q[locKey] as unknown as string | undefined;
    const eng = (q as any)[base] as string;
    return (loc && loc.trim().length > 0 ? loc : eng) ?? "";
  };

  const total = data?.total ?? 0;
  const sectionCount = Math.ceil(total / PER_SECTION);

  const sectionStart = section * PER_SECTION;
  const sectionQs = data?.questions.slice(sectionStart, sectionStart + PER_SECTION) ?? [];

  const setAnswer = (qid: number, val: "A" | "B" | "C" | "D") =>
    setAnswers((p) => ({ ...p, [qid]: val }));

  const nextSection = () => setSection((s) => Math.min(sectionCount - 1, s + 1));
  const prevSection = () => setSection((s) => Math.max(0, s - 1));
  const jumpTo = (s: number) => setSection(s);

  const onSubmit = () => {
    // Save answers for results page (optional)
    if (typeof window !== "undefined") {
      sessionStorage.setItem("quiz:answers", JSON.stringify(answers));
      sessionStorage.setItem("quiz:questions", JSON.stringify(data?.questions ?? []));
      sessionStorage.setItem("quiz:topics", JSON.stringify(data?.topics ?? []));
      sessionStorage.setItem("quiz:count_by_topic", JSON.stringify(data?.count_by_topic ?? {}));
    }
    window.location.href = "/quiz/results"; // or compute inline if you prefer
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <p className="text-sm text-red-600">{t("error")} {error ? `(${error})` : ""}</p>
        <Button asChild className="mt-3"><Link href="/">{t("backHome")}</Link></Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-green-50/40 pb-24">
      {/* Breadcrumbs */}
      <Breadcrumb className="mx-auto max-w-6xl px-4 pt-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                <Home className="h-4 w-4" aria-hidden="true" />
                <span>{t("breadcrumbHome")}</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sm text-gray-700">{t("breadcrumbQuiz")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Title + subtitle + stepper */}
      <section className="mx-auto max-w-6xl px-4 pt-4 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">{t("hero.title")}</h1>
        <p className="mt-2 text-gray-600">{t("hero.lead")}</p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white font-bold">1</div>
          <div className="h-[2px] w-16 bg-gray-300" />
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-300 text-gray-400 font-bold">2</div>
        </div>
      </section>

      {/* QUIZ CARD */}
      <section className="mx-auto mt-8 max-w-6xl px-4">
        <Card className="rounded-2xl border border-slate-200/70 shadow-[0_20px_60px_-28px_rgba(2,132,199,0.20)]">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">🗂️</span>
              <CardTitle className="text-lg font-bold">{t("card.title")}</CardTitle>
            </div>

            {/* Section navigator like screenshot box */}
            <div className="rounded-md border bg-slate-50 px-3 py-2 text-xs">
              <div className="mb-1 font-semibold">{t("nav.title")}</div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: sectionCount }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => jumpTo(i)}
                    className={cn(
                      "rounded-sm border px-2 py-1 transition-colors",
                      i === section
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    )}
                    aria-label={`${t("nav.section")} ${i + 1}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              {/* <div className="mt-1 text-right text-[10px] text-slate-500">{t("nav.hide")}</div> */}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Section header strip */}
            <div className="border-t border-slate-200/70  px-5 py-4">
              <h3 className="text-base font-bold">
                {t("sectionPrefix")} {section + 1}
                <span className="text-slate-500"> — {sectionQs[0]?.topic ?? ""}</span>
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                {t("sectionHint", { start: sectionStart + 1, end: Math.min(sectionStart + PER_SECTION, total), total })}
              </p>
            </div>

            {/* Questions grid */}
            <div className="grid gap-5 bg-white px-5 py-6">
              {sectionQs.map((q, idxInSection) => {
                const labelA = getLocalized(q, "option_a");
                const labelB = getLocalized(q, "option_b");
                const labelC = getLocalized(q, "option_c");
                const labelD = getLocalized(q, "option_d");
                const chosen = answers[q.id] || "";
                const qNumber = sectionStart + idxInSection + 1;

                return (
                  <div
                    key={q.id}
                    className="rounded-xl border border-slate-200/70 bg-emerald-50/40 p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <p className="text-base font-semibold">
                        {qNumber}. {getLocalized(q, "question")}
                      </p>
                      <span className={cn(
                        "shrink-0 rounded-md border px-2 py-1 text-[11px]",
                        chosen ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"
                      )}>
                        {chosen ? t("left.answered") : t("left.notAnswered")}
                      </span>
                    </div>

                    <RadioGroup
                      value={chosen}
                      onValueChange={(val: "A" | "B" | "C" | "D") => setAnswer(q.id, val)}
                      className="space-y-3"
                    >
                      {([
                        ["A", labelA],
                        ["B", labelB],
                        ["C", labelC],
                        ["D", labelD],
                      ] as const).map(([val, label]) => {
                        const id = `${q.id}-${val}`;
                        return (
                          <div
                            key={val}
                            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 hover:bg-emerald-100/60"
                          >
                            <RadioGroupItem id={id} value={val as any} />
                            <Label htmlFor={id} className="text-sm leading-5">
                              {label}
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>
                );
              })}
            </div>

            {/* Bottom controls */}
            <div className="flex items-center justify-between border-t border-slate-200/70 bg-white px-5 py-4">
              <Button variant="outline" onClick={prevSection} disabled={section === 0}>
                {t("prev")}
              </Button>

              {section < sectionCount - 1 ? (
                <Button onClick={nextSection}>{t("next")}</Button>
              ) : (
                <Button
                  size="lg"
                  onClick={onSubmit}
                  className="rounded-2xl px-10 py-6 text-base font-semibold text-white shadow-lg
                             bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                >
                  {t("submit")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
