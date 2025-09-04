'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Home, ClipboardList, Download, Loader2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';

import {
    Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
    BreadcrumbSeparator, BreadcrumbPage
} from '@/components/ui/breadcrumb';
import {
    Accordion, AccordionItem, AccordionTrigger, AccordionContent
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi
} from '@/components/ui/carousel';
import { useEffect, useState, useMemo } from 'react';

/* -------------------- Types -------------------- */
type Meal = {
    img: string;
    title: string;
    kcal: number;
    carbs: string;
    protein: string;
    fat: string;
    fiber?: string;
};

type ApiDish = {
    Dish: string;
    Calories: number;
    Protein_g: number;
    Fat_g: number;
    Carbs_g: number;
};

type ApiDishName = {
    dish_name: string;
    dish_ms_name: string;
    dish_vi_name: string;
    dish_zh_name: string;
};

type ApiMeal = {
    Meal: string;
    Dishes: ApiDishName[];                 // <— was string[]
    Ingredients: Record<string, string[]>;
    Images: Record<string, string>;
    PerDish: ApiDish[];                    // unchanged
    Calories: number;
    Protein_g: number;
    Fat_g: number;
    Carbs_g: number;
};

type ApiResult = {
    targets: {
        calories_kcal: number;
        protein_g: number;
        fat_g: number;
        carbs_g: number;
        fiber_g: number;
        macro_split_pct: {
            protein: number;
            fat: number;
            carbs: number;
        };
    };
    plan: ApiMeal[];
};

type UserProfile = {
    age: number | null;
    sex: 'male' | 'female' | null;
    height_cm: number | null;
    weight_kg: number | null;
    waist_cm: number | null;
    activity_frequency: 'sedentary' | 'low' | 'medium' | 'high' | null;
    allergies: string[];
    diet_preference: 'none' | 'vegan' | 'vegetarian';
    include_eggs: boolean | null;
    fitness_goal: 'Weight Loss' | 'Muscle Gain' | 'Maintain' | null; // label form
};

/* -------------------- Utils -------------------- */
function getCookie(name: string) {
    if (typeof document === 'undefined') return null;
    return document.cookie
        .split('; ')
        .find(row => row.startsWith(name + '='))
        ?.split('=')[1] ?? null;
}

