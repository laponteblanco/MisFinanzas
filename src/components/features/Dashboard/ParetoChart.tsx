"use client";

import React, { useMemo, useState } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useTransactions } from "@/store/useTransactions";
import { formatCurrency, parseLocalDate } from "@/lib/utils";
import { Target } from "lucide-react";
import { ChartTimeSelector } from "./ChartTimeSelector";

export const ParetoChart = () => {
    const transactions = useTransactions(state => state.transactions);
    const [selectedMonths, setSelectedMonths] = useState<number[]>([new Date().getMonth()]);
    const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);

    const paretoData = useMemo(() => {
        const expenses = transactions.filter(t => {
            if (t.type !== 'expense') return false;
            const date = parseLocalDate(t.date);
            const matchMonth = selectedMonths.length === 0 || selectedMonths.includes(date.getMonth());
            const matchYear = selectedYears.length === 0 || selectedYears.includes(date.getFullYear());
            return matchMonth && matchYear;
        });
        
        // Sum by category
        const sums: Record<string, number> = {};
        let totalExpense = 0;
        
        expenses.forEach(t => {
            const amount = Number(t.amount);
            sums[t.category] = (sums[t.category] || 0) + amount;
            totalExpense += amount;
        });

        // Sort descending
        const sorted = Object.entries(sums)
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => ({ category, amount }));

        // Calculate cumulative percentage
        let cumulative = 0;
        const data = sorted.map(item => {
            cumulative += item.amount;
            const cumulativePercentage = totalExpense > 0 ? (cumulative / totalExpense) * 100 : 0;
            return {
                ...item,
                cumulativePercentage: Number(cumulativePercentage.toFixed(2))
            };
        });

        return data;
    }, [transactions, selectedMonths, selectedYears]);

    // Removed early return so time selector stays visible
    return (
        <section className="w-full relative space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between gap-4 px-2 flex-wrap">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                        <Target size={24} className="text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-100 tracking-tighter">Análisis de Pareto (80/20)</h3>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">Descubre qué pocas categorías consumen el 80% de tu dinero.</p>
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
                {paretoData.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center opacity-60">
                        <Target size={40} className="text-slate-500 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sin datos para este periodo</p>
                    </div>
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={paretoData} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="category" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 600 }}
                                    dy={15}
                                    angle={-45}
                                    textAnchor="end"
                                    height={70}
                                />
                                <YAxis 
                                    yAxisId="left" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tickFormatter={(v) => `$${v/1000}k`}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                />
                                <YAxis 
                                    yAxisId="right" 
                                    orientation="right" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tickFormatter={(v) => `${v}%`}
                                    tick={{ fill: '#fbbf24', fontSize: 10, fontWeight: 'bold' }}
                                    domain={[0, 100]}
                                />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    contentStyle={{
                                        backgroundColor: '#0f172a', 
                                        border: '1px solid rgba(255,255,255,0.1)', 
                                        borderRadius: '12px',
                                        padding: '12px',
                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)'
                                    }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                    formatter={(value, name) => {
                                        if (name === 'cumulativePercentage') return [`${value}%`, 'Acumulado'];
                                        return [formatCurrency(Number(value)), 'Gasto'];
                                    }}
                                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', fontSize: '11px' }}
                                />
                                <Bar yAxisId="left" dataKey="amount" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                    {paretoData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.cumulativePercentage <= 80 ? '#f43f5e' : '#334155'} />
                                    ))}
                                </Bar>
                                <Line 
                                    yAxisId="right" 
                                    type="monotone" 
                                    dataKey="cumulativePercentage" 
                                    stroke="#fbbf24" 
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#0f172a', strokeWidth: 2 }}
                                    activeDot={{ r: 6 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                        
                        <div className="absolute top-4 right-6 flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">El 80% Vital</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">El 20% Trivial</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};
