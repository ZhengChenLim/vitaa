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
import { Home } from 'lucide-react';
import { Link } from '@/i18n/navigation';

type Sex = 'male' | 'female' | null;
type Activity = 'sedentary' | 'low' | 'medium' | 'high' | null;
type Goal = 'loss' | 'muscle' | 'maintain' | null;
type Diet = 'none' | 'vegan' | 'vegetarian' | null;

export default function PlanPage() {
    const t = useTranslations('plan');

    // form state
    const [age, setAge] = useState<string>('');
    const [sex, setSex] = useState<Sex>(null);
    const [height, setHeight] = useState<string>('');
    const [weight, setWeight] = useState<string>('');
    const [waist, setWaist] = useState<string>('');
    const [activity, setActivity] = useState<Activity>(null);
    const [goal, setGoal] = useState<Goal>(null);
    const [diet, setDiet] = useState<Diet>('none');
    const [eggs, setEggs] = useState<boolean | null>(null);

    const allergyKeys = useMemo(
        () => ['milk', 'eggs', 'peanuts', 'treeNuts', 'soy', 'wheat', 'fish', 'shellfish', 'sesame'] as const,
        []
    );
    const [allergies, setAllergies] = useState<Record<string, boolean>>({});
    const toggleAllergy = (k: string) => setAllergies(prev => ({ ...prev, [k]: !prev[k] }));

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            age: age ? Number(age) : null,
            sex,
            height_cm: height ? Number(height) : null,
            weight_kg: weight ? Number(weight) : null,
            waist_cm: waist ? Number(waist) : null,
            activity,
            goal,
            allergies: allergyKeys.filter(k => allergies[k]),
            diet,
            include_eggs: eggs,
        };
        console.log('Submit payload:', payload);
    };

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
                                <span>{t('breadcrumbs.home')}</span>
                            </Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>

                    <BreadcrumbSeparator />

                    <BreadcrumbItem>
                        <BreadcrumbPage className="text-sm text-gray-700">
                            {t('breadcrumbs.plan')}
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            {/* Title + subtitle */}
            <section className="mx-auto max-w-6xl px-4 pt-4 text-center">

                <h1 className="text-4xl font-extrabold tracking-tight">{t('title')}</h1>
                <p className="mt-2 text-gray-600">{t('subtitle')}</p>

                {/* Stepper */}
                <div className="mt-6 flex items-center justify-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white font-bold">
                        {t('stepper.one')}
                    </div>
                    <div className="h-[2px] w-16 bg-gray-300" />
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-300 text-gray-400 font-bold">
                        {t('stepper.two')}
                    </div>
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
                        <Clipboard className='text-green-600' />
                        <h2 className="text-lg font-semibold">{t('assessmentTitle')}</h2>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Age */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                {t('fields.age.label')}
                            </label>
                            <input
                                type="number"
                                min={0}
                                placeholder={t('fields.age.placeholder')}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-sky-500"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                            />
                        </div>

                        {/* Sex */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                {t('fields.sex.label')}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSex('male')}
                                    className={`rounded-md border px-3 py-2 font-medium ${sex === 'male'
                                            ? 'border-green-600 bg-green-50 text-green-700'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {t('fields.sex.male')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSex('female')}
                                    className={`rounded-md border px-3 py-2 font-medium ${sex === 'female'
                                            ? 'border-green-600 bg-green-50 text-green-700'
                                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {t('fields.sex.female')}
                                </button>
                            </div>
                        </div>

                        {/* Height */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                {t('fields.height.label')}
                            </label>
                            <input
                                type="number"
                                min={0}
                                placeholder={t('fields.height.placeholder')}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-sky-500"
                                value={height}
                                onChange={(e) => setHeight(e.target.value)}
                            />
                        </div>

                        {/* Weight */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                {t('fields.weight.label')}
                            </label>
                            <input
                                type="number"
                                min={0}
                                placeholder={t('fields.weight.placeholder')}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-sky-500"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                            />
                        </div>

                        {/* Waist circumference (full width) */}
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                {t('fields.waist.label')}
                            </label>
                            <input
                                type="number"
                                min={0}
                                placeholder={t('fields.waist.placeholder')}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-sky-500"
                                value={waist}
                                onChange={(e) => setWaist(e.target.value)}
                            />
                        </div>

                        {/* Activity Frequency */}
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                {t('fields.activity.label')}
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {(['sedentary', 'low', 'medium', 'high'] as Activity[]).map((k) => (
                                    <button
                                        key={k}
                                        type="button"
                                        onClick={() => setActivity(k)}
                                        className={`rounded-md border px-3 py-2 text-sm font-medium ${activity === k
                                                ? 'border-green-600 bg-green-50 text-green-700'
                                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {t(`fields.activity.${k}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Fitness Goal */}
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                {t('fields.goal.label')}
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['loss', 'muscle', 'maintain'] as Goal[]).map((k) => (
                                    <button
                                        key={k}
                                        type="button"
                                        onClick={() => setGoal(k)}
                                        className={`rounded-md border px-3 py-2 text-sm font-medium ${goal === k
                                                ? 'border-green-600 bg-green-50 text-green-700'
                                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {t(`fields.goal.${k}`)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Allergies */}
                        <div className="md:col-span-2">
                            <div className="flex items-baseline justify-between">
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    {t('fields.allergies.label')}
                                </label>
                                <span className="text-xs text-gray-500">{t('fields.allergies.help')}</span>
                            </div>

                            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                                {allergyKeys.map((k) => (
                                    <label
                                        key={k}
                                        className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={!!allergies[k]}
                                            onChange={() => toggleAllergy(k)}
                                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                        />
                                        <span className="text-sm text-gray-800">
                                            {t(`fields.allergies.${k}`)}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Diet Preference */}
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                {t('fields.diet.label')}
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['none', 'vegan', 'vegetarian'] as Diet[]).map((k) => (
                                    <button
                                        key={k}
                                        type="button"
                                        onClick={() => setDiet(k)}
                                        className={`rounded-md border px-3 py-2 text-sm font-medium ${diet === k
                                                ? 'border-green-600 bg-green-50 text-green-700'
                                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {t(`fields.diet.${k}`)}
                                    </button>
                                ))}
                            </div>

                            {/* include eggs? */}
                            <div className="mt-3 text-sm text-gray-600">{t('fields.diet.includeEggs')}</div>
                            <div className="mt-1 flex gap-6">
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="eggs"
                                        checked={eggs === true}
                                        onChange={() => setEggs(true)}
                                        className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                                    />
                                    <span>{t('common.yes')}</span>
                                </label>
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="eggs"
                                        checked={eggs === false}
                                        onChange={() => setEggs(false)}
                                        className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                                    />
                                    <span>{t('common.no')}</span>
                                </label>
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
