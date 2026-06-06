"use client";
import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 6 }: SkeletonProps) {
  return (
    <div
      className="vl-skeleton"
      style={{ width, height, borderRadius }}
    />
  );
}
