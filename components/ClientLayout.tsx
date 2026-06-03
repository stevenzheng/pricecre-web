"use client";

import { LanguageProvider } from "@/lib/LanguageContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
