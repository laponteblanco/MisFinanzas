"use client";

import React, { useState, useEffect } from "react";
import { 
    X, 
    Key, 
    Plus, 
    Copy, 
    Check, 
    ShieldCheck, 
    RefreshCw, 
    CreditCard,
    Zap
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AdminPanel = ({ isOpen, onClose }: AdminPanelProps) => {
    const [plans, setPlans] = useState<any[]>([]);
    const [keys, setKeys] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState("");
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const fetchAdminData = async () => {
        setLoading(true);
        const { data: plansData } = await supabase.from('plans').select('*').neq('billing_cycle', 'trial');
        const { data: keysData } = await supabase
            .from('license_keys')
            .select('*, plans(name)')
            .order('created_at', { ascending: false })
            .limit(10);

        if (plansData) setPlans(plansData);
        if (keysData) setKeys(keysData);
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) fetchAdminData();
    }, [isOpen]);

    const generateKey = async () => {
        if (!selectedPlan) return;
        setLoading(true);
        
        // Formato Profesional: MFP-XXXX-XXXX-XXXX
        const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        const randomPart = () => Array.from({length: 4}, () => charset[Math.floor(Math.random() * charset.length)]).join('');
        const keyCode = `MFP-${randomPart()}-${randomPart()}-${randomPart()}`;

        const { error } = await supabase.from('license_keys').insert({
            key_code: keyCode,
            plan_id: selectedPlan,
            is_used: false
        });

        if (!error) {
            fetchAdminData();
            setSelectedPlan("");
        }
        setLoading(false);
    };

    const copyToClipboard = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-3xl animate-in fade-in duration-300">
            <div className="bg-[#0a0a0a] border border-[var(--theme-border)] w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-[0_0_80px_-20px_rgba(59,130,246,0.3)]">
                <div className="p-10">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30">
                                <ShieldCheck size={20} className="text-[var(--theme-text)]" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight text-[var(--theme-text)] uppercase italic">Alta Gerencia</h3>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Generador de Llaves Maestras</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-[var(--theme-glass)] hover:bg-white/10 rounded-full text-slate-500 transition-all border border-[var(--theme-border)]">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-10">
                        {/* SECCIÓN GENERADOR */}
                        <div className="bg-white/[0.02] border border-[var(--theme-border)] p-8 rounded-[2rem] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                                <Zap size={80} className="text-blue-600" />
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-2">
                                <Plus size={14} /> Nueva Activación
                            </h4>
                            <div className="flex flex-col md:flex-row gap-4">
                                <select 
                                    className="flex-1 bg-[var(--theme-glass)] border border-[var(--theme-border)] p-4 rounded-2xl text-xs font-bold uppercase tracking-widest focus:border-blue-500/50 outline-none transition-all"
                                    value={selectedPlan}
                                    onChange={(e) => setSelectedPlan(e.target.value)}
                                >
                                    <option value="">Selecciona el Nivel Pro...</option>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <button 
                                    onClick={generateKey}
                                    disabled={!selectedPlan || loading}
                                    className="px-8 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--theme-text)] transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2 justify-center"
                                >
                                    <Key size={16} /> Generar Llave
                                </button>
                            </div>
                        </div>

                        {/* LISTA DE LLAVES RECIENTES */}
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 flex items-center gap-2">
                                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Auditoría de Llaves
                            </h4>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {keys.map((k) => (
                                    <div key={k.id} className="bg-white/[0.01] border border-[var(--theme-border)] p-4 rounded-2xl flex items-center justify-between group hover:bg-white/[0.03] transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                k.is_used ? "bg-slate-700" : "bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                            )} />
                                            <div>
                                                <code className="text-sm font-black text-[var(--theme-text)]/90 tracking-wider font-mono">{k.key_code}</code>
                                                <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">{k.plans?.name} • {k.is_used ? 'REDIMIDA' : 'DISPONIBLE'}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => copyToClipboard(k.key_code)}
                                            className="p-2 hover:bg-blue-600/20 text-slate-600 hover:text-blue-500 rounded-xl transition-all"
                                        >
                                            {copiedKey === k.key_code ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                ))}
                                {keys.length === 0 && !loading && (
                                    <div className="text-center py-10 opacity-30 text-[10px] font-bold uppercase tracking-widest">
                                        No hay llaves generadas todavía
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
