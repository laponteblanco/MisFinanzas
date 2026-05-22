"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useTransactions } from "@/store/useTransactions";
import { formatCurrency, cn } from "@/lib/utils";
import { Sparkles, AlertTriangle, TrendingUp, Info, Wallet, Home, Car, Zap, CreditCard, Film, Activity, Package, Tag, Utensils } from "lucide-react";
import Link from "next/link";

// Mapeo Semántico de Categorías (Iconos y Gradientes Premium)
const CATEGORY_META: Record<string, { icon: any, color: string, glow: string }> = {
    'ALIMENTACIÓN': { icon: Utensils, color: 'bg-orange-500', glow: 'shadow-orange-500/20' },
    'VIVIENDA': { icon: Home, color: 'bg-blue-600', glow: 'shadow-blue-600/20' },
    'TRANSPORTE': { icon: Car, color: 'bg-emerald-500', glow: 'shadow-emerald-500/20' },
    'SERVICIOS': { icon: Zap, color: 'bg-yellow-400', glow: 'shadow-yellow-400/20' },
    'SUSCRIPCIONES': { icon: CreditCard, color: 'bg-purple-500', glow: 'shadow-purple-500/20' },
    'ENTRETENIMIENTO': { icon: Film, color: 'bg-pink-500', glow: 'shadow-pink-500/20' },
    'SALUD': { icon: Activity, color: 'bg-rose-500', glow: 'shadow-rose-500/20' },
    'VARIOS': { icon: Package, color: 'bg-slate-500', glow: 'shadow-slate-500/20' },
    'OTROS': { icon: Tag, color: 'bg-slate-400', glow: 'shadow-slate-400/20' },
};
const DEFAULT_META = { icon: Tag, color: 'bg-blue-500', glow: 'shadow-blue-500/20' };

