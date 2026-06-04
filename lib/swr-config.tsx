// lib/swr-config.ts — Global SWR configuration
"use client";

import { SWRConfig } from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const e = new Error("API error");
    (e as any).status = res.status;
    throw e;
  }
  return res.json();
};

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 2000,
        errorRetryCount: 2,
        errorRetryInterval: 3000,
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
