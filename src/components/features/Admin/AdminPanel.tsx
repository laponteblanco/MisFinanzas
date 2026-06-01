"use client";

import React, { useState, useEffect } from "react";
import { 
    X, Key, Plus, Copy, Check, ShieldCheck, RefreshCw, Zap, 
    BarChart3, Users, Activity, Database 
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { getAdminStats } from "@/app/actions/adminActions";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const AdminPanel = ({ isOpen, onClose }: AdminPanelProps) => {
    const [activeTab, setActiveTab] = useState<'keys' | 'stats'>('stats');

    // Keys State
    const [plans, setPlans] = useState<any[]>([]);
    const [keys, setKeys] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState("");
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Stats State
    const [stats, setStats] = useState<any>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsError, setStatsError] = useState<string | null>(null);

    const fetchData = async () => {
        // Fetch Keys
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

        // Fetch Stats
        setStatsLoading(true);
        try {
            const data = await getAdminStats();
            setStats(data);
            setStatsError(null);
        } catch (err: any) {
            setStatsError(err.message);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchData();
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
            fetchData();
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
            <div className="bg-[#0a0a0a] border border-[var(--theme-border)] w-full max-w-3xl rounded-[3rem] overflow-hidden shadow-[0_0_80px_-20px_rgba(59,130,246,0.3)] flex flex-col max-h-[90vh]">
                
                {/* HEADER */}
                <div className="p-8 pb-0 shrink-0">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30">
                                <ShieldCheck size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight text-[var(--theme-text)] uppercase italic">Alta Gerencia</h3>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Centro de Control Global</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-[var(--theme-glass)] hover:bg-white/10 rounded-full text-slate-500 transition-all border border-[var(--theme-border)]">
                            <X size={20} />
                        </button>
                    </div>

                    {/* TABS */}
                    <div className="flex gap-4 border-b border-[var(--theme-border)]">
                        <button 
                            onClick={() => setActiveTab('stats')}
                            className={cn(
                                "pb-4 text-xs font-black uppercase tracking-widest transition-all relative",
                                activeTab === 'stats' ? "text-blue-500" : "text-slate-500 hover:text-white"
                            )}
                        >
                            <span className="flex items-center gap-2"><BarChart3 size={16} /> Métricas</span>
                            {activeTab === 'stats' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full shadow-[0_0_10px_rgba(59,130,246,1)]" />}
                        </button>
                        <button 
                            onClick={() => setActiveTab('keys')}
                            className={cn(
                                "pb-4 text-xs font-black uppercase tracking-widest transition-all relative",
                                activeTab === 'keys' ? "text-blue-500" : "text-slate-500 hover:text-white"
                            )}
                        >
                            <span className="flex items-center gap-2"><Key size={16} /> Llaves Maestras</span>
                            {activeTab === 'keys' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full shadow-[0_0_10px_rgba(59,130,246,1)]" />}
                        </button>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    
                    {/* TAB: ESTADÍSTICAS */}
                    {activeTab === 'stats' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                            {statsError && (
                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs font-bold text-center">
                                    {statsError}
                                </div>
                            )}

                            {statsLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">
                                    <RefreshCw size={32} className="animate-spin text-blue-500" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Sincronizando Mando Central...</p>
                                </div>
                            ) : stats ? (
                                <>
                                    {/* KPI CARDS */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-white/[0.02] border border-[var(--theme-border)] p-6 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group">
                                            <Users size={60} className="absolute -right-4 -top-4 opacity-5 text-blue-500 group-hover:scale-110 transition-transform" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 text-center">Total Usuarios</p>
                                            <h4 className="text-4xl font-black text-white">{stats.totalUsers}</h4>
                                        </div>
                                        <div className="bg-white/[0.02] border border-[var(--theme-border)] p-6 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group">
                                            <Activity size={60} className="absolute -right-4 -top-4 opacity-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 text-center">Usuarios Activos</p>
                                            <h4 className="text-4xl font-black text-emerald-400">{stats.activeUsers}</h4>
                                        </div>
                                        <div className="bg-white/[0.02] border border-[var(--theme-border)] p-6 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group">
                                            <ShieldCheck size={60} className="absolute -right-4 -top-4 opacity-5 text-rose-500 group-hover:scale-110 transition-transform" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 text-center">Pruebas Expiradas</p>
                                            <h4 className="text-4xl font-black text-rose-400">{stats.expiredTrialUsers || 0}</h4>
                                        </div>
                                        <div className="bg-white/[0.02] border border-[var(--theme-border)] p-6 rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden group">
                                            <Database size={60} className="absolute -right-4 -top-4 opacity-5 text-purple-500 group-hover:scale-110 transition-transform" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 text-center">Transacciones</p>
                                            <h4 className="text-4xl font-black text-purple-400">{stats.totalTransactions}</h4>
                                        </div>
                                    </div>

                                    {/* GRÁFICOS */}
                                    <div className="bg-white/[0.02] border border-[var(--theme-border)] p-8 rounded-[2.5rem]">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center justify-center gap-2">
                                            Distribución de Planes
                                        </h4>
                                        <div className="h-[250px] w-full">
                                            {stats.planDistribution && stats.planDistribution.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={stats.planDistribution}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={100}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                            stroke="none"
                                                        >
                                                            {stats.planDistribution.map((entry: any, index: number) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip 
                                                            contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '16px' }}
                                                            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-xs font-bold text-slate-600 uppercase tracking-widest">
                                                    No hay datos suficientes
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* LEYENDA MANUAL */}
                                        <div className="flex flex-wrap justify-center gap-4 mt-6">
                                            {stats.planDistribution?.map((entry: any, index: number) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                                    <span className="text-[10px] font-black uppercase text-slate-400">{entry.name} ({entry.value})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    )}

                    {/* TAB: LLAVES MAESTRAS */}
                    {activeTab === 'keys' && (
                        <div className="space-y-10 animate-in slide-in-from-left-4 duration-300">
                            {/* SECCIÓN GENERADOR */}
                            <div className="bg-white/[0.02] border border-[var(--theme-border)] p-8 rounded-[2rem] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                                    <Zap size={80} className="text-blue-600" />
                                </div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-2">
                                    <Plus size={14} /> Nueva Activación
                                </h4>
                                <div className="flex flex-col md:flex-row gap-4 relative z-10">
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
                                                    "w-2 h-2 rounded-full shrink-0",
                                                    k.is_used ? "bg-slate-700" : "bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                                )} />
                                                <div>
                                                    <code className="text-sm font-black text-[var(--theme-text)]/90 tracking-wider font-mono break-all">{k.key_code}</code>
                                                    <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">{k.plans?.name} • {k.is_used ? 'REDIMIDA' : 'DISPONIBLE'}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => copyToClipboard(k.key_code)}
                                                className="p-3 hover:bg-blue-600/20 text-slate-600 hover:text-blue-500 rounded-xl transition-all shrink-0"
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
                    )}
                </div>
            </div>
        </div>
    );
};
