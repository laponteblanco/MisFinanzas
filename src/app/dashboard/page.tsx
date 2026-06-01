"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/store/useTransactions";
import { useSettings } from "@/store/useSettings";
import { cn, formatCurrency, parseLocalDate } from "@/lib/utils";
import {
    Plus,
    TrendingUp,
    TrendingDown,
    Wallet,
    Users,
    ChevronDown,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    PieChart as PieIcon,
    BarChart3,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { ModuleBook } from "@/components/features/Dashboard/ModuleBook";

export default function DashboardPage() {
    const { profile, user } = useAuth();
    const { transactions, setIsFormOpen, fetchTransactions } = useTransactions();
    const { responsibles: availableResponsibles, categories, fetchSettings } = useSettings();

    // Sincronización inicial de datos maestros para activar gráficos
    useEffect(() => {
        if (user?.id) {
            // ⭐ CARGA MAESTRA PARALELA: Disparar todas las consultas a la vez
            // Esto reduce la latencia total de N consultas a la duración de la consulta más lenta.
            Promise.all([
                fetchSettings(user.id),
                fetchTransactions(user.id)
            ]);
        }
    }, [user?.id, fetchSettings, fetchTransactions]);

    const displayName = profile?.display_name || "Usuario";

    // --- MOTOR DE CÁLCULO PRO: PARTICIPACIÓN ESTRUCTURAL COMPLETA ---
    const stats = useMemo(() => {
        let income = 0;
        let expense = 0;

        transactions.forEach(tx => {
            const effectiveAmount = Number(tx.amount);
            if (tx.type === 'income') income += effectiveAmount;
            else expense += effectiveAmount;
        });

        return {
            balance: income - expense,
            income,
            expense,
            count: transactions.length
        };
    }, [transactions]);

    // --- SPARKLINE: Generar datos de tendencia patrimonial ---
    const sparklinePoints = useMemo(() => {
        if (transactions.length === 0) return "";
        
        const sorted = [...transactions].sort((a, b) => 
            parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime()
        );

        // Agrupar por día
        const grouped: Record<string, number> = {};
        sorted.forEach(t => {
            const d = parseLocalDate(t.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (!grouped[key]) grouped[key] = 0;
            grouped[key] += (t.type === 'income' ? Number(t.amount) : -Number(t.amount));
        });

        // Saldo acumulado
        let balance = 0;
        const values = Object.keys(grouped).sort().map(key => {
            balance += grouped[key];
            return balance;
        });

        // Tomar últimos 12 puntos activos
        const points = values.slice(-12);
        if (points.length < 2) return "";
        
        const width = 320;
        const height = 60;
        const padding = 4;
        const min = Math.min(...points);
        const max = Math.max(...points);
        const range = max - min || 1;
        
        return points.map((val, i) => {
            const x = padding + (i / (points.length - 1)) * (width - padding * 2);
            const y = padding + (1 - (val - min) / range) * (height - padding * 2);
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');
    }, [transactions]);

    return (
        <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* HEADER ESTRATÉGICO ACTUALIZADO */}
            <header className="space-y-6 mb-2">
                <h1 className="text-xl font-black tracking-tighter">
                    MisFinanzas<span className="text-blue-600">Personales</span>
                </h1>
                
                <div className="space-y-1">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                        ¡Hola, {displayName}! <span className="inline-block animate-pulse">👋</span>
                    </h2>
                    <p className="text-[var(--theme-text-muted)] text-base font-medium opacity-90">
                        Aquí está el resumen de tu patrimonio hoy.
                    </p>
                </div>
            </header>

            <div className="flex flex-col gap-8">

                {/* MÓDULO 1: MASTER CARD — Tu Patrimonio Global */}
                <section
                    data-tour="balance-card"
                    className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-6 sm:p-10 shadow-[0_32px_90px_-20px_rgba(0,0,0,0.9)] backdrop-blur-3xl"
                >
                    {/* Ambient glow */}
                    <div className="absolute -top-[40%] -left-[20%] w-[140%] h-[200%] bg-[radial-gradient(ellipse_at_top_left,rgba(56,189,248,0.15),transparent_60%)] pointer-events-none" />
                    <div className="absolute -bottom-[30%] -right-[20%] w-[100%] h-[160%] bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.15),transparent_60%)] pointer-events-none" />
                    
                    {/* Grid overlay for futuristic vibe */}
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none" />

                    {/* Inner glass card */}
                    <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.15] rounded-[2rem] px-5 py-6 sm:px-10 sm:py-8 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_50px_rgba(0,0,0,0.4)] transition-all duration-500 hover:border-white/30 hover:bg-white/[0.05]">
                        
                        {/* Top LED edge */}
                        <div className="absolute inset-x-12 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
                        <div className="absolute inset-x-12 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

                        {/* Title */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                            <p className="text-sm sm:text-base font-black text-cyan-50 tracking-[0.2em] uppercase">
                                Tu Patrimonio Global
                            </p>
                        </div>

                        {/* Giant Balance — Glassy Glow Tone */}
                        <div className="w-full flex justify-center mb-3">
                            <h2 
                                className="text-[clamp(2.5rem,10vw,5.5rem)] font-black leading-none tracking-tighter whitespace-nowrap"
                                style={{
                                    background: 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 50%, #94a3b8 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    filter: 'drop-shadow(0 4px 24px rgba(255,255,255,0.15))',
                                }}
                            >
                                {formatCurrency(stats.balance).replace('$', '$ ')}
                            </h2>
                        </div>

                        {/* Sparkline Trend */}
                        {sparklinePoints && (
                            <div className="w-full flex justify-center my-4 sm:my-8 relative">
                                <svg 
                                    viewBox="0 0 320 60" 
                                    className="w-full max-w-[350px] h-[70px] drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]"
                                    preserveAspectRatio="none"
                                >
                                    <defs>
                                        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                                            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    {/* Fill area under the line */}
                                    <path
                                        d={`${sparklinePoints} L320,60 L0,60 Z`}
                                        fill="url(#sparkGrad)"
                                    />
                                    {/* Line */}
                                    <path
                                        d={sparklinePoints}
                                        fill="none"
                                        stroke="#38bdf8"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                        )}

                        {/* Income / Expense Sub-cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                            {/* Ingresos - Glassy */}
                            <div className="relative overflow-hidden flex items-center gap-4 bg-emerald-500/[0.03] backdrop-blur-xl border border-emerald-500/30 rounded-[1.5rem] px-5 py-4 transition-all duration-300 hover:bg-emerald-500/[0.08] hover:border-emerald-400/50 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)] group">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative shrink-0 w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] transition-transform group-hover:scale-110">
                                    <ArrowUpRight size={24} strokeWidth={2.5} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                </div>
                                <div className="relative flex flex-col items-start min-w-0">
                                    <span className="text-emerald-300 text-sm sm:text-lg font-black tracking-tight leading-tight w-full drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                                        + {formatCurrency(stats.income).replace('$', '$ ')}
                                    </span>
                                    <span className="text-[10px] font-black text-emerald-500/70 uppercase tracking-[0.2em] mt-0.5">
                                        Ingresos Totales
                                    </span>
                                </div>
                            </div>

                            {/* Gastos - Glassy */}
                            <div className="relative overflow-hidden flex items-center gap-4 bg-rose-500/[0.03] backdrop-blur-xl border border-rose-500/30 rounded-[1.5rem] px-5 py-4 transition-all duration-300 hover:bg-rose-500/[0.08] hover:border-rose-400/50 hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.3)] group">
                                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative shrink-0 w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] transition-transform group-hover:scale-110">
                                    <ArrowDownRight size={24} strokeWidth={2.5} className="text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.8)]" />
                                </div>
                                <div className="relative flex flex-col items-start min-w-0">
                                    <span className="text-rose-300 text-sm sm:text-lg font-black tracking-tight leading-tight w-full drop-shadow-[0_0_10px_rgba(251,113,133,0.3)]">
                                        - {formatCurrency(stats.expense).replace('$', '$ ')}
                                    </span>
                                    <span className="text-[10px] font-black text-rose-500/70 uppercase tracking-[0.2em] mt-0.5">
                                        Gastos Totales
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* BITÁCORA FLOTANTE INTELIGENTE (ESTILO LIBRO 3D / JARVIS HUD) */}
                <ModuleBook />

                <div className="h-10" />
            </div>
        </div>
    );
}