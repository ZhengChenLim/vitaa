// app/components/LocaleSwitcher.tsx
'use client';

import {useTranslations, useLocale} from 'next-intl';
import {useRouter, usePathname} from '@/i18n/navigation'; // next-intl wrapper
import {useSearchParams} from 'next/navigation';
import {useCallback} from 'react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';

type Locale = 'en' | 'ms' | 'zh' | 'vi';

const choices: {code: Locale; key: string}[] = [
  {code: 'en', key: 'lang.english'},
  {code: 'ms', key: 'lang.malay'},
  {code: 'zh', key: 'lang.chinese'},
  {code: 'vi', key: 'lang.vietnamese'}
];

export default function LocaleSwitcher() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = useLocale() as Locale;

  const setLocale = useCallback(
    (loc: Locale) => {
      const qs = searchParams?.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      router.replace(href, {locale: loc});
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="inline-flex items-center gap-2">
      <span className="sr-only">{t('lang.switch')}</span>
      <Select value={current} onValueChange={(v) => setLocale(v as Locale)}>
        <SelectTrigger
          aria-label={t('lang.switch')}
          className="h-8 w-[140px] text-sm"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" className="text-sm">
          {choices.map(({code, key}) => (
            <SelectItem key={code} value={code}>
              {t(key)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
