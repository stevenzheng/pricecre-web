"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { zh, en } from "@/lib/i18n";

type Lang = "zh" | "en";
type T = typeof zh;

interface LangContextType {
  lang: Lang;
  t: T;
  toggleLang: () => void;
}

const LangContext = createContext<LangContextType>({
  lang: "zh",
  t: zh,
  toggleLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("zh");
  const t = lang === "zh" ? zh : en;

  const toggleLang = () => setLang((l) => (l === "zh" ? "en" : "zh"));

  return (
    <LangContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LangContext);
}
