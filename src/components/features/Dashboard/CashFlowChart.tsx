"use client";

import React, { useMemo, useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useTransactions } from "@/store/useTransactions";
import { formatCurrency, parseLocalDate } from "@/lib/utils";

export const CashFlowChart = () => {
    const { transactions } = useTransactions();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const data = useMemo(() => {
        const monthsMap: Record<string, { name: string; sortKey: string; ingresos: number; gastos: number }> = {};
        
        transactions.forEach(t => {
            const date = parseLocalDate(t.date);
            const label = date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
            // Clave para ordenar cronológicamente: YYYY-MM
            const sortKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            
            if (!monthsMap[label]) {
                monthsMap[label] = { name: label, sortKey, ingresos: 0, gastos: 0 };
            }
            
            if (t.type === 'income') monthsMap[label].ingresos += Number(t.amount);
            else monthsMap[label].gastos += Number(t.amount);
        });

        // Retornar solo los meses con movimientos, ordenados por fecha
        return Object.values(monthsMap)
            .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
            .map(({ sortKey, ...rest }) => rest);
    }, [transactions]);

    return (
        /* SOLUCIÓN DEFINITIVA: 
           El div padre TIENE que tener la altura fija SIEMPRE. 
           No usamos el 'return' temprano, solo condicionamos el ResponsiveContainer.
        */
        <div className="w-full h-[220px] relative" style={{ minWidth: 0 }}> 
            {isMounted ? (
                <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0}>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }} barGap={8}>
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
                            cursor={{fill: 'rgba(255,255,255,0.03)'}} 
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
                        <Bar 
                            dataKey="ingresos" 
                            fill="#3b82f6" 
                            radius={[6, 6, 0, 0]} 
                            name="ingresos" 
                            barSize={12} 
                        />
                        <Bar 
                            dataKey="gastos" 
                            fill="#f43f5e" 
                            radius={[6, 6, 0, 0]} 
                            name="gastos" 
                            barSize={12} 
                        />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                // Mientras no esté montado, mostramos el pulso en el mismo contenedor
                <div className="absolute inset-0 bg-[var(--theme-glass)] animate-pulse rounded-3xl" />
            )}
        </div>
    );
};