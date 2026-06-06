"use client";
import React from "react";

type DotTone = "success" | "error" | "warning" | "muted";

const toneClass: Record<DotTone, string> = {
  success: "vl-dot vl-dot-success",
  error: "vl-dot vl-dot-error",
  warning: "vl-dot vl-dot-warning",
  muted: "vl-dot vl-dot-muted",
};

interface StatusDotProps {
  tone: DotTone;
}

export function StatusDot({ tone }: StatusDotProps) {
  return <span className={toneClass[tone]} />;
}
