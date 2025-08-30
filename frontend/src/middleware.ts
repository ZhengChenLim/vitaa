import createMiddleware from 'next-intl/middleware';
import {routing} from '@/i18n/routing';

export default createMiddleware(routing);

// don’t run on api/_next/static/assets
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};