"use client";

import React, { useMemo, useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useTransactions } from "@/store/useTransactions";
import { formatCurrency, parseLocalDate } from "@/lib/utils";
import { TrendingUp } from "lucide-react";
import { ChartTimeSelector } from "./ChartTimeSelector";

export const CashFlowChart = () => {
    const transactions = useTransactions(state => state.transactions);
    const [isMounted, setIsMounted] = useState(false);
    const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const data = useMemo(() => {
        const months = Array.from({ length: 12 }, (_, i) => ({
            name: new Date(0, i).toLocaleDateString('es-ES', { month: 'short' }).toUpperCase(),
            ingresos: 0,
            gastos: 0
        }));

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        transactions.forEach((t) => {
            const date = parseLocalDate(t.date);
            const m = date.getMonth();
            const y = date.getFullYear();

            if (selectedYears.length === 0 || selectedYears.includes(y)) {
                const amount = Number(t.amount);
                if (t.type === 'income') {
                    months[m].ingresos += amount;
                } else {
                    months[m].gastos += amount;
                }
            }
        });

        const sliceCurrent = selectedYears.length === 1 && selectedYears.includes(currentYear);
        return sliceCurrent ? months.slice(0, currentMonth + 1) : months;
    }, [transactions, selectedYears]);

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4 px-2 flex-wrap">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                        <TrendingUp size={24} className="text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-100 tracking-tighter">Tendencia de Flujo de Caja</h3>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">Evolución de tus ingresos y egresos a lo largo del año.</p>
                    </div>
                </div>
                <ChartTimeSelector 
                    type="year"
                    selectedYears={selectedYears} 
                    onYearChange={setSelectedYears} 
                />
            </div>

            <div className="w-full h-[220px] relative" style={{ minWidth: 0 }}> 
                {isMounted ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                width={50} 
                                tick={{fill: '#94a3b8', fontSize: 10}} 
                                tickFormatter={(v) => `$${v/1000}k`} 
                            />
                            <Tooltip 
                                cursor={{stroke: 'rgba(255,255,255,0.05)', strokeWidth: 2, strokeDasharray: '4 4'}} 
                                contentStyle={{
                                    backgroundColor: '#0f172a', 
                                    border: '1px solid rgba(255,255,255,0.1)', 
                                    borderRadius: '16px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                                    padding: '12px'
                                }} 
                                itemStyle={{fontSize: '11px', fontWeight: 'bold', padding: '2px 0'}}
                                labelStyle={{color: '#64748b', fontSize: '10px', fontWeight: 'black', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em'}}
                                formatter={(v, name) => [formatCurrency(Number(v)), name === 'ingresos' ? 'INGRESOS' : 'EGRESOS']} 
                            />
                            <Legend 
                                verticalAlign="top" 
                                align="right" 
                                iconType="circle"
                                wrapperStyle={{paddingBottom: '30px', fontSize: '10px', fontWeight: '900', letterSpacing: '0.05em'}} 
                            />
                            <Line 
                                type="monotone"
                                dataKey="ingresos" 
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                dot={{ r: 3, strokeWidth: 2, fill: '#0f172a' }}
                                activeDot={{ r: 5, strokeWidth: 0 }}
                                name="ingresos" 
                            />
                            <Line 
                                type="monotone"
                                dataKey="gastos" 
                                stroke="#f43f5e" 
                                strokeWidth={3}
                                dot={{ r: 3, strokeWidth: 2, fill: '#0f172a' }}
                                activeDot={{ r: 5, strokeWidth: 0 }}
                                name="gastos" 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 bg-[var(--theme-glass)] animate-pulse rounded-3xl" />
                )}
            </div>
        </div>
    );
};