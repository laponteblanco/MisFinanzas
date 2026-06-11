"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Tag, Users, Check, AlertCircle, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useLicense } from "@/hooks/useLicense";
import { useTransactions } from "@/store/useTransactions";
import { useSettings } from "@/store/useSettings";
import { formatNumberWithDots, parseNumericString, cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface TransactionFormProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TransactionForm = ({ isOpen, onClose }: TransactionFormProps) => {
    const { user, profile } = useAuth();
    const { has_active_access } = useLicense();
    const addTransaction = useTransactions(state => state.addTransaction);
    const editTransaction = useTransactions(state => state.editTransaction);
    const transactionToEdit = useTransactions(state => state.transactionToEdit);
    const setTransactionToEdit = useTransactions(state => state.setTransactionToEdit);
    const categories = useSettings(state => state.categories);
    const availableResponsibles = useSettings(state => state.responsibles);
    const fetchSettings = useSettings(state => state.fetchSettings);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getLocalDatetimeString = (d: Date) => {
        const tzoffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tzoffset).toISOString().slice(0, 16);
    };

    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState(getLocalDatetimeString(new Date()));
    const [responsibles, setResponsibles] = useState<any[]>([]);

    useEffect(() => {
        if (user?.id) fetchSettings(user.id);
    }, [user?.id, fetchSettings]);

    // EFECTO ESTABLE: Sincronización de datos al abrir/cambiar modo
    useEffect(() => {
        if (!isOpen) return;
        if (transactionToEdit) {
            setType(transactionToEdit.type);
            setAmount(transactionToEdit.amount.toString());
            setDescription(transactionToEdit.description || "");
            setCategory(transactionToEdit.category || "");
            let dateVal = transactionToEdit.date;
            if (dateVal.length === 10) dateVal += "T00:00";
            setDate(dateVal.slice(0, 16));
            setResponsibles(transactionToEdit.responsibles || []);
        } else {
            setType('expense'); setAmount(""); setDescription(""); setCategory("");
            setResponsibles([]); setDate(getLocalDatetimeString(new Date()));
            setError(null);
        }
    }, [isOpen, transactionToEdit]);

    // EFECTO DE LIMPIEZA: Reset de categoría al cambiar tipo (Solo en modo Nuevo)
    useEffect(() => {
        if (!transactionToEdit && isOpen) setCategory("");
    }, [type, transactionToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isAdmin = profile?.role === 'admin';
        const hasAccess = has_active_access || isAdmin;
        if (!user || !hasAccess) return;
        
        setLoading(true);
        setError(null);

        const totalPct = responsibles.reduce((acc, r) => acc + r.percentage, 0);
        
        if (responsibles.length === 0) {
            setError("Debes asignar al menos un responsable al movimiento.");
            setLoading(false);
            return;
        }

        if (totalPct !== 100) {
            setError(`El reparto debe sumar el 100% (Actual: ${totalPct}%)`);
            setLoading(false);
            return;
        }

        const transactionData = {
            user_id: user.id,
            type,
            amount: parseNumericString(amount),
            description,
            category,
            date: date, // Enviamos el string YYYY-MM-DD directamente para evitar desfases de zona horaria
            responsibles
        };

        try {
            if (transactionToEdit) {
                editTransaction(transactionToEdit.id, transactionData);
            } else {
                addTransaction(transactionData);
                // Celebración visual Inmersiva (Pantalla completa con ráfagas laterales)
                const duration = 1000;
                const end = Date.now() + duration;

                (function frame() {
                    confetti({
                        particleCount: 7,
                        angle: 60,
                        spread: 80,
                        origin: { x: 0, y: 0.8 },
                        colors: ['#3b82f6', '#10b981', '#f43f5e', '#fbbf24'],
                        zIndex: 10000
                    });
                    confetti({
                        particleCount: 7,
                        angle: 120,
                        spread: 80,
                        origin: { x: 1, y: 0.8 },
                        colors: ['#3b82f6', '#10b981', '#f43f5e', '#fbbf24'],
                        zIndex: 10000
                    });

                    if (Date.now() < end) {
                        requestAnimationFrame(frame);
                    }
                }());
            }
            
            // Navegar suavemente a la parte superior de la página
            window.scrollTo({ top: 0, behavior: 'smooth' });

            onClose();
            setTransactionToEdit(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
            <div className="bg-[var(--theme-surface)] border border-[var(--theme-border)] w-full max-w-lg rounded-[2.5rem] max-h-[90vh] overflow-y-auto shadow-2xl transition-all duration-500 animate-in fade-in zoom-in-95 custom-scrollbar">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black tracking-tight text-[var(--theme-text)]">
                            {transactionToEdit ? "Editar Movimiento" : "Nuevo Movimiento"}
                        </h3>
                        <button onClick={onClose} className="p-2 hover:bg-[var(--theme-glass)] rounded-full text-slate-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Selector de Tipo */}
                        <div className="flex bg-[var(--theme-glass)] p-1.5 rounded-2xl border border-[var(--theme-border)]">
                            <button 
                                type="button"
                                onClick={() => setType('expense')}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === 'expense' ? 'bg-rose-600 text-[var(--theme-text)] shadow-lg' : 'text-slate-500 hover:text-[var(--theme-text)]'}`}
                            >
                                Salida
                            </button>
                            <button 
                                type="button"
                                onClick={() => setType('income')}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === 'income' ? 'bg-emerald-600 text-[var(--theme-text)] shadow-lg' : 'text-slate-500 hover:text-[var(--theme-text)]'}`}
                            >
                                Entrada
                            </button>
                        </div>



                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={type}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="text-center group py-6 pt-8"
                            >
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">Monto de la Operación</p>
                                <div 
                                    className={`flex flex-row items-baseline justify-center gap-1 font-black tracking-tighter w-full overflow-hidden px-2 ${type === 'expense' ? 'text-[#ff1a4a]' : 'text-emerald-500'}`}
                                    style={{
                                        textShadow: type === 'expense' ? '0 0 60px rgba(255, 26, 74, 0.6)' : '0 0 60px rgba(16, 185, 129, 0.6)'
                                    }}
                                >
                                    <span style={{ fontSize: 'clamp(28px, 8vw, 45px)', lineHeight: '1' }}>$</span>
                                    <input 
                                        autoFocus
                                        type="text" 
                                        className="input-amount-hero bg-transparent outline-none placeholder:opacity-30 border-none focus:ring-0 p-0 m-0 text-left"
                                        style={{ 
                                            color: 'inherit',
                                            fontSize: 'clamp(48px, 14vw, 80px)',
                                            lineHeight: '1',
                                            width: '100%',
                                        }}
                                        size={Math.max(1, formatNumberWithDots(amount).length)}
                                        placeholder="0"
                                        value={formatNumberWithDots(amount)}
                                        onChange={(e) => setAmount(parseNumericString(e.target.value).toString())}
                                    />
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Detalles Secundarios */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Descripción</p>
                                <input 
                                    className="w-full bg-[var(--theme-glass)] border border-[var(--theme-border)] p-4 rounded-2xl outline-none focus:border-blue-500/50 text-sm font-medium text-[var(--theme-text)]"
                                    placeholder={type === 'income' ? "¿De dónde proviene?" : "¿En qué se usó?"}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Categoría</p>
                                <div className="relative group">
                                    <select 
                                        className="w-full bg-[#151515] border border-[var(--theme-border)] p-4 rounded-2xl outline-none focus:border-blue-500/50 text-sm font-medium text-[var(--theme-text)] appearance-none cursor-pointer"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                    >
                                        <option value="" disabled className="bg-[#050505] text-slate-600">Seleccionar...</option>
                                        {categories.filter(c => !c.type || c.type === type).length > 0 ? (
                                            categories.filter(c => !c.type || c.type === type).map(cat => (
                                                <option key={cat.id} value={cat.name} className="bg-[#151515] text-[var(--theme-text)] py-2">
                                                    {cat.emoji || '📦'} {cat.name}
                                                </option>
                                            ))
                                        ) : (
                                            <>
                                                {type === 'expense' ? (
                                                    <>
                                                        <option value="Alimentación" className="bg-[#151515] text-[var(--theme-text)]">🍎 Alimentación</option>
                                                        <option value="Transporte" className="bg-[#151515] text-[var(--theme-text)]">🚗 Transporte</option>
                                                        <option value="Vivienda" className="bg-[#151515] text-[var(--theme-text)]">🏠 Vivienda</option>
                                                        <option value="Suscripciones" className="bg-[#151515] text-[var(--theme-text)]">💳 Suscripciones</option>
                                                        <option value="Servicios" className="bg-[#151515] text-[var(--theme-text)]">⚡ Servicios</option>
                                                        <option value="Otros" className="bg-[#151515] text-[var(--theme-text)]">📦 Otros</option>
                                                    </>
                                                ) : (
                                                    <option value="Ingresos" className="bg-[#151515] text-[var(--theme-text)]">💰 Ingresos</option>
                                                )}
                                            </>
                                        )}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover:text-[var(--theme-text)] transition-colors">
                                        <Tag size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN DE RESPONSABLES Y REPARTO */}
                        <div className="space-y-4 pt-4 border-t border-[var(--theme-border)]">
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Responsables y Reparto</p>
                                <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/10 rounded-full">
                                    <Users size={12} className="text-blue-500" />
                                    <span className="text-[10px] font-black text-blue-500">{responsibles.length}</span>
                                </div>
                            </div>

                            {/* Selector Desplegable */}
                            <div className="relative group">
                                <select 
                                    className="w-full bg-[#151515] border border-[var(--theme-border)] p-4 rounded-2xl outline-none focus:border-blue-500/50 text-sm font-medium text-[var(--theme-text)] appearance-none cursor-pointer"
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        if (!name || responsibles.find(r => r.name === name)) return;
                                        const newResps = [...responsibles, { name, percentage: 0 }];
                                        // Recalcular reparto equitativo
                                        const equalPct = Math.floor(100 / newResps.length);
                                        const updated = newResps.map((r, idx) => ({
                                            ...r,
                                            percentage: idx === newResps.length - 1 ? 100 - (equalPct * (newResps.length - 1)) : equalPct
                                        }));
                                        setResponsibles(updated);
                                    }}
                                    value=""
                                >
                                    <option value="" disabled>Añadir Responsable...</option>
                                    {availableResponsibles
                                        .filter(r => !responsibles.some(sel => sel.name === r.name))
                                        .map(r => (
                                            <option key={r.id} value={r.name}>{r.name}</option>
                                        ))
                                    }
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    <Plus size={16} />
                                </div>
                            </div>

                            {/* Lista de Responsables con Porcentajes */}
                            <div className="space-y-3">
                                {responsibles.map((resp, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-white/[0.02] border border-[var(--theme-border)] p-3 rounded-2xl group animate-in slide-in-from-right-2 duration-300">
                                        <div className="flex-1">
                                            <p className="text-[11px] font-bold text-[var(--theme-text)] uppercase tracking-tight">{resp.name}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="number"
                                                className="w-16 bg-[var(--theme-glass)] border border-[var(--theme-border)] p-2 rounded-xl text-center text-xs font-black text-blue-500 outline-none focus:border-blue-500"
                                                value={resp.percentage}
                                                onChange={(e) => {
                                                    const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                    const updated = [...responsibles];
                                                    updated[idx].percentage = val;
                                                    setResponsibles(updated);
                                                }}
                                            />
                                            <span className="text-[10px] font-black text-slate-600">%</span>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    const filtered = responsibles.filter((_, i) => i !== idx);
                                                    if (filtered.length > 0) {
                                                        const equalPct = Math.floor(100 / filtered.length);
                                                        const updated = filtered.map((r, i) => ({
                                                            ...r,
                                                            percentage: i === filtered.length - 1 ? 100 - (equalPct * (filtered.length - 1)) : equalPct
                                                        }));
                                                        setResponsibles(updated);
                                                    } else {
                                                        setResponsibles([]);
                                                    }
                                                }}
                                                className="p-2 text-slate-700 hover:text-rose-500 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {responsibles.length > 0 && (
                                <div className="flex justify-between items-center px-4 pt-2">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Total Repartido</p>
                                    <p className={cn(
                                        "text-xs font-black",
                                        responsibles.reduce((acc, r) => acc + r.percentage, 0) === 100 ? "text-emerald-500" : "text-rose-500"
                                    )}>
                                        {responsibles.reduce((acc, r) => acc + r.percentage, 0)}%
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Fecha y Hora de Operación */}
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Fecha y Hora</p>
                            <div className="relative">
                                <input 
                                    type="datetime-local" 
                                    className="w-full bg-[var(--theme-glass)] border border-[var(--theme-border)] p-4 rounded-2xl outline-none focus:border-blue-500/50 text-sm font-medium text-[var(--theme-text)] custom-calendar-icon"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={loading || !amount || !description || !category || responsibles.length === 0}
                            className={`w-full py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${loading || !amount || !description || !category || responsibles.length === 0 ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-[var(--theme-text)] shadow-xl shadow-blue-600/20 active:scale-95'}`}
                        >
                            {loading ? "Procesando..." : (transactionToEdit ? "Guardar Cambios" : "Registrar Operación")}
                            {!loading && <Check size={18} />}
                        </button>
                    </form>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(59, 130, 246, 0.3);
                }
                .custom-calendar-icon::-webkit-calendar-picker-indicator {
                    filter: invert(1);
                    opacity: 0.1;
                    position: absolute;
                    right: 15px;
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};