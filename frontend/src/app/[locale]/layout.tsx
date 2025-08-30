// app/[locale]/layout.tsx
import type {Metadata} from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {notFound} from 'next/navigation';
import Header from '@/components/Header';
import '../globals.css';
import CookieConsent from '@/components/CookieConsent';
type Locale = 'en' | 'ms' | 'zh';

export const metadata: Metadata = { title: 'Vitaa', description: 'Health planning & analysis' };

export default async function RootLayout({
  children,
  // params
}: {
  children: React.ReactNode;
  // params: Promise<{locale: Locale}>;
}) {
  // const {locale} = await params;

  // let messages: Record<string, string>;
  // try {
  //   messages = (await import(`@//${locale}.json`)).default;
  // } catch {
  //   notFound();
  // }

  return (
    <html>
      <body>
        <NextIntlClientProvider >
          <Header />
          {children}
          <CookieConsent />

        </NextIntlClientProvider>
      </body>
    </html>
  );
}
