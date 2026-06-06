"use client";
import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="vl-empty">
      {icon && <div className="vl-empty-icon">{icon}</div>}
      <p className="vl-empty-title">{title}</p>
      {description && <p className="vl-empty-desc">{description}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
