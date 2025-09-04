'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Home, ClipboardList, AlertTriangle, CheckCircle, Info, Loader2 } from 'lucide-react';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage
} from '@/components/ui/breadcrumb';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

// --- cookie helpers ---
function getCookie(name: string) {
  if (typeof document === 'undefined') return undefined;
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='))
    ?.split('=')[1];
}
function setCookie(name: string, value: string, days = 7) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

// --- types ---
type Sex = 'male' | 'female' | null;
type Activity = 'sedentary' | 'low' | 'medium' | 'high' | null;
type Alcohol = 'none' | 'occasional' | 'frequent' | null;
type Smoking = 'smoker' | 'nonSmoker' | null;

// --- API base (same as your form page) ---
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://127.0.0.1:8001';

// --- helpers ---
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
function calcBMI(kg?: number | null, cm?: number | null) {
  if (!kg || !cm) return null;
  const m = cm / 100;
  return kg / (m * m);
}
// BRI = 364.2 - 365.5 * sqrt(1 - ( (waist/(2π))^2 / ( (height/2)^2 ) ))
function calcBRI(waistCm?: number | null, heightCm?: number | null) {
  if (!waistCm || !heightCm) return null;
  const r = waistCm / (2 * Math.PI);
  const R = heightCm / 2;
  const inside = 1 - (r * r) / (R * R);
  if (inside <= 0 || inside > 1) return null;
  return 364.2 - (365.5 * Math.sqrt(inside));
}
function markerLeft(value: number, min: number, max: number) {
  const pct = ((clamp(value, min, max) - min) / (max - min)) * 100;
  return `${pct}%`;
}

// normalized risk codes
type RiskCode = 'high' | 'moderate' | 'low' | 'unknown';
function normalizeRisk(r?: string): RiskCode {
  const v = (r || '').toLowerCase();
  if (v.includes('high')) return 'high';
  if (v.includes('moderate') || v.includes('med')) return 'moderate';
  if (v.includes('low')) return 'low';
  return 'unknown';
}
function riskColor(code: RiskCode) {
  if (code === 'high') return 'bg-rose-100 text-rose-700 border-rose-200';
  if (code === 'moderate') return 'bg-amber-100 text-amber-700 border-amber-200';
  if (code === 'low') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}
function riskIcon(code: RiskCode) {
  if (code === 'high') return <AlertTriangle className="h-5 w-5" />;
  if (code === 'moderate') return <Info className="h-5 w-5" />;
  if (code === 'low') return <CheckCircle className="h-5 w-5" />;
  return <Info className="h-5 w-5" />;
}

// label title-casing (for family_history saved labels)
const toTitle = (s: string) =>
  s
    .replace(/([A-Z])/g, ' $1')
    .replace(/^\w/, c => c.toUpperCase())
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();

// API label maps (same as your form page)
const sexMap: Record<Exclude<Sex, null>, string> = { male: 'Male', female: 'Female' };
const activityMap: Record<Exclude<Activity, null>, string> = {
  sedentary: 'Sedentary', low: 'Low', medium: 'Medium', high: 'High'
};
const alcoholMap: Record<Exclude<Alcohol, null>, string> = {
  none: 'None', occasional: 'Occasional', frequent: 'Frequent'
};
const smokingMap: Record<Exclude<Smoking, null>, string> = {
  smoker: 'Yes', nonSmoker: 'No'
};

