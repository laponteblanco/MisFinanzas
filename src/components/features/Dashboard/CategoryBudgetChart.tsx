"use client";

import { 
    startOfMonth, 
    endOfMonth, 
    isWithinInterval,
} from 'date-fns';
import { useTransactions } from "@/store/useTransactions";
import { useEffect, useState, useMemo } from "react";
import { Tag } from "lucide-react";
import { 
    Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Cell, ComposedChart
} from 'recharts';
import { parseLocalDate } from "@/lib/utils";

export const CategoryBudgetChart = () => {
    const transactions = useTransactions(state => state.transactions);
    const budgets = useTransactions(state => state.budgets);
    const [isMobile, setIsMobile] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Detectar si estamos en móvil para cambiar el Layout
    useEffect(() => {
        setIsMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // 🗓️ Rango del mes actual
    const now = new Date();
    const range = { start: startOfMonth(now), end: endOfMonth(now) };

    // 1. Procesar gastos por categoría del MES ACTUAL
    const expenseByCat = useMemo(() => {
        return transactions
            .filter(t => {
                if (t.type !== 'expense') return false;
                try {
                    const txDate = parseLocalDate(t.date);
                    return isWithinInterval(txDate, range);
                } catch (e) {
                    return false;
                }
            })
            .reduce((acc: Record<string, number>, t) => {
                acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
                return acc;
            }, {});
    }, [transactions, range]);

    // 2. Preparar datos y ORDENAR (Pareto: De Mayor a Menor Gasto)
    const data = Object.keys(budgets)
        .map(cat => {
            const spent = expenseByCat[cat] || 0;
            const budget = budgets[cat];
            const percent = budget > 0 ? (spent / budget) * 100 : (spent > 0 ? 100 : 0);
            
            return {
                name: cat,
                spent,
                budget,
                percent: Number(percent.toFixed(1)),
                remaining: budget - spent
            };
        })
        .sort((a, b) => b.spent - a.spent);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            const isOver = d.remaining < 0;

            return (
                <div className="bg-[#0d0d0d] border border-[var(--theme-border)] p-4 rounded-2xl shadow-2xl backdrop-blur-md">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] mb-2">{d.name}</p>
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-[var(--theme-text)]">Gastado: <span className="text-blue-400">${d.spent.toLocaleString()}</span></p>
                        <p className="text-xs font-bold text-[var(--theme-text)]">Presupuesto: <span className="text-[var(--theme-text-muted)]">${(d.budget || 0).toLocaleString()}</span></p>
                        <div className="h-[1px] bg-[var(--theme-glass)] my-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest">
                            Uso: <span className={isOver ? "text-rose-500" : "text-emerald-500"}>{d.percent}%</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (!isMounted) return <div className="h-[300px] md:h-[350px] w-full bg-[var(--theme-glass)] animate-pulse rounded-3xl" />;

    if (data.length === 0) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center text-[var(--theme-text-muted)] gap-2">
                <div className="w-12 h-12 bg-[var(--theme-glass)] rounded-2xl flex items-center justify-center">
                    <Tag size={20} className="opacity-20" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Sin datos de presupuesto</p>
            </div>
        );
    }

    // Altura dinámica basada en el número de categorías para que el scroll funcione
    const chartHeight = Math.max(data.length * 55, 300);

    return (
        <div className="h-[300px] md:h-[350px] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar" style={{ minWidth: 0 }}>
            <div style={{ height: chartHeight, width: '100%', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <ComposedChart
                        layout="vertical"
                        data={data}
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        barGap={-28} 
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} vertical={true} />
                        
                        <XAxis type="number" hide />
                        
                        <YAxis 
                            type="category"
                            dataKey="name"
                            stroke="#64748b"
                            fontSize={10}
                            fontWeight="bold"
                            tickLine={false}
                            axisLine={false}
                            width={100}
                            tickFormatter={(name) => name.length > 15 ? `${name.substring(0, 13)}...` : name}
                        />
                        
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'white', opacity: 0.03 }} />
                        
                        {/* BARRA DE PRESUPUESTO (FONDO) */}
                        <Bar 
                            dataKey="budget" 
                            barSize={28} 
                            fill="transparent" 
                            stroke="#ffffff10" 
                            strokeDasharray="4 4" 
                            strokeWidth={1}
                            radius={[0, 4, 4, 0]}
                            isAnimationActive={false}
                        />

                        {/* BARRA DE GASTO REAL */}
                        <Bar 
                            dataKey="spent" 
                            barSize={16} 
                            radius={[0, 4, 4, 0]}
                        >
                            {data.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.spent > entry.budget ? '#f43f5e' : '#3b82f6'} 
                                    fillOpacity={0.8}
                                />
                            ))}
                        </Bar>
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(59, 130, 246, 0.5);
                }
            `}</style>
        </div>
    );
};