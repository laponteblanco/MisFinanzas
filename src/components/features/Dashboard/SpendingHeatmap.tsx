"use client";

import React, { useMemo, useState } from "react";
import { useTransactions } from "@/store/useTransactions";
import { parseLocalDate, formatCurrency, cn } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import { ChartTimeSelector } from "./ChartTimeSelector";

export const SpendingHeatmap = () => {
    const transactions = useTransactions(state => state.transactions);
    const [selectedMonths, setSelectedMonths] = useState<number[]>([new Date().getMonth()]);
    const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);

    const heatmapData = useMemo(() => {
        // Obtenemos solo los gastos del mes/periodo actual
        const expenses = transactions.filter(t => {
            if (t.type !== 'expense') return false;
            const d = parseLocalDate(t.date);
            const matchMonth = selectedMonths.length === 0 || selectedMonths.includes(d.getMonth());
            const matchYear = selectedYears.length === 0 || selectedYears.includes(d.getFullYear());
            return matchMonth && matchYear;
        });
        
        // Agrupar por día del mes (1 al 31)
        const data = Array.from({ length: 31 }, (_, i) => ({ 
            day: i + 1, 
            amount: 0, 
            count: 0 
        }));

        let maxAmount = 0;

        expenses.forEach(t => {
            const date = parseLocalDate(t.date);
            const dayOfMonth = date.getDate(); // 1 al 31
            const amount = Number(t.amount);
            
            // dayOfMonth - 1 para el index
            data[dayOfMonth - 1].amount += amount;
            data[dayOfMonth - 1].count += 1;
            
            if (data[dayOfMonth - 1].amount > maxAmount) {
                maxAmount = data[dayOfMonth - 1].amount;
            }
        });

        return { data, maxAmount };
    }, [transactions, selectedMonths, selectedYears]);

    const getColorIntensity = (amount: number, max: number) => {
        if (amount === 0) return "bg-slate-800/50 border-slate-700/50";
        const ratio = amount / (max || 1);
        if (ratio < 0.25) return "bg-rose-900/40 border-rose-800/50 text-rose-300";
        if (ratio < 0.5) return "bg-rose-800/60 border-rose-700/50 text-rose-200";
        if (ratio < 0.75) return "bg-rose-600/80 border-rose-500/50 text-white";
        return "bg-rose-500 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)] z-10";
    };

    return (
        <section className="w-full relative space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between gap-4 px-2 flex-wrap">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                        <CalendarDays size={24} className="text-rose-400" />
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-100 tracking-tighter">Calendario de Gastos</h3>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">Identifica en qué días del mes gastas más dinero.</p>
                    </div>
                </div>
                <ChartTimeSelector 
                    selectedMonths={selectedMonths} 
                    selectedYears={selectedYears} 
                    onMonthChange={setSelectedMonths} 
                    onYearChange={setSelectedYears} 
                />
            </div>

            <div className="bg-slate-900/50 border border-white/[0.05] rounded-[2rem] p-6 sm:p-8 backdrop-blur-xl">
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                    {heatmapData.data.map((day, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5">
                            <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">{day.day}</span>
                            
                            <div 
                                className={cn(
                                    "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex flex-col items-center justify-center border transition-all duration-300 hover:scale-125 cursor-default group relative",
                                    getColorIntensity(day.amount, heatmapData.maxAmount)
                                )}
                            >
                                <span className={cn(
                                    "text-[8px] font-black tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity",
                                    day.amount > 0 ? "scale-100" : "hidden"
                                )}>
                                    {day.count}
                                </span>

                                {/* Tooltip */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 sm:px-3 sm:py-2 bg-slate-800 text-slate-200 text-[10px] sm:text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-xl border border-slate-700 whitespace-nowrap z-50">
                                    {formatCurrency(day.amount)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-center gap-3 mt-8">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Menos</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-slate-800/50 border border-slate-700/50" />
                        <div className="w-3 h-3 rounded-sm bg-rose-900/40 border border-rose-800/50" />
                        <div className="w-3 h-3 rounded-sm bg-rose-800/60 border border-rose-700/50" />
                        <div className="w-3 h-3 rounded-sm bg-rose-600/80 border border-rose-500/50" />
                        <div className="w-3 h-3 rounded-sm bg-rose-500 border border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Más</span>
                </div>
            </div>
        </section>
    );
};
