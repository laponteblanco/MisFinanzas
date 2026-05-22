"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Sparkles, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

// ─────────────────────────────────────────────────────────────────
// Tipos y Configuración
// ─────────────────────────────────────────────────────────────────

export interface TourStep {
    target: string;          // Selector CSS del elemento a resaltar
    title: string;
    description: string;
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

const TOUR_STEPS: TourStep[] = [
    {
        target: '[data-tour="balance-card"]',
        title: "💰 Tu Patrimonio Global",
        description: "Este es tu centro de mando. Aquí visualizas la salud de tu vida financiera en tiempo real. El gráfico de tendencia (Sparkline) te indica si tu patrimonio está creciendo o disminuyendo, permitiéndote tomar decisiones estratégicas antes de que termine el mes.",
        placement: 'bottom',
    },
    {
        target: '[data-tour="nav-dashboard"]',
        title: "🏠 Panel de Inteligencia",
        description: "Tu base de operaciones. Aquí consolidamos gráficos avanzados y KPIs que transforman tus simples registros en conocimiento accionable para optimizar tus ahorros.",
        placement: 'right',
    },
    {
        target: '[data-tour="nav-history"]',
        title: "📋 Libro Contable Maestro",
        description: "El historial definitivo de tus movimientos. Puedes auditar cada transacción, filtrar por responsables o fechas, y exportar reportes detallados a Excel para un análisis externo.",
        placement: 'right',
    },
    {
        target: '[data-tour="responsible-analysis"]',
        title: "👥 Finanzas Colaborativas",
        description: "Ideal para parejas o familias. Visualiza quién está aportando más o quién está ejecutando el mayor gasto. Esta transparencia ayuda a equilibrar la carga financiera del hogar sin fricciones.",
        placement: 'top',
    },
    {
        target: '[data-tour="cash-flow"]',
        title: "📈 Ritmo del Dinero",
        description: "Compara tus ingresos reales contra tus egresos. Este gráfico es vital para asegurar que mantienes un flujo de caja positivo; la regla de oro para la libertad financiera.",
        placement: 'top',
    },
    {
        target: '[data-tour="budget-control"]',
        title: "🛡️ Escudo de Presupuesto",
        description: "Define límites para tus gastos. El sistema te alertará visualmente cuando te acerques al borde en cada categoría. Respetar estos límites es la forma más efectiva de generar excedentes de dinero.",
        placement: 'top',
    },
    {
        target: '[data-tour="expense-distribution"]',
        title: "🧬 Radiografía de Gastos",
        description: "¿A dónde se va realmente tu dinero? Descubre si estás invirtiendo demasiado en ocio o muy poco en educación. Este gráfico circular te da la respuesta inmediata sobre tus prioridades actuales.",
        placement: 'top',
    },
    {
        target: '[data-tour="nav-settings"]',
        title: "⚙️ Motor de Personalización",
        description: "Configura tus categorías personalizadas, gestiona los miembros de tu equipo financiero y ajusta la estética de la app para que se adapte a tu estilo de vida.",
        placement: 'right',
    },
    {
        target: '[data-tour="fab-new"]',
        title: "⚡ Acción Inmediata",
        description: "¡El botón más potente! Registrar tus movimientos en el momento en que ocurren es la clave para la precisión. Con solo un par de taps, mantendrás todo tu ecosistema financiero actualizado.",
        placement: 'top',
    },
];

// ─────────────────────────────────────────────────────────────────
// Hook: useTour
// ─────────────────────────────────────────────────────────────────

export function useTour() {
    const { profile, updateProfile, loading: authLoading } = useAuth();
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    // Efecto para lanzar el tour la primera vez
    useEffect(() => {
        if (!authLoading && profile && profile.tour_completed === false) {
            // Delay para que el Dashboard termine de cargar sus componentes dinámicos
            const timer = setTimeout(() => setIsActive(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [authLoading, profile]);

    const startTour = useCallback(() => {
        setCurrentStep(0);
        setIsActive(true);
    }, []);

    const endTour = useCallback(async () => {
        setIsActive(false);
        setCurrentStep(0);
        
        // Sincronizar con Supabase
        if (profile && !profile.tour_completed) {
            await updateProfile({ tour_completed: true });
        }
    }, [profile, updateProfile]);

    const nextStep = useCallback(() => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            endTour();
        }
    }, [currentStep, endTour]);

    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    return {
        isActive,
        currentStep,
        hasSeenTour: profile?.tour_completed ?? true,
        totalSteps: TOUR_STEPS.length,
        step: TOUR_STEPS[currentStep],
        startTour,
        endTour,
        nextStep,
        prevStep,
    };
}

// ─────────────────────────────────────────────────────────────────
// Componente: TourButton (para el Navbar)
// ─────────────────────────────────────────────────────────────────

export function TourButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            data-tour="tour-button"
            className="text-slate-500 hover:text-blue-400 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl md:w-full md:py-3 cursor-pointer hover:bg-blue-500/10 group relative"
            title="Tour Guiado"
        >
            <HelpCircle size={24} className="group-hover:scale-110 transition-transform" />
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────
// Componente: TourOverlay (Portal)
// ─────────────────────────────────────────────────────────────────

export function TourOverlay({
    isActive,
    step,
    currentStep,
    totalSteps,
    onNext,
    onPrev,
    onClose,
}: {
    isActive: boolean;
    step: TourStep;
    currentStep: number;
    totalSteps: number;
    onNext: () => void;
    onPrev: () => void;
    onClose: () => void;
}) {
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; placement: string }>({ top: 0, left: 0, placement: 'bottom' });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Bloquear scroll cuando el tour está activo
    useEffect(() => {
        if (isActive) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isActive]);

    // Calcular posición del elemento target
    useEffect(() => {
        if (!isActive || !step) return;

        const findAndPosition = () => {
            const el = document.querySelector(step.target);
            if (!el) {
                setTargetRect(null);
                // Si no se encuentra el elemento, posicionar el tooltip al centro (fail-safe)
                setTooltipPos({
                    top: window.innerHeight / 2 - 100,
                    left: (window.innerWidth - 340) / 2,
                    placement: 'auto'
                });
                return;
            }

            const rect = el.getBoundingClientRect();
            setTargetRect(rect);

            // Scroll suave al elemento si no está visible
            const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
            if (!isVisible) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Recalcular después del scroll
                setTimeout(() => {
                    const newRect = el.getBoundingClientRect();
                    setTargetRect(newRect);
                    calculateTooltipPosition(newRect, step.placement || 'auto');
                }, 400);
                return;
            }

            calculateTooltipPosition(rect, step.placement || 'auto');
        };

        const calculateTooltipPosition = (rect: DOMRect, placement: string) => {
            const tooltipW = 340;
            const tooltipH = 220; // Aproximado para el copy más largo
            const gap = 20;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const isMobile = vw < 768;

            if (isMobile) {
                setTooltipPos({
                    top: vh - tooltipH - 120, // Zona inferior segura
                    left: (vw - Math.min(tooltipW, vw - 32)) / 2,
                    placement: 'bottom',
                });
                return;
            }

            let top = 0;
            let left = 0;
            let finalPlacement = placement;

            if (placement === 'auto') {
                const spaceBelow = vh - rect.bottom;
                const spaceAbove = rect.top;
                finalPlacement = spaceBelow > tooltipH + gap ? 'bottom' : spaceAbove > tooltipH + gap ? 'top' : 'bottom';
            }

            switch (finalPlacement) {
                case 'bottom':
                    top = rect.bottom + gap;
                    left = rect.left + rect.width / 2 - tooltipW / 2;
                    break;
                case 'top':
                    top = rect.top - tooltipH - gap;
                    left = rect.left + rect.width / 2 - tooltipW / 2;
                    break;
                case 'right':
                    top = rect.top + rect.height / 2 - tooltipH / 2;
                    left = rect.right + gap;
                    break;
                case 'left':
                    top = rect.top + rect.height / 2 - tooltipH / 2;
                    left = rect.left - tooltipW - gap;
                    break;
            }

            left = Math.max(16, Math.min(left, vw - tooltipW - 16));
            top = Math.max(16, Math.min(top, vh - tooltipH - 16));

            setTooltipPos({ top, left, placement: finalPlacement });
        };

        findAndPosition();
        window.addEventListener('resize', findAndPosition);
        return () => window.removeEventListener('resize', findAndPosition);
    }, [isActive, step, currentStep]);

    // Soporte de teclado
    useEffect(() => {
        if (!isActive) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'Enter') onNext();
            if (e.key === 'ArrowLeft') onPrev();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isActive, onNext, onPrev, onClose]);

