"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registerSessionToken } from "@/hooks/useSessionGuard";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isRecovering, setIsRecovering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Redirección inmediata si ya existe sesión (Seguridad Extra Cliente)
    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                setIsRedirecting(true);
                router.push("/dashboard");
            }
        };
        checkSession();
    }, [router]);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/dashboard`,
            });
            if (resetError) throw resetError;
            setMessage("Se ha enviado un enlace a tu correo. Por favor, revísalo.");
        } catch (err: any) {
            setError(err.message || "Error al enviar el correo de recuperación");
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isRegistering) {
                // LÓGICA DE REGISTRO
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { emailRedirectTo: `${window.location.origin}/dashboard` }
                });
                if (signUpError) throw signUpError;
                alert("¡Cuenta creada! Ya puedes iniciar sesión.");
                setIsRegistering(false);
            } else {
                // LÓGICA DE LOGIN
                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                
                if (signInError) throw signInError;
                
                if (data.session) {
                    console.log("Login exitoso, registrando sesión única...");
                    // Registrar token de sesión única (invalida otros dispositivos)
                    await registerSessionToken(data.session.user.id);
                    setIsRedirecting(true);
                    router.push("/dashboard");
                    router.refresh();
                }
            }
        } catch (err: any) {
            setError(err.message === "Invalid login credentials" ? "Correo o clave incorrectos" : err.message);
        } finally {
            // Solo reseteamos el loading si NO estamos redirigiendo
            setLoading(false);
        }
    };

    if (isRedirecting) {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] text-white">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full" />
                <div className="relative flex flex-col items-center gap-6">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-t-2 border-l-2 border-blue-500 rounded-full animate-spin" />
                        <div className="absolute inset-2 border-b-2 border-r-2 border-blue-400/50 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <h1 className="text-lg font-black tracking-tighter uppercase">
                            MisFinanzas<span className="text-blue-500">Personales</span>
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">
                            Sincronizando Inteligencia...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
            <div className="bg-[#111] border border-[var(--theme-border)] p-8 sm:p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl transition-all">
                
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tighter">MisFinanzasPersonales</h1>
                    <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em]">
                        {isRecovering ? "Recuperar Contraseña" : isRegistering ? "Crear nueva cuenta" : "Acceso al sistema"}
                    </p>
                </div>

                {isRecovering ? (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Correo Electrónico</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ejemplo@correo.com"
                                className="w-full bg-[var(--theme-glass)] border border-[var(--theme-border)] p-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-rose-500 text-[11px] font-bold text-center bg-rose-500/10 p-2 rounded-lg">
                                {error}
                            </p>
                        )}
                        {message && (
                            <p className="text-emerald-500 text-[11px] font-bold text-center bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                                {message}
                            </p>
                        )}

                        <div className="space-y-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                            >
                                {loading ? "Procesando..." : "Enviar Enlace"}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsRecovering(false); setError(null); setMessage(null); }}
                                className="w-full text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                            >
                                Volver al inicio de sesión
                            </button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleAuth} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Correo</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ejemplo@correo.com"
                                className="w-full bg-[var(--theme-glass)] border border-[var(--theme-border)] p-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-black uppercase text-slate-500">Contraseña</label>
                                {!isRegistering && (
                                    <button 
                                        type="button"
                                        onClick={() => { setIsRecovering(true); setError(null); setMessage(null); }}
                                        className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[var(--theme-glass)] border border-[var(--theme-border)] p-4 pr-12 rounded-2xl text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="text-rose-500 text-[11px] font-bold text-center bg-rose-500/10 p-2 rounded-lg">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
                        >
                            {loading ? "Procesando..." : isRegistering ? "Registrarme ahora" : "Entrar ahora"}
                        </button>
                    </form>
                )}

                <div className="mt-8 pt-6 border-t border-[var(--theme-border)] text-center">
                    {!isRecovering && (
                        <button 
                            onClick={() => { setIsRegistering(!isRegistering); setError(null); setMessage(null); }}
                            className="text-[var(--theme-text-muted)] hover:text-white text-xs font-bold transition-colors"
                        >
                            {isRegistering 
                                ? "¿Ya tienes cuenta? Inicia sesión" 
                                : "¿No tienes cuenta? Regístrate aquí"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}