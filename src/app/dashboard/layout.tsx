"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useLicense } from "@/hooks/useLicense";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { useTransactions } from "@/store/useTransactions";
import { TransactionForm } from "@/components/features/Transactions/TransactionForm";
import { AIFab } from "@/components/shared/AIFab";
import dynamic from "next/dynamic";
import { SettingsModal } from "@/components/features/Settings/SettingsModal";
const AdminPanel = dynamic(() => import("@/components/features/Admin/AdminPanel").then(mod => mod.AdminPanel), { ssr: false });
import { PricingGlass } from "@/components/features/Pricing/PricingGlass";
import { ForcePasswordChangeModal } from "@/components/features/Auth/ForcePasswordChangeModal";
import { TrialBanner } from "@/components/features/Pricing/TrialBanner";
import { DashboardSkeleton } from "@/components/shared/DashboardSkeleton";
import { motion } from "framer-motion";
import { GlobalRemindersAlert } from "@/components/features/Reminders/GlobalRemindersAlert";
import { cn } from "@/lib/utils";
import { 
    LogOut, 
    LayoutDashboard, 
    Settings, 
    History,
    ShieldCheck,
    Target,
    HelpCircle
} from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, profile, loading: authLoading, signOut } = useAuth();
    const { has_active_access: originalAccess, isInitialized, plan_name } = useLicense();
    const { kicked: sessionKicked } = useSessionGuard();
    const pathname = usePathname();
    
    const isAdmin = profile?.role === 'admin';
    const has_active_access = isAdmin || originalAccess;
    
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const displayName = profile?.display_name || "Usuario";

    const { isFormOpen, setIsFormOpen, fetchTransactions, transactions } = useTransactions();
    const router = useRouter();

    // Sincronización: Cerrar modales al navegar
    useEffect(() => {
        setIsSettingsOpen(false);
        setIsAdminOpen(false);
        setIsFormOpen(false);
    }, [pathname, setIsFormOpen]);

    useEffect(() => {
        if (user?.id && transactions.length === 0) {
            fetchTransactions(user.id);
        }
    }, [user?.id, fetchTransactions, transactions.length]);

    // Redirección si no hay usuario después de cargar la sesión
    useEffect(() => {
        if (!authLoading && !user) {
            console.log("No authenticated user found. Redirecting to login...");
            router.push("/login");
        }
    }, [authLoading, user, router]);

    if (authLoading || (user && !isInitialized && !isAdmin)) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[var(--theme-surface)] text-[var(--theme-text)] font-sans selection:bg-blue-500/30 relative pb-[80px] landscape:pb-[56px] md:pb-0 overflow-x-hidden transition-colors duration-500">
            <div className="fixed top-0 left-0 right-0 z-[200]">
                <TrialBanner />
            </div>

            {!has_active_access && !isAdmin && (
                <PricingGlass onSubscribe={(id) => window.location.href = `/checkout?priceId=${id}`} />
            )}

            <aside className={cn(
                "w-full md:w-20 bg-[var(--theme-glass)] border-t md:border-r md:border-t-0 border-[var(--theme-border)] flex flex-row md:flex-col items-center justify-around md:justify-between p-4 landscape:p-2 md:py-8 fixed bottom-0 left-0 right-0 md:sticky md:top-0 md:h-screen z-[500] backdrop-blur-xl transition-all",
                (!has_active_access && !isAdmin) && "blur-md opacity-40 pointer-events-none"
            )}>
                <div className="hidden md:block text-2xl font-black text-blue-500 tracking-tighter">MFP</div>
                <nav className="flex w-full md:w-auto flex-row md:flex-col items-center justify-around md:gap-8 min-h-[60px] landscape:min-h-[40px]">
                    <Link href="/dashboard" className={cn(
                        "transition-all min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl md:w-full md:py-3 cursor-pointer relative group",
                        pathname === "/dashboard" 
                            ? "bg-blue-600/10 text-blue-500 shadow-[inset_0_0_10px_rgba(59,130,246,0.05)]" 
                            : "text-slate-500 hover:text-blue-500 hover:scale-110"
                    )}>
                        <LayoutDashboard size={24} />
                        {pathname === "/dashboard" && (
                            <motion.div layoutId="nav-glow" className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full hidden md:block" />
                        )}
                    </Link>
                    <Link href="/dashboard/transactions" className={cn(
                        "transition-all min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl md:w-full md:py-3 cursor-pointer relative",
                        pathname === "/dashboard/transactions" 
                            ? "bg-blue-600/10 text-blue-500 shadow-[inset_0_0_10px_rgba(59,130,246,0.05)]" 
                            : "text-slate-500 hover:text-white"
                    )}>
                        <History size={24} />
                        {pathname === "/dashboard/transactions" && (
                            <motion.div layoutId="nav-glow" className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full hidden md:block" />
                        )}
                    </Link>

                    <button onClick={() => setIsSettingsOpen(true)} className={cn(
                        "transition-all border border-transparent p-2 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center md:w-full md:py-3 cursor-pointer relative",
                        isSettingsOpen 
                            ? "bg-blue-600/10 text-blue-500 border-blue-500/20" 
                            : "text-slate-500 hover:text-white hover:border-[var(--theme-border)]"
                    )}>
                        <Settings size={24} />
                        {isSettingsOpen && (
                            <motion.div layoutId="nav-glow" className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full hidden md:block" />
                        )}
                    </button>

                    {profile?.role === 'admin' && (
                        <button 
                            onClick={() => setIsAdminOpen(true)} 
                            className={cn(
                                "transition-all p-3 rounded-xl border min-w-[44px] min-h-[44px] flex items-center justify-center md:w-full md:py-3 cursor-pointer relative",
                                isAdminOpen 
                                    ? "bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-lg shadow-blue-500/10" 
                                    : "text-blue-500/60 bg-blue-600/5 border-blue-500/10 hover:bg-blue-600/10 hover:text-blue-500"
                            )}
                            title="Alta Gerencia"
                        >
                            <ShieldCheck size={24} />
                            {isAdminOpen && (
                                <motion.div layoutId="nav-glow" className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full hidden md:block" />
                            )}
                        </button>
                    )}

                    <button onClick={() => signOut()} className="text-slate-500 hover:text-rose-500 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl md:w-full md:py-3 cursor-pointer">
                        <LogOut size={24} />
                    </button>
                </nav>
                <div className="hidden md:flex w-10 h-10 rounded-full bg-blue-600 items-center justify-center font-black text-xs shadow-lg shadow-blue-600/20">
                    {displayName[0].toUpperCase()}
                </div>
            </aside>

            <main className={cn(
                "flex-1 relative transition-all duration-1000 overflow-y-auto overflow-x-hidden",
                !has_active_access && "blur-2xl opacity-20 pointer-events-none scale-95 origin-center"
            )}>
                {children}
            </main>

            {/* BOTÓN FLOTANTE DE ACCIÓN (FAB) – AI Intelligence */}
            <AIFab
                onClick={() => {
                    if (plan_name === 'Free' && transactions.length >= 50) return;
                    setIsFormOpen(true);
                }}
                disabled={plan_name === 'Free' && transactions.length >= 50}
                hidden={!has_active_access && !isAdmin}
                title={plan_name === 'Free' && transactions.length >= 50 ? "Límite de plan alcanzado" : "Nuevo Movimiento"}
            />

            {isFormOpen && <TransactionForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />}
            {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
            {isAdminOpen && <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />}

            {/* Alertas Globales de Recordatorios */}
            <GlobalRemindersAlert />

            {/* Modal Obligatorio de Cambio de Contraseña */}
            <ForcePasswordChangeModal isOpen={profile?.force_password_change === true} />

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
            `}</style>
        </div>
    );
}
