// app/components/Footer.tsx
"use client";

import { Link } from "@/i18n/navigation";
import { Leckerli_One } from "next/font/google";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";

const leckerli = Leckerli_One({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default function Footer() {
  const year = new Date().getFullYear();
  const t = useTranslations("FOOTER"); // expect translations under "FOOTER" namespace

  return (
    <footer className="w-full border-t bg-green-50">
      <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col items-center text-center">
        {/* Brand */}
        <div
          className={`text-2xl font-bold tracking-tight text-green-700 ${leckerli.className}`}
        >
          Vitaa
        </div>

        {/* Nav links with separators */}
        <nav className="mt-1">
          <div className="flex items-center text-sm font-semibold text-slate-800">
            <div>
              <Link
                href="/ai"
                className="hover:text-green-700 transition-colors"
              >
                {t("ai")}
              </Link>
            </div>
            <Separator orientation="vertical" className="mx-6" />
            <div>
              <Link
                href="/resources"
                className="hover:text-green-700 transition-colors"
              >
                {t("resources")}
              </Link>
            </div>
            <Separator orientation="vertical" className="mx-6" />
            <div>
              <a
                href="https://sdgs.un.org/goals/goal3"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-green-700 transition-colors"
              >
                {t("sdg3")}
              </a>
            </div>
            <Separator orientation="vertical" className="mx-6" />
            <div>
              <Link
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-slate-400 cursor-not-allowed"
              >
                {t("about")}
              </Link>
            </div>
          </div>
        </nav>

        {/* Copyright */}
        <p className="mt-2 text-xs text-slate-600">© {year} {t("byTeam")}</p>
      </div>
    </footer>
  );
}
