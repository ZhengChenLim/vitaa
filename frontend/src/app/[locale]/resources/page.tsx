// app/[locale]/data-sources/page.tsx
'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Leckerli_One } from 'next/font/google';
import { ExternalLink, BookOpenCheck, Database, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const leckerli = Leckerli_One({ subsets: ['latin'], weight: '400', display: 'swap' });

type Resource = { label: string; href: string; hint?: string };
type Section = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  resources: Resource[];
};

export default function DataSourcesPage() {
  const t = useTranslations('DATA_SOURCES');

  // Build sections from locale messages
  const SECTIONS: Section[] = useMemo(
    () => [
      {
        icon: <Database className="h-5 w-5" aria-hidden="true" />,
        title: t('food.title'),
        subtitle: t('food.subtitle'),
        badge: t('food.badge'),
        resources: [
          { label: t('food.mmFood100k'), href: 'https://huggingface.co/datasets/Codatta/MM-Food-100K', hint: t('food.hint') },
        ],
      },
      {
        icon: <Activity className="h-5 w-5" aria-hidden="true" />,
        title: t('exercise.title'),
        subtitle: t('exercise.subtitle'),
        badge: t('exercise.badge'),
        resources: [
          { label: t('exercise.compAdult'), href: 'https://pacompendium.com/adult-compendium/', hint: t('exercise.hint') },
        ],
      },
      {
        icon: <BookOpenCheck className="h-5 w-5" aria-hidden="true" />,
        title: t('myNcd.title'),
        subtitle: t('myNcd.subtitle'),
        badge: t('myNcd.badge'),
        resources: [
          { label: t('myNcd.pmc'), href: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10917592/' },
          { label: t('myNcd.nhms2019'), href: 'https://iku.moh.gov.my/images/IKU/Document/REPORT/NHMS2019/Report_NHMS2019-NCD_v2.pdf' },
          { label: t('myNcd.healthFacts2022'), href: 'https://www.moh.gov.my/moh/resources/Penerbitan/Penerbitan%20Utama/HEALTH%20FACTS/Health_Facts_2022-updated.pdf' },
        ],
      },
      {
        icon: <BookOpenCheck className="h-5 w-5" aria-hidden="true" />,
        title: t('globalNcd.title'),
        subtitle: t('globalNcd.subtitle'),
        badge: t('globalNcd.badge'),
        resources: [
          { label: t('globalNcd.whoFs'), href: 'https://www.who.int/news-room/fact-sheets/detail/noncommunicable-diseases' },
          { label: t('globalNcd.ihmeGbd'), href: 'https://vizhub.healthdata.org/gbd-results/' },
        ],
      },
    ],
    [t]
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* Hero */}
      <section className="mb-8 text-center">
        <div className={cn('text-3xl md:text-4xl text-green-700', leckerli.className)}>Vitaa</div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {t('hero.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-600">{t('hero.subtitle')}</p>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-700">{t('hero.tagline')}</p>
      </section>

      <Separator className="mb-8" />

      {/* Sections */}
      <div className="grid gap-6">
        {SECTIONS.map((s, idx) => (
          <Card key={idx} className="border-green-100">
            <CardHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-slate-800">
                <span className="rounded-xl bg-green-50 p-2">{s.icon}</span>
                <CardTitle className="text-lg">{s.title}</CardTitle>
                {s.badge && <Badge variant="secondary">{s.badge}</Badge>}
              </div>
              {s.subtitle && <CardDescription className="pl-12">{s.subtitle}</CardDescription>}
            </CardHeader>
            <CardContent>
              <ResourceTable
                resources={s.resources}
                t={{
                  content: t('table.content'),
                  link: t('table.link'),
                  notes: t('table.notes'),
                  continued: t('table.continued'),
                }}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Note */}
      <p className="mt-8 text-xs text-slate-500">{t('note')}</p>
    </main>
  );
}

function ResourceTable({
  resources,
  t,
}: {
  resources: Resource[];
  t: { content: string; link: string; notes: string; continued: string };
}) {
  return (
    <Table className="w-full table-fixed">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[35%]">{t.content}</TableHead>
          <TableHead className="w-[45%]">{t.link}</TableHead>
          <TableHead className="w-[20%] text-right">{t.notes}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {resources.map((r, i) => (
          <TableRow key={i}>
            {/* Content */}
            <TableCell className="whitespace-pre-wrap break-words align-top text-sm font-medium text-slate-800">
              {r.label}
            </TableCell>

            {/* Link */}
            <TableCell className="whitespace-pre-wrap break-words align-top">
              <a
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-col text-green-700 underline-offset-4 hover:underline break-all"
              >
                <span>{r.href}</span>
                <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
              </a>
            </TableCell>

            {/* Notes */}
            <TableCell className="text-right text-slate-600 align-top">
              {r.hint ? r.hint : <span className="text-slate-300">—</span>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
