'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState, useEffect, useRef } from 'react';
import { Clipboard, Home, Loader2 } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage
} from '@/components/ui/breadcrumb';
import { Link, useRouter } from '@/i18n/navigation';

// --- cookie helpers ---
function getCookie(name: string) {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='))
    ?.split('=')[1];
}
function setCookie(name: string, value: string, days = 7) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

type Sex = 'male' | 'female' | null;
type Activity = 'sedentary' | 'low' | 'medium' | 'high' | null;
type Goal = 'loss' | 'muscle' | 'maintain' | null;
type Diet = 'none' | 'vegan' | 'vegetarian' | null;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8001';

export default function PlanPage() {
  const t = useTranslations('plan');
  const router = useRouter();

  // refs for focusing first invalid field on submit
  const ageRef = useRef<HTMLInputElement>(null);
  const heightRef = useRef<HTMLInputElement>(null);
  const weightRef = useRef<HTMLInputElement>(null);
  const waistRef = useRef<HTMLInputElement>(null);

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
    () =>
      ['milk', 'eggs', 'peanuts', 'treeNuts', 'soy', 'wheat', 'fish', 'shellfish', 'sesame'] as const,
    []
  );
  const [allergies, setAllergies] = useState<Record<string, boolean>>({});
  const toggleAllergy = (k: string) => setAllergies(prev => ({ ...prev, [k]: !prev[k] }));

  // request state
  const [isLoading, setIsLoading] = useState(false);
  const [serverResult, setServerResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // field-level errors
  const [fieldErrors, setFieldErrors] = useState<{
    age?: string;
    height?: string;
    waist?: string;
    sex?: string;
    weight?: string; // kept for parity if you later add a range
    activity?: string;
    goal?: string;
  }>({});

  const [touched, setTouched] = useState({
    age: false,
    height: false,
    weight: false,
    waist: false,
  });

  // helpers
  const toTitle = (s: string) =>
    s
      .replace(/([A-Z])/g, ' $1')
      .replace(/^\w/, c => c.toUpperCase())
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();

  const goalMap: Record<NonNullable<Goal>, string> = {
    loss: 'Weight Loss',
    muscle: 'Muscle Gain',
    maintain: 'Maintain'
  };

  const reverseGoalMap = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(goalMap).map(([k, v]) => [v, k])
      ) as Record<string, NonNullable<Goal>>,
    []
  );

  // validation helpers
  const validateAge = (v: string) => {
    if (!v) return t('validation.required');
    const n = Number(v);
    if (!Number.isFinite(n)) return t('validation.number');
    if (n < 18 || n > 150) return t('validation.age');
    return undefined;
  };
  const validateHeight = (v: string) => {
    if (!v) return t('validation.required');
    const n = Number(v);
    if (!Number.isFinite(n)) return t('validation.number');
    if (n < 50 || n > 250) return t('validation.height');
    return undefined;
  };
  const validateWaist = (v: string) => {
    if (!v) return undefined; // waist is optional; validate only when present
    const n = Number(v);
    if (!Number.isFinite(n)) return t('validation.number');
    if (n < 30 || n > 200) return t('validation.waist');
    return undefined;
  };
  const validateWeight = (v: string) => {
    if (!v) return t('validation.required');
    const n = Number(v);
    if (!Number.isFinite(n)) return t('validation.number');
    if (n < 30 || n > 200) return t('validation.weight');
    return undefined;
  };

  // Hydrate from cookie/sessionStorage on mount
  useEffect(() => {
    try {
      const rawCookie = getCookie('user_profile');
      const rawProfile = rawCookie
        ? decodeURIComponent(rawCookie)
        : sessionStorage.getItem('user_profile');

      if (rawProfile) {
        const p = JSON.parse(rawProfile) ?? {};

        if (p.age != null) setAge(String(p.age));
        setSex((p.sex ?? null) as Sex);

        if (p.height_cm != null) setHeight(String(p.height_cm));
        if (p.weight_kg != null) setWeight(String(p.weight_kg));
        if (p.waist_cm != null) setWaist(String(p.waist_cm));

        setActivity((p.activity_frequency ?? null) as Activity);

        const goalKey = p.fitness_goal ? (reverseGoalMap[p.fitness_goal] as Goal) : null;
        setGoal(goalKey ?? null);

        setDiet((p.diet_preference ?? 'none') as Diet);

        if (typeof p.include_eggs === 'boolean') setEggs(p.include_eggs);

        const titles: string[] = Array.isArray(p.allergies) ? p.allergies : [];
        const nextAllergies: Record<string, boolean> = {};
        allergyKeys.forEach(k => {
          nextAllergies[k] = titles.includes(toTitle(k));
        });
        setAllergies(nextAllergies);
      }

      const rawResult = getCookie('healthplan_result');
      if (rawResult) {
        const parsed = JSON.parse(decodeURIComponent(rawResult));
        setServerResult(parsed);
      }
    } catch {
      // ignore bad stored data
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // live-validate numeric fields
  // useEffect(() => {
  //   setFieldErrors(prev => ({ ...prev, age: validateAge(age) }));
  // }, [age]);
  // useEffect(() => {
  //   setFieldErrors(prev => ({ ...prev, height: validateHeight(height) }));
  // }, [height]);
  // useEffect(() => {
  //   setFieldErrors(prev => ({ ...prev, waist: validateWaist(waist) }));
  // }, [waist]);
  // useEffect(() => {
  //   setFieldErrors(prev => ({ ...prev, weight: validateWeight(weight) }));
  // }, [weight]);

  useEffect(() => {
    if (touched.age) {
      setFieldErrors(prev => ({ ...prev, age: validateAge(age) }));
    }
  }, [age, touched.age]);

  useEffect(() => {
    if (touched.height) {
      setFieldErrors(prev => ({ ...prev, height: validateHeight(height) }));
    }
  }, [height, touched.height]);

  useEffect(() => {
    if (touched.weight) {
      setFieldErrors(prev => ({ ...prev, weight: validateWeight(weight) }));
    }
  }, [weight, touched.weight]);

  useEffect(() => {
    if (touched.waist) {
      setFieldErrors(prev => ({ ...prev, waist: validateWaist(waist) }));
    }
  }, [waist, touched.waist]);
  const focusFirstError = () => {
    if (fieldErrors.age) return ageRef.current?.focus();
    if (fieldErrors.height) return heightRef.current?.focus();
    if (fieldErrors.waist) return waistRef.current?.focus();
    // fallback focus if required toggles are missing
    if (!sex) return ageRef.current?.focus();
    if (!activity) return ageRef.current?.focus();
    if (!goal) return ageRef.current?.focus();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setServerResult(null);

    // validate required toggles
    const nextErrors = {
      age: validateAge(age),
      height: validateHeight(height),
      waist: validateWaist(waist),
      sex: sex ? undefined : 'Required',
      activity: activity ? undefined : 'Required',
      goal: goal ? undefined : 'Required',
      // weight is required but no numeric range requested
      weight: weight ? undefined : 'Required'
    };
    setFieldErrors(nextErrors);

    const hasErrors = Object.values(nextErrors).some(Boolean);
    setTouched({ age: true, height: true, weight: true, waist: true });
    if (hasErrors) {
      setIsLoading(false);
      focusFirstError();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const payload = {
      age: age ? Number(age) : null,
      sex,
      height_cm: height ? Number(height) : null,
      weight_kg: weight ? Number(weight) : null,
      waist_cm: waist ? Number(waist) : null,
      activity_frequency: activity,
      allergies: (allergyKeys as readonly string[]).filter(k => allergies[k]).map(toTitle),
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

      const data = await res.json().catch(() => ({}));
      sessionStorage.setItem('healthplan:result', JSON.stringify(data));

      const userProfileData = {
        age: payload.age,
        sex: payload.sex,
        height_cm: payload.height_cm,
        weight_kg: payload.weight_kg,
        waist_cm: payload.waist_cm,
        activity_frequency: payload.activity_frequency,
        allergies: payload.allergies,
        diet_preference: payload.diet_preference,
        include_eggs: payload.include_eggs,
        fitness_goal: payload.fitness_goal
      };

      const consent = getCookie('vit_consent'); // e.g., "all"
      if (consent === 'all') {
        try {
          const compact = JSON.stringify({ targets: data?.targets ?? null, ts: Date.now() });
          setCookie('healthplan_result', encodeURIComponent(compact), 7);
          setCookie('user_profile', encodeURIComponent(JSON.stringify(userProfileData)), 7);
        } catch {
          // swallow cookie write errors
        }
      } else {
        sessionStorage.setItem('user_profile', JSON.stringify(userProfileData));
      }

      router.push('/healthplan');
      return;
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  // small helper for required asterisk
  const Req = () => <span className="ml-1 text-red-600" aria-hidden="true">*</span>;

  return (
    <main className="min-h-screen w-full bg-green-50/40 pb-24">
      {/* Loading Page */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white px-6">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-green-600" aria-hidden="true" />
          <p className="text-sm text-green-600">{t('loading') ?? 'Generating your plan…'}</p>
        </div>
      )}

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
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{t('title')}</h1>
        <p className="mt-2 text-gray-600">{t('subtitle')}</p>

        {/* Stepper */}
        <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white font-bold">
            {t('stepper.one')}
          </div>
          <div className="h-[2px] w-12 sm:w-16 bg-gray-300" />
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-300 text-gray-400 font-bold">
            {t('stepper.two')}
          </div>
        </div>
      </section>

      {/* FORM CARD */}
      <section className="mx-auto mt-6 sm:mt-8 max-w-5xl px-4">
        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-300 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              {typeof error === 'string' ? error : JSON.stringify(error, null, 2)}
            </p>
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="relative rounded-[20px] sm:rounded-[28px] border-2 border-sky-500/60 bg-white p-4 sm:p-7 md:p-8 shadow-lg"
        >
          {/* Header */}
          <div className="mb-5 sm:mb-6 flex items-center gap-2">
            <Clipboard className="text-green-600" />
            <h2 className="text-base sm:text-lg font-semibold">{t('assessmentTitle')}</h2>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
            {/* Age (required) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('fields.age.label')} <Req />
              </label>
              <input
                ref={ageRef}
                type="number"
                inputMode="numeric"
                min={1}
                max={150}
                step="1"
                placeholder={t('fields.age.placeholder')}
                className={`w-full rounded-md border px-3 py-2 outline-none focus:border-sky-500 ${fieldErrors.age ? 'border-red-400 focus:border-red-500' : 'border-gray-300'
                  }`}
                value={age}
                onChange={e => {
                  setAge(e.target.value);
                  if (!touched.age) setTouched(prev => ({ ...prev, age: true }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, age: true }))}
                aria-invalid={!!fieldErrors.age}
                aria-describedby={fieldErrors.age ? 'age-error' : undefined}
                required
              />
              {fieldErrors.age && (
                <p id="age-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.age}
                </p>
              )}
            </div>

            {/* Sex (required) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('fields.sex.label')} <Req />
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['male', 'female'] as Sex[]).map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setSex(k);
                      setFieldErrors(prev => ({ ...prev, sex: undefined }));
                    }}
                    className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${sex === k
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 text-gray-700 active:bg-gray-100'
                      }`}
                    aria-pressed={sex === k}
                  >
                    {t(`fields.sex.${k}`)}
                  </button>
                ))}
              </div>
              {fieldErrors.sex && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.sex}</p>
              )}
            </div>

            {/* Height (required) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('fields.height.label')} <Req />
              </label>
              <input
                ref={heightRef}
                type="number"
                inputMode="numeric"
                min={30}
                max={250}
                step="1"
                placeholder={t('fields.height.placeholder')}
                className={`w-full rounded-md border px-3 py-2 outline-none focus:border-sky-500 ${fieldErrors.height ? 'border-red-400 focus:border-red-500' : 'border-gray-300'
                  }`}
                value={height}
                onChange={e => { setHeight(e.target.value); if (!touched.height) setTouched(p => ({ ...p, height: true })); }}
                onBlur={() => setTouched(p => ({ ...p, height: true }))}
                aria-invalid={!!fieldErrors.height}
                aria-describedby={fieldErrors.height ? 'height-error' : undefined}
                required
              />
              {fieldErrors.height && (
                <p id="height-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.height}
                </p>
              )}
            </div>

            {/* Weight (required — no numeric range requested) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('fields.weight.label')} <Req />
              </label>
              <input
                ref={weightRef}
                type="number"
                inputMode="decimal"
                min={20}
                max={200}
                step="0.1"
                placeholder={t('fields.weight.placeholder')}
                className={`w-full rounded-md border px-3 py-2 outline-none focus:border-sky-500 ${fieldErrors.weight ? 'border-red-400 focus:border-red-500' : 'border-gray-300'
                  }`}
                value={weight}
                onChange={e => { setWeight(e.target.value); if (!touched.weight) setTouched(p => ({ ...p, weight: true })); }}
                onBlur={() => setTouched(p => ({ ...p, weight: true }))}

                aria-invalid={!!fieldErrors.weight}
                aria-describedby={fieldErrors.weight ? 'weight-error' : undefined}
                required
              />
              {fieldErrors.weight && (
                <p id="weight-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.weight}
                </p>
              )}
            </div>

            {/* Waist circumference (optional but validated if present) */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('fields.waist.label')}
              </label>
              <input
                ref={waistRef}
                type="number"
                inputMode="numeric"
                min={20}
                max={200}
                step="1"
                placeholder={t('fields.waist.placeholder')}
                className={`w-full rounded-md border px-3 py-2 outline-none focus:border-sky-500 ${fieldErrors.waist ? 'border-red-400 focus:border-red-500' : 'border-gray-300'
                  }`}
                value={waist}
                onChange={e => { setWaist(e.target.value); if (!touched.waist) setTouched(p => ({ ...p, waist: true })); }}
                onBlur={() => setTouched(p => ({ ...p, waist: true }))}
                aria-invalid={!!fieldErrors.waist}
                aria-describedby={fieldErrors.waist ? 'waist-error' : undefined}
              />
              {fieldErrors.waist && (
                <p id="waist-error" className="mt-1 text-xs text-red-600">
                  {fieldErrors.waist}
                </p>
              )}
            </div>

            {/* Activity (required) */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('fields.activity.label')} <Req />
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['sedentary', 'low', 'medium', 'high'] as Activity[]).map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setActivity(k);
                      setFieldErrors(prev => ({ ...prev, activity: undefined }));
                    }}
                    className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${activity === k
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 text-gray-700 active:bg-gray-100'
                      }`}
                    aria-pressed={activity === k}
                  >
                    {t(`fields.activity.${k}`)}
                  </button>
                ))}
              </div>
              {fieldErrors.activity && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.activity}</p>
              )}
            </div>

            {/* Goal (required) */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('fields.goal.label')} <Req />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(['loss', 'muscle', 'maintain'] as Goal[]).map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setGoal(k);
                      setFieldErrors(prev => ({ ...prev, goal: undefined }));
                    }}
                    className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${goal === k
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 text-gray-700 active:bg-gray-100'
                      }`}
                    aria-pressed={goal === k}
                  >
                    {t(`fields.goal.${k}`)}
                  </button>
                ))}
              </div>
              {fieldErrors.goal && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.goal}</p>
              )}
            </div>

            {/* Allergies (optional) */}
            <div className="md:col-span-2">
              <div className="flex items-baseline justify-between">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('fields.allergies.label')}
                </label>
                <span className="text-xs text-gray-500">{t('fields.allergies.help')}</span>
              </div>

              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                {allergyKeys.map(k => (
                  <label
                    key={k}
                    className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-3 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={!!allergies[k]}
                      onChange={() => toggleAllergy(k)}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-800">{t(`fields.allergies.${k}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Diet (optional) */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('fields.diet.label')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(['none', 'vegan', 'vegetarian'] as Diet[]).map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setDiet(k)}
                    className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${diet === k
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 text-gray-700 active:bg-gray-100'
                      }`}
                    aria-pressed={diet === k}
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
              disabled={isLoading}
            >
              {t('submit')}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
