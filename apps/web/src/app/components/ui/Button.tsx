"use client";

import { cn } from "@lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ReactNode } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-300 overflow-hidden relative group disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        // Primary gradient button
        primary:
          "bg-gradient-to-r from-[#545BFF] to-[#6B73FF] hover:from-[#4349dd] hover:to-[#545BFF] text-white shadow-[0_0_20px_rgba(84,91,255,0.38)] hover:shadow-[0_0_36px_rgba(84,91,255,0.62)] hover:-translate-y-0.5",
        // Secondary subtle gradient
        secondary:
          "bg-gradient-to-r from-[#545BFF]/15 to-[#6B73FF]/15 hover:from-[#545BFF]/25 hover:to-[#6B73FF]/25 border border-[#545BFF]/30 hover:border-[#545BFF]/50 text-heading hover:-translate-y-0.5",
        // Ghost button - minimal style
        ghost:
          "border border-[#545BFF]/30 bg-transparent hover:bg-[#545BFF]/10 text-heading transition-colors",
        // Outline button
        outline:
          "border border-[#545BFF]/40 bg-[#545BFF]/10 hover:bg-[#545BFF]/20 text-heading transition-all hover:-translate-y-0.5",
        // Danger/warning style
        danger:
          "bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-600 hover:to-red-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_36px_rgba(239,68,68,0.5)] hover:-translate-y-0.5",
        // Success style
        success:
          "bg-gradient-to-r from-emerald-500/80 to-emerald-600/80 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_36px_rgba(16,185,129,0.5)] hover:-translate-y-0.5",
      },
      size: {
        sm: "px-3 py-1.5 text-xs h-8",
        md: "px-5 py-2.5 text-sm h-10",
        lg: "px-7 py-3 text-base h-12",
        xl: "px-8 py-4 text-lg h-14",
      },
      hasShimmer: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      hasShimmer: true,
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
  asLink?: boolean;
  href?: string;
  target?: string;
  rel?: string;
  isLoading?: boolean;
  loadingText?: string;
}

const Button = ({
  className,
  variant,
  size,
  hasShimmer = true,
  children,
  disabled,
  isLoading,
  loadingText,
  asLink,
  href,
  target,
  rel,
  ...props
}: ButtonProps) => {
  const baseClasses = buttonVariants({ variant, size, className });

  // Add shimmer effect for primary and other gradient buttons
  const shimmerClass =
    hasShimmer &&
    (variant === "primary" || variant === "danger" || variant === "success")
      ? "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent group-hover:before:translate-x-full before:transition-transform before:duration-700"
      : "";

  const finalClassName = cn(baseClasses, shimmerClass);

  const content = (
    <>
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isLoading ? loadingText || "Loading..." : children}
      </span>
    </>
  );

  if (asLink && href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={finalClassName}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={finalClassName}
      {...props}
    >
      {content}
    </button>
  );
};

export { Button, buttonVariants };
