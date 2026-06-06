"use client";
import React from "react";

type BadgeTone = "success" | "error" | "warning" | "neutral" | "blue";

const toneClass: Record<BadgeTone, string> = {
  success: "vl-badge vl-badge-success",
  blue: "vl-badge vl-badge-accent",
  error: "vl-badge vl-badge-danger",
  warning: "vl-badge vl-badge-warning",
  neutral: "vl-badge vl-badge-neutral",
};

interface BadgeProps {
  tone: BadgeTone;
  children: React.ReactNode;
}

export function Badge({ tone, children }: BadgeProps) {
  return <span className={toneClass[tone]}>{children}</span>;
}
