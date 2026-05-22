"use client";

import React from "react";
import { Clock, Star, ArrowRight } from "lucide-react";
import { useLicense } from "@/hooks/useLicense";

export const TrialBanner = () => {
    const { has_active_access, days_left, is_trial, loading } = useLicense();

    if (loading || !is_trial || !has_active_access) return null;

    return (
        <div className="bg-blue-600/10 border-b border-blue-500/20 backdrop-blur-md px-4 py-2 flex items-center justify-center gap-4 text-[var(--theme-text)]">
            <div className="flex items-center gap-2">
                <div className="bg-blue-500 p-1 rounded-md">
                    <Star size={12} fill="white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">
                    Periodo de Prueba Pro: <span className="text-blue-400">{days_left} días restantes</span>
                </span>
            </div>
            <div className="h-4 w-px bg-white/10 hidden md:block"></div>
            <p className="text-[9px] font-bold text-[var(--theme-text-muted)] hidden lg:block uppercase tracking-tight">
                Disfruta de todas las funciones premium. No olvides elegir tu plan antes de que expire.
            </p>
        </div>
    );
};
