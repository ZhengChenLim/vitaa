// app/components/Footer.tsx
"use client";

import { Link } from "@/i18n/navigation";
import { Leckerli_One } from "next/font/google";
import { Separator } from "@/components/ui/separator"

const leckerli = Leckerli_One({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-green-50">
      <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col items-center text-center">
        {/* Brand */}
        <div
          className={`text-2xl font-bold tracking-tight text-green-700 ${leckerli.className}`}
        >
          Vitaa
        </div>

        {/* Nav links with spaced | separators */}
        <nav className="mt-1">
          <div className="flex items-center text-sm font-semibold text-slate-800 ">
            <div>
            <Link href="/ai" className="hover:text-green-700 transition-colors">
              AI
            </Link>
            </div>
            <Separator orientation="vertical" className="mx-6" />
            <div>
            <Link href="/resources" className="hover:text-green-700 transition-colors">
              Resources
            </Link>
            </div>
            <Separator orientation="vertical" className="mx-6" />
            <div>
            <Link href="/about" className="hover:text-green-700 transition-colors">
              About Us
            </Link>
            </div>
            <Separator orientation="vertical" className="mx-6" />
            <div>
            <Link href="/contact" className="hover:text-green-700 transition-colors">
              Contact
            </Link>
            </div>
          </div>
        </nav>

        {/* Copyright */}
        <p className="mt-2 text-xs text-slate-600">
          © {year} by Six Minus One
        </p>
      </div>
    </footer>
  );
}
