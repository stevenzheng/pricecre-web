"use client";

import { useEffect, useState } from "react";

let modalId = 0;
const listeners: Set<(msg: string, confirm?: boolean) => void> = new Set();

export function showModal(msg: string) {
  listeners.forEach((fn) => fn(msg, false));
}

export function showToast(msg: string) {
  listeners.forEach((fn) => fn(msg, true));
}

export default function Modal() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const [isToast, setIsToast] = useState(false);

  useEffect(() => {
    const handler = (msg: string, toast?: boolean) => {
      setMessage(msg);
      setIsToast(!!toast);
      setVisible(true);
      if (toast) setTimeout(() => setVisible(false), 2500);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center animate-fade-in" onClick={() => !isToast && setVisible(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative max-w-sm w-[90vw] rounded-2xl p-6 shadow-2xl text-center z-10 animate-slide-up"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text)" }}>{message}</p>
        <div className="flex gap-2 justify-center">
          <button
            className="px-5 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
            onClick={() => setVisible(false)}
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}
