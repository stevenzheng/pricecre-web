"use client";
import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="vl-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <h1 className="vl-page-title">{title}</h1>
        {description && <p className="vl-page-desc">{description}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
}
