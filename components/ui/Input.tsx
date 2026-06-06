"use client";
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  mono?: boolean;
  error?: string;
}

export function Input({ label, mono, error, className = "", ...props }: InputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label className="vl-label">{label}</label>}
      <input
        className={`vl-input${mono ? " vl-input-mono" : ""} ${error ? "vl-input-error" : ""} ${className}`.trim()}
        {...props}
      />
      {error && <span style={{ fontSize: 12, color: "#EE0000" }}>{error}</span>}
    </div>
  );
}
