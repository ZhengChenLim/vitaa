'use client';

import { Leckerli_One } from 'next/font/google';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

// shadcn/ui
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// lucide icons
import { Brain, Bot, ShieldCheck, BookOpenCheck, ExternalLink, Activity, Sparkles } from 'lucide-react';

const leckerli = Leckerli_One({ subsets: ['latin'], weight: '400', display: 'swap' });

export default function AIHowWeUsePage() {
  const t = useTranslations('AI_HOW'); // <— namespace
  const [openSection, setOpenSection] = useState<string | undefined>('how');

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Brand / Title */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight text-green-700 ${leckerli.className}`}>Vitaa <a className='text-blue-500 font-bold '>AI</a></h1>
          <p className="text-sm text-slate-600">{t('subtitle')}</p>
        </div>
        <Badge className="rounded-full bg-green-600 px-3 py-1 text-white">{t('badgeAiGuides')}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* 1. Meet Your AI Assistant */}
        <Card className="border-green-100">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-green-700" aria-hidden />
              <CardTitle>{t('meet.title')}</CardTitle>
            </div>
            <CardDescription>{t('meet.desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{t('meet.p1')}</p>
            <ul className="list-disc pl-5 text-slate-700">
              <li>{t('meet.li1')}</li>
              <li>{t('meet.li2')}</li>
            </ul>
            <Alert className="mt-2">
              <Sparkles className="h-4 w-4" aria-hidden />
              <AlertTitle>{t('meet.tipTitle')}</AlertTitle>
              <AlertDescription>{t('meet.tipBody')}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Vivi - AI Chatbox */}
        <Card className="border-green-100">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-green-700" aria-hidden />
              <CardTitle>{t('vivi.title')}</CardTitle>
            </div>
            <CardDescription>{t('vivi.desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ol className="list-decimal pl-5 text-slate-700">
              <li><span className="font-medium">{t('vivi.step1.h')}</span> {t('vivi.step1.p')}</li>
              <li><span className="font-medium">{t('vivi.step2.h')}</span> {t('vivi.step2.p')}</li>
              <li><span className="font-medium">{t('vivi.step3.h')}</span> {t('vivi.step3.p')}</li>
              <li><span className="font-medium">{t('vivi.step4.h')}</span> {t('vivi.step4.p')}</li>
            </ol>
          </CardContent>
        </Card>

        {/* 2. How It Works */}
        <Card className="md:col-span-2 border-green-100">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-700" aria-hidden />
              <CardTitle>{t('how.title')}</CardTitle>
            </div>
            <CardDescription>{t('how.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Tabs */}
            <Tabs value={openSection} onValueChange={(v) => setOpenSection(v)} className="hidden w-full md:block">
              <TabsList className="flex w-full flex-wrap gap-2">
                <TabsTrigger value="how" className="flex-1 min-w-[8rem] text-xs sm:text-sm">{t('how.tabs.how')}</TabsTrigger>
                <TabsTrigger value="result" className="flex-1 min-w-[8rem] text-xs sm:text-sm">{t('how.tabs.result')}</TabsTrigger>
                <TabsTrigger value="understand" className="flex-1 min-w-[8rem] text-xs sm:text-sm">{t('how.tabs.understand')}</TabsTrigger>
              </TabsList>

              <TabsContent value="how" className="space-y-3 text-sm text-slate-700">
                <p>{t('how.how.p')}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <FeaturePill>{t('how.how.fields.age')}</FeaturePill>
                  <FeaturePill>{t('how.how.fields.weight')}</FeaturePill>
                  <FeaturePill>{t('how.how.fields.height')}</FeaturePill>
                  <FeaturePill>{t('how.how.fields.waist')}</FeaturePill>
                  <FeaturePill>{t('how.how.fields.bp')}</FeaturePill>
                  <FeaturePill>{t('how.how.fields.lifestyle')}</FeaturePill>
                  <FeaturePill>{t('how.how.fields.family')}</FeaturePill>
                </div>
              </TabsContent>

              <TabsContent value="result" className="space-y-3 text-sm text-slate-700">
                <p>{t('how.result.p')}</p>
              </TabsContent>

              <TabsContent value="understand" className="space-y-4">
                <p className="text-sm text-slate-700">{t('how.understand.p')}</p>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('how.table.h1')}</TableHead>
                        <TableHead>{t('how.table.h2')}</TableHead>
                        <TableHead>{t('how.table.h3')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell><RiskBadge level="low" /> {t('how.table.low')}</TableCell>
                        <TableCell>{t('how.table.lowMeaning')}</TableCell>
                        <TableCell>{t('how.table.lowDo')}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><RiskBadge level="high" /> {t('how.table.high')}</TableCell>
                        <TableCell>{t('how.table.highMeaning')}</TableCell>
                        <TableCell>{t('how.table.highDo')}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>

            {/* Mobile: Accordion */}
            <div className="md:hidden">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="m-how">
                  <AccordionTrigger className="text-sm">{t('how.tabs.how')}</AccordionTrigger>
                  <AccordionContent className="space-y-2 text-sm text-slate-700">
                    <p>{t('how.how.p')}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <FeaturePill>{t('how.how.fields.age')}</FeaturePill>
                      <FeaturePill>{t('how.how.fields.weight')}</FeaturePill>
                      <FeaturePill>{t('how.how.fields.height')}</FeaturePill>
                      <FeaturePill>{t('how.how.fields.waist')}</FeaturePill>
                      <FeaturePill>{t('how.how.fields.bp')}</FeaturePill>
                      <FeaturePill>{t('how.how.fields.lifestyle')}</FeaturePill>
                      <FeaturePill>{t('how.how.fields.family')}</FeaturePill>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="m-result">
                  <AccordionTrigger className="text-sm">{t('how.tabs.result')}</AccordionTrigger>
                  <AccordionContent className="text-sm text-slate-700">
                    {t('how.result.p')}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="m-understand">
                  <AccordionTrigger className="text-sm">{t('how.tabs.understand')}</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p className="text-sm text-slate-700">{t('how.understand.p')}</p>
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('how.table.h1')}</TableHead>
                            <TableHead>{t('how.table.h2')}</TableHead>
                            <TableHead>{t('how.table.h3')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell><RiskBadge level="low" /> {t('how.table.low')}</TableCell>
                            <TableCell>{t('how.table.lowMeaning')}</TableCell>
                            <TableCell>{t('how.table.lowDo')}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><RiskBadge level="high" /> {t('how.table.high')}</TableCell>
                            <TableCell>{t('how.table.highMeaning')}</TableCell>
                            <TableCell>{t('how.table.highDo')}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </CardContent>
        </Card>

        {/* 3. Why You Can Trust It */}
        <Card className="border-green-100">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-700" aria-hidden />
              <CardTitle>{t('trust.title')}</CardTitle>
            </div>
            <CardDescription>{t('trust.desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ul className="list-disc pl-5 text-slate-700">
              <li><span className="font-medium">{t('trust.safe.h')}</span> {t('trust.safe.p')}</li>
              <li><span className="font-medium">{t('trust.clear.h')}</span> {t('trust.clear.p')}</li>
              <li><span className="font-medium">{t('trust.ethical.h')}</span> {t('trust.ethical.p')}</li>
            </ul>
          </CardContent>
        </Card>

        {/* Models Used */}
        <Card className="border-green-100">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpenCheck className="h-5 w-5 text-green-700" aria-hidden />
              <CardTitle>{t('models.title')}</CardTitle>
            </div>
            <CardDescription>{t('models.desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full">openai/gpt-oss-120b</Badge>
              <Badge variant="secondary" className="rounded-full">openai/gpt-oss-20b</Badge>
            </div>
            <p>{t('models.learnMore')}</p>
            <p>
              <Link
                href="https://arxiv.org/abs/2508.10925"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-green-700 underline-offset-2 hover:underline"
              >
                {t('models.arxiv')} <ExternalLink className="h-4 w-4" aria-hidden />
              </Link>
            </p>
            <Separator />
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="infra">
                <AccordionTrigger className="text-sm font-medium">{t('models.howPowers')}</AccordionTrigger>
                <AccordionContent className="text-sm text-slate-700">
                  {t('models.howPowersBody')}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

/* ----------------------------- UI helpers ----------------------------- */
function FeaturePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-white px-2.5 py-1 text-[11px] sm:text-xs font-medium text-slate-700 shadow-sm">
      {children}
    </span>
  );
}

function RiskBadge({ level }: { level: 'low' | 'high' }) {
  const base = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold';
  if (level === 'low') return <span className={`${base} bg-green-100 text-green-800`}>●</span>;
  return <span className={`${base} bg-red-100 text-red-800`}>●</span>;
}
