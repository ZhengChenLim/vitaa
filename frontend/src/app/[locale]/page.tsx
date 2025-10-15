import { getTranslations } from 'next-intl/server';
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Link } from '@/i18n/navigation';
import { Activity, HeartPulse, BookOpenCheck, Edit, Wind } from "lucide-react";

export default async function HomePage() {
  const t = await getTranslations('home');
  const title = t.rich('heroTitle', {
    strong: (chunks) => <span className="text-[#37CD9B]">{chunks}</span>
  });
  return (
    <main className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h1 className="text-4xl md:text-7xl font-extrabold leading-tight">
              {title}
            </h1>
            <p className="mt-4 text-gray-600">{t('heroSubtitle')}</p>
            <div className="mt-6 flex gap-4">
              <Button className="bg-gradient-to-r from-[#13D298] to-[#2CD30D] text-white font-semibold shadow-md hover:opacity-90"
                size={"lg"}>
                <Link href="/planform">{t('ctaGenerate')}</Link></Button>
              {/* <Button variant="outline">{t('ctaSample')}</Button> */}
            </div>
          </div>

          <div className="flex-1">
            <div className="rounded-2xl overflow-hidden shadow">
              <img src="/hero.png" alt="Healthy lifestyle" />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: Stats + Prevention pill card */}
      <section className="w-full bg-green-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-5xl font-bold">{t('malaysiaReality')}</h2>
            <p className="mt-2 text-gray-600">{t('malaysiaSubtitle')}</p>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow">
              <p className="text-5xl font-extrabold text-[#37CD9B] text-center">73%</p>
              <p className="mt-2 font-semibold">{t('stat1')}</p>
              <p className="text-sm text-gray-500">{t('stat1sub')}</p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow">
              <p className="text-5xl font-extrabold text-[#37CD9B] text-center">3.9M</p>
              <p className="mt-2 font-semibold">{t('stat2')}</p>
              <p className="text-sm text-gray-500">{t('stat2sub')}</p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow">
              <p className="text-5xl font-extrabold text-[#37CD9B] text-center">80%</p>
              <p className="mt-2 font-semibold">{t('stat3')}</p>
              <p className="text-sm text-gray-500">{t('stat3sub')}</p>
            </div>
          </div>

          {/* Prevention pill card */}
          <div className="mt-10 flex justify-center">
            <div className="w-full max-w-4xl rounded-[24px] bg-white p-6 shadow-lg md:p-8">
              <h3 className="text-center text-xl font-extrabold md:text-2xl">
                {t('preventionTitle')}
              </h3>
              <p className="mx-auto mt-3 max-w-3xl text-center text-gray-600">
                {t('preventionText')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: CTA with glow, image left / copy right */}
      <section className="relative w-full bg-white py-16">
        {/* glow */}
        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-[420px] w-[720px] rounded-full bg-[radial-gradient(closest-side,rgba(34,197,94,0.18),transparent_70%)] blur-0" />
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 md:grid-cols-2">
          {/* Left image stack */}
          <div className="mx-auto w-full max-w-md">
            <div className="relative">
              {/* bottom card */}
              <img
                src="/cta-bottom.png"
                alt="Health profile cards"
                width="300"
                height="200"
                className="w-full rotate-[-9deg] rounded-2xl shadow-xl"
              />
              {/* top card */}
              <img
                src="/cta-top.png"
                alt="Risk widgets"
                width="400"
                height="300"
                className=" left-40 top-6 w-[88%] rotate-[11deg] rounded-2xl shadow-xl"
              />
            </div>
          </div>

          {/* Right copy + button */}
          <div className="text-center md:text-left">
            <h3 className="text-3xl font-extrabold leading-tight md:text-4xl">
              {t.rich('ctaAnalysis', {
                highlight: (chunks) => (
                  <span className="text-green-600">{chunks}</span>
                )
              })}
            </h3>

            <Button
              className="mt-6 inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold text-white shadow-md transition hover:opacity-90 bg-gradient-to-r from-[#13D298] to-[#2CD30D]"
              size={"lg"}
            >
              <Link href={"/analysisform"}>{t('ctaAnalysisBtn')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION 3: Why Vitaa */}
      <section className="w-full bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h3 className="text-center text-3xl font-extrabold">
            {t('whyTitle')}
          </h3>
          <p className="mt-2 text-center text-gray-600">
            {t('whySubtitle')}
          </p>

          <div className="mt-12 flex flex-col space-y-10">

            {/* AI Preventive Health Analytics */}
            <Link
              href="/analysisform"
              className="group flex flex-col md:flex-row items-center gap-6 rounded-2xl bg-green-50 p-6 shadow-sm hover:shadow-md hover:bg-green-100 transition cursor-pointer"
            >
              <div className="w-full md:w-1/2 overflow-hidden rounded-xl">
                <img
                  src="/why-ai.jpg"
                  alt="AI Preventive Health Analytics"
                  className="h-56 w-full object-cover md:h-64 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="w-full md:w-1/2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-600">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">
                    {t('why.aiTitle')}
                  </h4>
                </div>
                <p className="mt-4 text-gray-600 text-sm">{t('why.aiDesc')}</p>
              </div>
            </Link>

            {/* Personalised Health Plans */}
            <Link
              href="/planform"
              className="group flex flex-col md:flex-row-reverse items-center gap-6 rounded-2xl bg-green-50 p-6 shadow-sm hover:shadow-md hover:bg-green-100 transition cursor-pointer"
            >
              <div className="w-full md:w-1/2 overflow-hidden rounded-xl">
                <img
                  src="/why-kitchen.jpg"
                  alt="Personalised Health Plans"
                  className="h-56 w-full object-cover md:h-64 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="w-full md:w-1/2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-600">
                    <HeartPulse className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">
                    {t('why.planTitle')}
                  </h4>
                </div>
                <p className="mt-4 text-gray-600 text-sm">{t('why.planDesc')}</p>
              </div>
            </Link>

            {/* NCD Knowledge Library */}
            <Link
              href="/ncd"
              className="group flex flex-col md:flex-row items-center gap-6 rounded-2xl bg-green-50 p-6 shadow-sm hover:shadow-md hover:bg-green-100 transition cursor-pointer"
            >
              <div className="w-full md:w-1/2 overflow-hidden rounded-xl">
                <img
                  src="/why-library.jpg"
                  alt="NCD Knowledge Library"
                  className="h-56 w-full object-cover md:h-64 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="w-full md:w-1/2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-600">
                    <BookOpenCheck className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">
                    {t('why.libraryTitle')}
                  </h4>
                </div>
                <p className="mt-4 text-gray-600 text-sm">{t('why.libraryDesc')}</p>
              </div>
            </Link>

            {/* Interactive Health Quiz */}
            <Link
              href="/challenges"
              className="group flex flex-col md:flex-row-reverse items-center gap-6 rounded-2xl bg-green-50 p-6 shadow-sm hover:shadow-md hover:bg-green-100 transition cursor-pointer"
            >
              <div className="w-full md:w-1/2 overflow-hidden rounded-xl">
                <img
                  src="/why-quiz.jpg"
                  alt="Interactive Health Quiz"
                  className="h-56 w-full object-cover md:h-64 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="w-full md:w-1/2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-600">
                    <Edit className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">
                    {t('why.quizTitle')}
                  </h4>
                </div>
                <p className="mt-4 text-gray-600 text-sm">{t('why.quizDesc')}</p>
              </div>
            </Link>

            {/* Air Quality Insights */}
            <Link
              href="/airpollution"
              className="group flex flex-col md:flex-row items-center gap-6 rounded-2xl bg-green-50 p-6 shadow-sm hover:shadow-md hover:bg-green-100 transition cursor-pointer"
            >
              <div className="w-full md:w-1/2 overflow-hidden rounded-xl">
                <img
                  src="/why-air.jpg"
                  alt="Air Quality Insights"
                  className="h-56 w-full object-cover md:h-64 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="w-full md:w-1/2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-600">
                    <Wind className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">
                    {t('why.airTitle')}
                  </h4>
                </div>
                <p className="mt-4 text-gray-600 text-sm">{t('why.airDesc')}</p>
              </div>
            </Link>
          </div>
        </div>
      </section>



    </main>
  );
}