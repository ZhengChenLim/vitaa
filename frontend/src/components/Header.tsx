// app/components/Header.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import LocaleSwitcher from './LocaleSwitcher';
import { Leckerli_One } from "next/font/google";

// shadcn/ui
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const leckerli = Leckerli_One({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default function Header() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [mobileExploreOpen, setMobileExploreOpen] = useState(false);

  const NavLink = ({
    href,
    children
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
    >
      {children}
    </Link>
  );

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-2xl font-extrabold tracking-tight">
          <span className={`text-green-700 ${leckerli.className}`}>Vitaa</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-2 md:flex">
          <NavLink href="/">{t('nav.home')}</NavLink>
          <NavLink href="/planform">{t('nav.plan')}</NavLink>
          <NavLink href="/analysisform">{t('nav.analysis')}</NavLink>

          {/* Explore NCD Dropdown */}
          {/* Explore NCD Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              aria-label={t("nav.exploreAria")}
            >
              {t("nav.explore")}
              <ChevronDown className="ml-1 h-4 w-4" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="min-w-80 p-4 bg-white shadow-lg rounded-xl"
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Column 1: NCD */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-purple-600">
                    {t("nav.section.ncd")}
                  </p>
                  <DropdownMenuGroup className="space-y-1">
                    <DropdownMenuItem asChild>
                      <Link href="/ncd" className="rounded-md px-2 py-1.5 hover:bg-purple-50">
                        {t("nav.section.ncd")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/ncd/diabetes" className="rounded-md px-2 py-1.5 hover:bg-purple-50">
                        {t("nav.ncd.diabetes")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/ncd/hypertension" className="rounded-md px-2 py-1.5 hover:bg-purple-50">
                        {t("nav.ncd.hypertension")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/ncd/stroke" className="rounded-md px-2 py-1.5 hover:bg-purple-50">
                        {t("nav.ncd.stroke")}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </div>

                {/* Column 2: Challenges */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    {t("nav.section.challenges")}
                  </p>
                  <DropdownMenuGroup className="space-y-1">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/challenges"
                        className="rounded-md px-2 py-1.5 hover:bg-emerald-50"
                      >
                        {t("nav.challenges.monthlyQuiz")}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <button
            className="md:hidden inline-flex items-center rounded-lg p-2 hover:bg-gray-100"
            onClick={() => setOpen(v => !v)}
            aria-label={t('nav.toggleMenuAria')}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {open && (
        <div className="border-t bg-white md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-2">
            <Link href="/" className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-gray-100" onClick={() => setOpen(false)}>
              {t('nav.home')}
            </Link>
            <Link href="/planform" className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-gray-100" onClick={() => setOpen(false)}>
              {t('nav.plan')}
            </Link>
            <Link href="/analysisform" className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-gray-100" onClick={() => setOpen(false)}>
              {t('nav.analysis')}
            </Link>

            {/* Mobile Explore NCD (top-down collapsible) */}
            <button
              className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold hover:bg-gray-100"
              onClick={() => setMobileExploreOpen(v => !v)}
              aria-expanded={mobileExploreOpen}
              aria-controls="mobile-explore-ncd"
            >
              <span>{t('nav.explore')}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${mobileExploreOpen ? 'rotate-180' : ''}`} />
            </button>

            {mobileExploreOpen && (
              <div id="mobile-explore-ncd" className="ml-2 flex flex-col gap-1 pb-2">
                <div className="px-3 py-1 text-xs font-medium text-slate-500">{t('nav.section.ncd')}</div>
                <Link href="/ncd" className="rounded-lg px-3 py-2 text-sm hover:bg-gray-100" onClick={() => setOpen(false)}>
                  {t('nav.section.ncd')}
                </Link>
                <Link href="/ncd/diabetes" className="rounded-lg px-3 py-2 text-sm hover:bg-gray-100" onClick={() => setOpen(false)}>
                  {t('nav.ncd.diabetes')}
                </Link>
                <Link href="/ncd/hypertension" className="rounded-lg px-3 py-2 text-sm hover:bg-gray-100" onClick={() => setOpen(false)}>
                  {t('nav.ncd.hypertension')}
                </Link>
                <Link href="/ncd/stroke" className="rounded-lg px-3 py-2 text-sm hover:bg-gray-100" onClick={() => setOpen(false)}>
                  {t('nav.ncd.stroke')}
                </Link>

                <div className="px-3 pt-2 text-xs font-medium text-slate-500">{t('nav.section.challenges')}</div>
                <Link href="/challenges" className="rounded-lg px-3 py-2 text-sm hover:bg-gray-100" onClick={() => setOpen(false)}>
                  {t('nav.challenges.monthlyQuiz')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
