"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useReminders } from "@/store/useReminders";
import { formatCurrency, cn } from "@/lib/utils";
import {
    Bell,
    Plus,
    Trash2,
    CheckCircle2,
    Clock,
    Calendar,
    AlertCircle,
    X,
    Check,
    Repeat,
    Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export const RemindersManager = () => {
    const { user } = useAuth();
    const router = useRouter();
    const {
        reminders,
        loading,
        fetchReminders,
        addReminder,
        deleteReminder,
        toggleReminderActive
    } = useReminders();

    const [isAdding, setIsAdding] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [isRecurring, setIsRecurring] = useState(false);

    useEffect(() => {
        if (user?.id) fetchReminders(user.id);
    }, [user?.id, fetchReminders]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !title || !dueDate) return;

        setIsSubmitting(true);
        try {
            await addReminder({
                user_id: user.id,
                title,
                amount: parseFloat(amount) || 0,
                due_date: dueDate,
                is_active: true,
                is_recurring: isRecurring
            });

            // Success feedback
            alert("✅ Recordatorio guardado correctamente");

            // Clear form and close modal
            setTitle("");
            setAmount("");
            setDueDate("");
            setIsRecurring(false);
            setIsAdding(false);

            // Refresh data
            router.refresh();
        } catch (err: any) {
            console.error("Error al guardar recordatorio:", err);
            alert(`❌ Error al guardar: ${err.message || "Ocurrió un error inesperado"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-600/10 rounded-xl border border-blue-500/20">
                        <Bell size={20} className="text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-[var(--theme-text)] tracking-tighter">Recordatorios de Pago</h3>
                        <p className="text-[10px] font-bold text-[var(--theme-text-muted)] uppercase tracking-widest mt-0.5">Gestión de vencimientos</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <Plus size={14} />
                    Añadir
                </button>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-[var(--theme-glass)] border border-blue-500/20 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-500" />
                        <form onSubmit={handleAdd} className="space-y-5">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-black uppercase tracking-widest text-blue-400">Nuevo Recordatorio</h4>
                                <button type="button" onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">¿Qué debes pagar?</label>
                                    <input
                                        required
                                        placeholder="Ej: Arriendo, Internet, Crédito..."
                                        className="w-full bg-black/20 border border-[var(--theme-border)] p-3.5 rounded-xl text-sm font-medium outline-none focus:border-blue-500/50"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Monto aproximado</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full bg-black/20 border border-[var(--theme-border)] p-3.5 rounded-xl text-sm font-medium outline-none focus:border-blue-500/50"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Fecha de Vencimiento</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="date"
                                            className="w-full bg-black/20 border border-[var(--theme-border)] p-3.5 rounded-xl text-sm font-medium outline-none focus:border-blue-500/50 appearance-none"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                        />
                                        <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="flex items-end pb-1">
                                    <label className="flex items-center gap-3 cursor-pointer group bg-white/[0.03] border border-[var(--theme-border)] p-3 rounded-xl w-full hover:bg-blue-600/5 transition-all">
                                        <div className={cn(
                                            "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                            isRecurring ? "bg-blue-600 border-blue-500" : "bg-black/20 border-slate-700 group-hover:border-slate-500"
                                        )}>
                                            {isRecurring && <Check size={14} className="text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={isRecurring}
                                            onChange={(e) => setIsRecurring(e.target.checked)}
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Repetir cada mes</span>
                                            <span className="text-[8px] font-bold text-slate-600 uppercase">Auto-genera el próximo mes</span>
                                        </div>
                                        <Repeat size={14} className={cn("ml-auto transition-colors", isRecurring ? "text-blue-400" : "text-slate-700")} />
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        Guardar Recordatorio
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-4">
                {loading && reminders.length === 0 ? (
                    <div className="p-10 text-center text-slate-500 animate-pulse text-xs font-black uppercase tracking-widest">Cargando...</div>
                ) : reminders.length === 0 ? (
                    <div className="p-12 text-center bg-white/[0.02] border border-dashed border-[var(--theme-border)] rounded-[2.5rem]">
                        <Clock size={40} className="mx-auto text-slate-700 mb-4 opacity-50" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">No tienes recordatorios activos</p>
                    </div>
                ) : (
                    reminders.map((reminder) => (
                        <motion.div
                            key={reminder.id}
                            layout
                            className={cn(
                                "group relative bg-[var(--theme-glass)] border border-[var(--theme-border)] rounded-2xl p-5 flex items-center justify-between transition-all hover:bg-white/[0.04]",
                                !reminder.is_active && "opacity-50 grayscale"
                            )}
                        >
                            <div className="flex items-center gap-5">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center border transition-all",
                                    reminder.is_active
                                        ? "bg-blue-600/10 border-blue-500/20 text-blue-400 group-hover:scale-110"
                                        : "bg-slate-800/50 border-slate-700 text-slate-500"
                                )}>
                                    <Clock size={22} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-sm font-black text-[var(--theme-text)] tracking-tight">{reminder.title}</h4>
                                        {reminder.is_recurring && (
                                            <span title="Recurrente mensual">
                                                <Repeat size={12} className="text-blue-500" />
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[11px] font-black text-blue-500">{formatCurrency(reminder.amount)}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                            Vence: {(() => {
                                                const [y, m, d] = reminder.due_date.split('-').map(Number);
                                                return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleReminderActive(reminder.id, reminder.is_active)}
                                    className={cn(
                                        "p-2.5 rounded-xl transition-all",
                                        reminder.is_active
                                            ? "text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10"
                                            : "text-emerald-500 bg-emerald-500/10"
                                    )}
                                    title={reminder.is_active ? "Marcar como pagado" : "Reactivar"}
                                >
                                    <CheckCircle2 size={18} />
                                </button>
                                <button
                                    onClick={() => deleteReminder(reminder.id)}
                                    className="p-2.5 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};
