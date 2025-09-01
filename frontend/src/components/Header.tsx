// app/components/Header.tsx
'use client';

import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {useState} from 'react';
import LocaleSwitcher from './LocaleSwitcher';
import { Leckerli_One } from "next/font/google";
const leckerli = Leckerli_One({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
export default function Header() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

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


        <nav className="hidden items-center gap-4 md:flex">
          <NavLink href="/">{t('nav.home')}</NavLink>
          <NavLink href="/planform">{t('nav.plan')}</NavLink>
          <NavLink href="/analysisform">{t('nav.analysis')}</NavLink>
          {/* <NavLink href="/contact">{t('nav.contact')}</NavLink> */}
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <button
            className="md:hidden inline-flex items-center rounded-lg p-2 hover:bg-gray-100"
            onClick={() => setOpen(v => !v)}
            aria-label="Toggle Menu"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </div>

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
            {/* <Link href="/contact" className="rounded-lg px-3 py-2 text-sm font-semibold hover:bg-gray-100" onClick={() => setOpen(false)}>
              {t('nav.contact')}
            </Link> */}
          </div>
        </div>
      )}
    </header>
  );
}