function setCookie(name: string, value: string, days = 7) {
    if (typeof document === 'undefined') return;
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8001';

/* -------------------- Page -------------------- */
export default function HealthPlanPage() {
    const t = useTranslations('planResult'); // texts for this result page
    const tf = useTranslations('plan');      // form labels/options (reuse your Plan page strings)

    const [apiData, setApiData] = useState<ApiResult | null>(null);
    const [loading, setLoading] = useState(true);

    // Editable profile state (same shape as your Plan form, hydrated from storage)
    type Sex = 'male' | 'female' | null;
    type Activity = 'sedentary' | 'low' | 'medium' | 'high' | null;
    type GoalKey = 'loss' | 'muscle' | 'maintain' | null;
    type Diet = 'none' | 'vegan' | 'vegetarian';

    const locale = (useLocale() as 'en' | 'ms' | 'vi' | 'zh') ?? 'en';

    const [age, setAge] = useState<string>('');
    const [sex, setSex] = useState<Sex>(null);
    const [height, setHeight] = useState<string>('');
    const [weight, setWeight] = useState<string>('');
    const [waist, setWaist] = useState<string>('');
    const [activity, setActivity] = useState<Activity>(null);
    const [goal, setGoal] = useState<GoalKey>(null);
    const [diet, setDiet] = useState<Diet>('none');
    const [eggs, setEggs] = useState<boolean | null>(null);

    const allergyKeys = useMemo(
        () => ['milk', 'eggs', 'peanuts', 'treeNuts', 'soy', 'wheat', 'fish', 'shellfish', 'sesame'] as const,
        []
    );
    const [allergiesMap, setAllergiesMap] = useState<Record<string, boolean>>({});
    const toggleAllergy = (k: string) => setAllergiesMap(prev => ({ ...prev, [k]: !prev[k] }));

    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const [fieldErrors, setFieldErrors] = useState<{
        age?: string;
        sex?: string;
        height?: string;
        weight?: string;
        waist?: string;
        activity?: string;
        goal?: string;
    }>({});

    const validateAge = (v: string) => {
        if (!v) return tf('validation.required');
        const n = Number(v);
        if (!Number.isFinite(n)) return tf('validation.number');
        if (n < 18 || n > 150) return tf('validation.age');
        return undefined;
    };
    const validateHeight = (v: string) => {
        if (!v) return tf('validation.required');
        const n = Number(v);
        if (!Number.isFinite(n)) return tf('validation.number');
        if (n < 50 || n > 250) return tf('validation.height');
        return undefined;
    };
    const validateWeight = (v: string) => {
        if (!v) return tf('validation.required');
        const n = Number(v);
        if (!Number.isFinite(n)) return tf('validation.number');
        if (n < 30 || n > 200) return tf('validation.weight');
        return undefined;
    };
    const validateWaist = (v: string) => {
        if (!v) return undefined; // optional
        const n = Number(v);
        if (!Number.isFinite(n)) return tf('validation.number');
        if (n < 30 || n > 200) return tf('validation.waist');
        return undefined;
    };

    useEffect(() => setFieldErrors(p => ({ ...p, age: validateAge(age) })), [age]);
    useEffect(() => setFieldErrors(p => ({ ...p, height: validateHeight(height) })), [height]);
    useEffect(() => setFieldErrors(p => ({ ...p, weight: validateWeight(weight) })), [weight]);
    useEffect(() => setFieldErrors(p => ({ ...p, waist: validateWaist(waist) })), [waist]);
    // mappings (same as your Plan form)
    const toTitle = (s: string) =>
        s.replace(/([A-Z])/g, ' $1')
            .replace(/^\w/, c => c.toUpperCase())
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();

    const goalMap: Record<NonNullable<GoalKey>, UserProfile['fitness_goal']> = {
        loss: 'Weight Loss',
        muscle: 'Muscle Gain',
        maintain: 'Maintain'
    };
    const reverseGoalMap: Record<NonNullable<UserProfile['fitness_goal']>, NonNullable<GoalKey>> = {
        'Weight Loss': 'loss',
        'Muscle Gain': 'muscle',
        'Maintain': 'maintain'
    };

    const getDishTitle = (meal: ApiMeal, enName: string): string => {
        const item = meal.Dishes.find(d => d.dish_name === enName);
        if (!item) return enName; // fallback
        switch (locale) {
            case 'ms': return item.dish_ms_name || item.dish_name;
            case 'vi': return item.dish_vi_name || item.dish_name;
            case 'zh': return item.dish_zh_name || item.dish_name;
            default: return item.dish_name; // 'en'
        }
    };

    // Load stored result + profile (sessionStorage preferred, cookies fallback)
    useEffect(() => {
        try {
            // result (full) from sessionStorage
            const sessionData = sessionStorage.getItem('healthplan:result');
            if (sessionData) {
                setApiData(JSON.parse(sessionData));
            } else {
                // compact cookie fallback (targets only)
                const cookieData = getCookie('healthplan_result');
                if (cookieData) {
                    const parsed = JSON.parse(decodeURIComponent(cookieData));
                    // only targets in cookie, keep apiData minimal
                    setApiData(parsed);
                }
            }

            // profile
            const sessionProfile = sessionStorage.getItem('user_profile');
            const profileCookie = getCookie('user_profile');
            const rawProfile = sessionProfile ?? (profileCookie ? decodeURIComponent(profileCookie) : null);

            if (rawProfile) {
                const p: Partial<UserProfile> = JSON.parse(rawProfile);

                if (p.age != null) setAge(String(p.age));
                setSex((p.sex ?? null) as Sex);

                if (p.height_cm != null) setHeight(String(p.height_cm));
                if (p.weight_kg != null) setWeight(String(p.weight_kg));
                if (p.waist_cm != null) setWaist(String(p.waist_cm));

                setActivity((p.activity_frequency ?? null) as Activity);

                const g = p.fitness_goal ? reverseGoalMap[p.fitness_goal] : null;
                setGoal((g ?? null) as GoalKey);

                setDiet(((p.diet_preference as Diet) ?? 'none') as Diet);
                if (typeof p.include_eggs === 'boolean') setEggs(p.include_eggs);

                const titles: string[] = Array.isArray(p.allergies) ? p.allergies : [];
                const next: Record<string, boolean> = {};
                allergyKeys.forEach(k => { next[k] = titles.includes(toTitle(k)); });
                setAllergiesMap(next);
            }
        } catch (e) {
            // ignore malformed storage
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* -------------------- BMI + status -------------------- */
    const bmi = useMemo(() => {
        const h = Number(height);
        const w = Number(weight);
        if (!h || !w) return null;
        return w / Math.pow(h / 100, 2);
    }, [height, weight]);

    const weightStatus = useMemo(() => {
        if (!bmi) return t('overview.status.unknown');
        if (bmi < 18.5) return t('overview.status.under');
        if (bmi < 25) return t('overview.status.normal');
        if (bmi < 30) return t('overview.status.over');
        return t('overview.status.obese');
    }, [bmi, t]);

    const statusCode = useMemo(() => {
        if (!bmi) return 'unknown' as const;
        if (bmi < 18.5) return 'underweight' as const;
        if (bmi < 25) return 'normal' as const;
        if (bmi < 30) return 'overweight' as const;
        return 'obese' as const;
    }, [bmi]);

    const statusColorClass = useMemo(() => {
        switch (statusCode) {
            case 'underweight': return 'text-orange-600';
            case 'normal': return 'text-green-700';
            case 'overweight': return 'text-yellow-600';
            case 'obese': return 'text-red-600';
            default: return 'text-slate-700';
        }
    }, [statusCode]);

    /* -------------------- Meals mapping -------------------- */
    const convertApiMealToCarouselMeals = (apiMeal: ApiMeal): Meal[] => {
        return apiMeal.PerDish.map(dish => ({
            img: apiMeal.Images[dish.Dish] || '/food-placeholder.jpg',      // Images keyed by EN name
            title: getDishTitle(apiMeal, dish.Dish),                        // localized display name
            kcal: Math.round(dish.Calories),
            carbs: `${dish.Carbs_g.toFixed(1)} g`,
            protein: `${dish.Protein_g.toFixed(1)} g`,
            fat: `${dish.Fat_g.toFixed(1)} g`,
            fiber: '0 g'
        }));
    };

    const mealsByType = useMemo(() => {
        if (!apiData || !(apiData as any).plan) return { breakfast: [], lunch: [], dinner: [] };
        const plan = (apiData as ApiResult).plan;
        const breakfast = plan.find(m => m.Meal.toLowerCase() === 'breakfast');
        const lunch = plan.find(m => m.Meal.toLowerCase() === 'lunch');
        const dinner = plan.find(m => m.Meal.toLowerCase() === 'dinner');
        return {
            breakfast: breakfast ? convertApiMealToCarouselMeals(breakfast) : [],
            lunch: lunch ? convertApiMealToCarouselMeals(lunch) : [],
            dinner: dinner ? convertApiMealToCarouselMeals(dinner) : []
        };
    }, [apiData]);

    /* -------------------- Exercise (demo) -------------------- */
    const schedule = [
        { day: t('exercise.days.mon'), text: t('exercise.items.mon') },
        { day: t('exercise.days.tue'), text: t('exercise.items.tue') },
        { day: t('exercise.days.wed'), text: t('exercise.items.wed') },
        { day: t('exercise.days.thu'), text: t('exercise.items.thu') },
        { day: t('exercise.days.fri'), text: t('exercise.items.fri') },
        { day: t('exercise.days.sat'), text: t('exercise.items.sat') },
        { day: t('exercise.days.sun'), text: t('exercise.items.sun') }
    ];

    /* -------------------- Submit inside accordion -------------------- */
    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const nextErrors = {
            age: validateAge(age),
            sex: sex ? undefined : tf('validation.required'),
            height: validateHeight(height),
            weight: validateWeight(weight),
            waist: validateWaist(waist),
            activity: activity ? undefined : tf('validation.required'),
            goal: goal ? undefined : tf('validation.required'),
        };
        setFieldErrors(nextErrors);

        if (Object.values(nextErrors).some(Boolean)) {
            setSaving(false);
            // bring user back to the accordion area on mobile
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        setSaveError(null);

        const payload = {
            age: age ? Number(age) : null,
            sex,
            height_cm: height ? Number(height) : null,
            weight_kg: weight ? Number(weight) : null,
            waist_cm: waist ? Number(waist) : null,
            activity_frequency: activity,
            allergies: (allergyKeys as readonly string[]).filter(k => allergiesMap[k]).map(toTitle),
            diet_preference: diet,
            include_eggs: eggs,
            fitness_goal: goal ? goalMap[goal] : null
        };
        

        try {
            const res = await fetch(`${API_BASE}/api/plan/health/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(text || `Request failed with ${res.status}`);
            }
            const data: ApiResult = await res.json();

            // update live view
            setApiData(data);

            // persist for next visits
            sessionStorage.setItem('healthplan:result', JSON.stringify(data));

            const userProfileData: UserProfile = {
                age: payload.age,
                sex: payload.sex,
                height_cm: payload.height_cm,
                weight_kg: payload.weight_kg,
                waist_cm: payload.waist_cm,
                activity_frequency: payload.activity_frequency,
                allergies: payload.allergies,
                diet_preference: payload.diet_preference as Diet,
                include_eggs: payload.include_eggs,
                fitness_goal: payload.fitness_goal as UserProfile['fitness_goal']
            };

            const consent = getCookie('vit_consent'); // "all" to allow cookies
            if (consent === 'all') {
                // compact cookie to save space
                const compact = JSON.stringify({ targets: data?.targets ?? null, ts: Date.now() });
                setCookie('healthplan_result', encodeURIComponent(compact), 7);
                setCookie('user_profile', encodeURIComponent(JSON.stringify(userProfileData)), 7);
            } else {
                sessionStorage.setItem('user_profile', JSON.stringify(userProfileData));
            }
        } catch (err: any) {
            setSaveError(err?.message ?? 'Something went wrong.');
        } finally {
            setSaving(false);
            // scroll to overview so users see changes immediately
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    /* -------------------- Loading / Empty -------------------- */
    if (loading) {
        return (
            <main className="min-h-screen w-full bg-green-50/40 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">{tf('loading') ?? 'Loading your health plan...'}</p>
                </div>
            </main>
        );
    }

    /* -------------------- Render -------------------- */
    return (
        <main className="min-h-screen w-full bg-green-50/40 pb-24">
            {/* Breadcrumbs */}
            <Breadcrumb className="mx-auto max-w-6xl px-4 pt-6">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                                <Home className="h-4 w-4" />
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

            {/* Title + stepper */}
            <section className="mx-auto max-w-6xl px-4 pt-3 text-center">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                    {t('title')}
                </h1>
                <div className="mt-6 flex items-center justify-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 text-gray-400 font-bold">1</div>
                    <div className="h-[2px] w-16 bg-gray-300" />
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white font-bold">2</div>
                </div>
            </section>

            {/* Accordion: Editable Health Profile (no redirect) */}
            <section className="mx-auto mt-6 max-w-6xl px-4">
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="profile" className="border-0">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <AccordionTrigger className="px-4 py-4 md:px-6 md:py-5 text-left">
                                <div className="inline-flex items-center gap-2">
                                    <ClipboardList className="h-5 w-5 text-green-600" />
                                    <span className="text-lg font-semibold">{t('profile.title')}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-5 md:px-6">
                                <form onSubmit={handleProfileSubmit}>
                                    {/* Grid of fields (mirrors Plan form) */}
                                    <div className="rounded-xl border border-slate-200 p-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            {/* Age (required) */}
                                            <LabeledInput
                                                label={tf('fields.age.label')}
                                                required
                                                type="number"
                                                inputMode="numeric"
                                                min={18}
                                                max={150}
                                                step="1"
                                                value={age}
                                                onChange={setAge}
                                                placeholder={tf('fields.age.placeholder')}
                                                error={fieldErrors.age}
                                            />

                                            {/* Sex (required) */}
                                            <div>
                                                <div className="mb-1 text-sm font-medium text-gray-700">
                                                    {tf('fields.sex.label')} <span className="text-red-600">*</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <ToggleBtn
                                                        active={sex === 'male'}
                                                        onClick={() => { setSex('male'); setFieldErrors(p => ({ ...p, sex: undefined })); }}
                                                        ariaInvalid={!!fieldErrors.sex}
                                                    >
                                                        {tf('fields.sex.male')}
                                                    </ToggleBtn>
                                                    <ToggleBtn
                                                        active={sex === 'female'}
                                                        onClick={() => { setSex('female'); setFieldErrors(p => ({ ...p, sex: undefined })); }}
                                                        ariaInvalid={!!fieldErrors.sex}
                                                    >
                                                        {tf('fields.sex.female')}
                                                    </ToggleBtn>
                                                </div>
                                                {fieldErrors.sex && <p className="mt-1 text-xs text-red-600">{fieldErrors.sex}</p>}
                                            </div>

                                            {/* Height (required) */}
                                            <LabeledInput
                                                label={tf('fields.height.label')}
                                                required
                                                type="number"
                                                inputMode="numeric"
                                                min={30}
                                                max={250}
                                                step="1"
                                                value={height}
                                                onChange={setHeight}
                                                placeholder={tf('fields.height.placeholder')}
                                                error={fieldErrors.height}
                                            />

                                            {/* Weight (required) */}
                                            <LabeledInput
                                                label={tf('fields.weight.label')}
                                                required
                                                type="number"
                                                inputMode="decimal"
                                                min={30}
                                                max={200}
                                                step="0.1"
                                                value={weight}
                                                onChange={setWeight}
                                                placeholder={tf('fields.weight.placeholder')}
                                                error={fieldErrors.weight}
                                            />

                                            {/* Waist (optional, validated if present) */}
                                            <div className="md:col-span-2">
                                                <LabeledInput
                                                    label={tf('fields.waist.label')}
                                                    type="number"
                                                    inputMode="numeric"
                                                    min={30}
                                                    max={200}
                                                    step="1"
                                                    value={waist}
                                                    onChange={setWaist}
                                                    placeholder={tf('fields.waist.placeholder')}
                                                    error={fieldErrors.waist}
                                                />
                                            </div>

                                            {/* Activity (required) */}
                                            <div className="md:col-span-2">
                                                <div className="mb-1 text-sm font-medium text-gray-700">
                                                    {tf('fields.activity.label')} <span className="text-red-600">*</span>
                                                </div>
                                                {/* Mobile-first: 2 cols on small screens, 4 on md+ */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    {(['sedentary', 'low', 'medium', 'high'] as const).map(k => (
                                                        <ToggleBtn
                                                            key={k}
                                                            active={activity === k}
                                                            onClick={() => { setActivity(k); setFieldErrors(p => ({ ...p, activity: undefined })); }}
                                                            ariaInvalid={!!fieldErrors.activity}
                                                        >
                                                            {tf(`fields.activity.${k}`)}
                                                        </ToggleBtn>
                                                    ))}
                                                </div>
                                                {fieldErrors.activity && <p className="mt-1 text-xs text-red-600">{fieldErrors.activity}</p>}
                                            </div>

                                            {/* Goal (required) */}
                                            <div className="md:col-span-2">
                                                <div className="mb-1 text-sm font-medium text-gray-700">
                                                    {tf('fields.goal.label')} <span className="text-red-600">*</span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    {(['loss', 'muscle', 'maintain'] as const).map(k => (
                                                        <ToggleBtn
                                                            key={k}
                                                            active={goal === k}
                                                            onClick={() => { setGoal(k); setFieldErrors(p => ({ ...p, goal: undefined })); }}
                                                            ariaInvalid={!!fieldErrors.goal}
                                                        >
                                                            {tf(`fields.goal.${k}`)}
                                                        </ToggleBtn>
                                                    ))}
                                                </div>
                                                {fieldErrors.goal && <p className="mt-1 text-xs text-red-600">{fieldErrors.goal}</p>}
                                            </div>
                                            {/* Allergies */}
                                            <div className="md:col-span-2">
                                                <div className="flex items-baseline justify-between">
                                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                                        {tf('fields.allergies.label')}
                                                    </label>
                                                    <span className="text-xs text-gray-500">{tf('fields.allergies.help')}</span>
                                                </div>
                                                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                                                    {allergyKeys.map(k => (
                                                        <label key={k} className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-50">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!allergiesMap[k]}
                                                                onChange={() => toggleAllergy(k)}
                                                                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                            />
                                                            <span className="text-sm text-gray-800">{tf(`fields.allergies.${k}`)}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            {/* Diet */}
                                            <div className="md:col-span-2">
                                                <div className="mb-1 text-sm font-medium text-gray-700">
                                                    {tf('fields.diet.label')}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                    {(['none', 'vegan', 'vegetarian'] as const).map(k => (
                                                        <ToggleBtn key={k} active={diet === k} onClick={() => setDiet(k)}>
                                                            {tf(`fields.diet.${k}`)}
                                                        </ToggleBtn>
                                                    ))}
                                                </div>
                                                <div className="mt-3 text-sm text-gray-600">
                                                    {tf('fields.diet.includeEggs')}
                                                </div>
                                                <div className="mt-1 flex gap-6">
                                                    <label className="inline-flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="eggs"
                                                            checked={eggs === true}
                                                            onChange={() => setEggs(true)}
                                                            className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                                                        />
                                                        <span>{tf('common.yes')}</span>
                                                    </label>
                                                    <label className="inline-flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="eggs"
                                                            checked={eggs === false}
                                                            onChange={() => setEggs(false)}
                                                            className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500"
                                                        />
                                                        <span>{tf('common.no')}</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* allergies inline text */}
                                        <div className="mt-4 text-sm text-gray-600">
                                            <strong>{t('profile.fields.allergies')}:</strong>{' '}
                                            {Object.entries(allergiesMap).filter(([, v]) => v).map(([k]) => tf(`fields.allergies.${k}`)).join(', ') || tf('profile.none', { default: 'None' })}
                                        </div>

                                        {/* Save button + error */}
                                        <div className="mt-5">
                                            <Button
                                                type="submit"
                                                disabled={saving}
                                                className="w-full md:w-auto bg-gradient-to-r from-[#13D298] to-[#2CD30D] text-white font-semibold shadow-md hover:opacity-90"
                                            >
                                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                {t('profile.update')}
                                            </Button>
                                            {saveError && (
                                                <p className="mt-2 text-sm text-red-600">{saveError}</p>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            </AccordionContent>
                        </div>
                    </AccordionItem>
                </Accordion>
            </section>

            {/* Overview */}
            <section className="mx-auto mt-8 max-w-6xl px-4">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="mb-3 text-3xl text-center font-semibold text-slate-700">{t('overview.title')}</h3>
                    <div className="relative h-0 w-0 md:h-0 md:w-0" />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-6">
                    <MetricCard label={t('overview.metrics.bmi')} value={bmi ? bmi.toFixed(1) : 'N/A'} colorClass={statusColorClass} />
                    <MetricCard label={t('overview.metrics.dailyCalories')} value={apiData?.targets?.calories_kcal ? Math.round(apiData.targets.calories_kcal).toString() : 'N/A'} />
                    <MetricCard label={t('overview.metrics.weightStatus')} value={weightStatus} colorClass={statusColorClass} />
                </div>

                {/* Macro split */}
                {apiData?.targets?.macro_split_pct && (
                    <div className="mt-6">
                        <Card className="bg-gradient-to-r from-green-50 to-blue-50">
                            <CardContent className="p-6">
                                <h4 className="text-lg font-semibold mb-4 text-slate-700">{t('overview.macroTitle', { default: 'Macro Distribution' })}</h4>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-bold text-green-600">
                                            {apiData.targets.macro_split_pct.protein.toFixed(1)}%
                                        </div>
                                        <div className="text-sm text-slate-600">{t('overview.protein')}</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-green-600">
                                            {apiData.targets.macro_split_pct.carbs.toFixed(1)}%
                                        </div>
                                        <div className="text-sm text-slate-600">{t('overview.carbs')}</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-green-600">
                                            {apiData.targets.macro_split_pct.fat.toFixed(1)}%
                                        </div>
                                        <div className="text-sm text-slate-600">{t('overview.fat')}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </section>

            {/* Diet plan - carousels */}
            <section className="mx-auto mt-8 max-w-6xl px-4">
                <h4 className="mb-6 text-3xl text-center font-semibold text-slate-700">{t('diet.title')}</h4>

                {mealsByType.breakfast.length > 0 && (
                    <div className="mb-8">
                        <h5 className="text-xl font-semibold text-slate-700 mb-4 text-center">{t('diet.breakfast')}</h5>
                        <DietCarousel meals={mealsByType.breakfast} />
                    </div>
                )}

                {mealsByType.lunch.length > 0 && (
                    <div className="mb-8">
                        <h5 className="text-xl font-semibold text-slate-700 mb-4 text-center">{t('diet.lunch')}</h5>
                        <DietCarousel meals={mealsByType.lunch} />
                    </div>
                )}

                {mealsByType.dinner.length > 0 && (
                    <div className="mb-8">
                        <h5 className="text-xl font-semibold text-slate-700 mb-4 text-center">{t('diet.dinner')}</h5>
                        <DietCarousel meals={mealsByType.dinner} />
                    </div>
                )}
            </section>

            {/* Exercise */}
            <section className="mx-auto mt-10 max-w-6xl px-4">
                <h4 className="mb-3 text-3xl text-center font-semibold text-slate-700">{t('exercise.title')}</h4>
                <Card className="overflow-hidden bg-[linear-gradient(270deg,#129D6A_0%,#40BFA6_100%)]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-white">{t('exercise.scheduleTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 bg-white">
                        <ul className="divide-y">
                            {schedule.map((s, idx) => (
                                <li key={idx} className="flex items-center justify-between py-3">
                                    <span className="font-medium text-slate-800">{s.day}</span>
                                    <span className="text-slate-600">{s.text}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </section>

            {/* CTA */}
            <section className="mx-auto mt-10 max-w-5xl px-4">
                <Card>
                    <CardContent className="py-8 text-center">
                        <h5 className="text-lg font-semibold">{t('cta.title')}</h5>
                        <p className="mt-1 text-sm text-slate-600">{t('cta.subtitle')}</p>
                        <Button className="mt-5 inline-flex items-center gap-2 bg-gradient-to-r from-[#13D298] to-[#2CD30D] text-white hover:opacity-90">
                            <Download className="h-4 w-4" />
                            {t('cta.download')}
                        </Button>
                    </CardContent>
                </Card>
            </section>
        </main>
    );
}

/* -------------------- Small helpers -------------------- */
function LabeledInput(props: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  min?: number;
  max?: number;
  step?: string | number;
}) {
  const { label, type = 'text', value, onChange, placeholder, required, error, inputMode, min, max, step } = props;
  const id = useMemo(() => label.replace(/\s+/g, '-').toLowerCase(), [label]);
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        inputMode={inputMode}
        min={min as any}
        max={max as any}
        step={step as any}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-md border px-3 py-3 outline-none transition focus:border-sky-500
          ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-300'}
        `}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}


function ToggleBtn(props: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ariaInvalid?: boolean;
}) {
  const { active, onClick, children, ariaInvalid } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-invalid={ariaInvalid || undefined}
      className={`rounded-md border px-3 py-3 text-sm font-medium transition
        ${active ? 'border-green-600 bg-green-50 text-green-700'
                 : 'border-gray-300 text-gray-700 active:bg-gray-100'}
      `}
    >
      {children}
    </button>
  );
}



function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-xs text-slate-500">{label}</div>
            <div className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                {value}
            </div>
        </div>
    );
}

function MetricCard({ label, value, colorClass = 'text-green-700' }: { label: string; value: string; colorClass?: string }) {
    return (
        <Card className="text-center bg-green-50/60 shadow-sm">
            <CardContent className="py-6">
                <div className={`text-2xl font-extrabold ${colorClass}`}>{value}</div>
                <div className="text-xs text-slate-600">{label}</div>
            </CardContent>
        </Card>
    );
}

/* -------------------- Diet Carousel -------------------- */
function DietCarousel({ meals }: { meals: Meal[] }) {
    const [api, setApi] = useState<CarouselApi | null>(null);

    const duplicatedMeals = useMemo(() => {
        if (meals.length === 0) return [];
        return Array(20).fill(meals).flat();
    }, [meals]);

    const startIndex = useMemo(() => meals.length * 3, [meals.length]);
    const [current, setCurrent] = useState(startIndex);
    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        if (!api) return;
        const update = () => setCurrent(api.selectedScrollSnap());
        const onReInit = () => {
            api.scrollTo(startIndex, false);
            setCurrent(startIndex);
        };
        api.on('select', update);
        api.on('reInit', onReInit);
        return () => {
            api.off('select', update);
            api.off('reInit', onReInit);
        };
    }, [api, startIndex]);

    useEffect(() => {
        if (!api || hasInitialized || duplicatedMeals.length === 0) return;
        const timer = setTimeout(() => {
            api.scrollTo(startIndex, false);
            setCurrent(startIndex);
            setHasInitialized(true);
        }, 50);
        return () => clearTimeout(timer);
    }, [api, startIndex, hasInitialized, duplicatedMeals.length]);

    useEffect(() => {
        if (!api || !hasInitialized) return;
        const handleReposition = () => {
            const currentSnap = api.selectedScrollSnap();
            const totalSlides = duplicatedMeals.length;
            const originalMealCount = meals.length;
            if (currentSnap < originalMealCount) {
                const newPosition = currentSnap + originalMealCount * 2;
                api.scrollTo(newPosition, false);
                setCurrent(newPosition);
            } else if (currentSnap >= totalSlides - originalMealCount) {
                const newPosition = currentSnap - originalMealCount * 2;
                api.scrollTo(newPosition, false);
                setCurrent(newPosition);
            }
        };
        const timer = setTimeout(handleReposition, 100);
        return () => clearTimeout(timer);
    }, [current, api, hasInitialized, duplicatedMeals.length, meals.length]);

    if (meals.length === 0) {
        return <div className="text-center text-gray-500 py-8">No meals available</div>;
    }

    return (
        <div className="relative isolate">
            <Carousel
                setApi={setApi}
                opts={{ loop: true, align: 'center', skipSnaps: false, dragFree: true }}
                className="w-full"
            >
                <CarouselContent className="-ml-3 md:-ml-4 p-4  min-h-[700px] bg-transparent ">
                    {duplicatedMeals.map((m, i) => {
                        const originalIndex = i % meals.length;
                        const isActive = i === current;
                        return (
                            <CarouselItem
                                key={`${originalIndex}-${Math.floor(i / meals.length)}`}
                                className="pl-3 md:pl-5 md:pt-6 basis-[85%] sm:basis-[65%] md:basis-[42%] lg:basis-[38%] rounded-3xl"
                            >
                                <div
                                    className={`relative will-change-transform transition-all duration-300 ease-out
                    ${isActive
                                            ? 'z-20 scale-[1.08] md:scale-[1.12] -mx-3 md:-mx-4 opacity-100 blur-0 pointer-events-auto '
                                            : 'z-0 scale-[0.94] opacity-55 blur-[1px] pointer-events-none'}
                  `}
                                >
                                    <MealCard {...m} />
                                </div>
                            </CarouselItem>
                        );
                    })}
                </CarouselContent>
                <CarouselPrevious className="z-30 left-2 sm:left-3 h-12 w-12" />
                <CarouselNext className="z-30 right-2 sm:right-3 h-12 w-12" />
            </Carousel>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent" />
        </div>
    );
}