    if (!mounted || !isActive) return null;

    const portalContent = (
        <AnimatePresence>
            {isActive && (
                <div className="fixed inset-0 z-[10000]">
                    {/* Overlay oscurecedor con gradiente radial invertido para el "hueco" */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0"
                        onClick={onClose}
                        style={{
                            background: targetRect
                                ? `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) * 0.7}px, rgba(0,0,0,0.88) ${Math.max(targetRect.width, targetRect.height) * 0.7 + 50}px)`
                                : 'rgba(0,0,0,0.85)',
                        }}
                    />

                    {/* Foco visual (Halo) */}
                    {targetRect && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="absolute pointer-events-none"
                            style={{
                                top: targetRect.top - 12,
                                left: targetRect.left - 12,
                                width: targetRect.width + 24,
                                height: targetRect.height + 24,
                                borderRadius: '1.75rem',
                                border: '2px solid rgba(59, 130, 246, 0.5)',
                                boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1), 0 0 60px rgba(59, 130, 246, 0.3)',
                            }}
                        />
                    )}

                    {/* Diálogo del Tour */}
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute w-[calc(100vw-32px)] max-w-[360px] z-[10001]"
                        style={{
                            top: tooltipPos.top,
                            left: tooltipPos.left,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-[#0c1220]/95 backdrop-blur-3xl border border-blue-500/20 rounded-[2rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8),0_0_50px_rgba(59,130,246,0.15)] overflow-hidden">
                            {/* Progreso */}
                            <div className="h-1.5 bg-slate-800/50 w-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-indigo-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>

                            <div className="p-8 space-y-5">
                                {/* Encabezado */}
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-black text-white tracking-tight leading-tight">
                                            {step.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-[9px] font-black text-blue-400 uppercase tracking-widest">
                                                Paso {currentStep + 1} de {totalSteps}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-all -mr-2 -mt-2"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Cuerpo */}
                                <p className="text-[14px] text-slate-300 leading-relaxed font-medium">
                                    {step.description}
                                </p>

                                {/* Footer / Acciones */}
                                <div className="flex items-center justify-between pt-4 gap-4">
                                    <button
                                        onClick={onPrev}
                                        disabled={currentStep === 0}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                                            currentStep === 0
                                                ? "border-transparent text-slate-800 cursor-not-allowed"
                                                : "border-slate-800 text-slate-400 hover:text-white hover:bg-white/5 hover:border-slate-700"
                                        )}
                                    >
                                        <ChevronLeft size={16} />
                                        Atrás
                                    </button>

                                    <button
                                        onClick={onNext}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/30 active:scale-95 group"
                                    >
                                        {currentStep === totalSteps - 1 ? (
                                            <>
                                                <Sparkles size={16} />
                                                Finalizar
                                            </>
                                        ) : (
                                            <>
                                                Siguiente
                                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>

                                {currentStep < totalSteps - 1 && (
                                    <button
                                        onClick={onClose}
                                        className="w-full text-center text-[10px] font-black text-slate-600 hover:text-blue-400 uppercase tracking-widest transition-colors py-1"
                                    >
                                        Saltar Introducción
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(portalContent, document.body);
}
