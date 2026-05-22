"use client";

import React from "react";
import { cn, formatCurrency } from "@/lib/utils";

interface KPIWidgetProps {
  label: string;
  value: number;
  type?: "income" | "expense" | "neutral";
  isPercentage?: boolean;
  className?: string;
}

/**
 * KPI Widget - Financial Indicator
 * Premium UI with Glassmorphism
 */
export const KPIWidget: React.FC<KPIWidgetProps> = ({ 
  label, 
  value, 
  type = "neutral", 
  isPercentage = false,
  className 
}) => {
  const isNegative = type === "expense" || (type === "neutral" && value < 0);
  const isPositive = type === "income";

  return (
    <div className={cn(
      "glass-card p-5 flex flex-col gap-1 transition-all hover:translate-y-[-2px]",
      className
    )}>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className={cn(
        "text-2xl font-bold tracking-tight",
        isPositive && "text-emerald-400",
        isNegative && "text-rose-400",
        type === "neutral" && !isNegative && "text-[var(--theme-text)]"
      )}>
        {isPercentage ? `${value.toFixed(1)}%` : formatCurrency(value)}
      </span>
    </div>
  );
};