function MealCard({ img, title, kcal, carbs, protein, fat, fiber }: Meal) {
    const t = useTranslations('planResult.meal');
    return (
        <Card className="shadow-md transition-shadow duration-300">
            <div className="relative h-56 sm:h-60 md:h-64 lg:h-72 w-full">
                <Image
                    src={img}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 85vw, (max-width: 768px) 65vw, (max-width: 1024px) 42vw, 38vw"
                    className="object-cover transition-transform duration-300 hover:scale-105 "
                    priority
                    style={{ objectPosition: 'top' }}
                    onError={() => { }}
                />
            </div>
            <CardContent className="p-5">
                <div className="text-base font-bold text-slate-800 mb-3 leading-tight">{title}</div>
                <dl className="divide-y divide-slate-100 text-sm">
                    <div className="flex items-center justify-between py-2">
                        <dt className="text-slate-600 font-medium">{t('labels.calories')}</dt>
                        <dd className="font-bold text-green-700">
                            {kcal} {t('labels.kcal')}
                        </dd>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <dt className="text-slate-600">{t('labels.carbs')}</dt>
                        <dd className="font-semibold text-slate-800">{carbs}</dd>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <dt className="text-slate-600">{t('labels.protein')}</dt>
                        <dd className="font-semibold text-slate-800">{protein}</dd>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <dt className="text-slate-600">{t('labels.fat')}</dt>
                        <dd className="font-semibold text-slate-800">{fat}</dd>
                    </div>
                    {fiber && (
                        <div className="flex items-center justify-between py-2">
                            <dt className="text-slate-600">{t('labels.fiber')}</dt>
                            <dd className="font-semibold text-slate-800">{fiber}</dd>
                        </div>
                    )}
                </dl>
            </CardContent>
        </Card>
    );
}