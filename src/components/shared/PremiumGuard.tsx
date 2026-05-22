"use client";

import React from "react";
import { useAuth, UserProfile } from "@/hooks/useAuth"; // Importamos la interfaz explícitamente
import { Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export const usePlan = () => {
    const { profile } = useAuth();
    
    // Forzamos el tipo para que Netlify no tenga dudas
    const userProfile = profile as UserProfile | null;
    
    const hasActivePlan = !!userProfile?.plan_id;
    const isTrialActive = !!(userProfile?.trial_end_at && new Date(userProfile.trial_end_at) > new Date());
    
    return {
        isPro: hasActivePlan || isTrialActive,
        plan: hasActivePlan ? "Pro" : "Free",
        isTrialing: isTrialActive
    };
};

export const PremiumGuard: React.FC<{ 
    children: React.ReactNode; 
    fallback?: React.ReactNode; 
    message?: string;
    className?: string;
}> = ({ children, fallback, message, className }) => {
    const { isPro } = usePlan();

    if (isPro) return <>{children}</>;
    if (fallback) return <>{fallback}</>;

    return (
        <div className={cn("relative glass-card p-6 flex flex-col items-center justify-center text-center gap-4 min-h-[200px] rounded-[2.5rem] bg-white/[0.02] border border-[var(--theme-border)] overflow-hidden", className)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px] z-10" />
            <div className="relative z-20 flex flex-col items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-full text-blue-400 border border-blue-500/20 animate-pulse">
                    <Lock size={24} />
                </div>
                <h5 className="font-black text-white uppercase text-[10px] tracking-[0.2em]">Funcionalidad Pro</h5>
                <p className="text-[11px] text-slate-500 max-w-[220px] mt-2 font-medium">
                    {message || "Actualiza a Pro para acceder a este reporte."}
                </p>
                <button className="mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">
                    <Sparkles size={14} /> Upgrade a Pro
                </button>
            </div>
            <div className="opacity-5 grayscale blur-md pointer-events-none absolute inset-0 p-6">
                {children}
            </div>
        </div>
    );
};