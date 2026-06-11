"use client";

import React, { useMemo, useState, useEffect, useDeferredValue } from 'react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    Cell,
    ReferenceLine
} from 'recharts';
import { useTransactions } from '@/store/useTransactions';
import { useSettings, Category } from '@/store/useSettings';
import { formatCurrency, parseLocalDate } from '@/lib/utils';
import { Target, TrendingDown, AlertTriangle } from 'lucide-react';
import { ChartTimeSelector } from './ChartTimeSelector';

export const BudgetBarChart = () => {
    const transactions = useTransactions(state => state.transactions);
    const budgets = useTransactions(state => state.budgets);
    const categories = useSettings(state => state.categories);
    
    const [isMounted, setIsMounted] = useState(false);
    const [selectedMonths, setSelectedMonths] = useState<number[]>([new Date().getMonth()]);
    const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);
    const [txType, setTxType] = useState<'expense' | 'income'>('expense');

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const deferredMonths = useDeferredValue(selectedMonths);
    const deferredYears = useDeferredValue(selectedYears);
    const deferredTransactions = useDeferredValue(transactions);

    const { globalBudget, globalSpent, executionPercentage, chartData } = useMemo(() => {
        // Calculate real amount by category matching the selected month/year
        const amountByCat = deferredTransactions
            .filter(t => {
                if (t.type !== txType) return false;
                try {
                    const txDate = parseLocalDate(t.date);
                    const matchMonth = deferredMonths.length === 0 || deferredMonths.includes(txDate.getMonth());
                    const matchYear = deferredYears.length === 0 || deferredYears.includes(txDate.getFullYear());
                    return matchMonth && matchYear;
                } catch(e) {
                    return false;
                }
            })
            .reduce((acc: Record<string, number>, t) => {
                acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
                return acc;
            }, {});

        // Build total budget and total spent
        let totalBudget = 0;
        let totalSpent = 0;
        
        const details = categories
            .filter((cat: Category) => (cat.type || 'expense') === txType)
            .map((cat: Category) => {
            const catBudget = Number(cat.budget) || 0;
            const catSpent = amountByCat[cat.name] || 0;
            totalBudget += catBudget;
            totalSpent += catSpent;
            
            const execPercent = catBudget > 0 ? (catSpent / catBudget) * 100 : (catSpent > 0 ? 100 : 0);
            
            return {
                displayName: `${cat.emoji || '📦'} ${cat.name}`.toUpperCase(),
                name: cat.name,
                Real: catSpent,
                Presupuesto: catBudget,
                Execution: execPercent,
            };
        }).filter(item => item.Presupuesto > 0 || item.Real > 0)
          .sort((a, b) => b.Real - a.Real); // sort by highest spent

        const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : (totalSpent > 0 ? 100 : 0);

        return {
            globalBudget: totalBudget,
            globalSpent: totalSpent,
            executionPercentage: percentage,
            chartData: details
        };
    }, [deferredTransactions, budgets, categories, deferredMonths, deferredYears, txType]);

    if (!isMounted) return <div className="h-[400px] w-full bg-[var(--theme-glass)] animate-pulse rounded-3xl" />;
    
    const isOverBudget = globalSpent > globalBudget;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const realPayload = payload.find((p: any) => p.dataKey === 'Real');
            const budgetPayload = payload.find((p: any) => p.dataKey === 'Presupuesto');
            
            const realValue = realPayload ? realPayload.value : 0;
            const budgetValue = budgetPayload ? budgetPayload.value : 0;
            
            const isOver = realValue > budgetValue;
            return (
                <div className="bg-[#050505]/90 border border-[var(--theme-border)] p-4 rounded-2xl shadow-2xl min-w-[180px]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] mb-3">{label}</p>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold text-[var(--theme-text)]">
                            <span className="opacity-70">Presupuesto:</span>
                            <span className="text-blue-400">{formatCurrency(budgetValue)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold text-[var(--theme-text)]">
                            <span className="opacity-70">Gasto Real:</span>
                            <span className={isOver ? "text-rose-500" : "text-[var(--theme-text)]"}>{formatCurrency(realValue)}</span>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[var(--theme-border)] flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)]">Ejecución:</span>
                        <span className={`text-xs font-black ${isOver ? "text-rose-500 animate-pulse" : "text-emerald-500"}`}>
                            {payload[0].payload.Execution.toFixed(1)}%
                        </span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full flex flex-col space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
                <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl backdrop-blur-md">
                    <button 
                        onClick={() => setTxType('expense')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${txType === 'expense' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Egresos
                    </button>
                    <button 
                        onClick={() => setTxType('income')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${txType === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Ingresos
                    </button>
                </div>
                <ChartTimeSelector 
                    selectedMonths={selectedMonths} 
                    selectedYears={selectedYears} 
                    onMonthChange={setSelectedMonths} 
                    onYearChange={setSelectedYears} 
                />
            </div>

            {/* SUMMARY WIDGET */}
            <div className={`p-6 rounded-[2rem] border relative overflow-hidden transition-all duration-500 ${txType === 'expense' ? (isOverBudget ? 'bg-rose-500/5 border-rose-500/20' : 'bg-blue-500/5 border-blue-500/20') : (isOverBudget ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-orange-500/5 border-orange-500/20')}`}>
                {(txType === 'expense' ? isOverBudget : !isOverBudget) && (
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <AlertTriangle size={80} className={txType === 'expense' ? 'text-rose-500' : 'text-orange-500'} />
                    </div>
                )}
                
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-text-muted)] mb-4 flex items-center gap-2">
                    <Target size={14} className={txType === 'expense' ? (isOverBudget ? 'text-rose-400' : 'text-blue-400') : (isOverBudget ? 'text-emerald-400' : 'text-orange-400')} />
                    Balance Global
                </h4>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-end">
                    <div className="space-y-1 z-10">
                        <p className="text-xs font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">{txType === 'expense' ? 'Lo que Gastaste' : 'Lo que Ingresaste'}</p>
                        <p className={`text-3xl sm:text-4xl font-black tracking-tighter ${txType === 'expense' ? (isOverBudget ? 'text-rose-500' : 'text-[var(--theme-text)]') : (isOverBudget ? 'text-emerald-500' : 'text-[var(--theme-text)]')}`}>
                            {formatCurrency(globalSpent)}
                        </p>
                    </div>
                    
                    <div className="space-y-1 text-left sm:text-right z-10">
                        <p className="text-xs font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">{txType === 'expense' ? 'Lo que Presupuestaste' : 'Tu Meta de Ingresos'}</p>
                        <p className={`text-xl sm:text-2xl font-black tracking-tighter ${txType === 'expense' ? 'text-blue-400' : 'text-emerald-400'}`}>
                            {formatCurrency(globalBudget)}
                        </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-text-muted)]">
                            Ejecución del Presupuesto
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${txType === 'expense' ? (isOverBudget ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20') : (isOverBudget ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20')}`}>
                            {executionPercentage.toFixed(1)}%
                        </span>
                    </div>
                    <div className="h-3 w-full bg-white/[0.05] rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ${txType === 'expense' ? (isOverBudget ? 'bg-rose-500' : 'bg-blue-500') : (isOverBudget ? 'bg-emerald-500' : 'bg-orange-500')}`}
                            style={{ width: `${Math.min(executionPercentage, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* BREAKDOWN CHART */}
            {chartData.length > 0 && (
                <div className="w-full h-[350px] relative min-w-0 mt-8">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-text-muted)] mb-4 pl-2">
                        Desglose por Categoría
                    </h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={chartData}
                            margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                            barGap={-16} // To overlap the bars for a progress effect
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis type="number" hide domain={[0, 'dataMax']} />
                            <YAxis 
                                dataKey="displayName" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false} 
                                width={120}
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 900 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                            
                            {/* Barra de Fondo (Presupuesto) */}
                            <Bar 
                                dataKey="Presupuesto" 
                                fill="transparent"
                                stroke="rgba(255,255,255,0.2)"
                                strokeDasharray="2 2" 
                                radius={[0, 8, 8, 0]} 
                                barSize={24}
                            />
                            
                            {/* Barra Frontal (Real) */}
                            <Bar 
                                dataKey="Real" 
                                radius={[0, 6, 6, 0]} 
                                barSize={16}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={txType === 'expense' ? (entry.Real > entry.Presupuesto ? '#f43f5e' : '#3b82f6') : (entry.Real >= entry.Presupuesto ? '#10b981' : '#f59e0b')} 
                                        fillOpacity={1}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {chartData.length > 0 && (
                <div className="flex justify-center gap-6 pb-2">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-1.5 rounded-full shadow-lg ${txType === 'expense' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic">{txType === 'expense' ? 'En Rango' : 'Progreso'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-1.5 rounded-full shadow-lg ${txType === 'expense' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic">{txType === 'expense' ? 'Exceso' : 'Meta Cumplida'}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
