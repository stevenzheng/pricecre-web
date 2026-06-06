"use client";
import React from "react";

interface CardProps {
  children: React.ReactNode;
  href?: string;
  hover?: boolean;
  padding?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Card({ children, href, hover = true, padding, className = "", style, onClick }: CardProps) {
  const cls = `vl-card${!hover ? " vl-card-static" : ""} ${className}`.trim();
  const mergedStyle: React.CSSProperties = {
    ...(padding ? { padding } : { padding: "20px 24px" }),
    ...(onClick ? { cursor: "pointer" } : {}),
    ...style,
  };

  if (href) {
    return (
      <a href={href} style={{ textDecoration: "none", display: "block" }}>
        <div className={cls} style={mergedStyle}>
          {children}
        </div>
      </a>
    );
  }

  return (
    <div className={cls} style={mergedStyle} onClick={onClick}>
      {children}
    </div>
  );
}
