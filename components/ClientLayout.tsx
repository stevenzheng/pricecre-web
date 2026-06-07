"use client";

import { LanguageProvider } from "@/lib/LanguageContext";
import { Providers } from "@/components/Providers";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <LanguageProvider>{children}</LanguageProvider>
    </Providers>
  );
}
