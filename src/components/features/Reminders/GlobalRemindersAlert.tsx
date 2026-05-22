"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, ArrowRight } from "lucide-react";
import { useRemindersAlert } from "@/hooks/useRemindersAlert";
import { formatCurrency } from "@/lib/utils";

export const GlobalRemindersAlert = () => {
    const { activeAlerts } = useRemindersAlert();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (activeAlerts.length > 0) {
            const timer = setTimeout(() => setIsVisible(true), 3000); // Mostrar después de 3s
            return () => clearTimeout(timer);
        }
    }, [activeAlerts]);

    // Asegurar que el índice esté dentro de los límites si las alertas cambian
    useEffect(() => {
        if (currentIndex >= activeAlerts.length && activeAlerts.length > 0) {
            setCurrentIndex(0);
        }
    }, [activeAlerts.length, currentIndex]);

    if (activeAlerts.length === 0 || !isVisible) return null;

    const current = activeAlerts[currentIndex];
    if (!current) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, x: 100, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                className="fixed bottom-24 right-6 md:bottom-10 md:right-32 z-[1000] max-w-[320px] w-full"
            >
                <div className="relative bg-[#0c1220]/90 backdrop-blur-2xl border border-blue-500/30 rounded-[1.5rem] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(59,130,246,0.15)] overflow-hidden group">
                    {/* Progress line for multiple alerts */}
                    {activeAlerts.length > 1 && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                            <motion.div 
                                className="h-full bg-blue-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentIndex + 1) / activeAlerts.length) * 100}%` }}
                            />
                        </div>
                    )}

                    <div className="flex gap-4">
                        <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                            <Bell size={20} className="animate-bounce" />
                        </div>
                        
                        <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start">
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-400">Pago Próximo</h4>
                                <button 
                                    onClick={() => setIsVisible(false)}
                                    className="text-slate-500 hover:text-white transition-colors -mt-1 -mr-1 p-1"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            <p className="text-xs font-medium text-slate-300 leading-relaxed">
                                🔔 Recuerda que tienes un pago próximo de <span className="font-black text-white">{current.title}</span> por <span className="font-black text-emerald-400">{formatCurrency(current.amount)}</span>.
                            </p>
                            
                            {activeAlerts.length > 1 && (
                                <button 
                                    onClick={() => setCurrentIndex((prev) => (prev + 1) % activeAlerts.length)}
                                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors pt-2"
                                >
                                    Siguiente aviso ({currentIndex + 1}/{activeAlerts.length})
                                    <ArrowRight size={10} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Decorative ambient light */}
                    <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-blue-600/10 blur-xl rounded-full" />
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
