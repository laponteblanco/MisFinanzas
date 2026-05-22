import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, TrendingDown, Scale, FileText } from "lucide-react";
import { useTransactions } from "@/store/useTransactions";
import { formatCurrency, formatCompactCurrency, cn, parseLocalDate } from "@/lib/utils";

interface ResponsibleDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    stats: {
        id: string;
        name: string;
        income: number;
        expense: number;
        balance: number;
    };
}

export const ResponsibleDetailModal = ({ isOpen, onClose, stats }: ResponsibleDetailModalProps) => {
    const { transactions } = useTransactions();

    const responsibleTransactions = useMemo(() => {
        return transactions
            .filter(tx => tx.responsibles?.some(r => r.name === stats.name))
            .map(tx => {
                const respSplit = tx.responsibles?.find(r => r.name === stats.name);
                const effectiveAmount = Number(tx.amount) * ((respSplit?.percentage || 0) / 100);
                return {
                    ...tx,
                    effectiveAmount,
                    percentage: respSplit?.percentage || 0
                };
            })
            .sort((a, b) => {
                const dDiff = parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime();
                if (dDiff !== 0) return dDiff;
                return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
            });
    }, [transactions, stats.name]);

    if (!isOpen) return null;

    const isPositive = stats.balance >= 0;
    const initials = stats.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-auto overflow-hidden animate-in fade-in duration-300">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[var(--theme-bg)] pointer-events-auto opacity-95" onClick={onClose} />

            <div className="relative w-full h-full md:h-[85vh] md:max-w-4xl bg-[var(--theme-surface)] md:border md:border-[var(--theme-border)] md:rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col transition-all duration-500 animate-in zoom-in-95 pointer-events-auto overflow-hidden">
                
                {/* Header Superior */}
                <div className="flex justify-between items-center p-6 sm:p-8 border-b border-[var(--theme-border)] bg-white/[0.02] shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600/20 to-blue-400/10 border border-blue-500/20 flex items-center justify-center shadow-inner shrink-0">
                            <div className="text-lg font-black text-blue-400 tracking-tighter">
                                {initials}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-xl font-black text-[var(--theme-text)] tracking-tight leading-none mb-1">{stats.name}</h3>
                            <span className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest">Resumen de Movimientos</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-[var(--theme-glass)] hover:bg-white/10 rounded-full transition-colors text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] border border-[var(--theme-border)]">
                        <X size={20} />
                    </button>
                </div>

                {/* Resumen Financiero (KPIs) */}
                <div className="grid grid-cols-3 divide-x divide-[var(--theme-border)] border-b border-[var(--theme-border)] bg-[var(--theme-glass)] shrink-0">
                    <div className="p-6 flex flex-col gap-2 justify-center items-center text-center">
                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 mb-1">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ingresos Totales</span>
                        <span className="text-lg sm:text-2xl font-black text-[var(--theme-text)] tracking-tighter">{formatCurrency(stats.income)}</span>
                    </div>
                    <div className="p-6 flex flex-col gap-2 justify-center items-center text-center">
                        <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400 mb-1">
                            <TrendingDown size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Egresos Totales</span>
                        <span className="text-lg sm:text-2xl font-black text-[var(--theme-text)] tracking-tighter">{formatCurrency(stats.expense)}</span>
                    </div>
                    <div className="p-6 flex flex-col gap-2 justify-center items-center text-center bg-blue-600/5">
                        <div className={cn("p-2 rounded-xl mb-1", isPositive ? "bg-blue-500/10 text-blue-400" : "bg-rose-500/10 text-rose-400")}>
                            <Scale size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Balance Neto</span>
                        <span className={cn(
                            "text-lg sm:text-2xl font-black tracking-tighter",
                            isPositive ? "text-blue-400" : "text-rose-400"
                        )}>{formatCurrency(stats.balance)}</span>
                    </div>
                </div>

                {/* Lista de Movimientos Filtrados */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                        <FileText size={14} /> Historial de Movimientos ({responsibleTransactions.length})
                    </h4>
                    
                    {responsibleTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-4 opacity-50">
                            <div className="p-4 bg-[var(--theme-glass)] rounded-full">
                                <FileText size={32} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest">No hay movimientos registrados</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <AnimatePresence mode="popLayout">
                                {responsibleTransactions.map((tr) => (
                                    <motion.div 
                                        key={tr.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white/[0.03] border border-[var(--theme-border)] rounded-2xl p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-white/[0.05] transition-all"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                                                tr.type === "income" 
                                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                            )}>
                                                {tr.type === "income" ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-sm text-[var(--theme-text)] truncate">{tr.description || "Sin descripción"}</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border",
                                                        tr.type === "income" 
                                                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                                            : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                                                    )}>
                                                        {tr.type === "income" ? "Ingreso" : "Gasto"}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-medium">{tr.date}</span>
                                                    <span className="text-[10px] text-slate-500 font-medium px-2 py-0.5 bg-[var(--theme-glass)] rounded-md">
                                                        Total Op: {formatCompactCurrency(tr.amount)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:items-end gap-1 shrink-0 bg-black/20 p-3 rounded-xl border border-white/5">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Asignado ({tr.percentage}%)</span>
                                            <span className={cn(
                                                "font-black text-base sm:text-lg tracking-tighter",
                                                tr.type === "income" ? "text-emerald-400" : "text-rose-400"
                                            )}>
                                                {tr.type === "income" ? "+" : "-"} {formatCurrency(tr.effectiveAmount)}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
