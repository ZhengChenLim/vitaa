'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Clipboard } from 'lucide-react';
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage
} from '@/components/ui/breadcrumb';
import { Link } from '@/i18n/navigation';
import { Home } from 'lucide-react';
type Sex = 'male' | 'female' | null;
type Activity = 'sedentary' | 'low' | 'medium' | 'high' | null;
type Alcohol = 'none' | 'occasional' | 'frequent' | null;
type Smoking = 'smoker' | 'nonSmoker' | null;

export default function AnalysisFormPage() {
    const t = useTranslations('analysis');

    // state
    const [age, setAge] = useState('');
    const [sex, setSex] = useState<Sex>(null);
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [waist, setWaist] = useState('');
    const [sbp, setSbp] = useState(''); // systolic BP
    const [activity, setActivity] = useState<Activity>(null);
    const [alcohol, setAlcohol] = useState<Alcohol>(null);
    const [smoking, setSmoking] = useState<Smoking>(null);

    const famKeys = useMemo(
        () => ['diabetes', 'hypertension', 'stroke', 'none'] as const,
        []
    );
    const [family, setFamily] = useState<Record<string, boolean>>({});
    const toggleFam = (k: string) => setFamily(p => {
        // if "none" selected, clear others; if others selected, clear "none"
        if (k === 'none') return { none: !p.none };
        const next = { ...p, [k]: !p[k] };
        if (next[k]) next['none'] = false;
        return next;
    });

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submit payload:', {
            age: age ? Number(age) : null,
            sex,
            height_cm: height ? Number(height) : null,
            weight_kg: weight ? Number(weight) : null,
            waist_cm: waist ? Number(waist) : null,
            systolic_bp: sbp ? Number(sbp) : null,
            activity, alcohol, smoking,
            family_history: famKeys.filter(k => family[k]),
        });
    };

    return (
        <main className="min-h-screen w-full bg-green-50/40 pb-24">
            {/* Breadcrumbs (shadcn) */}
            <Breadcrumb className="mx-auto max-w-6xl px-4 pt-6">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
                            >
                                <Home className="h-4 w-4" aria-hidden="true" />
                                <span>{t('breadcrumbs.home')}</span>
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>

                    <BreadcrumbSeparator />

                    <BreadcrumbItem>
                        <BreadcrumbPage className="text-sm text-gray-700">
                            {t('breadcrumbs.analysis')}
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            {/* Title + subtitle + stepper */}
            <section className="mx-auto max-w-6xl px-4 pt-4 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight">{t('title')}</h1>
                <p className="mt-2 text-gray-600">{t('subtitle')}</p>
                <div className="mt-6 flex items-center justify-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white font-bold">1</div>
                    <div className="h-[2px] w-16 bg-gray-300" />
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-300 text-gray-400 font-bold">2</div>
                </div>
            </section>

            {/* FORM CARD */}
            <section className="mx-auto mt-8 max-w-5xl px-4">
                <form
                    onSubmit={onSubmit}
                    className="relative rounded-[28px] border-2 border-sky-500/60 bg-white p-5 shadow-lg sm:p-7 md:p-8"
                >
                    {/* Header */}
                    <div className="mb-6 flex items-center gap-2">
                        <Clipboard className="text-green-600" />
                        <h2 className="text-lg font-semibold">{t('assessmentTitle')}</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Age */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.age.label')}</label>
                            <input
                                type="number" min={0} placeholder={t('fields.age.placeholder')}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-sky-500"
                                value={age} onChange={(e) => setAge(e.target.value)}
                            />
                        </div>

                        {/* Sex */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.sex.label')}</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button type="button" onClick={() => setSex('male')}
                                    className={`rounded-md border px-3 py-2 font-medium ${sex === 'male' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                                    {t('fields.sex.male')}
                                </button>
                                <button type="button" onClick={() => setSex('female')}
                                    className={`rounded-md border px-3 py-2 font-medium ${sex === 'female' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                                    {t('fields.sex.female')}
                                </button>
                            </div>
                        </div>

                        {/* Height */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.height.label')}</label>
                            <input
                                type="number" min={0} placeholder={t('fields.height.placeholder')}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-sky-500"
                                value={height} onChange={(e) => setHeight(e.target.value)}
                            />
                        </div>

                        {/* Weight */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.weight.label')}</label>
                            <input
                                type="number" min={0} placeholder={t('fields.weight.placeholder')}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-sky-500"
                                value={weight} onChange={(e) => setWeight(e.target.value)}
                            />
                        </div>

                        {/* Waist circumference */}
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.waist.label')}</label>
                            <input
                                type="number" min={0} placeholder={t('fields.waist.placeholder')}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-sky-500"
                                value={waist} onChange={(e) => setWaist(e.target.value)}
                            />
                        </div>

                        {/* Systolic BP */}
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.bpSystolic.label')}</label>
                            <input
                                type="number" min={0} placeholder={t('fields.bpSystolic.placeholder')}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-sky-500"
                                value={sbp} onChange={(e) => setSbp(e.target.value)}
                            />
                            <p className="mt-1 text-xs italic text-gray-500">{t('fields.bpSystolic.help')}</p>
                        </div>

                        {/* Activity */}
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.activity.label')}</label>
                            <div className="grid grid-cols-4 gap-2">
                                {(['sedentary', 'low', 'medium', 'high'] as Activity[]).map(k => (
                                    <button key={k} type="button" onClick={() => setActivity(k)}
                                        className={`rounded-md border px-3 py-2 text-sm font-medium ${activity === k ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                                        {t(`fields.activity.${k}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Alcohol */}
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.alcohol.label')}</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['none', 'occasional', 'frequent'] as Alcohol[]).map(k => (
                                    <button key={k} type="button" onClick={() => setAlcohol(k)}
                                        className={`rounded-md border px-3 py-2 text-sm font-medium ${alcohol === k ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                                        {t(`fields.alcohol.${k}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Smoking */}
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.smoking.label')}</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['smoker', 'nonSmoker'] as Smoking[]).map(k => (
                                    <button key={k} type="button" onClick={() => setSmoking(k)}
                                        className={`rounded-md border px-3 py-2 text-sm font-medium ${smoking === k ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                                        {t(`fields.smoking.${k}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Family history */}
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.family.label')}</label>
                            <div className="grid grid-cols-4 gap-2">
                                {famKeys.map(k => (
                                    <button
                                        key={k}
                                        type="button"
                                        onClick={() => toggleFam(k)}
                                        className={`rounded-md border px-3 py-2 text-sm font-medium ${family[k] ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {t(`fields.family.${k}`)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="mt-6">
                        <button
                            type="submit"
                            className="w-full rounded-xl px-6 py-3 text-base font-semibold text-white shadow-md transition hover:opacity-90 bg-gradient-to-r from-[#13D298] to-[#2CD30D]"
                        >
                            {t('submit')}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}
