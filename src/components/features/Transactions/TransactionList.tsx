"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTransactions } from "@/store/useTransactions";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { TransactionFilters } from "./TransactionFilters";

/**
 * Transaction List - SaaS Data Viewer
 * Premium History UI with Framer Motion and Advanced Filtering
 */
export const TransactionList = () => {
    const { user } = useAuth();
    const filteredTransactions = useTransactions(state => state.filteredTransactions);
    const fetchTransactions = useTransactions(state => state.fetchTransactions);
    const loading = useTransactions(state => state.loading);
    const deleteTransaction = useTransactions(state => state.deleteTransaction);

    useEffect(() => {
        if (user) fetchTransactions(user.id);
    }, [user, fetchTransactions]);

    if (loading && filteredTransactions.length === 0) {
        return <div className="p-10 text-center text-muted-foreground animate-pulse">Cargando movimientos...</div>;
    }

    return (
        <div className="flex flex-col gap-3">
            <TransactionFilters />
            
            <div className="flex flex-col gap-3 relative min-h-[100px]">
                <AnimatePresence mode="popLayout">
                    {filteredTransactions.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="glass-card p-10 text-center text-muted-foreground italic"
                        >
                            No hay movimientos que coincidan con los filtros.
                        </motion.div>
                    ) : (
                        filteredTransactions.map((tr) => (
                            <motion.div 
                                key={tr.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-card p-4 flex items-center justify-between group hover:bg-[var(--theme-glass)] transition-all"
                            >
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-semibold text-sm">{tr.description || "Sin descripción"}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-tighter",
                                            tr.type === "income" ? "text-emerald-500" : "text-rose-500"
                                        )}>
                                            {tr.type === "income" ? "Ingreso" : "Gasto"}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-medium">
                                            • {(() => {
                                                try {
                                                    const d = new Date(tr.date);
                                                    if (isNaN(d.getTime())) return tr.date;
                                                    const hasTime = tr.date.includes('T');
                                                    const datePart = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                                                    if (hasTime) {
                                                        const timePart = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                                                        return `${datePart}, ${timePart}`;
                                                    }
                                                    return datePart;
                                                } catch {
                                                    return tr.date;
                                                }
                                            })()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={cn(
                                        "font-bold text-sm",
                                        tr.type === "income" ? "text-emerald-400" : "text-[var(--theme-text)]"
                                    )}>
                                        {tr.type === "income" ? "+" : "-"} {formatCurrency(tr.amount)}
                                    </span>
                                    
                                    <button
                                        onClick={() => deleteTransaction(tr.id)}
                                        className="p-2 rounded-lg text-rose-500/50 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
