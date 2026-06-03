"use client";

import { useEffect, useState } from "react";

let toastId = 0;
const listeners: Set<(msg: string) => void> = new Set();

export function showToast(msg: string) {
  listeners.forEach((fn) => fn(msg));
}

export default function Toast() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (msg: string) => {
      setMessage(msg);
      setVisible(true);
      setTimeout(() => setVisible(false), 2500);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
      <div
        className="px-5 py-3 rounded-xl text-sm font-medium shadow-lg"
        style={{
          background: "var(--bg-surface)",
          color: "var(--text-strong)",
          border: "1px solid var(--line)",
          backdropFilter: "blur(20px)",
        }}
      >
        {message}
      </div>
    </div>
  );
}
