"use client";
import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  as?: "button";
}

interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  as: "a";
  href: string;
}

type Props = ButtonProps | LinkButtonProps;

const variantClass: Record<ButtonVariant, string> = {
  primary: "vl-btn-primary",
  secondary: "vl-btn-secondary",
  ghost: "vl-btn-ghost",
  danger: "vl-btn-danger",
};

export function Button(props: Props) {
  const { variant = "primary", size = "md", as, className = "", ...rest } = props;
  const cls = `${variantClass[variant]}${size === "sm" ? " vl-btn-sm" : ""} ${className}`.trim();

  if (as === "a") {
    const { children, ...anchorProps } = rest as LinkButtonProps;
    return (
      <a className={cls} {...anchorProps}>
        {children}
      </a>
    );
  }

  const { children, ...buttonProps } = rest as ButtonProps;
  return (
    <button className={cls} {...buttonProps}>
      {children}
    </button>
  );
}
