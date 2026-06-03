"use client";

import { zh, en } from "@/lib/i18n";

export type Lang = "zh" | "en";
export type T = typeof zh;

export function getLang(cookieLang?: string): Lang {
  if (cookieLang === "en") return "en";
  return "zh";
}

export { zh, en };
