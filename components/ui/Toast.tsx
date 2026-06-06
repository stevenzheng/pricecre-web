"use client";
import React, { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  duration?: number;
  onDismiss: () => void;
}

export function Toast({ message, duration = 3000, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 200);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  if (!visible) return null;

  return (
    <div className="vl-toast" onClick={onDismiss} style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200, maxWidth: 400 }}>
      {message}
    </div>
  );
}
