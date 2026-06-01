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
    Cell,
    Text
} from 'recharts';
import { useTransactions } from '@/store/useTransactions';
import { useSettings, Category } from '@/store/useSettings';
import { formatCurrency } from '@/lib/utils';

export const BudgetBarChart = () => {
    const transactions = useTransactions(state => state.transactions);
    const budgets = useTransactions(state => state.budgets);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const categories = useSettings(state => state.categories); // Para recuperar los emojis

    const data = useMemo(() => {
        // Calcular gasto real por categoría (ahora coincide con el nombre en DB)
        const expenseByCat = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc: Record<string, number>, t) => {
                acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
                return acc;
            }, {});

        // Cruzar con presupuestos
        return Object.keys(budgets).map(catName => {
            const catInfo = categories.find((c: Category) => c.name === catName);
            const emoji = catInfo?.emoji || '📦';
            
            return {
                displayName: `${emoji} ${catName}`.toUpperCase(),
                name: catName,
                Real: expenseByCat[catName] || 0,
                Presupuesto: budgets[catName] || 0,
                percent: (expenseByCat[catName] || 0) / (budgets[catName] || 1) * 100
            };
        }).sort((a, b) => b.Real - a.Real).slice(0, 5);
    }, [transactions, budgets, categories]);

    if (!isMounted) return <div className="h-[300px] w-full bg-[var(--theme-glass)] animate-pulse rounded-3xl" />;
    if (data.length === 0) return null;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#050505]/90 backdrop-blur-xl border border-[var(--theme-border)] p-4 rounded-2xl shadow-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--theme-text-muted)] mb-2">{label}</p>
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-[var(--theme-text)] flex justify-between gap-4">
                            <span>Real:</span>
                            <span className="text-blue-400">{formatCurrency(payload[0].value)}</span>
                        </p>
                        <p className="text-xs font-bold text-[var(--theme-text-muted)] flex justify-between gap-4">
                            <span>Límite:</span>
                            <span>{formatCurrency(payload[1].value)}</span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-[350px] relative min-w-0">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    layout="vertical"
                    data={data}
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    barGap={0}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" hide />
                    <YAxis 
                        dataKey="displayName" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        width={100}
                        tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 900 }}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    
                    {/* Barra de Fondo (Presupuesto) */}
                    <Bar 
                        dataKey="Presupuesto" 
                        fill="rgba(255,255,255,0.05)" 
                        radius={[0, 10, 10, 0]} 
                        barSize={20}
                    />
                    
                    {/* Barra Frontal (Real) */}
                    <Bar 
                        dataKey="Real" 
                        radius={[0, 10, 10, 0]} 
                        barSize={20}
                    >
                        {data.map((entry, index) => (
                            <Cell 
                                key={`cell-${index}`} 
                                fill={entry.Real > entry.Presupuesto ? '#f43f5e' : '#3b82f6'} 
                                fillOpacity={0.8}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
