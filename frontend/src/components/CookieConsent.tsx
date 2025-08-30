'use client';

import {useEffect, useState, useCallback} from 'react';
import {useTranslations} from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';

const COOKIE_NAME = 'vit_consent'; // 'all' | 'essential'
const COOKIE_DAYS = 10;

function getCookie(name: string) {
  const match = document.cookie.split('; ').find(r => r.startsWith(name + '='));
  return match?.split('=')[1];
}

function setCookie(name: string, value: string, days = COOKIE_DAYS) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Expires=${expires}; Path=/; SameSite=Lax${secure}`;
}

export default function CookieConsent() {
  const t = useTranslations('consent');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show only if the cookie hasn't been set yet
    if (!getCookie(COOKIE_NAME)) setOpen(true);
  }, []);

  const acceptAll = useCallback(() => {
    setCookie(COOKIE_NAME, 'all');
    setOpen(false);
  }, []);

  const rejectAll = useCallback(() => {
    setCookie(COOKIE_NAME, 'essential');
    setOpen(false);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-center">{t('title')}</DialogTitle>
          <DialogDescription className="text-center text-gray-700">
            {t('body')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm text-gray-500">
          <p><span className="font-semibold">• </span>{t('lines.essential')}</p>
          <p><span className="font-semibold">• </span>{t('lines.analytics')}</p>
          <p><span className="font-semibold">• </span>{t('lines.personalization')}</p>
        </div>

        <div className="mt-4 flex items-center justify-center gap-3">
          <Button
            onClick={acceptAll}
            className="min-w-[140px] bg-gradient-to-r from-[#13D298] to-[#2CD30D] text-white font-semibold shadow-md hover:opacity-90"
          >
            {t('accept')}
          </Button>
          <Button
            variant="secondary"
            onClick={rejectAll}
            className="min-w-[140px] font-semibold text-gray-600"
          >
            {t('reject')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
