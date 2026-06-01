"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    Cell 
} from 'recharts';
import { 
    startOfMonth, 
    endOfMonth, 
    isWithinInterval, 
    format,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useTransactions } from '@/store/useTransactions';
import { useSettings } from '@/store/useSettings';
import { formatCurrency, parseLocalDate } from '@/lib/utils';
import { ChartTimeSelector } from './ChartTimeSelector';

export const BudgetControlChart = () => {
    const transactions = useTransactions(state => state.transactions);
    const categories = useSettings(state => state.categories);
    const [isMounted, setIsMounted] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [selectedMonths, setSelectedMonths] = useState<number[]>([new Date().getMonth()]);
    const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 📊 ESTRUCTURA DE DATOS ESPERADA (Fase de Transformación)
    const chartData = useMemo(() => {
        // Calcular gasto real por categoría según filtros
        const expenseByCat = transactions
            .filter(t => {
                if (t.type !== 'expense') return false;
                try {
                    const txDate = parseLocalDate(t.date);
                    const matchMonth = selectedMonths.length === 0 || selectedMonths.includes(txDate.getMonth());
                    const matchYear = selectedYears.length === 0 || selectedYears.includes(txDate.getFullYear());
                    return matchMonth && matchYear;
                } catch (e) {
                    return false;
                }
            })
            .reduce((acc: Record<string, number>, t) => {
                acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
                return acc;
            }, {});

        // Mapear categorías reales del usuario
        return categories.map(cat => {
            const realSpent = expenseByCat[cat.name] || 0;
            const budgetLimit = Number(cat.budget) || 0;
            
            return {
                category: `${cat.emoji || '📦'} ${cat.name}`,
                budget: budgetLimit,
                real: realSpent,
                execution: budgetLimit > 0 ? (realSpent / budgetLimit) * 100 : (realSpent > 0 ? 100 : 0)
            };
        }).sort((a, b) => b.real - a.real); // De mayor gasto a menor gasto real
    }, [transactions, categories, selectedMonths, selectedYears]);

    if (!isMounted) return <div className="h-[400px] w-full bg-[var(--theme-glass)] animate-pulse rounded-[2.5rem]" />;
    if (chartData.length === 0) return null;

    // ✨ CÁLCULO DE ANCHO DINÁMICO
    const minWidth = Math.max(100, chartData.length * 20); 

    // 🧠 CUSTOM TOOLTIP GLASSMORPHISM
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const isOver = data.real > data.budget;

            return (
                <div className="bg-[#0a0a0a]/90 border border-[var(--theme-border)] backdrop-blur-xl rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-3 min-w-[200px] animate-in fade-in zoom-in duration-300">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--theme-text-muted)] border-b border-[var(--theme-border)] pb-2">
                        {label}
                    </p>
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-[var(--theme-text)]/60">
                            <span>💰 Presupuesto:</span>
                            <span className="text-[var(--theme-text)]">{formatCurrency(data.budget)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-[var(--theme-text)]/60">
                            <span>💸 Gasto Real:</span>
                            <span className={isOver ? "text-rose-500" : "text-blue-400"}>
                                {formatCurrency(data.real)}
                            </span>
                        </div>
                    </div>
                    <div className="pt-2 border-t border-[var(--theme-border)]">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)]">
                            <span>📊 Ejecución:</span>
                            <span className={isOver ? "text-rose-500 animate-pulse" : "text-emerald-500"}>
                                {data.execution.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div 
            className="bg-[var(--theme-glass)] border border-[var(--theme-border)] rounded-[2.5rem] p-6 sm:p-8 backdrop-blur-md relative overflow-hidden select-none" 
            style={{ WebkitTapHighlightColor: 'transparent' }}
            onClick={() => setActiveIndex(null)}
        >
            <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h3 className="text-xl font-black text-[var(--theme-text)] tracking-tighter flex items-center gap-3">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                        Control de Presupuesto
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mt-1 ml-4.5">
                        {selectedMonths.length > 0 ? "Filtro activo" : "Todos los periodos"}
                    </p>
                </div>
                <ChartTimeSelector 
                    selectedMonths={selectedMonths} 
                    selectedYears={selectedYears} 
                    onMonthChange={setSelectedMonths} 
                    onYearChange={setSelectedYears} 
                />
            </div>
            
            {/* Contenedor de Scroll Horizontal */}
            <div className="w-full overflow-x-auto overflow-y-hidden custom-horizontal-scrollbar pb-4">
                <div style={{ width: `${minWidth}%`, minWidth: `${chartData.length * 80}px` }} className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            barGap={-28} // ✨ Superposición vertical para efecto de contenedor
                            margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                            style={{ outline: 'none' }}
                            onClick={(e) => {
                                if (e && typeof e.activeTooltipIndex === 'number') {
                                    setActiveIndex(e.activeTooltipIndex);
                                }
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                            <XAxis 
                                dataKey="category" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: "bold" }}
                                dy={10}
                            />
                            <YAxis type="number" hide domain={[0, 'dataMax + 100']} />
                            <Tooltip 
                                content={<CustomTooltip />} 
                                cursor={false} 
                                trigger="click" 
                                wrapperStyle={{ outline: 'none' }}
                            />
                            
                            {/* 🟦 BARRA FONDO (PRESUPUESTO): Contenedor vertical */}
                            <Bar 
                                dataKey="budget" 
                                barSize={36}
                                fill="transparent"
                                stroke="#ffffff20"
                                strokeDasharray="4 4"
                                radius={[12, 12, 4, 4]}
                                isAnimationActive={false}
                            />
                            
                            {/* 🚀 BARRA FRENTE (GASTO REAL): Progreso vertical */}
                            <Bar 
                                dataKey="real" 
                                barSize={16}
                                radius={[10, 10, 0, 0]}
                                isAnimationActive={true}
                                animationDuration={1000}
                            >
                                {chartData.map((entry, index) => {
                                    const isFocused = activeIndex === index;
                                    const hasFocus = activeIndex !== null;
                                    const barColor = entry.real > entry.budget ? '#f43f5e' : '#3b82f6';
                                    
                                    return (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={barColor} 
                                            opacity={!hasFocus || isFocused ? 1 : 0.2}
                                            style={{
                                                filter: isFocused ? `drop-shadow(0 0 12px ${barColor})` : 'none',
                                                transition: 'all 0.4s ease-in-out',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    );
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="mt-4 flex justify-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic">En Rango</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-1.5 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.3)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] italic">Exceso</span>
                </div>
            </div>

            <style jsx>{`
                .custom-horizontal-scrollbar::-webkit-scrollbar { height: 5px; }
                .custom-horizontal-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-horizontal-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-horizontal-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(59, 130, 246, 0.2);
                }
            `}</style>
        </div>
    );
};
