"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
}

export const CollapsibleSection = ({
    title,
    icon,
    children,
    defaultOpen = false,
    className
}: CollapsibleSectionProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const pathname = usePathname();

    // Auto-colapsado al navegar
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    return (
        <section className={cn(
            "bg-[var(--theme-glass)] border border-[var(--theme-border)] rounded-[2.5rem] overflow-hidden backdrop-blur-md transition-all duration-500",
            isOpen ? "pb-6" : "pb-0",
            className
        )}>
            {/* Cabecera Interactiva */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 sm:p-8 hover:bg-white/[0.02] active:bg-white/[0.05] transition-colors outline-none group cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    {icon && (
                        <div className={cn(
                            "text-blue-500 transition-all duration-500 opacity-60 group-hover:opacity-100",
                            isOpen ? "rotate-0 scale-110" : "-rotate-12 scale-100"
                        )}>
                            {icon}
                        </div>
                    )}
                    <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-[var(--theme-text-muted)] group-hover:text-white transition-colors">
                        {title}
                    </h3>
                </div>
                
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border border-[var(--theme-border)] bg-[var(--theme-glass)] text-slate-500 transition-all duration-500",
                    isOpen ? "rotate-180 bg-blue-600/20 border-blue-500/30 text-blue-400" : "rotate-0"
                )}>
                    <ChevronDown size={16} />
                </div>
            </div>

            {/* Contenido Animado con Tailwind CSS Grid Transition */}
            <div className={cn(
                "grid transition-all duration-500 ease-[0.04,0.62,0.23,0.98]",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}>
                <div className="overflow-hidden">
                    <div className="px-6 sm:px-8 border-t border-[var(--theme-border)] pt-6">
                        {children}
                    </div>
                </div>
            </div>
        </section>
    );
};
