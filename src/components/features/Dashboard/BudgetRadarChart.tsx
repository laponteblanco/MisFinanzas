"use client";

import React, { useMemo, useState, useDeferredValue } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useTransactions } from "@/store/useTransactions";
import { useSettings } from "@/store/useSettings";
import { formatCurrency, parseLocalDate } from "@/lib/utils";
import { Navigation } from "lucide-react";
import { ChartTimeSelector } from "./ChartTimeSelector";

export const BudgetRadarChart = () => {
    const transactions = useTransactions(state => state.transactions);
    const budgets = useTransactions(state => state.budgets);
    const [selectedMonths, setSelectedMonths] = useState<number[]>([new Date().getMonth()]);
    const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);

    const deferredMonths = useDeferredValue(selectedMonths);
    const deferredYears = useDeferredValue(selectedYears);
    const deferredTransactions = useDeferredValue(transactions);

    const radarData = useMemo(() => {
        // Obtenemos gastos
        const expenses = deferredTransactions.filter(t => {
            if (t.type !== 'expense') return false;
            const date = parseLocalDate(t.date);
            const matchMonth = deferredMonths.length === 0 || deferredMonths.includes(date.getMonth());
            const matchYear = deferredYears.length === 0 || deferredYears.includes(date.getFullYear());
            return matchMonth && matchYear;
        });
        
        // Sumamos gasto por categoría
        const spentByCategory: Record<string, number> = {};
        expenses.forEach(t => {
            spentByCategory[t.category] = (spentByCategory[t.category] || 0) + Number(t.amount);
        });

        // Solo vamos a tomar las top 6 categorías (por presupuesto o por gasto) para que el radar no quede ilegible
        const allCategories = Array.from(new Set([...Object.keys(budgets), ...Object.keys(spentByCategory)]));
        
        const data = allCategories.map(cat => ({
            category: cat,
            gasto: spentByCategory[cat] || 0,
            presupuesto: budgets[cat] || 0,
            // FullMark is just the max of both for scaling purposes
            fullMark: Math.max(spentByCategory[cat] || 0, budgets[cat] || 0)
        }));

        // Ordenamos por mayor gasto y tomamos el top 6 para no saturar el radar
        return data.sort((a, b) => b.gasto - a.gasto).slice(0, 6);
    }, [deferredTransactions, budgets, deferredMonths, deferredYears]);

    if (radarData.length < 3) {
        return (
            <div className="py-10 text-center opacity-50">
                <p className="text-xs font-bold text-slate-400">Se necesitan al menos 3 categorías con datos para el Radar de Desviación.</p>
            </div>
        );
    }

    return (
        <section className="w-full relative space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between gap-4 px-2 flex-wrap">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
                        <Navigation size={24} className="text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-100 tracking-tighter">Radar de Desviación</h3>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">Visualiza hacia dónde se deforma tu presupuesto (Top 6 Categorías).</p>
                    </div>
                </div>
                <ChartTimeSelector 
                    selectedMonths={selectedMonths} 
                    selectedYears={selectedYears} 
                    onMonthChange={setSelectedMonths} 
                    onYearChange={setSelectedYears} 
                />
            </div>

            <div className="bg-slate-900/50 border border-white/[0.05] rounded-[2rem] p-4 sm:p-6 backdrop-blur-xl h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis 
                            dataKey="category" 
                            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                        />
                        <PolarRadiusAxis 
                            angle={30} 
                            domain={[0, 'auto']} 
                            tick={false} 
                            axisLine={false} 
                        />
                        <Tooltip 
                            contentStyle={{
                                backgroundColor: '#0f172a', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '12px',
                                padding: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)'
                            }}
                            itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                            labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', fontSize: '10px' }}
                            formatter={(value, name) => [
                                formatCurrency(Number(value)), 
                                name === 'gasto' ? 'Gasto Real' : 'Presupuesto'
                            ]}
                        />
                        <Legend 
                            verticalAlign="top" 
                            iconType="circle"
                            wrapperStyle={{ paddingBottom: '10px', fontSize: '10px', fontWeight: 'bold' }} 
                        />
                        <Radar 
                            name="Presupuesto" 
                            dataKey="presupuesto" 
                            stroke="#3b82f6" 
                            fill="#3b82f6" 
                            fillOpacity={0.2} 
                        />
                        <Radar 
                            name="Gasto Real" 
                            dataKey="gasto" 
                            stroke="#f43f5e" 
                            fill="#f43f5e" 
                            fillOpacity={0.5} 
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
};
