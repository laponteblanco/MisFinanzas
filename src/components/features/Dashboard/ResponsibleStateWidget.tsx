import React, { useMemo } from "react";
import { useTransactions } from "@/store/useTransactions";
import { useSettings } from "@/store/useSettings";
import { formatCurrency, formatCompactCurrency, cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
    Users, TrendingUp, TrendingDown, Scale, User
} from "lucide-react";

// Componente Interno: Mini Gráfico de Tendencia (Sparkline)
const Sparkline = ({ color }: { color: string }) => (
    <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50">
        <path 
            d="M1 18C5 18 8 6 12 6C16 6 19 20 23 20C27 20 30 4 34 4C38 4 41 16 45 16C49 16 52 8 56 10" 
            stroke={color} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
    </svg>
);

// Componente Interno: Tarjeta de Responsable Ejecutiva
const ResponsibleCard = ({ name, stats }: { name: string, stats: any }) => {
    const isPositive = stats.balance >= 0;
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    return (
        <motion.div 
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="group relative bg-[var(--theme-glass)] backdrop-blur-md border border-[var(--theme-border)] rounded-[2rem] p-6 shadow-2xl hover:bg-white/[0.04] transition-all duration-300 select-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
        >
            {/* Header: Avatar + Nombre + Sparkline */}
            <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600/20 to-blue-400/10 border border-blue-500/20 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
                        {/* Verificamos si existe un avatar real o usamos iniciales */}
                        <div className="text-sm font-black text-blue-400 tracking-tighter">
                            {initials}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h4 className="text-sm font-black text-[var(--theme-text)] tracking-tight leading-none mb-1">{name}</h4>
                        <span className="text-[9px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">Ejecutivo de Cuenta</span>
                    </div>
                </div>
                <Sparkline color={isPositive ? "#10b981" : "#3b82f6"} />
            </div>

            {/* Grid de KPIs triples */}
            <div className="grid grid-cols-3 gap-1 border-t border-[var(--theme-border)] pt-6 mt-4">
                {/* Ingresos */}
                <div className="flex flex-col items-start px-1 overflow-hidden w-full">
                    <div className="flex items-center gap-1 mb-1 w-full min-w-0">
                        <span className="text-[11px] font-black text-[var(--theme-text)] tracking-tighter whitespace-nowrap">
                            {formatCompactCurrency(stats.income)}
                        </span>
                        <TrendingUp size={8} className="text-emerald-400 shrink-0" />
                    </div>
                    <span className="text-[8px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Ingresos</span>
                </div>

                {/* Egresos */}
                <div className="flex flex-col items-start px-1 border-x border-[var(--theme-border)] overflow-hidden w-full">
                    <div className="flex items-center gap-1 mb-1 w-full min-w-0">
                        <span className="text-[11px] font-black text-[var(--theme-text)] tracking-tighter whitespace-nowrap">
                            {formatCompactCurrency(stats.expense)}
                        </span>
                        <TrendingDown size={8} className="text-rose-400 shrink-0" />
                    </div>
                    <span className="text-[8px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Egresos</span>
                </div>

                {/* Balance */}
                <div className="flex flex-col items-start px-1 overflow-hidden w-full">
                    <div className="flex items-center gap-1 mb-1 w-full min-w-0">
                        <span className={cn(
                            "text-[11px] font-black tracking-tighter whitespace-nowrap",
                            isPositive ? "text-[var(--theme-text)]" : "text-rose-400"
                        )}>
                            {formatCompactCurrency(stats.balance)}
                        </span>
                        <Scale size={8} className={cn("shrink-0", isPositive ? "text-blue-400" : "text-rose-400")} />
                    </div>
                    <span className="text-[8px] font-bold text-[var(--theme-text-muted)] uppercase tracking-wider">Balance</span>
                </div>
            </div>

            {/* Overlay sutil de resplandor en hover */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    );
};

export const ResponsibleStateWidget = () => {
    const { transactions } = useTransactions();
    const { responsibles } = useSettings();

    // Cálculo masivo de estadísticas para todos los responsables
    const allStats = useMemo(() => {
        return responsibles.map(r => {
            let income = 0;
            let expense = 0;

            transactions.forEach(tx => {
                const respMatch = tx.responsibles?.find(match => match.name === r.name);
                if (respMatch) {
                    const effectiveAmount = Number(tx.amount) * (respMatch.percentage / 100);
                    if (tx.type === 'income') income += effectiveAmount;
                    else expense += effectiveAmount;
                }
            });

            return {
                id: r.id,
                name: r.name,
                income,
                expense,
                balance: income - expense
            };
        }).sort((a, b) => b.balance - a.balance); // Ordenar por desempeño financiero
    }, [responsibles, transactions]);

    return (
        <section className="w-full relative z-20 space-y-8">
            {/* Header de la Sección */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-4 sm:px-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                        <Users size={24} className="text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-[var(--theme-text)] tracking-tighter">Análisis por Responsable</h3>
                        <p className="text-xs font-medium text-[var(--theme-text-muted)] mt-1">Explora el rendimiento y liquidez individual de tu equipo.</p>
                    </div>
                </div>
            </div>

            {/* Grid de Tarjetas */}
            {allStats.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] border border-dashed border-[var(--theme-border)] rounded-[3rem]">
                    <User size={40} className="mx-auto text-[var(--theme-text-muted)] mb-4 opacity-50" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--theme-text-muted)]">No hay perfiles configurados</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    {allStats.map(stat => (
                        <ResponsibleCard key={stat.id} name={stat.name} stats={stat} />
                    ))}
                </div>
            )}
        </section>
    );
};

