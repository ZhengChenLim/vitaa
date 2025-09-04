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
  // NOTE: 'Secure' works only on https; fine to leave in dev if you’re on http
  document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

// --- types ---
type Sex = 'male' | 'female' | null;
type Activity = 'sedentary' | 'low' | 'medium' | 'high' | null;
type Alcohol = 'none' | 'occasional' | 'frequent' | null;
type Smoking = 'smoker' | 'nonSmoker' | null;


const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8000';

export default function AnalysisFormPage() {
  const t = useTranslations('analysis');
  const router = useRouter();

  // --- form state ---
  const [age, setAge] = useState<string>('');
  const [sex, setSex] = useState<Sex>(null);
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [waist, setWaist] = useState<string>('');
  const [sbp, setSbp] = useState<string>(''); // systolic BP
  const [activity, setActivity] = useState<Activity>(null);
  const [alcohol, setAlcohol] = useState<Alcohol>(null);
  const [smoking, setSmoking] = useState<Smoking>(null);

  const famKeys = useMemo(() => ['diabetes', 'hypertension', 'stroke', 'none'] as const, []);
  const [family, setFamily] = useState<Record<string, boolean>>({});
  const toggleFam = (k: string) =>
    setFamily(p => {
      // if "none" selected, clear others; if others selected, clear "none"
      if (k === 'none') return { none: !p.none } as Record<string, boolean>;
      const next = { ...p, [k]: !p[k] } as Record<string, boolean>;
      if (next[k]) next['none'] = false;
      return next;
    });

  // --- request state ---
  const [isLoading, setIsLoading] = useState(false);
  const [serverResult, setServerResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // refs for focusing first invalid field
  const ageRef = useRef<HTMLInputElement>(null);
  const heightRef = useRef<HTMLInputElement>(null);
  const weightRef = useRef<HTMLInputElement>(null);
  const waistRef = useRef<HTMLInputElement>(null);

  // field-level errors
  const [fieldErrors, setFieldErrors] = useState<{
    age?: string;
    sex?: string;
    height?: string;
    weight?: string;
    waist?: string;
  }>({});
  const [touched, setTouched] = useState({
    age: false,
    height: false,
    weight: false,
    waist: false,
  });

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
  const validateWeight = (v: string) => {
    if (!v) return t('validation.required');
    const n = Number(v);
    if (!Number.isFinite(n)) return t('validation.number');
    if (n < 30 || n > 300) return t('validation.weight');
    return undefined;
  };
  const validateWaist = (v: string) => {
    if (!v) return t('validation.required'); // waist is required for analysis
    const n = Number(v);
    if (!Number.isFinite(n)) return t('validation.number');
    if (n < 30 || n > 200) return t('validation.waist');
    return undefined;
  };

  // live-validate numeric fields
  // useEffect(() => { setFieldErrors(p => ({ ...p, age: validateAge(age) })); }, [age]);
  // useEffect(() => { setFieldErrors(p => ({ ...p, height: validateHeight(height) })); }, [height]);
  // useEffect(() => { setFieldErrors(p => ({ ...p, weight: validateWeight(weight) })); }, [weight]);
  // useEffect(() => { setFieldErrors(p => ({ ...p, waist: validateWaist(waist) })); }, [waist]);
  useEffect(() => {
    if (touched.age) setFieldErrors(p => ({ ...p, age: validateAge(age) }));
  }, [age, touched.age]);

  useEffect(() => {
    if (touched.height) setFieldErrors(p => ({ ...p, height: validateHeight(height) }));
  }, [height, touched.height]);

  useEffect(() => {
    if (touched.weight) setFieldErrors(p => ({ ...p, weight: validateWeight(weight) }));
  }, [weight, touched.weight]);

  useEffect(() => {
    if (touched.waist) setFieldErrors(p => ({ ...p, waist: validateWaist(waist) }));
  }, [waist, touched.waist]);

  const focusFirstError = () => {
    if (fieldErrors.age) return ageRef.current?.focus();
    if (fieldErrors.height) return heightRef.current?.focus();
    if (fieldErrors.weight) return weightRef.current?.focus();
    if (fieldErrors.waist) return waistRef.current?.focus();
    // if sex missing, just focus age as a visible cue; you could also scroll to sex group
    if (!sex) return ageRef.current?.focus();
  };

  const Req = () => <span className="ml-1 text-red-600" aria-hidden="true">*</span>;

  // --- helpers ---
  const toTitle = (s: string) =>
    s
      .replace(/([A-Z])/g, ' $1')
      .replace(/^\w/, c => c.toUpperCase())
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim();

  const sexMap: Record<Exclude<Sex, null>, string> = { male: 'Male', female: 'Female' };
  const activityMap: Record<Exclude<Activity, null>, string> = {
    sedentary: 'Sedentary',
    low: 'Low',
    medium: 'Medium',
    high: 'High'
  };
  const alcoholMap: Record<Exclude<Alcohol, null>, string> = {
    none: 'None',
    occasional: 'Occasional',
    frequent: 'Frequent'
  };
  const smokingMap: Record<Exclude<Smoking, null>, string> = {
    smoker: 'Yes',
    nonSmoker: 'No'
  };

  // Map back from stored labels -> form keys (for hydration from cookie/session)
  const reverseActivityMap = useMemo(
    () => ({ Sedentary: 'sedentary', Low: 'low', Medium: 'medium', High: 'high' }) as Record<string, Exclude<Activity, null>>,
    []
  );

  // --- hydrate from cookie/sessionStorage on mount (similar to Plan form) ---
  useEffect(() => {
    try {
      // 1) Prefill profile from cookie (preferred) or sessionStorage (fallback)
      const rawCookie = getCookie('user_profile');
      const rawProfile = rawCookie ? decodeURIComponent(rawCookie) : sessionStorage.getItem('user_profile');

      if (rawProfile) {
        const p = JSON.parse(rawProfile) ?? {};

        if (p.age != null) setAge(String(p.age));
        setSex((p.sex ?? null) as Sex);

        if (p.height_cm != null) setHeight(String(p.height_cm));
        if (p.weight_kg != null) setWeight(String(p.weight_kg));
        if (p.waist_cm != null) setWaist(String(p.waist_cm));

        setActivity((p.activity_frequency ?? null) as Activity);

        if (p.systolic_bp != null) setSbp(String(p.systolic_bp));
        setSmoking((p.smoking ?? null) as Smoking);
        setAlcohol((p.alcohol ?? null) as Alcohol);

        // family_history stored as Title-cased labels; convert back to boolean map by key
        const titles: string[] = Array.isArray(p.family_history) ? p.family_history : [];
        const next: Record<string, boolean> = {};
        famKeys.forEach(k => {
          if (k === 'none') next[k] = titles.length === 0 || titles.includes('None');
          else next[k] = titles.includes(toTitle(k));
        });
        setFamily(next);
      }

      // 2) Optionally show last (compact) result if cookie exists
      const rawResult = getCookie('analysis_result');
      if (rawResult) {
        const parsed = JSON.parse(decodeURIComponent(rawResult));
        setServerResult(parsed);
      }
    } catch {
      // Ignore malformed cookie/session data
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- submit ---
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setServerResult(null);
    setTouched({ age: true, height: true, weight: true, waist: true });
    // build error map
    const nextErrors = {
      age: validateAge(age),
      sex: sex ? undefined : t('validation.required'),
      height: validateHeight(height),
      weight: validateWeight(weight),
      waist: validateWaist(waist),
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Family history to API shape {Diabetes:"Yes|No", Hypertension:"Yes|No", Stroke:"Yes|No"}
    const famObj: Record<string, string | null> = {
      Diabetes: family['none'] ? 'No' : family['diabetes'] ? 'Yes' : 'No',
      Hypertension: family['none'] ? 'No' : family['hypertension'] ? 'Yes' : 'No',
      Stroke: family['none'] ? 'No' : family['stroke'] ? 'Yes' : 'No'
    };

    const payload = {
      Age: age ? Number(age) : null,
      Sex: sex ? sexMap[sex] : null,
      FamilyHistory: famObj,
      WeightKg: weight ? Number(weight) : null,
      HeightCm: height ? Number(height) : null,
      WaistCircumferenceCm: waist ? Number(waist) : null,
      ActivityLevel: activity ? activityMap[activity] : null,
      Smoking: smoking ? smokingMap[smoking] : null,
      AlcoholConsumption: alcohol ? alcoholMap[alcohol] : null,
      SystolicBP: sbp ? Number(sbp) : null
    };
    setFieldErrors(nextErrors);

    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (hasErrors) {
      setIsLoading(false);
      focusFirstError();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Family history to API shape {Diabetes:"Yes|No", Hypertension:"Yes|No", Stroke:"Yes|No"}
    const famObj: Record<string, string | null> = {
      Diabetes: family['none'] ? 'No' : family['diabetes'] ? 'Yes' : 'No',
      Hypertension: family['none'] ? 'No' : family['hypertension'] ? 'Yes' : 'No',
      Stroke: family['none'] ? 'No' : family['stroke'] ? 'Yes' : 'No'
    };

    const payload = {
      Age: age ? Number(age) : null,
      Sex: sex ? sexMap[sex] : null,
      FamilyHistory: famObj,
      WeightKg: weight ? Number(weight) : null,
      HeightCm: height ? Number(height) : null,
      WaistCircumferenceCm: waist ? Number(waist) : null,
      ActivityLevel: activity ? activityMap[activity] : null,
      Smoking: smoking ? smokingMap[smoking] : null,
      AlcoholConsumption: alcohol ? alcoholMap[alcohol] : null,
      SystolicBP: sbp ? Number(sbp) : null
    };

    try {
      const res = await fetch(`${API_BASE}/api/webhooks/user-profile/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Request failed with ${res.status}`);
      }

      const data = await res.json().catch(() => ({}));

      // Persist API result to sessionStorage so the next page can read it
      sessionStorage.setItem('analysis:result', JSON.stringify(data));

      // Store user profile data for reuse (shares the same cookie name as plan form)
      const userProfileData = {
        age: payload.Age,
        sex, // keep internal code ('male'|'female')
        height_cm: payload.HeightCm,
        weight_kg: payload.WeightKg,
        waist_cm: payload.WaistCircumferenceCm,
        activity_frequency: activity as Exclude<Activity, null> | null,
        systolic_bp: sbp ? Number(sbp) : null,
        smoking: smoking as Exclude<Smoking, null> | null,
        alcohol: alcohol as Exclude<Alcohol, null> | null,
        family_history: (famKeys as readonly string[])
          .filter(k => family[k] && k !== 'none')
          .map(toTitle)
      };

      const consent = getCookie('vit_consent'); // e.g., "all"
      if (consent === 'all') {
        try {
          // Store a compact result snapshot to cookie
          const compact = JSON.stringify({
            risk: (data && (data.risk ?? data.Risk)) ?? null,
            score: (data && (data.score ?? data.Score)) ?? null,
            ts: Date.now()
          });
          setCookie('analysis_result', encodeURIComponent(compact), 7);

          // Store user profile data
          setCookie('user_profile', encodeURIComponent(JSON.stringify(userProfileData)), 7);
        } catch {
          // swallow cookie write errors
        }
      } else {
        // Even without consent, store profile in sessionStorage for current session
        sessionStorage.setItem('user_profile', JSON.stringify(userProfileData));
      }

      // Navigate to your analysis result page (adjust path if different)
      router.push('/analysisresult');
      return;
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };
  const hasErrors = Object.values(fieldErrors).some(Boolean) || !sex;
  return (
    <main className="min-h-screen w-full bg-green-50/40 pb-24">
      {/* Loading Page (full-screen overlay) */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-green-600" aria-hidden="true" />
          <p className="text-sm text-green-600">{t('loading') ?? 'Submitting…'}</p>
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
        {/* Server result / error display */}
        {/* {(serverResult || error) && (
          <div
            className={`mb-4 rounded-xl border p-4 ${
              error ? 'border-red-300 bg-red-50' : 'border-emerald-300 bg-emerald-50'
            }`}
          >
            {error ? (
              <p className="text-sm text-red-700">{error}</p>
            ) : (
              <>
                <p className="mb-2 text-sm font-semibold text-emerald-800">{'Your Analysis'}</p>
                <pre className="overflow-auto rounded-lg bg-white p-3 text-xs text-gray-800">
                  {JSON.stringify(serverResult, null, 2)}
                </pre>
              </>
            )}
          </div>
        )} */}
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-300 bg-red-50 p-4"
          >
            <p className="text-sm text-red-700">
              {typeof error === 'string' ? error : JSON.stringify(error, null, 2)}
            </p>
          </div>
        )}

        <form onSubmit={onSubmit} className="relative rounded-[28px] border-2 border-sky-500/60 bg-white p-5 shadow-lg sm:p-7 md:p-8">
          {/* Header */}
          <div className="mb-6 flex items-center gap-2">
            <Clipboard className="text-green-600" />
            <h2 className="text-lg font-semibold">{t('assessmentTitle')}</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Age */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('fields.age.label')} <Req />
              </label>
              <input
                ref={ageRef}
                id="field-age"
                type="number"
                inputMode="numeric"
                min={18}
                max={150}
                step="1"
                placeholder={t('fields.age.placeholder')}
                className={`w-full rounded-md border px-3 py-2 outline-none focus:border-sky-500 ${fieldErrors.age ? 'border-red-400 focus:border-red-500' : 'border-gray-300'
                  }`}
                value={age}
                onChange={e => {
                  setAge(e.target.value);
                  if (!touched.age) setTouched(p => ({ ...p, age: true }));
                }}
                onBlur={() => setTouched(p => ({ ...p, age: true }))}
                aria-invalid={!!fieldErrors.age}
                aria-describedby={fieldErrors.age ? 'age-error' : undefined}
                required
              />
              {fieldErrors.age && (
                <p id="age-error" className="mt-1 text-xs text-red-600">{fieldErrors.age}</p>
              )}
            </div>

            {/* Sex */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('fields.sex.label')} <Req />
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['male', 'female'] as const).map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setSex(k);
                      setFieldErrors(p => ({ ...p, sex: undefined }));
                    }}
                    className={`rounded-md border px-3 py-2 font-medium ${sex === k
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

            {/* Height */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('fields.height.label')} <Req />
              </label>
              <input
                ref={heightRef}
                id="field-height"
                type="number"
                inputMode="numeric"
                min={50}
                max={250}
                step="1"
                placeholder={t('fields.height.placeholder')}
                className={`w-full rounded-md border px-3 py-2 outline-none focus:border-sky-500 ${fieldErrors.height ? 'border-red-400 focus:border-red-500' : 'border-gray-300'
                  }`}
                value={height}
                onChange={e => {
                  setHeight(e.target.value);
                  if (!touched.height) setTouched(p => ({ ...p, height: true }));
                }}
                onBlur={() => setTouched(p => ({ ...p, height: true }))}
                aria-invalid={!!fieldErrors.height}
                aria-describedby={fieldErrors.height ? 'height-error' : undefined}
                required
              />
              {fieldErrors.height && (
                <p id="height-error" className="mt-1 text-xs text-red-600">{fieldErrors.height}</p>
              )}
            </div>

            {/* Weight */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('fields.weight.label')} <Req />
              </label>
              <input
                ref={weightRef}
                id="field-weight"
                type="number"
                inputMode="decimal"
                min={30}
                max={300}
                step="0.1"
                placeholder={t('fields.weight.placeholder')}
                className={`w-full rounded-md border px-3 py-2 outline-none focus:border-sky-500 ${fieldErrors.weight ? 'border-red-400 focus:border-red-500' : 'border-gray-300'
                  }`}
                value={weight}
                onChange={e => {
                  setWeight(e.target.value);
                  if (!touched.weight) setTouched(p => ({ ...p, weight: true }));
                }}
                onBlur={() => setTouched(p => ({ ...p, weight: true }))}
                aria-invalid={!!fieldErrors.weight}
                aria-describedby={fieldErrors.weight ? 'weight-error' : undefined}
                required
              />
              {fieldErrors.weight && (
                <p id="weight-error" className="mt-1 text-xs text-red-600">{fieldErrors.weight}</p>
              )}
            </div>

            {/* Waist circumference */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('fields.waist.label')} <Req />
              </label>
              <input
                ref={waistRef}
                id="field-waist"
                type="number"
                inputMode="numeric"
                min={30}
                max={200}
                step="1"
                placeholder={t('fields.waist.placeholder')}
                className={`w-full rounded-md border px-3 py-2 outline-none focus:border-sky-500 ${fieldErrors.waist ? 'border-red-400 focus:border-red-500' : 'border-gray-300'
                  }`}
                value={waist}
                onChange={e => {
                  setWaist(e.target.value);
                  if (!touched.waist) setTouched(p => ({ ...p, waist: true }));
                }}
                onBlur={() => setTouched(p => ({ ...p, waist: true }))}
                aria-invalid={!!fieldErrors.waist}
                aria-describedby={fieldErrors.waist ? 'waist-error' : undefined}
                required
              />
              {fieldErrors.waist && (
                <p id="waist-error" className="mt-1 text-xs text-red-600">{fieldErrors.waist}</p>
              )}
            </div>

            {/* Systolic BP */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.bpSystolic.label')}</label>
              <input
                type="number"
                min={0}
                placeholder={t('fields.bpSystolic.placeholder')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:border-sky-500"
                value={sbp}
                onChange={e => setSbp(e.target.value)}
              />
              <p className="mt-1 text-xs italic text-gray-500">{t('fields.bpSystolic.help')}</p>
            </div>

            {/* Activity */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.activity.label')}</label>
              <div className="grid grid-cols-1 md:grid-cols-4  gap-2">
                {(['sedentary', 'low', 'medium', 'high'] as Activity[]).map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setActivity(k)}
                    className={`rounded-md border px-3 py-2 text-sm font-medium ${activity === k ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {t(`fields.activity.${k}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Alcohol */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.alcohol.label')}</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {(['none', 'occasional', 'frequent'] as Alcohol[]).map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setAlcohol(k)}
                    className={`rounded-md border px-3 py-2 text-sm font-medium ${alcohol === k ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
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
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSmoking(k)}
                    className={`rounded-md border px-3 py-2 text-sm font-medium ${smoking === k ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {t(`fields.smoking.${k}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Family history */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('fields.family.label')}</label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                {famKeys.map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => toggleFam(k)}
                    className={`rounded-md border px-3 py-2 text-sm font-medium ${family[k]
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
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
              disabled={isLoading || hasErrors}

            >
              {t('submit')}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
