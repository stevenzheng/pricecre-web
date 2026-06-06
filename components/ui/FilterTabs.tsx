"use client";
import React from "react";

interface Tab {
  key: string;
  label: string;
}

interface FilterTabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
}

export function FilterTabs({ tabs, active, onChange }: FilterTabsProps) {
  return (
    <div className="vl-filter-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`vl-filter-tab${active === tab.key ? " active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
