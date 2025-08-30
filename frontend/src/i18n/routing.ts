import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ms", "zh", "vi"],
  defaultLocale: "en",
  localePrefix: "as-needed"
});