export const ExpenseChart = () => {
    const { transactions } = useTransactions();
    const [isMounted, setIsMounted] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const { chartData, totalExpenses } = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const total = expenses.reduce((sum, curr) => sum + Number(curr.amount), 0);
        
        const categoryTotals = expenses.reduce((acc: { [key: string]: number }, curr) => {
            const cat = curr.category || "General";
            acc[cat] = (acc[cat] || 0) + Number(curr.amount);
            return acc;
        }, {});
        
        const sortedData = Object.keys(categoryTotals).map(name => {
            const val = categoryTotals[name];
            return {
                name: name.toUpperCase(), 
                value: val,
                percentage: total > 0 ? (val / total * 100) : 0
            };
        }).sort((a, b) => b.value - a.value);

        // Cálculo Pareto (Cumulativo)
        let cumulative = 0;
        const dataWithPareto = sortedData.map(item => {
            cumulative += item.percentage;
            return {
                ...item,
                cumulativePercentage: cumulative
            };
        });
        
        return { chartData: dataWithPareto, totalExpenses: total };
    }, [transactions]);

    if (!isMounted) return <div className="h-[320px] w-full bg-[var(--theme-glass)] animate-pulse rounded-3xl" />;

    // Financial Analysis Engine (Pareto Logic 80/20)
    let insight = null;
    if (chartData.length > 0) {
        const paretoThresholdIdx = chartData.findIndex(item => item.cumulativePercentage >= 80);
        const vitalFewCount = (paretoThresholdIdx === -1 ? chartData.length : paretoThresholdIdx + 1);
        const vitalCategories = chartData.slice(0, vitalFewCount).map(item => item.name).join(' y ');

        if (vitalFewCount <= 2 && chartData.length > 3) {
            insight = {
                text: `Alerta Pareto: Solo ${vitalFewCount} categorías (${vitalCategories}) representan el 80% de tus salidas. Enfoca tu ahorro ahí.`,
                icon: AlertTriangle,
                color: "text-amber-500",
                bg: "bg-amber-500/10",
                border: "border-amber-500/20"
            };
        } else {
            insight = {
                text: `Distribución balanceada: Revisa tu gasto en ${chartData[0].name} (${chartData[0].percentage.toFixed(1)}%) para optimizar presupuesto.`,
                icon: Sparkles,
                color: "text-blue-400",
                bg: "bg-blue-500/10",
                border: "border-blue-500/20"
            };
        }
    }

    return (
        <div className="w-full h-full xl:max-h-[450px] overflow-y-auto overflow-x-hidden custom-scrollbar flex justify-center pb-10 pr-2">
            <div className="w-full max-w-2xl flex flex-col space-y-10">
                
                {/* FINANCIAL ANALYSIS BOX (Analítica Pareto) */}
                {insight && (
                    <div className={cn("p-5 rounded-[2rem] flex items-center gap-5 border backdrop-blur-xl transition-all duration-700 animate-in slide-in-from-top-4", insight.bg, insight.border)}>
                        <div className={cn("p-3 rounded-2xl bg-[var(--theme-glass)] shadow-2xl shrink-0", insight.color)}>
                            <insight.icon size={22} strokeWidth={2.5} />
                        </div>
                        <p className="text-[11px] font-bold text-[var(--theme-text-muted)] leading-relaxed tracking-tight">
                            {insight.text}
                        </p>
                    </div>
                )}

                {/* EXPENSE BARS LIST */}
                {chartData.length === 0 ? (
                    <div className="text-center py-20 bg-white/[0.02] rounded-[3rem] border border-dashed border-[var(--theme-border)]">
                        <Package size={40} className="mx-auto text-[var(--theme-text-muted)] mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--theme-text-muted)]">Sin registros actuales</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {chartData.map((item, index) => {
                            const meta = CATEGORY_META[item.name] || DEFAULT_META;
                            const isParetoVital = item.cumulativePercentage <= 80 || index === 0;
                            const isTop = index === 0;
                            
                            // Estado de selección
                            const isSelected = selectedCategory === item.name;

                            // Transacciones de esta categoría para el acordeón
                            const categoryTxs = transactions.filter(t => 
                                t.type === 'expense' && 
                                ((t.category || "General").toUpperCase() === item.name)
                            );

                            return (
                                <div 
                                    key={item.name} 
                                    onClick={() => setSelectedCategory(isSelected ? null : item.name)}
                                    // 1. Componente Táctil y Estilos Condicionales:
                                    className={cn(
                                        "relative group transition-all duration-300 cursor-pointer rounded-[2rem] p-5 border",
                                        isSelected 
                                            ? "bg-white/[0.08] border-[var(--theme-border)] shadow-lg scale-[1.02]" 
                                            : "bg-transparent border-transparent hover:bg-white/[0.03] active:scale-[0.98]",
                                        !isParetoVital && !isSelected && "opacity-50 grayscale-[0.5] hover:opacity-100 hover:grayscale-0"
                                    )}
                                >
                                    
                                    {/* Cabecera Pareto Premium */}
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-4">
                                            {/* Icono de Cristal */}
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-110",
                                                "bg-white/[0.03] border border-[var(--theme-border)]",
                                                isSelected || isTop ? "border-blue-500/50 shadow-blue-500/20" : ""
                                            )}>
                                                <meta.icon size={20} className={isSelected || isTop ? "text-blue-400" : "text-[var(--theme-text)]"} strokeWidth={2.5} />
                                            </div>
                                            
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--theme-text)] brightness-125">
                                                    {item.name}
                                                </span>
                                                <span className="text-[9px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest mt-0.5">
                                                    Impacto: {item.percentage.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end">
                                            <span className={cn(
                                                "text-lg font-black tracking-tighter transition-all",
                                                isSelected || isTop ? "text-[var(--theme-text)] text-xl" : "text-[var(--theme-text-muted)]"
                                            )}>
                                                {formatCurrency(item.value)}
                                            </span>
                                            {isParetoVital && (
                                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10 mt-1">
                                                    Vital (Top 80%)
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Barra de Progreso LED Pareto */}
                                    <div className="relative h-2 w-full bg-white/[0.02] rounded-full overflow-visible border border-white/[0.05]">
                                        {/* Cumulative Marker (Pareto Logic) */}
                                        <div 
                                            className="absolute top-1/2 -translate-y-1/2 h-4 w-1 bg-[var(--theme-glass)] rounded-full z-10"
                                            style={{ left: `${item.percentage}%` }}
                                            title={`Acumulado: ${item.cumulativePercentage.toFixed(1)}%`}
                                        />

                                        {/* Barra de Progreso */}
                                        <div 
                                            className={cn(
                                                "absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(255,255,255,0.1)]",
                                                meta.color,
                                                isSelected || isTop ? "shadow-[0_0_30px_rgba(59,130,246,0.3)] brightness-125" : ""
                                            )}
                                            style={{ width: `${item.percentage}%` }}
                                        />

                                        {/* Glow Layer (Solo Vitales o Seleccionados) */}
                                        {(isParetoVital || isSelected) && (
                                            <div 
                                                className={cn(
                                                    "absolute top-0 left-0 h-full rounded-full blur-md flex opacity-30 transition-all duration-1000",
                                                    meta.color,
                                                    isSelected && "opacity-60 blur-lg"
                                                )}
                                                style={{ width: `${item.percentage}%` }}
                                            />
                                        )}
                                    </div>

                                    {/* 2. Acción al hacer clic: Mostrar Detalle (Acordeón) */}
                                    <div className={cn(
                                        "overflow-hidden transition-all duration-500",
                                        isSelected ? "max-h-[400px] mt-6 opacity-100 border-t border-[var(--theme-border)] pt-5" : "max-h-0 opacity-0 mt-0 pt-0 border-transparent"
                                    )}>
                                        <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--theme-text-muted)] mb-4 flex items-center justify-between">
                                            Últimos movimientos
                                            <span className="text-[var(--theme-text)]/30">{categoryTxs.length} regs</span>
                                        </h4>
                                        <div className="space-y-3">
                                            {categoryTxs.length === 0 ? (
                                                <p className="text-xs text-[var(--theme-text-muted)] italic p-3 text-center">No hay transacciones registradas.</p>
                                            ) : (
                                                categoryTxs.slice(0, 3).map(tx => (
                                                    <div key={tx.id} className="flex justify-between items-center bg-white/[0.02] hover:bg-white/[0.05] transition-colors p-3 rounded-2xl border border-[var(--theme-border)]">
                                                        <span className="text-xs font-bold text-[var(--theme-text-muted)] truncate flex-1 leading-tight">{tx.description}</span>
                                                        <span className="text-xs font-black text-[var(--theme-text)] shrink-0 ml-4">{formatCurrency(tx.amount)}</span>
                                                    </div>
                                                ))
                                            )}
                                            {categoryTxs.length > 3 && (
                                                <Link 
                                                    href={`/dashboard/transactions?category=${item.name.toLowerCase()}`}
                                                    className="w-full text-center text-[10px] uppercase font-black tracking-widest text-blue-500 hover:text-[var(--theme-text)] bg-blue-500/10 hover:bg-blue-600 transition-colors mt-2 py-3 rounded-xl border border-blue-500/20 block"
                                                >
                                                    Ver los {categoryTxs.length} movimientos
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                    
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};