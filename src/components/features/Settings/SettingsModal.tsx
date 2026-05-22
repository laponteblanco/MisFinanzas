"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Tag, Users, Check, Sparkles, Pencil, MessageCircle, HelpCircle, User, Save, Palette } from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/store/useSettings";
import { useTheme, ThemeColor, ThemeBackground } from "@/store/useTheme";
import { formatNumberWithDots, parseNumericString } from "@/lib/utils";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
    const { user, profile, updateProfile } = useAuth();
    const { categories, responsibles, addCategory, updateCategory, deleteCategory, addResponsible, updateResponsible, deleteResponsible, fetchSettings } = useSettings();
    const { theme, setTheme, bgTheme, setBgTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<'categories' | 'responsibles' | 'account' | 'soporte'>('categories');
    const [newName, setNewName] = useState("");
    const [tempDisplayName, setTempDisplayName] = useState(profile?.display_name || "");
    const [newEmoji, setNewEmoji] = useState("💰");
    const [newBudget, setNewBudget] = useState<string>("");
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editingResponsible, setEditingResponsible] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const triggerSuccess = () => {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#22c55e', '#ffffff', '#fbbf24'],
            zIndex: 9999
        });
    };

    useEffect(() => {
        if (isOpen && user?.id) {
            fetchSettings(user.id);
            setTempDisplayName(profile?.display_name || "");
        }
    }, [isOpen, user?.id, fetchSettings, profile?.display_name]);

    if (!isOpen) return null;

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newName.trim()) return;

        if (activeTab === 'categories') {
            const budgetVal = parseFloat(newBudget) || 0;
            if (editingCategory) {
                await updateCategory(editingCategory, { name: newName.trim(), emoji: newEmoji, budget: budgetVal });
                setEditingCategory(null);
            } else {
                await addCategory(user.id, newName.trim(), newEmoji, budgetVal);
            }
            setNewName("");
            setNewEmoji("💰");
            setNewBudget("");
        } else {
            if (editingResponsible) {
                await updateResponsible(editingResponsible, newName.trim());
                setEditingResponsible(null);
            } else {
                await addResponsible(user.id, newName.trim());
            }
            setNewName("");
        }
        triggerSuccess();
    };

    const startEditing = (item: any) => {
        if (activeTab === 'categories') {
            setEditingCategory(item.id);
            setEditingResponsible(null);
            setNewName(item.name);
            setNewEmoji(item.emoji || "💰");
            setNewBudget(item.budget?.toString() || "");
        } else {
            setEditingResponsible(item.id);
            setEditingCategory(null);
            setNewName(item.name);
        }
    };

    const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const start = input.selectionStart || 0;
        const oldVal = input.value;
        const cleanVal = parseNumericString(oldVal);

        setNewBudget(cleanVal.toString());

        // Sincronizar cursor después del render
        setTimeout(() => {
            const newVal = formatNumberWithDots(cleanVal);
            const diff = newVal.length - oldVal.length;
            input.setSelectionRange(start + diff, start + diff);
        }, 0);
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-auto overflow-hidden animate-in fade-in duration-300">
            {/* Backdrop Totalmente Opaco para Ocultar el Resto */}
            <div className="absolute inset-0 bg-[var(--theme-bg)] pointer-events-auto" onClick={onClose} />

            <div className="relative w-full h-full md:h-[90vh] md:max-w-5xl bg-[var(--theme-surface)] md:border md:border-[var(--theme-border)] md:rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row transition-all duration-500 scale-95 animate-in zoom-in-95 pointer-events-auto">

                {/* Sidebar del Modal */}
                <aside className="w-full md:w-64 bg-[var(--theme-glass)] border-r border-[var(--theme-border)] p-8 flex flex-col gap-6">
                    <div>
                        <h2 className="text-xl font-black text-[var(--theme-text)] tracking-tighter">Ajustes</h2>
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1">Configuración Core</p>
                    </div>

                    <nav className="flex md:flex-col gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0 w-full flex-nowrap shrink-0 snap-x">
                        <button
                            onClick={() => setActiveTab('categories')}
                            className={`flex items-center justify-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 snap-center min-w-[120px] md:min-w-0 md:justify-start ${activeTab === 'categories' ? 'bg-blue-600 text-[var(--theme-text)] shadow-lg shadow-blue-600/20' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-glass)]'}`}
                        >
                            <Tag size={16} /> Categorías
                        </button>
                        <button
                            onClick={() => setActiveTab('responsibles')}
                            className={`flex items-center justify-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 snap-center min-w-[130px] md:min-w-0 md:justify-start ${activeTab === 'responsibles' ? 'bg-blue-600 text-[var(--theme-text)] shadow-lg shadow-blue-600/20' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-glass)]'}`}
                        >
                            <Users size={16} /> Responsables
                        </button>
                        <button
                            onClick={() => setActiveTab('account')}
                            className={`flex items-center justify-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 snap-center min-w-[120px] md:min-w-0 md:justify-start ${activeTab === 'account' ? 'bg-blue-600 text-[var(--theme-text)] shadow-lg shadow-blue-600/20' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-glass)]'}`}
                        >
                            <User size={16} /> Mi Cuenta
                        </button>
                        <button
                            onClick={() => setActiveTab('soporte')}
                            className={`flex items-center justify-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 snap-center min-w-[120px] md:min-w-0 md:justify-start ${activeTab === 'soporte' ? 'bg-blue-600 text-[var(--theme-text)] shadow-lg shadow-blue-600/20' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text)] hover:bg-[var(--theme-glass)]'}`}
                        >
                            <HelpCircle size={16} /> Soporte
                        </button>
                    </nav>

                    <div className="mt-auto hidden md:block">
                        <div className="p-4 bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/10 rounded-2xl">
                            <Sparkles size={20} className="text-blue-400 mb-2" />
                            <p className="text-[10px] font-medium text-[var(--theme-text-muted)] leading-relaxed">
                                Personaliza tus listas para capturar datos con precisión gerencial.
                            </p>
                        </div>
                    </div>
                </aside>

                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-center p-8 border-b border-[var(--theme-border)] bg-white/[0.02]">
                        <h3 className="text-sm font-black uppercase tracking-widest text-[var(--theme-text-muted)]">
                            {activeTab === 'categories' ? 'Mis Categorías' : activeTab === 'responsibles' ? 'Mis Responsables' : activeTab === 'account' ? 'Configuración de Perfil' : 'Soporte Técnico'}
                        </h3>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-500">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Formulario de Adición - Oculto en Soporte y Cuenta */}
                    {(activeTab !== 'soporte' && activeTab !== 'account') && (
                        <form onSubmit={handleAdd} className="p-8 border-b border-[var(--theme-border)] bg-white/[0.01]">
                            <div className="flex flex-row gap-2 sm:gap-3 w-full">
                                {activeTab === 'categories' && (
                                    <div className="relative shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className="w-12 h-12 bg-[var(--theme-glass)] border border-[var(--theme-border)] rounded-xl flex items-center justify-center text-xl hover:bg-white/10 shrink-0"
                                        >
                                            {newEmoji}
                                        </button>
                                        {showEmojiPicker && (
                                            <div className="absolute top-14 left-0 bg-[#080808]/95 backdrop-blur-xl border border-[var(--theme-border)] rounded-[1.5rem] z-[110] shadow-2xl w-[280px] p-4 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
                                                <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                                                    {[
                                                        { label: 'Finanzas', list: ['💰', '💸', '💳', '🏦', '📈', '📉', '💎', '🧾'] },
                                                        { label: 'Hogar', list: ['🏠', '🛌', '🛋️', '🧹', '🧺', '🚿', '🔑', '🔌'] },
                                                        { label: 'Vida', list: ['🍔', '☕', '🍺', '🍕', '🍎', '🛒', '🏥', '💊'] },
                                                        { label: 'Transporte', list: ['🚗', '🚲', '🛵', '⛽', '🛫', '🚕', '🚚', '🚉'] },
                                                        { label: 'Ocio', list: ['🎮', '🎬', '🎵', '🎨', '⚽', '🏖️', '📸', '🏋️'] },
                                                        { label: 'Otros', list: ['💻', '📱', '📑', '✉️', '📞', '🛠️', '🎁', '✨'] },
                                                    ].map(cat => (
                                                        <div key={cat.label} className="space-y-1.5">
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-1">{cat.label}</p>
                                                            <div className="grid grid-cols-4 gap-1">
                                                                {cat.list.map(e => (
                                                                    <button key={e} type="button" onClick={() => { setNewEmoji(e); setShowEmojiPicker(false); }} className="h-10 w-10 hover:bg-white/10 rounded-xl flex items-center justify-center text-lg transition-colors">{e}</button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="border-t border-[var(--theme-border)] pt-3 flex flex-col gap-2">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 px-1">O pega el tuyo</p>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Copia/pega cualquier emoji..."
                                                        className="w-full bg-white/[0.03] border border-[var(--theme-border)] rounded-xl h-10 px-3 text-sm outline-none focus:border-blue-500/30 text-center"
                                                        maxLength={2}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val) {
                                                                setNewEmoji(val);
                                                                setShowEmojiPicker(false);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="flex-1 flex flex-col sm:flex-row gap-2 sm:gap-3 min-w-0">
                                    <div className="flex-1 min-w-0 relative flex items-center">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder={editingCategory ? "Nombre de categoría..." : activeTab === 'categories' ? "Añadir categoría..." : "Añadir responsable..."}
                                            className="w-full min-w-0 bg-[var(--theme-glass)] border border-[var(--theme-border)] h-12 px-4 pr-10 rounded-xl text-sm font-bold text-[var(--theme-text)] outline-none focus:border-blue-500/30 transition-all"
                                        />
                                        {editingCategory && (
                                            <button
                                                type="button"
                                                onClick={() => { 
                                                    setEditingCategory(null); 
                                                    setEditingResponsible(null); 
                                                    setNewName(""); 
                                                    setNewBudget(""); 
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[var(--theme-text)] p-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-2 items-center w-full sm:w-auto shrink-0">
                                        {activeTab === 'categories' && (
                                            <input
                                                type="text"
                                                value={formatNumberWithDots(newBudget)}
                                                onChange={handleBudgetChange}
                                                placeholder="$ Presupuesto"
                                                className="flex-1 sm:flex-none w-full sm:w-32 min-w-0 bg-[var(--theme-glass)] border border-[var(--theme-border)] h-12 px-4 rounded-xl text-sm font-bold text-emerald-400 outline-none focus:border-emerald-500/30 transition-all placeholder:text-emerald-500/30"
                                            />
                                        )}
                                        <button
                                            type="submit"
                                            className={`px-5 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-xl h-12 min-w-[60px] shrink-0 ${(editingCategory || editingResponsible) ? 'bg-emerald-500 text-[var(--theme-text)]' : 'bg-white text-black hover:bg-blue-600 hover:text-[var(--theme-text)]'}`}
                                        >
                                            {(editingCategory || editingResponsible) ? <Check size={18} /> : <Plus size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* Lista Scrolleable */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-3 custom-scrollbar">
                        {activeTab === 'categories' ? (
                            categories.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-4 bg-white/[0.03] border border-[var(--theme-border)] rounded-2xl group hover:border-[var(--theme-border)] transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-[var(--theme-glass)] rounded-xl flex items-center justify-center text-xl">
                                            {c.emoji || '📦'}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[var(--theme-text)] tracking-tight">{c.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[8px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10">
                                                    Budget: ${(c.budget || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => startEditing(c)}
                                            className="p-2 text-blue-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-blue-500/10 rounded-lg transition-all"
                                            title="Editar Categoría"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => deleteCategory(c.id)} className="p-2 text-rose-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-rose-500/10 rounded-lg transition-all" title="Eliminar">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : activeTab === 'responsibles' ? (
                            responsibles.map(r => (
                                <div key={r.id} className="flex items-center justify-between p-4 bg-white/[0.03] border border-[var(--theme-border)] rounded-2xl group hover:border-[var(--theme-border)] transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                                            <Users size={18} />
                                        </div>
                                        <p className="text-xs font-bold text-[var(--theme-text)] tracking-tight">{r.name}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => startEditing(r)}
                                            className="p-2 text-blue-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-blue-500/10 rounded-lg transition-all"
                                            title="Editar Responsable"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => deleteResponsible(r.id)} className="p-2 text-rose-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-rose-500/10 rounded-lg transition-all" title="Eliminar">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : activeTab === 'soporte' ? (
                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center animate-in fade-in slide-in-from-bottom-5 duration-500">
                                <div className="w-20 h-20 bg-[var(--theme-glass)] rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-[var(--theme-border)]">
                                    <MessageCircle size={40} className="text-[var(--theme-text)]" strokeWidth={1.5} />
                                </div>
                                
                                <h4 className="text-2xl font-black text-[var(--theme-text)] tracking-tighter mb-4">Soporte Técnico</h4>
                                
                                <p className="text-sm text-[var(--theme-text-muted)] max-w-sm leading-relaxed mb-8">
                                    Estamos disponibles para ayudarte. Si requieres asistencia técnica, deseas comprar una licencia o tienes alguna duda, escríbenos a WhatsApp sin compromiso.
                                </p>

                                <a 
                                    href="https://wa.me/573144089333" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#20ba5a] text-[var(--theme-text)] rounded-[2rem] font-bold shadow-[0_20px_50px_rgba(37,211,102,0.3)] transition-all hover:scale-105 active:scale-95 mb-10"
                                >
                                    <MessageCircle size={24} fill="white" />
                                    Abrir Chat en WhatsApp
                                </a>

                                <div className="w-full bg-white/[0.02] border border-[var(--theme-border)] rounded-[2.5rem] p-8 text-left max-w-md">
                                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-4 flex items-center gap-2">
                                        <Sparkles size={14} /> Nuestro Servicio Incluye:
                                    </h5>
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-3 text-xs text-slate-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                            <span>Respuesta rápida garantizada.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-xs text-slate-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                            <span>Soporte personalizado paso a paso.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-xs text-slate-300">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                            <span>Asesoría sobre uso y suscripciones.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        ) : activeTab === 'account' ? (
                            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-blue-600/10 rounded-lg">
                                            <User size={18} className="text-blue-400" />
                                        </div>
                                        <h4 className="text-sm font-black text-[var(--theme-text)] uppercase tracking-widest">Información Personal</h4>
                                    </div>
                                    
                                    <div className="space-y-6 bg-white/[0.02] border border-[var(--theme-border)] rounded-3xl p-6 sm:p-8">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tu Nombre de Usuario</label>
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <input 
                                                    type="text"
                                                    value={tempDisplayName}
                                                    onChange={(e) => setTempDisplayName(e.target.value)}
                                                    placeholder="Escribe tu nombre..."
                                                    className="flex-1 bg-[var(--theme-glass)] border border-[var(--theme-border)] h-14 px-6 rounded-2xl text-base font-bold text-[var(--theme-text)] outline-none focus:border-blue-500/30 transition-all"
                                                />
                                                <button
                                                    disabled={isSaving}
                                                    onClick={async () => {
                                                        setIsSaving(true);
                                                        try {
                                                            const result = await updateProfile({ display_name: tempDisplayName });
                                                            if (result.success) {
                                                                triggerSuccess();
                                                            } else {
                                                                console.error("No se pudo guardar:", result.error);
                                                            }
                                                        } catch (err) {
                                                            console.error("Fallo crítico:", err);
                                                        } finally {
                                                            setIsSaving(false);
                                                        }
                                                    }}
                                                    className={`px-8 py-4 ${isSaving ? 'bg-slate-700 cursor-wait' : 'bg-blue-600 hover:bg-blue-500'} text-[var(--theme-text)] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2`}
                                                >
                                                    {isSaving ? <Sparkles className="animate-spin" size={16} /> : <Save size={16} />}
                                                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-2 px-1 leading-relaxed italic">
                                                Este es el nombre que aparecerá en el saludo de tu dashboard y reportes ejecutivos.
                                            </p>
                                        </div>

                                        <div className="h-px bg-[var(--theme-glass)] w-full my-2" />

                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email de Acceso</label>
                                            <div className="bg-white/[0.03] border border-[var(--theme-border)] h-14 px-6 rounded-2xl flex items-center">
                                                <span className="text-sm font-medium text-[var(--theme-text-muted)]">{user?.email}</span>
                                            </div>
                                        </div>

                                        {/* Selector de Color de Letra / Acento */}
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-2">
                                                <Palette size={14} className="text-[var(--theme-text-muted)]" />
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Color de Acento (Letra)</label>
                                            </div>
                                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                                {[
                                                    { id: 'blue', hex: '#3b82f6', name: 'Azul' },
                                                    { id: 'emerald', hex: '#10b981', name: 'Esmeralda' },
                                                    { id: 'violet', hex: '#8b5cf6', name: 'Violeta' },
                                                    { id: 'amber', hex: '#f59e0b', name: 'Ámbar' },
                                                    { id: 'rose', hex: '#f43f5e', name: 'Rosa' },
                                                    { id: 'cyan', hex: '#06b6d4', name: 'Cian' },
                                                ].map((t) => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setTheme(t.id as ThemeColor)}
                                                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${theme === t.id ? 'bg-white/10 border-white/20 scale-105 shadow-xl' : 'bg-white/[0.02] border-[var(--theme-border)] hover:bg-[var(--theme-glass)]'}`}
                                                    >
                                                        <div 
                                                            className={`w-6 h-6 rounded-full shadow-inner flex items-center justify-center`}
                                                            style={{ backgroundColor: t.hex }}
                                                        >
                                                            {theme === t.id && <Check size={12} className="text-[var(--theme-text)] drop-shadow-md" />}
                                                        </div>
                                                        <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${theme === t.id ? 'text-[var(--theme-text)]' : 'text-slate-500'}`}>{t.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-slate-500 px-1 leading-relaxed italic">
                                                Cambia el color de los botones, iconos y elementos destacados.
                                            </p>
                                        </div>

                                        <div className="h-px bg-[var(--theme-glass)] w-full my-2" />

                                        {/* Selector de Fondo (Tema) */}
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-2">
                                                <Palette size={14} className="text-[var(--theme-text-muted)]" />
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fondo del Sistema (Tema)</label>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {[
                                                    { id: 'onyx', color: '#0a0a0a', name: 'Onyx' },
                                                    { id: 'pure', color: '#000000', name: 'Pure Black' },
                                                    { id: 'nordic', color: '#ffffff', name: 'Nordic Light' },
                                                    { id: 'ocean', color: '#0f172a', name: 'Deep Ocean' },
                                                    { id: 'forest', color: '#064e3b', name: 'Deep Forest' },
                                                    { id: 'wine', color: '#450a0a', name: 'Deep Wine' },
                                                ].map((b) => (
                                                    <button
                                                        key={b.id}
                                                        onClick={() => setBgTheme(b.id as ThemeBackground)}
                                                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${bgTheme === b.id ? 'bg-white/10 border-white/20 scale-105 shadow-xl' : 'bg-white/[0.02] border-[var(--theme-border)] hover:bg-[var(--theme-glass)]'}`}
                                                    >
                                                        <div 
                                                            className={`w-full h-8 rounded-lg shadow-inner flex items-center justify-center border border-[var(--theme-border)]`}
                                                            style={{ backgroundColor: b.color }}
                                                        >
                                                            {bgTheme === b.id && <Check size={12} className={bgTheme === 'nordic' ? 'text-black' : 'text-[var(--theme-text)]'} />}
                                                        </div>
                                                        <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${bgTheme === b.id ? (bgTheme === 'nordic' ? 'text-black' : 'text-white') : 'text-slate-500'}`}>{b.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-slate-500 px-1 leading-relaxed italic">
                                                Selecciona el estilo de fondo general para toda la aplicación.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl">
                                    <div className="flex gap-4">
                                        <Sparkles className="text-amber-400 shrink-0" size={20} />
                                        <div>
                                            <h5 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1 italic">Pro Tip</h5>
                                            <p className="text-[11px] text-[var(--theme-text-muted)] leading-relaxed font-medium">
                                                Mantener tu perfil actualizado ayuda a la AI a personalizar los consejos y resúmenes financieros mensuales según tu estilo de vida.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {(activeTab === 'categories' ? categories.length : activeTab === 'responsibles' ? responsibles.length : 0) === 0 && activeTab !== 'soporte' && (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-600 gap-4 opacity-50">
                                <div className="p-4 bg-[var(--theme-glass)] rounded-full">
                                    <Sparkles size={32} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest">Nada configurado todavía</p>
                            </div>
                        )}
                    </div>
                    {/* Fixed Bottom Close Button */}
                    <div className="p-4 sm:p-6 border-t border-[var(--theme-border)] bg-[var(--theme-surface)] shrink-0 z-10" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                        <button 
                            onClick={onClose} 
                            className="w-full flex items-center justify-center gap-2 py-4 bg-[var(--theme-glass)] hover:bg-white/10 border border-[var(--theme-border)] text-[var(--theme-text)] rounded-2xl font-bold shadow-lg transition-all active:scale-95"
                        >
                            <X size={18} />
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
