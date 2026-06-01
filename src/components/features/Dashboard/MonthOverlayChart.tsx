"use client";

import React, { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useTransactions } from "@/store/useTransactions";
import { formatCurrency, parseLocalDate } from "@/lib/utils";
import { Zap } from "lucide-react";
import { ChartTimeSelector } from "./ChartTimeSelector";

export const MonthOverlayChart = () => {
    const transactions = useTransactions(state => state.transactions);
    const [selectedMonths, setSelectedMonths] = useState<number[]>([new Date().getMonth()]);
    const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);

    const overlayData = useMemo(() => {
        const now = new Date();
        const currentMonth = selectedMonths.length > 0 ? selectedMonths[0] : now.getMonth();
        const currentYear = selectedYears.length > 0 ? selectedYears[0] : now.getFullYear();
        
        let prevMonth = currentMonth - 1;
        let prevYear = currentYear;
        if (prevMonth < 0) {
            prevMonth = 11;
            prevYear--;
        }

        // Initialize array for 31 days
        const days = Array.from({ length: 31 }, (_, i) => ({
            day: i + 1,
            current: 0,
            previous: 0
        }));

        const expenses = transactions.filter(t => t.type === 'expense');

        expenses.forEach(t => {
            const date = parseLocalDate(t.date);
            const m = date.getMonth();
            const y = date.getFullYear();
            const d = date.getDate();
            const amount = Number(t.amount);

            if (y === currentYear && m === currentMonth) {
                days[d - 1].current += amount;
            } else if (y === prevYear && m === prevMonth) {
                days[d - 1].previous += amount;
            }
        });

        let cumCurrent = 0;
        let cumPrev = 0;
        
        // Stop current curve at today's date so it doesn't drop to 0, ONLY if viewing current real month
        const isCurrentRealMonth = currentMonth === now.getMonth() && currentYear === now.getFullYear();
        const maxDay = isCurrentRealMonth ? now.getDate() : 31;

        return days.map(d => {
            cumPrev += d.previous;
            if (d.day <= maxDay) {
                cumCurrent += d.current;
            }
            return {
                day: d.day,
                current: d.day <= maxDay ? cumCurrent : null,
                previous: cumPrev
            };
        });
    }, [transactions, selectedMonths, selectedYears]);

    return (
        <section className="w-full relative space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between gap-4 px-2 flex-wrap">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                        <Zap size={24} className="text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-100 tracking-tighter">Velocidad de Gasto</h3>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">Compara el ritmo al que gastas tu dinero respecto al mes anterior.</p>
                    </div>
                </div>
                <ChartTimeSelector 
                    selectedMonths={selectedMonths} 
                    selectedYears={selectedYears} 
                    onMonthChange={(val) => setSelectedMonths(val.slice(-1))} 
                    onYearChange={(val) => setSelectedYears(val.slice(-1))} 
                    allowAllMonth={false}
                    allowAllYear={false}
                />
            </div>

            <div className="bg-slate-900/50 border border-white/[0.05] rounded-[2rem] p-4 sm:p-6 backdrop-blur-xl h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={overlayData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                            dataKey="day" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                            tickFormatter={(v) => `Día ${v}`}
                            minTickGap={20}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tickFormatter={(v) => `$${v/1000}k`}
                            tick={{ fill: '#94a3b8', fontSize: 10 }}
                        />
                        <Tooltip 
                            cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 2, strokeDasharray: '4 4' }}
                            contentStyle={{
                                backgroundColor: '#0f172a', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '12px',
                                padding: '12px',
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)'
                            }}
                            labelFormatter={(v) => `DÍA ${v} DEL MES`}
                            labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '8px', fontSize: '10px', letterSpacing: '0.1em' }}
                            formatter={(value: any, name?: string) => [
                                formatCurrency(Number(value)),
                                name || ''
                            ]}
                        />
                        <Legend 
                            verticalAlign="top" 
                            align="right" 
                            iconType="circle"
                            wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold' }} 
                        />
                        <Line 
                            type="monotone" 
                            dataKey="previous" 
                            name="Mes Anterior"
                            stroke="#64748b" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            activeDot={{ r: 4 }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="current" 
                            name="Mes Actual"
                            stroke="#a855f7" 
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#d8b4fe' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </section>
    );
};
