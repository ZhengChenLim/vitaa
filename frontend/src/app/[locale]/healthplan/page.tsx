'use client';

import { useTranslations } from 'next-intl';
import { Home, ClipboardList, Download } from 'lucide-react';
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

type ApiMeal = {
    Meal: string;
    Dishes: string[];
    Ingredients: Record<string, string[]>;
    Images: Record<string, string>;
    PerDish: ApiDish[];
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
    age: number;
    sex: string;
    height_cm: number;
    weight_kg: number;
    waist_cm?: number;
    activity_frequency: string;
    allergies: string[];
    diet_preference: string;
    include_eggs: boolean;
    fitness_goal: string;
};

// Cookie helper functions
function getCookie(name: string) {
    if (typeof document === 'undefined') return null;
    return document.cookie
        .split('; ')
        .find(row => row.startsWith(name + '='))
        ?.split('=')[1];
}

export default function HealthPlanPage() {
    const t = useTranslations('planResult');
    
    const [apiData, setApiData] = useState<ApiResult | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Load data on mount
    useEffect(() => {
        try {
            // Load from sessionStorage first (most recent)
            const sessionData = sessionStorage.getItem('healthplan:result');
            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                setApiData(parsed);
            } else {
                // Fallback to cookie
                const cookieData = getCookie('healthplan_result');
                if (cookieData) {
                    const decoded = decodeURIComponent(cookieData);
                    const parsed = JSON.parse(decoded);
                    setApiData(parsed);
                }
            }

            // Load user profile from sessionStorage first, then cookie
            const sessionProfile = sessionStorage.getItem('user_profile');
            if (sessionProfile) {
                const parsed = JSON.parse(sessionProfile);
                setUserProfile(parsed);
            } else {
                const profileCookie = getCookie('user_profile');
                if (profileCookie) {
                    const decoded = decodeURIComponent(profileCookie);
                    const parsed = JSON.parse(decoded);
                    setUserProfile(parsed);
                }
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Calculate BMI and weight status
    const bmi = useMemo(() => {
        if (!userProfile?.height_cm || !userProfile?.weight_kg) return null;
        return userProfile.weight_kg / Math.pow(userProfile.height_cm / 100, 2);
    }, [userProfile]);

    const weightStatus = useMemo(() => {
        if (!bmi) return t('overview.status.unknown');
        if (bmi < 18.5) return t('overview.status.under');
        if (bmi < 25) return t('overview.status.normal');
        if (bmi < 30) return t('overview.status.overweight');
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

    // Convert API meals to carousel format
    const convertApiMealToCarouselMeals = (apiMeal: ApiMeal): Meal[] => {
        return apiMeal.PerDish.map(dish => ({
            img: apiMeal.Images[dish.Dish] || '/food-placeholder.jpg',
            title: dish.Dish,
            kcal: Math.round(dish.Calories),
            carbs: `${dish.Carbs_g.toFixed(1)} g`,
            protein: `${dish.Protein_g.toFixed(1)} g`,
            fat: `${dish.Fat_g.toFixed(1)} g`,
            fiber: '0 g' // API doesn't provide fiber per dish
        }));
    };

    // Group meals by type
    const mealsByType = useMemo(() => {
        if (!apiData?.plan) return { breakfast: [], lunch: [], dinner: [] };
        
        const breakfast = apiData.plan.find(m => m.Meal.toLowerCase() === 'breakfast');
        const lunch = apiData.plan.find(m => m.Meal.toLowerCase() === 'lunch');
        const dinner = apiData.plan.find(m => m.Meal.toLowerCase() === 'dinner');

        return {
            breakfast: breakfast ? convertApiMealToCarouselMeals(breakfast) : [],
            lunch: lunch ? convertApiMealToCarouselMeals(lunch) : [],
            dinner: dinner ? convertApiMealToCarouselMeals(dinner) : []
        };
    }, [apiData]);

    // Exercise schedule (keep as demo for now since API doesn't provide this)
    const schedule = [
        { day: t('exercise.days.mon'), text: t('exercise.items.mon') },
        { day: t('exercise.days.tue'), text: t('exercise.items.tue') },
        { day: t('exercise.days.wed'), text: t('exercise.items.wed') },
        { day: t('exercise.days.thu'), text: t('exercise.items.thu') },
        { day: t('exercise.days.fri'), text: t('exercise.items.fri') },
        { day: t('exercise.days.sat'), text: t('exercise.items.sat') },
        { day: t('exercise.days.sun'), text: t('exercise.items.sun') }
    ];

    if (loading) {
        return (
            <main className="min-h-screen w-full bg-green-50/40 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading your health plan...</p>
                </div>
            </main>
        );
    }

    if (!apiData) {
        return (
            <main className="min-h-screen w-full bg-green-50/40 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">No Plan Found</h2>
                    <p className="text-gray-600 mb-4">We couldn't find your health plan. Please create a new one.</p>
                    <Link href="/plan">
                        <Button className="bg-gradient-to-r from-[#13D298] to-[#2CD30D] text-white">
                            Create New Plan
                        </Button>
                    </Link>
                </div>
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

            {/* Accordion: Health Profile */}
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
                            <div className="rounded-xl border border-slate-200 p-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Field label={t('profile.fields.age')} value={userProfile?.age?.toString() || 'N/A'} />
                                    <Field label={t('profile.fields.sex')} value={userProfile?.sex || 'N/A'} />
                                    <Field label={t('profile.fields.height')} value={userProfile?.height_cm ? `${userProfile.height_cm} cm` : 'N/A'} />
                                    <Field label={t('profile.fields.weight')} value={userProfile?.weight_kg ? `${userProfile.weight_kg} kg` : 'N/A'} />
                                    <Field label={t('profile.fields.waist')} value={userProfile?.waist_cm ? `${userProfile.waist_cm} cm` : 'N/A'} />
                                    <Field label={t('profile.fields.activity')} value={userProfile?.activity_frequency || 'N/A'} />
                                    <Field label={t('profile.fields.goal')} value={userProfile?.fitness_goal || 'N/A'} />
                                    <Field label={t('profile.fields.diet')} value={userProfile?.diet_preference || 'N/A'} />
                                </div>

                                <div className="mt-4 text-sm text-gray-600">
                                    <strong>{t('profile.fields.allergies')}:</strong> {userProfile?.allergies?.join(', ') || 'None'}
                                </div>

                                <div className="mt-5">
                                    <Link href="/planform">
                                        <Button className="w-full md:w-auto bg-gradient-to-r from-[#13D298] to-[#2CD30D] text-white font-semibold shadow-md hover:opacity-90">
                                            {t('profile.update')}
                                        </Button>
                                    </Link>
                                </div>
                            </div>
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
                    <MetricCard 
                        label={t('overview.metrics.bmi')} 
                        value={bmi ? bmi.toFixed(1) : 'N/A'}
                        colorClass={statusColorClass}
                    />
                    <MetricCard 
                        label={t('overview.metrics.dailyCalories')} 
                        value={apiData.targets.calories_kcal ? Math.round(apiData.targets.calories_kcal).toString() : 'N/A'} 
                    />
                    <MetricCard 
                        label={t('overview.metrics.weightStatus')} 
                        value={weightStatus}
                        colorClass={statusColorClass} 
                    />
                </div>
                
                {/* Macro split */}
                <div className="mt-6">
                    <Card className="bg-gradient-to-r from-green-50 to-blue-50">
                        <CardContent className="p-6">
                            <h4 className="text-lg font-semibold mb-4 text-slate-700">Macro Distribution</h4>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-green-600">
                                        {apiData.targets.macro_split_pct.protein.toFixed(1)}%
                                    </div>
                                    <div className="text-sm text-slate-600">Protein</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-green-600">
                                        {apiData.targets.macro_split_pct.carbs.toFixed(1)}%
                                    </div>
                                    <div className="text-sm text-slate-600">Carbs</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-green-600">
                                        {apiData.targets.macro_split_pct.fat.toFixed(1)}%
                                    </div>
                                    <div className="text-sm text-slate-600">Fat</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Diet plan - carousels by meal type */}
            <section className="mx-auto mt-8 max-w-6xl px-4">
                <h4 className="mb-6 text-3xl text-center font-semibold text-slate-700">{t('diet.title')}</h4>

                {/* Breakfast */}
                {mealsByType.breakfast.length > 0 && (
                    <div className="mb-8">
                        <h5 className="text-xl font-semibold text-slate-700 mb-4 text-center">Breakfast</h5>
                        <DietCarousel meals={mealsByType.breakfast} />
                    </div>
                )}

                {/* Lunch */}
                {mealsByType.lunch.length > 0 && (
                    <div className="mb-8">
                        <h5 className="text-xl font-semibold text-slate-700 mb-4 text-center">Lunch</h5>
                        <DietCarousel meals={mealsByType.lunch}/>
                    </div>
                )}

                {/* Dinner */}
                {mealsByType.dinner.length > 0 && (
                    <div className="mb-8">
                        <h5 className="text-xl font-semibold text-slate-700 mb-4 text-center">Dinner</h5>
                        <DietCarousel meals={mealsByType.dinner} />
                    </div>
                )}
                
                {/* Allergies warning */}
                {userProfile?.allergies && userProfile.allergies.length > 0 && (
                    <div className="mt-6">
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-2 text-xs font-medium text-yellow-900">
                            {t('considerations.allergies', { list: userProfile.allergies.join(', ') })}
                        </span>
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

/* ---------- Diet Carousel (hooks live here) ---------- */
function DietCarousel({ meals }: { meals: Meal[] }) {
    const [api, setApi] = useState<CarouselApi | null>(null);
    
    // Create multiple copies for smooth infinite scrolling
    const duplicatedMeals = useMemo(() => {
        if (meals.length === 0) return [];
        // Create 5 copies of the meals for smooth infinite scroll
        return Array(5).fill(meals).flat();
    }, [meals]);
    
    // Start in the middle set of meals
    const startIndex = useMemo(() => {
        return meals.length * 2; // Start at the 3rd copy (middle)
    }, [meals.length]);
    
    // Track current position in the duplicated array
    const [current, setCurrent] = useState(startIndex);
    const [hasInitialized, setHasInitialized] = useState(false);

    // 1) Wire listeners
    useEffect(() => {
        if (!api) return;

        const update = () => {
            const newCurrent = api.selectedScrollSnap();
            setCurrent(newCurrent);
        };
        
        const onReInit = () => {
            // After re-init, scroll back to the middle set
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

    // 2) Scroll to initial slide once
    useEffect(() => {
        if (!api || hasInitialized || duplicatedMeals.length === 0) return;
        
        const timer = setTimeout(() => {
            api.scrollTo(startIndex, false);
            setCurrent(startIndex);
            setHasInitialized(true);
        }, 50);

        return () => clearTimeout(timer);
    }, [api, startIndex, hasInitialized, duplicatedMeals.length]);

    // 3) Handle infinite scroll repositioning
    useEffect(() => {
        if (!api || !hasInitialized) return;

        const handleReposition = () => {
            const currentSnap = api.selectedScrollSnap();
            const totalSlides = duplicatedMeals.length;
            const originalMealCount = meals.length;
            
            // If we're too close to the beginning or end, silently reposition
            if (currentSnap < originalMealCount) {
                // Near start, jump to equivalent position in middle
                const newPosition = currentSnap + originalMealCount * 2;
                api.scrollTo(newPosition, false);
                setCurrent(newPosition);
            } else if (currentSnap >= totalSlides - originalMealCount) {
                // Near end, jump to equivalent position in middle  
                const newPosition = currentSnap - originalMealCount * 2;
                api.scrollTo(newPosition, false);
                setCurrent(newPosition);
            }
        };

        // Check position after each scroll
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
                opts={{ 
                    loop: true, 
                    align: "center",
                    skipSnaps: false,
                    dragFree: true
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-3 md:-ml-4 p-4  min-h-[700px] bg-transparent ">
                    {duplicatedMeals.map((m, i) => {
                        // Calculate which meal this represents in the original array
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

            {/* edge fades (don't block clicks) */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent" />
        </div>
    );
}

/* ---------- Helpers ---------- */
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


function MealCard({ img, title, kcal, carbs, protein, fat, fiber }: Meal) {
    const t = useTranslations('planResult.meal');

    return (
        <Card className="shadow-md transition-shadow duration-300">
            <div className="relative h-56 sm:h-60 md:h-64 lg:h-72 w-full">
                <Image 
                    src={img} 
                    alt={title} 
                    fill 
                    className="object-cover transition-transform duration-300 hover:scale-105 " 
                    sizes="(max-width: 640px) 85vw, (max-width: 768px) 65vw, (max-width: 1024px) 42vw, 38vw"
                    onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        e.currentTarget.src = '/food-placeholder.jpg';
                    }}
                  priority
                  style={{ objectPosition: 'top' }}
                />
                {/* <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" /> */}
            </div>
            <CardContent className="p-5">
                <div className="text-base font-bold text-slate-800 mb-3 leading-tight">{title}</div>

                {/* stacked macros */}
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