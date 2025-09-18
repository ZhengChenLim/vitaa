"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Home, ClipboardList, ChartColumn } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { cn } from "@/lib/utils";

type Question = {
  id: number;
  topic: string;
  correct_option: "A" | "B" | "C" | "D";
};

const topicKey = (topic: string) => {
  const map: Record<string, string> = {
    "Diabetes": "diabetes",
    "Stroke": "stroke",
    "Hypertension": "hypertension",
    "Other NCDs": "otherNcds",
    "General Knowledge": "generalKnowledge",
  };
  return map[topic] ?? topic.toLowerCase().replace(/\s+/g, "");
};
export default function QuizResultsPage() {
  const t = useTranslations("quiz");

  const [results, setResults] = React.useState<Record<
    string,
    { correct: number; total: number }
  > | null>(null);

  

  React.useEffect(() => {
    // read saved state from sessionStorage
    const rawAns = sessionStorage.getItem("quiz:answers");
    const rawQs = sessionStorage.getItem("quiz:questions");
    const rawTopics = sessionStorage.getItem("quiz:topics");
    const rawCounts = sessionStorage.getItem("quiz:count_by_topic");

    if (!rawAns || !rawQs || !rawTopics || !rawCounts) return;

    const answers: Record<number, string> = JSON.parse(rawAns);
    const questions: Question[] = JSON.parse(rawQs);
    const topics: string[] = JSON.parse(rawTopics);
    const counts: Record<string, number> = JSON.parse(rawCounts);

    const perTopic: Record<string, { correct: number; total: number }> = {};
    topics.forEach((topic) => {
      perTopic[topic] = { correct: 0, total: counts[topic] };
    });

    questions.forEach((q) => {
      if (answers[q.id] === q.correct_option) {
        perTopic[q.topic].correct++;
      }
    });

    setResults(perTopic);
  }, []);

  if (!results) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <p className="text-sm text-red-600">{t("noResults")}</p>
        <Link href="/quiz" className="text-emerald-600 underline">
          {t("retry")}
        </Link>
      </main>
    );
  }

  // prepare chart data
  const chartData = Object.entries(results).map(([topic, { correct, total }]) => ({
    topic,                                // original (for any internal logic)
    label: t(`topics.${topicKey(topic)}`),// localized label for display
    score: (correct / total) * 5,         // 0–5 scale
  }));

  return (
    <main className="min-h-screen w-full bg-green-50/40 pb-24">
      {/* Breadcrumbs */}
      <Breadcrumb className="mx-auto max-w-6xl px-4 pt-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                <Home className="h-4 w-4" aria-hidden="true" />
                <span>{t("breadcrumbHome")}</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/quiz" className="text-sm text-gray-500 hover:text-gray-700">
                {t("breadcrumbQuiz")}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sm text-gray-700">
              {t("breadcrumbResults")}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Title + stepper */}
      <section className="mx-auto max-w-6xl px-4 pt-4 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">{t("resultsTitle")}</h1>
        <p className="mt-2 text-gray-600">{t("hero.lead")}</p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-300 text-gray-400 font-bold">
            1
          </div>
          <div className="h-[2px] w-16 bg-gray-300" />
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white font-bold">
            2
          </div>
        </div>
      </section>

      {/* Result Card */}
       {/* Result Card */}
      <section className="mx-auto mt-8 max-w-6xl px-4">
        <Card className="rounded-2xl border border-slate-200/70 shadow">
          <CardHeader className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg font-bold">{t("yourResult")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 py-4">
            {Object.entries(results).map(([topic, { correct, total }]) => {
              const percent = correct / total;
              const color =
                percent >= 0.8 ? "bg-emerald-500"
                : percent >= 0.5 ? "bg-yellow-500"
                : "bg-red-500";

              const label = t(`topics.${topicKey(topic)}`);

              return (
                <div key={topic}>
                  <div className="flex justify-between text-sm font-medium">
                    <span>{label}</span>
                    <span>
                      {correct} {t("outOf")} {total}
                    </span>
                  </div>
                  <div className="mt-1 h-3 w-full rounded-full bg-gray-200">
                    <div className={cn("h-3 rounded-full", color)} style={{ width: `${percent * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      {/* Radar Chart */}
      <section className="mx-auto mt-8 max-w-6xl px-4">
        <Card className="rounded-2xl border border-slate-200/70 shadow">
          <CardHeader className="flex items-center gap-2">
            <ChartColumn className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-lg font-bold">{t("radarTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer>
                <RadarChart data={chartData}>
                  <PolarGrid />
                  {/* use the localized label here */}
                  <PolarAngleAxis dataKey="label" />
                  <PolarRadiusAxis domain={[0, 5]} />
                  <Radar name="Score" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