export default function AnalysisResultPage() {
  const t = useTranslations('analysisResult');
  // label mappers (localized for display)
  const label = {
    sex: (s: Exclude<Sex, null>) => t(`enums.sex.${s}`, { defaultValue: s === 'male' ? 'Male' : 'Female' }),
    activity: (a: Exclude<Activity, null>) =>
      t(`enums.activity.${a}`, { defaultValue: a.charAt(0).toUpperCase() + a.slice(1) }),
    alcohol: (a: Exclude<Alcohol, null>) =>
      t(`enums.alcohol.${a}`, { defaultValue: a.charAt(0).toUpperCase() + a.slice(1) }),
    smoking: (s: Exclude<Smoking, null>) =>
      t(`enums.smoking.${s}`, { defaultValue: s === 'smoker' ? 'Smoker' : 'Non-smoker' })
  };

  // editable profile state
  const [profile, setProfile] = useState<{
    age: number | null;
    sex: Sex;
    height_cm: number | null;
    weight_kg: number | null;
    waist_cm: number | null;
    activity_frequency: Activity;
    systolic_bp: number | null;
    smoking: Smoking;
    alcohol: Alcohol;
    family_history: string[];
  }>({
    age: null,
    sex: null,
    height_cm: null,
    weight_kg: null,
    waist_cm: null,
    activity_frequency: null,
    systolic_bp: null,
    smoking: null,
    alcohol: null,
    family_history: []
  });

  // toggles for family history inside the accordion editor
  const famKeys = ['diabetes', 'hypertension', 'stroke', 'none'] as const;
  const [family, setFamily] = useState<Record<string, boolean>>({});
  const toggleFam = (k: string) =>
    setFamily(p => {
      if (k === 'none') return { none: !p.none } as Record<string, boolean>;
      const next = { ...p, [k]: !p[k] } as Record<string, boolean>;
      if (next[k]) next['none'] = false;
      return next;
    });

  // server result + request state
  const [result, setResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    age?: string;
    sex?: string;
    height?: string;
    weight?: string;
    waist?: string;
  }>({});

  const validateAge = (v: number | null) => {
    if (v == null || v === ('' as any)) return t('validation.required');
    if (!Number.isFinite(v)) return t('validation.number');
    if (v < 18 || v > 150) return t('validation.age');
    return undefined;
  };
  const validateHeight = (v: number | null) => {
    if (v == null || v === ('' as any)) return t('validation.required');
    if (!Number.isFinite(v)) return t('validation.number');
    if (v < 50 || v > 250) return t('validation.height');
    return undefined;
  };
  const validateWeight = (v: number | null) => {
    if (v == null || v === ('' as any)) return t('validation.required');
    if (!Number.isFinite(v)) return t('validation.number');
    if (v < 30 || v > 300) return t('validation.weight');
    return undefined;
  };
  const validateWaist = (v: number | null) => {
    if (v == null || v === ('' as any)) return t('validation.required');
    if (!Number.isFinite(v)) return t('validation.number');
    if (v < 30 || v > 200) return t('validation.waist');
    return undefined;
  };

  // hydrate profile & result from cookie / session
  useEffect(() => {
    try {
      const rawCookie = getCookie('user_profile');
      const raw = rawCookie ? decodeURIComponent(rawCookie) : sessionStorage.getItem('user_profile');
      if (raw) {
        const p = JSON.parse(raw) ?? {};
        setProfile(prev => ({ ...prev, ...p }));

        // init family toggle state from saved labels
        const titles: string[] = Array.isArray(p.family_history) ? p.family_history : [];
        const next: Record<string, boolean> = {};
        const labelByKey: Record<string, string> = {
          diabetes: familyLabel('diabetes'),
          hypertension: familyLabel('hypertension'),
          stroke: familyLabel('stroke'),
          none: familyLabel('none')
        };
        const englishByKey: Record<string, string> = {
          diabetes: toTitle('diabetes'),
          hypertension: toTitle('hypertension'),
          stroke: toTitle('stroke'),
          none: 'None'
        };
        famKeys.forEach(k => {
          if (k === 'none') {
            next[k] = !titles?.length || titles.some(v =>
              v === labelByKey.none || v === englishByKey.none || v.toLowerCase() === 'none'
            );
          } else {
            next[k] = titles.some(v =>
              v === labelByKey[k] || v === englishByKey[k] || v.toLowerCase() === k
            );
          }
        });
        setFamily(next);
      }
    } catch { }

    try {
      const s = sessionStorage.getItem('analysis:result');
      if (s) setResult(JSON.parse(s));
      else {
        const rc = getCookie('analysis_result');
        if (rc) setResult(JSON.parse(decodeURIComponent(rc)));
      }
    } catch { }
  }, []);

  

  // derived metrics
  const bmi = useMemo(() => calcBMI(profile.weight_kg ?? null, profile.height_cm ?? null), [profile.weight_kg, profile.height_cm]);
  const bri = useMemo(() => calcBRI(profile.waist_cm ?? null, profile.height_cm ?? null), [profile.waist_cm, profile.height_cm]);
  const hasErrors = Object.values(fieldErrors).some(Boolean);
  const bmiInfo = useMemo(() => {
    if (bmi == null) return { label: t('bmi.bands.na', { defaultValue: '—' }), color: 'bg-gray-300' };
    if (bmi < 18.5) return { label: t('bmi.bands.underweight', { defaultValue: 'Underweight' }), color: 'bg-sky-300' };
    if (bmi < 24) return { label: t('bmi.bands.normal', { defaultValue: 'Normal' }), color: 'bg-emerald-400' };
    if (bmi < 28) return { label: t('bmi.bands.overweight', { defaultValue: 'Overweight' }), color: 'bg-amber-400' };
    return { label: t('bmi.bands.obese', { defaultValue: 'Obese' }), color: 'bg-rose-500' };
  }, [bmi, t]);

  const briInfo = useMemo(() => {
    if (bri == null) return { label: t('bri.bands.na', { defaultValue: '—' }), color: 'bg-gray-300' };
    if (bri < 3.4) return { label: t('bri.bands.poor', { defaultValue: 'Poor roundness (low fat)' }), color: 'bg-sky-300' };
    if (bri <= 5.4) return { label: t('bri.bands.desirable', { defaultValue: 'Desirable' }), color: 'bg-emerald-400' };
    if (bri <= 8.8) return { label: t('bri.bands.excessive', { defaultValue: 'Excessive' }), color: 'bg-amber-400' };
    return { label: t('bri.bands.elevated', { defaultValue: 'Significantly elevated' }), color: 'bg-rose-500' };
  }, [bri, t]);

  // risks from webhook result (works for {webhook_response:{...}} or flattened)
  const webhook = (result && (result.webhook_response || result)) || {};
  const diabetesRiskCode: RiskCode = normalizeRisk(webhook['Diabetes']);
  const htnRiskCode: RiskCode = normalizeRisk(webhook['Hypertension']);
  const strokeRiskCode: RiskCode = normalizeRisk(webhook['Stroke']);
  const familyLabel = (k: 'diabetes' | 'hypertension' | 'stroke' | 'none') =>
    k === 'none'
      ? t('profile.none', { defaultValue: 'None' })
      : t(`profile.fields.family.${k}`, { defaultValue: toTitle(k) });

  // inline submit: POST same API, update cookies + session, refresh UI
  const onInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErr(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // run validation (submit-only)
    const next = {
      age: validateAge(profile.age),
      sex: profile.sex ? undefined : t('validation.required'),
      height: validateHeight(profile.height_cm),
      weight: validateWeight(profile.weight_kg),
      waist: validateWaist(profile.waist_cm),
    };
    setFieldErrors(next);
    const hasErrors = Object.values(next).some(Boolean);
    if (hasErrors) {
      setIsSubmitting(false);
      // focus the first invalid field
      const first =
        (next.age && 'age') ||
        (next.sex && 'sex') ||
        (next.height && 'height') ||
        (next.weight && 'weight') ||
        (next.waist && 'waist');
      if (first) {
        const el = document.getElementById(first);
        if (el && 'focus' in el) (el as HTMLInputElement).focus();
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    // family to API shape
    const famObj: Record<string, string | null> = {
      Diabetes: family['none'] ? 'No' : family['diabetes'] ? 'Yes' : 'No',
      Hypertension: family['none'] ? 'No' : family['hypertension'] ? 'Yes' : 'No',
      Stroke: family['none'] ? 'No' : family['stroke'] ? 'Yes' : 'No'
    };


    const payload = {
      Age: profile.age ?? null,
      Sex: profile.sex ? sexMap[profile.sex] : null,
      FamilyHistory: famObj,
      WeightKg: profile.weight_kg ?? null,
      HeightCm: profile.height_cm ?? null,
      WaistCircumferenceCm: profile.waist_cm ?? null,
      ActivityLevel: profile.activity_frequency ? activityMap[profile.activity_frequency] : null,
      Smoking: profile.smoking ? smokingMap[profile.smoking] : null,
      AlcoholConsumption: profile.alcohol ? alcoholMap[profile.alcohol] : null,
      SystolicBP: profile.systolic_bp ?? null
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
      setResult(data);
      sessionStorage.setItem('analysis:result', JSON.stringify(data));

      // build user_profile for persistence (internal codes + labels for family_history)
      const userProfileData = {
        age: payload.Age,
        sex: profile.sex,
        height_cm: payload.HeightCm,
        weight_kg: payload.WeightKg,
        waist_cm: payload.WaistCircumferenceCm,
        activity_frequency: profile.activity_frequency,
        systolic_bp: payload.SystolicBP,
        smoking: profile.smoking,
        alcohol: profile.alcohol,
        family_history: (famKeys as readonly string[])
          .filter(k => family[k] && k !== 'none')
          .map(k => familyLabel(k as any))
      };

      const consent = getCookie('vit_consent'); // "all" enables cookies
      if (consent === 'all') {
        try {
          const compact = JSON.stringify({
            risk: (data && (data.risk ?? data.Risk)) ?? null,
            score: (data && (data.score ?? data.Score)) ?? null,
            ts: Date.now()
          });
          setCookie('analysis_result', encodeURIComponent(compact), 7);
          setCookie('user_profile', encodeURIComponent(JSON.stringify(userProfileData)), 7);
        } catch { }
      } else {
        sessionStorage.setItem('user_profile', JSON.stringify(userProfileData));
      }
    } catch (e: any) {
      setErr(e?.message ?? 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-green-50/40 pb-24">
      {/* full-screen loader when recalculating */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur">
          <Loader2 className="mb-3 h-10 w-10 animate-spin text-green-600" />
          <p className="text-sm text-green-700">{t('loading', { defaultValue: 'Submitting…' })}</p>
        </div>
      )}

      {/* Breadcrumbs */}
      <Breadcrumb className="mx-auto max-w-6xl px-4 pt-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                <Home className="h-4 w-4" aria-hidden="true" />
                <span>{t('breadcrumbs.home', { defaultValue: 'Home' })}</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sm text-gray-700">{t('breadcrumbs.result', { defaultValue: 'Result' })}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Title + stepper */}
      <section className="mx-auto max-w-6xl px-4 pt-4 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">{t('title', { defaultValue: 'Health Analysis Result' })}</h1>
        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-300 text-gray-400 font-bold">1</div>
          <div className="h-[2px] w-16 bg-gray-300" />
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white font-bold">2</div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="mx-auto mt-6 max-w-6xl px-4">
        <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <Info className="h-5 w-5 text-amber-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                <strong>{t('result.disclaimerLabel', { defaultValue: 'Disclaimer:' })}</strong>{' '}
                {t('result.disclaimer', {
                  defaultValue:
                    'This risk assessment is for health management only, not a medical diagnosis. A "high risk" result does not mean you will develop the disease. For personal advice, consult a doctor.'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile (Accordion with INLINE EDIT + RECALCULATE) */}
      <section className="mx-auto mt-8 max-w-6xl px-4">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="profile" className="border-0">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <AccordionTrigger className="px-4 py-4 text-left md:px-6 md:py-5 hover:no-underline">
                <div className="inline-flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-green-600" />
                  <span className="text-lg font-semibold text-slate-800">
                    {t('profile.title', { defaultValue: 'Health Profile' })}
                  </span>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-4 pb-5 md:px-6">
                {err && (
                  <div className="mb-4 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
                    {err}
                  </div>
                )}

                <form onSubmit={onInlineSubmit} className="rounded-xl border border-slate-200 p-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Age (required) */}
                    <LabeledInput
                      id="age"
                      label={t('profile.fields.age', { defaultValue: 'Age' })}
                      type="number"
                      value={profile.age ?? ''}
                      onChange={v => setProfile(p => ({ ...p, age: v === '' ? null : Number(v) }))}
                      required
                      error={fieldErrors.age}
                    />

                    {/* Sex (required) */}
                    <LabeledToggleGroup
                      id="sex"
                      label={t('profile.fields.sex', { defaultValue: 'Sex' })}
                      options={[
                        { key: 'male', label: label.sex('male') },
                        { key: 'female', label: label.sex('female') }
                      ]}
                      value={profile.sex}
                      onChange={v => setProfile(p => ({ ...p, sex: v as Sex }))}
                      columns={2}
                      required
                      error={fieldErrors.sex}
                    />

                    {/* Height (required) */}
                    <LabeledInput
                      id="height"
                      label={t('profile.fields.height', { defaultValue: 'Height (cm)' })}
                      type="number"
                      value={profile.height_cm ?? ''}
                      onChange={v => setProfile(p => ({ ...p, height_cm: v === '' ? null : Number(v) }))}
                      required
                      error={fieldErrors.height}
                    />

                    {/* Weight (required) */}
                    <LabeledInput
                      id="weight"
                      label={t('profile.fields.weight', { defaultValue: 'Weight (kg)' })}
                      type="number"
                      value={profile.weight_kg ?? ''}
                      onChange={v => setProfile(p => ({ ...p, weight_kg: v === '' ? null : Number(v) }))}
                      required
                      error={fieldErrors.weight}
                    />

                    {/* Waist (required) */}
                    <LabeledInput
                      id="waist"
                      className="md:col-span-2"
                      label={t('profile.fields.waist', { defaultValue: 'Waist Circumference (cm)' })}
                      type="number"
                      value={profile.waist_cm ?? ''}
                      onChange={v => setProfile(p => ({ ...p, waist_cm: v === '' ? null : Number(v) }))}
                      required
                      error={fieldErrors.waist}
                    />
                    {/* Activity */}
                    <LabeledToggleGroup
                      className="md:col-span-2"
                      label={t('profile.fields.activity', { defaultValue: 'Activity Frequency' })}
                      options={[
                        { key: 'sedentary', label: label.activity('sedentary') },
                        { key: 'low', label: label.activity('low') },
                        { key: 'medium', label: label.activity('medium') },
                        { key: 'high', label: label.activity('high') }
                      ]}
                      value={profile.activity_frequency}
                      onChange={v => setProfile(p => ({ ...p, activity_frequency: v as Activity }))}
                      columns={4}
                    />
                    {/* SBP */}
                    <LabeledInput
                      className="md:col-span-2"
                      label={t('profile.fields.sbp', { defaultValue: 'Systolic BP' })}
                      type="number"
                      value={profile.systolic_bp ?? ''}
                      onChange={v => setProfile(p => ({ ...p, systolic_bp: v === '' ? null : Number(v) }))}
                      help={t('profile.fields.sbpHelp', { defaultValue: 'Use your most recent resting reading if available.' })}
                    />
                    {/* Alcohol */}
                    <LabeledToggleGroup
                      className="md:col-span-2"
                      label={t('profile.fields.alcohol', { defaultValue: 'Alcohol Consumption' })}
                      options={[
                        { key: 'none', label: label.alcohol('none') },
                        { key: 'occasional', label: label.alcohol('occasional') },
                        { key: 'frequent', label: label.alcohol('frequent') }
                      ]}
                      value={profile.alcohol}
                      onChange={v => setProfile(p => ({ ...p, alcohol: v as Alcohol }))}
                      columns={3}
                    />
                    {/* Smoking */}
                    <LabeledToggleGroup
                      className="md:col-span-2"
                      label={t('profile.fields.smoking', { defaultValue: 'Smoking Status' })}
                      options={[
                        { key: 'smoker', label: label.smoking('smoker') },
                        { key: 'nonSmoker', label: label.smoking('nonSmoker') }
                      ]}
                      value={profile.smoking}
                      onChange={v => setProfile(p => ({ ...p, smoking: v as Smoking }))}
                      columns={2}
                    />
                    {/* Family history */}
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        {t('profile.fields.family.label', { defaultValue: 'Family history' })}
                      </label>
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
                            {familyLabel(k)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mt-5">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-[#13D298] to-[#2CD30D] font-semibold text-white shadow-md hover:opacity-90 md:w-auto"
                      disabled={isSubmitting || hasErrors}
                      >
                      {isSubmitting ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> {t('profile.update', { defaultValue: 'Update result' })}
                        </span>
                      ) : (
                        t('profile.update', { defaultValue: 'Update result' })
                      )}
                    </Button>
                  </div>
                </form>
              </AccordionContent>
            </div>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Analysis Result */}
      <section className="mx-auto mt-8 max-w-6xl px-4">
        <h3 className="mb-3 text-lg font-semibold text-slate-800">
          {t('result.title', { defaultValue: 'Analysis Result' })}
        </h3>

        {/* BMI Card */}
        <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-3 text-xl font-bold text-slate-800">{t('bmi.title', { defaultValue: 'BMI' })}</h4>
              <ScaleBar
                min={15}
                max={35}
                ticks={[18.5, 23.9, 27.9]}
                value={bmi ?? undefined}
                segments={[
                  { upTo: 18.5, color: 'bg-sky-300' },
                  { upTo: 24, color: 'bg-emerald-400' },
                  { upTo: 28, color: 'bg-amber-400' },
                  { upTo: 35, color: 'bg-rose-500' }
                ]}
              />
              <div className="mt-3 text-sm text-slate-600">
                <span className="font-semibold">{t('bmi.myResult', { defaultValue: 'My Result:' })} </span>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-slate-800">
                  {bmi ? bmi.toFixed(1) : '—'}
                </span>
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${bmiInfo.color} ${bmiInfo.color.includes('sky') || bmiInfo.color.includes('emerald') ? 'text-slate-800' : 'text-white'
                    }`}
                >
                  {bmiInfo.label}
                </span>
              </div>
            </div>
            <div className="text-sm text-slate-700">
              <p className="mb-2">{t('bmi.desc', { defaultValue: 'BMI (Body Mass Index) is an indicator of weight relative to height.' })}</p>
              <ul className="space-y-1">
                <li><span className="font-semibold">{t('bmi.bands.underweight', { defaultValue: 'Underweight' })}:</span> &lt;18.5</li>
                <li><span className="font-semibold">{t('bmi.bands.normal', { defaultValue: 'Normal' })}:</span> 18.5–23.9</li>
                <li><span className="font-semibold">{t('bmi.bands.overweight', { defaultValue: 'Overweight' })}:</span> 24.0–27.9</li>
                <li><span className="font-semibold">{t('bmi.bands.obese', { defaultValue: 'Obese' })}:</span> ≥28.0</li>
              </ul>
            </div>
          </div>
        </div>

        {/* BRI Card */}
        <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
            <div>
              <h4 className="mb-3 text-xl font-bold text-slate-800">{t('bri.title', { defaultValue: 'BRI' })}</h4>
              <ScaleBar
                min={1}
                max={20}
                ticks={[3.4, 5.4, 8.8]}
                value={bri ?? undefined}
                segments={[
                  { upTo: 3.4, color: 'bg-sky-300' },
                  { upTo: 5.4, color: 'bg-emerald-400' },
                  { upTo: 8.8, color: 'bg-amber-400' },
                  { upTo: 20, color: 'bg-rose-500' }
                ]}
              />
              <div className="mt-3 text-sm text-slate-600">
                <span className="font-semibold">{t('bri.myResult', { defaultValue: 'My Result:' })} </span>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-slate-800">
                  {bri ? bri.toFixed(1) : '—'}
                </span>
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${briInfo.color} ${briInfo.color.includes('sky') || briInfo.color.includes('emerald') ? 'text-slate-800' : 'text-white'
                    }`}
                >
                  {briInfo.label}
                </span>
              </div>
            </div>
            <div className="text-sm text-slate-700">
              <p className="mb-2">
                {t('bri.desc', {
                  defaultValue:
                    'The Body Roundness Index (BRI) estimates abdominal fat from height and waist circumference, linking higher values to central obesity and metabolic risk.'
                })}
              </p>
              <ul className="space-y-1">
                <li><span className="font-semibold">{t('bri.bands.poor', { defaultValue: 'Poor roundness (low fat)' })}:</span> &lt;3.4</li>
                <li><span className="font-semibold">{t('bri.bands.desirable', { defaultValue: 'Desirable' })}:</span> 3.4–5.4</li>
                <li><span className="font-semibold">{t('bri.bands.excessive', { defaultValue: 'Excessive' })}:</span> 5.5–8.8</li>
                <li><span className="font-semibold">{t('bri.bands.elevated', { defaultValue: 'Significantly elevated' })}:</span> ≥8.8</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Risk tiles */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">{t('risk.title', { defaultValue: 'Health Risk Assessment' })}</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <RiskTile
              t={t}
              titleKey="risk.conditions.diabetes"
              code={diabetesRiskCode}
              descKey="risk.desc.diabetes"
              descDefault="Diabetes is a condition characterized by chronically high blood sugar levels. Those at high risk should pay special attention to diet, exercise, and weight management."
            />
            <RiskTile
              t={t}
              titleKey="risk.conditions.hypertension"
              code={htnRiskCode}
              descKey="risk.desc.hypertension"
              descDefault="Hypertension is a chronic condition characterized by long-term elevated blood pressure. The risk is low. Maintaining a healthy lifestyle and preventing it are recommended."
            />
            <RiskTile
              t={t}
              titleKey="risk.conditions.stroke"
              code={strokeRiskCode}
              descKey="risk.desc.stroke"
              descDefault="A stroke is an acute illness caused by blocked blood flow or bleeding in the brain. The risk is low. Maintaining healthy habits is recommended to reduce future risk."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

/* ---------- tiny components ---------- */
function LabeledInput({
  label, type, value, onChange, help, className, required, error, id
}: {
  label: string;
  type?: 'text' | 'number';
  value: string | number;
  onChange: (v: string) => void;
  help?: string;
  className?: string;
  required?: boolean;
  error?: string;
  id?: string;
}) {
  const Req = () => <span className="ml-1 text-red-600" aria-hidden="true">*</span>;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required ? <Req /> : null}
      </label>
      <input
        id={id}
        type={type ?? 'text'}
        value={value as any}
        onChange={e => onChange(e.target.value)}
        className={`w-full rounded-md border px-3 py-2 outline-none focus:border-sky-500 ${error ? 'border-red-400 focus:border-red-500' : 'border-gray-300'
          }`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {help && <p className="mt-1 text-xs italic text-gray-500">{help}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function LabeledToggleGroup<T extends string>({
  label, options, value, onChange, columns = 2, className, required, error, id
}: {
  label: string;
  options: { key: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
  columns?: 2 | 3 | 4;
  className?: string;
  required?: boolean;
  error?: string;
  id?: string;
}) {
  const Req = () => <span className="ml-1 text-red-600" aria-hidden="true">*</span>;
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={id}>
        {label} {required ? <Req /> : null}
      </label>
      <div
        id={id}
        className={`grid gap-2 ${columns === 4 ? 'md:grid-cols-4 grid-cols-2' : columns === 3 ? 'md:grid-cols-3 grid-cols-1' : 'grid-cols-2'}`}
        role="group"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        {options.map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`rounded-md border px-3 py-2 text-sm font-medium ${value === opt.key ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            aria-pressed={value === opt.key}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function ScaleBar({
  min, max, value, ticks = [], segments
}: {
  min: number; max: number; value?: number; ticks?: number[];
  segments: Array<{ upTo: number; color: string }>;
}) {
  const widthPct = (to: number) => ((to - min) / (max - min)) * 100;
  const markerStyle = value == null ? { display: 'none' } : { left: markerLeft(value, min, max) };
  return (
    <div className="relative w-full">
      <div className="flex h-6 w-full overflow-hidden rounded-md border border-slate-200">
        {segments.map((s, i) => (
          <div
            key={i}
            className={`${s.color}`}
            style={{ width: `${widthPct(s.upTo) - (i === 0 ? 0 : widthPct(segments[i - 1].upTo))}%` }}
          />
        ))}
      </div>
      <div className="relative mt-1 h-4">
        {ticks.map((t, idx) => (
          <span key={idx} className="absolute -translate-x-1/2 text-xs text-slate-500" style={{ left: markerLeft(t, min, max) }}>
            {t}
          </span>
        ))}
      </div>
      <div className="relative mt-2 h-2">
        <span
          className="absolute -top-2 h-0 w-0 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-slate-700"
          style={markerStyle}
        />
      </div>
    </div>
  );
}

function RiskTile({
  t, titleKey, code, descKey, descDefault
}: {
  t: ReturnType<typeof useTranslations>;
  titleKey: string;
  code: RiskCode;
  descKey: string;
  descDefault: string;
}) {
  const clr = riskColor(code);
  const icon = riskIcon(code);
  const codeLabel =
    code === 'high'
      ? t('risk.level.high', { defaultValue: 'High' })
      : code === 'moderate'
        ? t('risk.level.moderate', { defaultValue: 'Moderate' })
        : code === 'low'
          ? t('risk.level.low', { defaultValue: 'Low' })
          : t('risk.level.unknown', { defaultValue: 'Unknown' });

  return (
    <div className="rounded-xl border p-5 shadow-sm transition-all hover:shadow-md">
      <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${clr} border`}>
        {icon}
        {codeLabel}
      </div>
      <h5 className="mb-2 text-lg font-bold text-slate-900">
        {t(titleKey as any, { defaultValue: 'Condition' })}
      </h5>
      <p className="text-sm leading-relaxed text-slate-700">
        {t(descKey as any, { defaultValue: descDefault })}
      </p>
      <div className="mt-3 inline-flex items-center text-sm font-medium text-green-700 hover:underline">
        {t('risk.learnMore', { defaultValue: 'Learn More' })}
        <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
