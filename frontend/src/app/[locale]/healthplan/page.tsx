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
    fiber: string;
};

export default function HealthPlanPage() {
    const t = useTranslations('planResult');

    // demo data
    const bmi = 22.3;
    const calories = 960;
    const weightStatus = t('overview.status.normal');

    const mealsTop: Meal[] = [
        { img: '/food1.jpg', title: t('diet.meals.fruitGrain'), kcal: 320, carbs: '45 g', protein: '9 g', fat: '8 g', fiber: '6 g' },
        { img: '/food2.jpg', title: t('diet.meals.veggieEggSalad'), kcal: 340, carbs: '34 g', protein: '16 g', fat: '11 g', fiber: '5 g' },
        { img: '/food3.jpg', title: t('diet.meals.eggsPancakes'), kcal: 300, carbs: '40 g', protein: '12 g', fat: '7 g', fiber: '4 g' }
    ];
    const mealsBottom: Meal[] = [
        { img: '/food4.jpg', title: t('diet.meals.fruitBowl'), kcal: 280, carbs: '40 g', protein: '8 g', fat: '6 g', fiber: '6 g' },
        { img: '/food5.jpg', title: t('diet.meals.avocadoSalad'), kcal: 360, carbs: '32 g', protein: '10 g', fat: '14 g', fiber: '8 g' },
        { img: '/food6.jpg', title: t('diet.meals.yogurtBowl'), kcal: 260, carbs: '35 g', protein: '12 g', fat: '5 g', fiber: '4 g' }
    ];

    const schedule = [
        { day: t('exercise.days.mon'), text: t('exercise.items.mon') },
        { day: t('exercise.days.tue'), text: t('exercise.items.tue') },
        { day: t('exercise.days.wed'), text: t('exercise.items.wed') },
        { day: t('exercise.days.thu'), text: t('exercise.items.thu') },
        { day: t('exercise.days.fri'), text: t('exercise.items.fri') },
        { day: t('exercise.days.sat'), text: t('exercise.items.sat') },
        { day: t('exercise.days.sun'), text: t('exercise.items.sun') }
    ];
    const allergiesLine = t('considerations.allergies', { list: 'Wheat, Shellfish' });

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
                    <AccordionItem value="profile" className="rounded-2xl border bg-white">
                        <AccordionTrigger className="px-4 py-4 md:px-6 md:py-5 text-left">
                            <div className="inline-flex items-center gap-2">
                                <ClipboardList className="h-5 w-5 text-green-600" />
                                <span className="text-lg font-semibold">{t('profile.title')}</span>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-5 md:px-6">
                            <div className="rounded-xl border border-slate-200 p-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <Field label={t('profile.fields.age')} value="28" />
                                    <Field label={t('profile.fields.sex')} value={t('profile.values.female')} />
                                    <Field label={t('profile.fields.height')} value="164 cm" />
                                    <Field label={t('profile.fields.weight')} value="53 kg" />
                                    <Field label={t('profile.fields.waist')} value="73 cm" />
                                    <Field label={t('profile.fields.activity')} value={t('profile.values.medium')} />
                                    <Field label={t('profile.fields.goal')} value={t('profile.values.maintain')} />
                                    <Field label={t('profile.fields.diet')} value={t('profile.values.vegetarian')} />
                                </div>

                                <div className="mt-4 text-sm text-gray-600">
                                    <strong>{t('profile.fields.allergies')}:</strong> Wheat, Shellfish
                                </div>

                                <div className="mt-5">
                                    <Button className="w-full md:w-auto bg-gradient-to-r from-[#13D298] to-[#2CD30D] text-white font-semibold shadow-md hover:opacity-90">
                                        {t('profile.update')}
                                    </Button>
                                </div>
                            </div>
                        </AccordionContent>
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
                    <MetricCard label={t('overview.metrics.bmi')} value={bmi.toFixed(1)} />
                    <MetricCard label={t('overview.metrics.dailyCalories')} value={calories.toString()} />
                    <MetricCard label={t('overview.metrics.weightStatus')} value={weightStatus} />
                </div>
                
            </section>

            {/* Diet plan - carousel */}
            <section className="mx-auto mt-8 max-w-6xl px-4">
                <h4 className="mb-3 text-3xl text-center font-semibold text-slate-700">{t('diet.title')}</h4>

                <DietCarousel meals={mealsTop} />
                <div className="mt-8" />
                <DietCarousel meals={mealsBottom} />
                
                <div className="mt-6">
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-2 text-xs font-medium text-yellow-900">
                        {allergiesLine}
                    </span>
                </div>

                
            </section>
           

            {/* Exercise */}
            <section className="mx-auto mt-10 max-w-6xl px-4">
                <h4 className="mb-3 text-3xl text-center font-semibold text-slate-700">{t('exercise.title')}</h4>

                <Card className="overflow-hidden bg-[linear-gradient(270deg,#129D6A_0%,#40BFA6_100%)]">
                    <CardHeader className="pb-2 ">
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

  return (
    <div className="relative isolate">
      <Carousel
        setApi={setApi}
        opts={{ 
          loop: true, 
          align: "center",
          skipSnaps: false,
          dragFree: false
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-3 md:-ml-4">
          {duplicatedMeals.map((m, i) => {
            // Calculate which meal this represents in the original array
            const originalIndex = i % meals.length;
            const isActive = i === current;
            
            return (
              <CarouselItem
                key={`${originalIndex}-${Math.floor(i / meals.length)}`}
                className="pl-3 md:pl-4 basis-[85%] sm:basis-[65%] md:basis-[42%] lg:basis-[38%]"
              >
                <div
                  className={`relative will-change-transform transition-all duration-300 ease-out
                    ${isActive
                      ? 'z-20 scale-[1.08] md:scale-[1.12] -mx-3 md:-mx-4 opacity-100 blur-0 pointer-events-auto shadow-2xl'
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

function MetricCard({ label, value }: { label: string; value: string }) {
    return (
        <Card className="text-center bg-green-50/60 shadow-sm">
            <CardContent className="py-6">
                <div className="text-2xl font-extrabold text-green-700">{value}</div>
                <div className="text-xs text-slate-600">{label}</div>
            </CardContent>
        </Card>
    );
}

function MealCard({ img, title, kcal, carbs, protein, fat, fiber }: Meal) {
  const t = useTranslations('planResult.meal');

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="relative h-56 sm:h-60 md:h-64 lg:h-72 w-full">
        <Image 
          src={img} 
          alt={title} 
          fill 
          className="object-cover transition-transform duration-300 hover:scale-105" 
          sizes="(max-width: 640px) 85vw, (max-width: 768px) 65vw, (max-width: 1024px) 42vw, 38vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
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
          <div className="flex items-center justify-between py-2">
            <dt className="text-slate-600">{t('labels.fiber')}</dt>
            <dd className="font-semibold text-slate-800">{fiber}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}