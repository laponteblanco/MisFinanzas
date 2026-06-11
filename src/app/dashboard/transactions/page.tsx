"use client";

import { useState, useMemo, memo, useEffect, Suspense } from "react";
import { useTransactions, Transaction } from "@/store/useTransactions";
import { useSettings } from "@/store/useSettings";
import { useAuth } from "@/hooks/useAuth";
import { cn, formatCurrency, parseLocalDate } from "@/lib/utils";
import { 
    ArrowLeft,
    Search,
    Filter,
    Edit2,
    Trash2,
    Plus,
    FileDown,
    Calendar,
    ArrowRight,
    Search as SearchIcon
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TransactionFilters } from "@/components/features/Transactions/TransactionFilters";


// Componente de Tarjeta Moderna (Mobile-Centric)
const TransactionCard = memo(({ tx, onEdit, onDelete }: { 
    tx: Transaction, 
    onEdit: (tx: Transaction) => void, 
    onDelete: (id: string) => void 
}) => {
    const isIncome = tx.type === 'income';
    const mainResponsible = tx.responsibles?.[0];
    const categories = useSettings(state => state.categories);

    const emoji = useMemo(() => {
        return categories.find(c => c.name.trim().toLowerCase() === tx.category.trim().toLowerCase())?.emoji || (isIncome ? '💰' : '📦');
    }, [categories, tx.category, isIncome]);

    return (
        <div className={cn(
            "group bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:bg-[var(--theme-surface)]",
            "border-l-4",
            isIncome ? "border-l-emerald-500" : "border-l-rose-500"
        )}>
            <div className="p-5 sm:p-6 flex flex-col gap-4">
                {/* Cabecera: Icono + Concepto + Monto */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 shrink-0 bg-[var(--theme-surface)] rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-[var(--theme-border)]">
                            {emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="text-sm sm:text-base font-black text-white line-clamp-2 leading-tight uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                                {tx.description}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 opacity-60">
                                <Calendar size={10} className="text-[var(--theme-text-muted)]" />
                                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--theme-text-muted)]">
                                    {parseLocalDate(tx.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="text-right shrink-0">
                        <p className={cn(
                            "text-lg sm:text-xl font-black font-mono tracking-tighter",
                            isIncome ? "text-emerald-400" : "text-white"
                        )}>
                            {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                        </p>
                    </div>
                </div>

                {/* Info Inferior: Etiqueta y Acciones */}
                <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-2 border-t border-[var(--theme-border)] pt-4">
                    {/* Contenedor Flex Wrap para Etiquetas */}
                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[120px]">
                        {mainResponsible && (
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                                <span className="opacity-60">{mainResponsible.name.split(' ')[0]}</span>
                                <span className="bg-blue-500/20 px-1.5 py-0.5 rounded-md text-[8px]">{mainResponsible.percentage}%</span>
                            </span>
                        )}
                        <span className="px-3 py-1 bg-[var(--theme-surface)] text-slate-500 border border-[var(--theme-border)] rounded-full text-[9px] font-black uppercase tracking-widest shrink-0">
                            {tx.category}
                        </span>
                    </div>

                    {/* Botones de acción fijos a la derecha o debajo si no caben */}
                    <div className="flex gap-2 shrink-0">
                        <button 
                            onClick={() => onEdit(tx)}
                            className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border border-blue-500/20"
                        >
                            EDITAR
                        </button>
                        <button 
                            onClick={() => onDelete(tx.id)}
                            className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border border-rose-500/20"
                        >
                            ELIMINAR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

TransactionCard.displayName = "TransactionCard";

export default function TransactionsPage() {
    return (
        <Suspense fallback={<div className="p-10 space-y-4 animate-pulse"><div className="h-32 bg-[var(--theme-surface)] rounded-3xl" /></div>}>
            <TransactionsContent />
        </Suspense>
    );
}

function TransactionsContent() {
    const { 
        filteredTransactions,
        deleteTransaction,
        setTransactionToEdit,
        setIsFormOpen,
        loading,
        filters,
        setFilters,
        fetchTransactions
    } = useTransactions();
    const { fetchSettings } = useSettings();
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const [limit, setLimit] = useState(50);

    // Carga maestra inicial para esta página
    useEffect(() => {
        if (user?.id) {
            Promise.all([
                fetchSettings(user.id),
                fetchTransactions(user.id)
            ]);
        }
    }, [user?.id, fetchSettings, fetchTransactions]);

    // Sincronizar búsqueda inicial desde URL al store global
    useEffect(() => {
        const categoryParam = searchParams.get('category');
        if (categoryParam) {
            setFilters({ search: categoryParam });
        }
    }, [searchParams, setFilters]);

    const handleEdit = (tx: Transaction) => {
        setTransactionToEdit(tx);
        setIsFormOpen(true);
    };

    const displayTransactions = useMemo(() => {
        return filteredTransactions.slice(0, limit);
    }, [filteredTransactions, limit]);

    return (
        <div className="p-4 md:p-10 space-y-8 animate-in fade-in duration-700 max-w-4xl mx-auto pb-32">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-3 bg-[var(--theme-surface)] hover:bg-white/10 rounded-2xl transition-colors border border-[var(--theme-border)] shadow-lg">
                        <ArrowLeft size={20} className="text-[var(--theme-text-muted)]" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter">Historial de <span className="text-blue-500">Movimientos</span></h1>
                        <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.4em] mt-1">Visibilidad Financiera Pro</p>
                    </div>
                </div>

                {/* Botones de acción removidos */}
            </header>

            <div className="space-y-6">
                {/* Barra de Filtros Inteligente */}
                <TransactionFilters />

                {/* Search Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 sticky top-[80px] z-40 py-4 bg-transparent backdrop-blur-md">
                    <div className="relative w-full md:max-w-md group">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar concepto o categoría..."
                            className="w-full bg-[var(--theme-surface)] border border-[var(--theme-border)] p-5 pl-12 rounded-[2rem] outline-none focus:border-blue-500/50 text-sm font-medium transition-all shadow-inner text-white"
                            value={filters.search}
                            onChange={(e) => setFilters({ search: e.target.value })}
                        />
                    </div>
                </div>

                {/* List Container */}
                <div className="space-y-4">
                    {loading && filteredTransactions.length === 0 ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-32 bg-[var(--theme-surface)] animate-pulse rounded-3xl w-full" />
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-4">
                                {displayTransactions.map((tx) => (
                                    <TransactionCard 
                                        key={tx.id} 
                                        tx={tx} 
                                        onEdit={handleEdit} 
                                        onDelete={deleteTransaction} 
                                    />
                                ))}
                            </div>

                            {displayTransactions.length === 0 && !loading && (
                                <div className="text-center py-24 bg-white/[0.02] border border-dashed border-[var(--theme-border)] rounded-[3rem]">
                                    <div className="inline-block p-8 bg-[var(--theme-surface)] rounded-[2rem] mb-6 shadow-inner">
                                        <Search size={40} className="text-slate-800" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Sin resultados</h3>
                                    <p className="text-slate-500 text-[10px] max-w-xs mx-auto uppercase tracking-[0.3em] font-black leading-relaxed">
                                        No encontramos movimientos que coincidan con tu criterio actual de búsqueda.
                                    </p>
                                </div>
                            )}

                            {filteredTransactions.length > limit && (
                                <div className="mt-12 flex justify-center pb-10">
                                    <button 
                                        onClick={() => setLimit(prev => prev + 50)}
                                        className="px-10 py-4 bg-[var(--theme-surface)] hover:bg-blue-600/10 text-[10px] font-black uppercase tracking-[0.4em] text-[var(--theme-text-muted)] hover:text-blue-500 border border-[var(--theme-border)] rounded-[1.5rem] transition-all shadow-lg"
                                    >
                                        Cargar más movimientos
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}