"use client";

import { useState } from "react";
import { Lock, KeyRound, Eye, EyeOff, Sparkles, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import confetti from "canvas-confetti";

interface ForcePasswordChangeModalProps {
    isOpen: boolean;
}

export const ForcePasswordChangeModal = ({ isOpen }: ForcePasswordChangeModalProps) => {
    const { user, updateProfile } = useAuth();
    
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }
        
        if (newPassword.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Actualizar contraseña
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                setError(updateError.message);
                setLoading(false);
                return;
            }

            // Si fue exitoso, quitamos la bandera del perfil
            const profileRes = await updateProfile({ force_password_change: false });
            
            if (profileRes.success) {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#3b82f6', '#22c55e', '#ffffff', '#fbbf24'],
                    zIndex: 99999
                });
                // Recargar para que el estado de useAuth se refresque y cierre el modal
                window.location.reload();
            } else {
                setError("Error actualizando perfil. Intenta de nuevo.");
            }

        } catch (err: any) {
            setError(err.message || "Ocurrió un error inesperado.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden">
            {/* Backdrop Totalmente Opaco */}
            <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-xl pointer-events-auto" />

            <div className="relative w-full max-w-md bg-[#111] border border-amber-500/20 p-8 rounded-[2.5rem] shadow-[0_0_100px_rgba(245,158,11,0.15)] overflow-hidden flex flex-col transition-all animate-in zoom-in-95 pointer-events-auto m-4">
                
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-4 shadow-lg shadow-amber-500/20">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tighter mb-2">
                        Actualización de Seguridad
                    </h2>
                    <p className="text-[11px] font-medium text-slate-400 leading-relaxed px-2">
                        Hemos implementado nuevas medidas de seguridad en el sistema. Para continuar, es obligatorio que actualices tu contraseña en este momento.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nueva Contraseña */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                <KeyRound size={16} />
                            </div>
                            <input
                                type={showNewPw ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full bg-[var(--theme-glass)] border border-[var(--theme-border)] h-14 pl-11 pr-12 rounded-2xl text-sm font-bold text-white outline-none focus:border-amber-500/50 transition-all"
                            />
                            <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirmar Nueva Contraseña */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirmar Nueva Contraseña</label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                <Lock size={16} />
                            </div>
                            <input
                                type={showConfirmPw ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                                placeholder="Repite la nueva contraseña"
                                className={`w-full bg-[var(--theme-glass)] border h-14 pl-11 pr-12 rounded-2xl text-sm font-bold text-white outline-none transition-all ${
                                    confirmPassword && confirmPassword !== newPassword
                                        ? 'border-rose-500/50 focus:border-rose-500'
                                        : 'border-[var(--theme-border)] focus:border-amber-500/50'
                                }`}
                            />
                            <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl mt-4">
                            <p className="text-[11px] text-rose-400 font-bold text-center">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6}
                        className="w-full mt-4 py-4 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-400 text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {loading ? <Sparkles className="animate-spin" size={16} /> : <KeyRound size={16} />}
                        {loading ? 'Guardando...' : 'Cambiar y Continuar'}
                    </button>
                </form>
            </div>
        </div>
    );
};
