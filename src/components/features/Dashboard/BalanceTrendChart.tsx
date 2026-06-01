"use client";

import React, { useMemo, useState, useEffect } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { useTransactions } from "@/store/useTransactions";
import { formatCurrency, parseLocalDate } from "@/lib/utils";

export const BalanceTrendChart = () => {
    const transactions = useTransactions(state => state.transactions);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
      setIsMounted(true);
  }, []);

  const data = useMemo(() => {
    if (transactions.length === 0) return [];

    // 1. Ordenar cronológicamente todas las transacciones
    const sorted = [...transactions].sort((a, b) => 
      parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime()
    );

    // 2. AGRUPACIÓN: Consolidar el flujo neto por cada DÍA (YYYY-MM-DD)
    const groupedByDate: Record<string, number> = {};
    sorted.forEach(t => {
      const dateKey = t.date; // t.date ya viene como YYYY-MM-DD desde Supabase/Store
      
      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = 0;
      groupedByDate[dateKey] += (t.type === 'income' ? Number(t.amount) : -Number(t.amount));
    });

    // 3. Calcular el saldo acumulado (progressive balance)
    let currentBalance = 0;
    const history = Object.keys(groupedByDate).sort().map(key => {
      currentBalance += groupedByDate[key];
      const [year, month, day] = key.split('-');
      return {
        date: `${day}/${month}`, // Formato visual corto (ej: 04/04)
        saldo: currentBalance
      };
    });

    // 4. TRUCO VISUAL: Si solo hay 1 día de datos, añadimos un punto de "Inicio" en 0
    // para que la gráfica trace una línea visible y no solo un punto flotando.
    if (history.length === 1) {
        history.unshift({ date: 'Inicio', saldo: 0 });
    }

    // Tomamos los últimos 15 días activos
    return history.slice(-15);
  }, [transactions]);

  return (
    <div className="w-full h-[320px] relative" style={{ minWidth: 0 }}>
      {isMounted ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}} 
              minTickGap={15} // Evita que las fechas se amontonen
            />
            
            {/* EJE Y ACTIVADO: Para que puedas ver la magnitud real (-120k, etc.) */}
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              width={55} 
              tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}} 
              tickFormatter={(v) => `$${(v/1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`}
              domain={['auto', 'auto']} // Permite que la gráfica se auto-ajuste a números muy negativos
            />
            
            <Tooltip 
              contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              formatter={(v: any) => [formatCurrency(Number(v)), 'Saldo Neto']}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontWeight: 'bold' }}
            />
            
            <Area 
              type="monotone" 
              dataKey="saldo" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorSaldo)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6', style: { filter: 'drop-shadow(0px 0px 5px rgba(59,130,246,0.8))' } }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="absolute inset-0 bg-[var(--theme-glass)] animate-pulse rounded-3xl" />
      )}
    </div>
  );
};