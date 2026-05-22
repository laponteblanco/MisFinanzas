"use client";

import React, { useState } from "react";
import { Check, Sparkles, Zap, Shield, Crown, ArrowRight, Key, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface PricingCardProps {
    title: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    isPopular?: boolean;
    discount?: string;
    priceId: string;
    onSubscribe: (priceId: string) => void;
}

const PricingCard = ({ 
    title, price, period, description, features, isPopular, discount, priceId, onSubscribe 
}: PricingCardProps) => (
    <div className={cn(
        "relative group flex flex-col p-8 rounded-[2.5rem] border transition-all duration-500 backdrop-blur-xl h-full",
        isPopular 
            ? "bg-blue-600/10 border-blue-500/30 shadow-[0_0_40px_-15px_rgba(59,130,246,0.3)] scale-105 z-10" 
            : "bg-white/[0.02] border-[var(--theme-border)] hover:border-white/20"
    )}>
        {isPopular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-[var(--theme-text)] shadow-xl shadow-blue-600/20">
                Mejor Valor
            </div>
        )}
        
        {discount && !isPopular && (
            <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-emerald-500/20">
                Ahorra {discount}
            </div>
        )}

        <div className="mb-8">
            <h4 className="text-[var(--theme-text-muted)] text-[10px] font-black uppercase tracking-[0.3em] mb-4">{title}</h4>
            <div className="flex items-baseline gap-1">
                <span className="text-4xl md:text-5xl font-black text-[var(--theme-text)]">{price}</span>
                <span className="text-slate-500 text-sm font-bold">/{period}</span>
            </div>
            <p className="text-slate-500 text-xs mt-4 font-medium leading-relaxed">{description}</p>
        </div>

        <ul className="space-y-4 mb-10 flex-1">
            {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-xs font-semibold text-slate-300">
                    <div className={cn(
                        "mt-0.5 p-1 rounded-md shrink-0",
                        isPopular ? "bg-blue-500/20 text-blue-400" : "bg-[var(--theme-glass)] text-slate-500"
                    )}>
                        <Check size={12} strokeWidth={3} />
                    </div>
                    {feature}
                </li>
            ))}
        </ul>

        <button 
            onClick={() => onSubscribe(priceId)}
            className={cn(
                "w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                isPopular 
                    ? "bg-blue-600 hover:bg-blue-500 text-[var(--theme-text)] shadow-xl shadow-blue-600/20 hover:scale-[1.02]" 
                    : "bg-[var(--theme-glass)] hover:bg-white/10 text-[var(--theme-text)] border border-[var(--theme-border)]"
            )}
        >
            Comprar Ahora <ArrowRight size={14} />
        </button>
    </div>
);

export const PricingGlass = ({ onSubscribe }: { onSubscribe: (id: string) => void }) => {
    const [activationKey, setActivationKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleActivateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activationKey) return;

        setLoading(true);
        setStatus(null);

        try {
            // Llamada al motor atómico de activación en PostgreSQL
            const { data, error } = await supabase.rpc('activate_license_key', {
                p_key_code: activationKey.trim()
            });

            if (error) throw error;

            if (data?.success) {
                setStatus({ type: 'success', message: data.message });
                // Recargar para aplicar cambios de licencia instantáneamente
                setTimeout(() => window.location.reload(), 2000);
            } else {
                setStatus({ type: 'error', message: data.message });
            }
        } catch (err: any) {
            setStatus({ type: 'error', message: "Error crítico al validar la llave." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-start md:items-center justify-center p-4 bg-black/60 backdrop-blur-2xl overflow-y-auto custom-scrollbar">
            <div className="max-w-6xl w-full py-12 md:py-20 my-auto">
                <div className="text-center mb-16 px-4">
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full text-blue-400 mb-6">
                        <Crown size={16} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">MisFinanzas Pro</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-[var(--theme-text)] tracking-tighter mb-4">Tu periodo de prueba ha finalizado</h2>
                    <p className="text-slate-500 text-sm md:text-base font-medium max-w-xl mx-auto leading-relaxed">
                        Elige un plan Pro o activa tu cuenta mediante una <span className="text-[var(--theme-text)]">Llave de Acceso (BRE-B)</span>.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-4 mb-20">
                    <PricingCard 
                        title="Pro Mensual"
                        price="$8.000"
                        period="mes"
                        description="Ideal para gestión personal inmediata."
                        features={["Auditoría AI en Tiempo Real", "Gestión Multimoneda", "Exportación PDF básica"]}
                        priceId="price_monthly"
                        onSubscribe={onSubscribe}
                    />
                    
                    <PricingCard 
                        title="Pro Semestral"
                        price="$36.000"
                        period="sem"
                        discount="25%"
                        description="Para usuarios con visión de mediano plazo."
                        features={["Todo lo de Pro Mensual", "Sincronización Multi-Workspace", "Soporte Prioritario"]}
                        priceId="price_semiannual"
                        onSubscribe={onSubscribe}
                    />

                    <PricingCard 
                        title="Pro Anual"
                        price="$60.000"
                        period="año"
                        discount="37%"
                        isPopular={true}
                        description="La solución definitiva para gestión patrimonial."
                        features={["Todo lo de Pro Semestral", "Exportaciones Excel Avanzadas", "Acceso Temprano a Features"]}
                        priceId="price_annual"
                        onSubscribe={onSubscribe}
                    />
                </div>

                {/* SECCIÓN ACTIVACIÓN POR LLAVE / BRE-B */}
                <div className="max-w-2xl mx-auto px-4">
                    <div className="bg-[var(--theme-glass)] border border-[var(--theme-border)] rounded-[2.5rem] p-10 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Key size={120} className="text-blue-500" />
                        </div>
                        
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--theme-text-muted)] mb-6 flex items-center gap-2">
                                <Shield size={14} className="text-blue-500" /> Activación por BRE-B (Llaves Rápidas)
                            </h4>
                            
                            <form onSubmit={handleActivateKey} className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                    <input 
                                        type="text" 
                                        value={activationKey}
                                        onChange={(e) => setActivationKey(e.target.value.toUpperCase())}
                                        placeholder="MFP-XXXX-XXXX-XXXX"
                                        className="w-full bg-black/40 border border-[var(--theme-border)] p-4 pl-12 rounded-2xl outline-none focus:border-blue-500/50 text-sm font-black tracking-widest placeholder:text-slate-800 transition-all"
                                    />
                                </div>
                                <button 
                                    type="submit"
                                    disabled={loading || !activationKey}
                                    className="px-8 py-4 bg-[var(--theme-glass)] hover:bg-white/10 border border-[var(--theme-border)] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--theme-text)] transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : "Validar Llave"}
                                </button>
                            </form>

                            {status && (
                                <div className={cn(
                                    "mt-6 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2",
                                    status.type === 'success' ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border border-rose-500/20 text-rose-500"
                                )}>
                                    {status.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                                    <p className="text-[10px] font-black uppercase tracking-widest">{status.message}</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <p className="text-center mt-8 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                        Pagos seguros procesados por Stripe o Canje Directo.
                    </p>
                </div>
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
            `}</style>
        </div>
    );
};
