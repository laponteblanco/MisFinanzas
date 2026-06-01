"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { 
  Users, 
  BarChart3, 
  Wallet, 
  PieChart as PieIcon, 
  Bell,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  Target,
  Zap,
  Navigation
} from "lucide-react";

import { BudgetControlChart } from "@/components/features/Dashboard/BudgetControlChart";
import { RemindersManager } from "@/components/features/Reminders/RemindersManager";
import { SpendingHeatmap } from "@/components/features/Dashboard/SpendingHeatmap";
import { ParetoChart } from "@/components/features/Dashboard/ParetoChart";
import { MonthOverlayChart } from "@/components/features/Dashboard/MonthOverlayChart";
import { BudgetRadarChart } from "@/components/features/Dashboard/BudgetRadarChart";

const CashFlowChart = dynamic(() => import("@/components/features/Dashboard/CashFlowChart").then(mod => mod.CashFlowChart), { ssr: false });
const ExpenseChart = dynamic(() => import("@/components/features/Dashboard/ExpenseChart").then(mod => mod.ExpenseChart), { ssr: false });
const ResponsibleStateWidget = dynamic(() => import("@/components/features/Dashboard/ResponsibleStateWidget").then(mod => mod.ResponsibleStateWidget), { ssr: false });

const PAGES = [
  {
    id: "responsible",
    title: "Análisis por Responsable",
    icon: <Users size={18} />,
    component: <ResponsibleStateWidget />
  },
  {
    id: "cashflow",
    title: "Tendencia de Flujo de Caja",
    icon: <BarChart3 size={18} />,
    component: <CashFlowChart />
  },
  {
    id: "budget",
    title: "Control de Presupuesto",
    icon: <Wallet size={18} />,
    component: <BudgetControlChart />
  },
  {
    id: "distribution",
    title: "Distribución de Egresos",
    icon: <PieIcon size={18} />,
    component: <ExpenseChart />
  },
  {
    id: "heatmap",
    title: "Hábitos de Gasto",
    icon: <Calendar size={18} />,
    component: <SpendingHeatmap />
  },
  {
    id: "pareto",
    title: "Regla 80/20",
    icon: <Target size={18} />,
    component: <ParetoChart />
  },
  {
    id: "velocity",
    title: "Velocidad de Gasto",
    icon: <Zap size={18} />,
    component: <MonthOverlayChart />
  },
  {
    id: "radar",
    title: "Radar de Desviación",
    icon: <Navigation size={18} />,
    component: <BudgetRadarChart />
  },
  {
    id: "reminders",
    title: "Próximos Pagos",
    icon: <Bell size={18} />,
    component: <RemindersManager />
  }
];

export function ModuleBook() {
  const [currentPage, setCurrentPage] = useState(-1);
  const [direction, setDirection] = useState(0); // -1 for prev, 1 for next
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setCurrentPage(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage < 0 || newPage >= PAGES.length) return;
    setDirection(newPage > currentPage ? 1 : -1);
    setCurrentPage(newPage);
  };

  // Custom 3D Book Page Flip Animation Variants
  const pageVariants = {
    enter: (dir: number) => ({
      rotateY: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.95,
      transformOrigin: dir > 0 ? "right center" : "left center"
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.55,
        ease: [0.25, 1, 0.5, 1] as const // clean custom ease
      }
    },
    exit: (dir: number) => ({
      rotateY: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.95,
      transformOrigin: dir > 0 ? "left center" : "right center",
      transition: {
        duration: 0.45,
        ease: [0.25, 1, 0.5, 1] as const
      }
    })
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-4xl mx-auto py-4 perspective-[1500px]" data-tour="module-book">
      {/* ── High-Tech Book Container (Glassmorphism & Neon Shadows) ── */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/[0.08] bg-gradient-to-br from-[#0a0f18]/90 via-[#0e1420]/95 to-[#050910]/95 p-6 sm:p-8 shadow-[0_32px_90px_-20px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
        
        {/* Holographic glowing spine accent */}
        <div className="absolute top-0 bottom-0 left-0 w-[4px] bg-gradient-to-b from-blue-500/60 via-purple-500/40 to-cyan-500/60 blur-[1px]" />
        
        {/* Book Header Telemetry */}
        <header className={cn("flex flex-wrap items-center justify-between gap-4 border-white/[0.06]", currentPage !== -1 ? "border-b pb-4 mb-6" : "")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <BookOpen size={20} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.25em]">MÓDULOS DE ANÁLISIS</span>
              <h3 className="text-lg font-bold text-white tracking-tight leading-tight">
                Bitácora Financiera Inteligente
              </h3>
            </div>
          </div>

          {/* Bookmarks Tab Bar (Elegant page controls) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            {PAGES.map((page, idx) => (
              <button
                key={page.id}
                onClick={() => handlePageChange(idx)}
                title={page.title}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border shrink-0",
                  currentPage === idx
                    ? "bg-blue-600/15 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                    : "bg-white/[0.02] text-slate-400 border-transparent hover:bg-white/[0.05] hover:text-white"
                )}
              >
                {page.icon}
                <span className="hidden sm:inline">{page.title.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </header>

        {/* ── Living Page Display (3D Book Flip Animation viewport) ── */}
        {currentPage !== -1 && (
          <div className="relative min-h-[350px] w-full flex flex-col justify-between overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            <div className="flex-1 w-full relative">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={currentPage}
                  custom={direction}
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="w-full h-full flex flex-col justify-start"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  {/* Active Page Header banner */}
                  <div className="flex items-center gap-2.5 mb-6 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping shrink-0" />
                    <h4 className="text-base sm:text-lg font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                      {PAGES[currentPage].title}
                    </h4>
                  </div>

                  {/* Page Content */}
                  <div className="bg-white/[0.015] border border-white/[0.04] rounded-2xl p-4 sm:p-6 shadow-inner relative overflow-x-hidden min-h-[300px]">
                    {/* Digital corner markings (Iron Man design details) */}
                    <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-blue-500/35 rounded-tl" />
                    <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-blue-500/35 rounded-tr" />
                    <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-blue-500/35 rounded-bl" />
                    <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-blue-500/35 rounded-br" />

                    {PAGES[currentPage].component}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Footer Navigation (Page turn controls) ── */}
            <footer className="flex items-center justify-between border-t border-white/[0.06] pt-5 mt-6">
              {/* Prev Page Button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className={cn(
                  "px-5 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all border",
                  currentPage === 0
                    ? "opacity-35 cursor-not-allowed border-transparent text-slate-600 bg-transparent"
                    : "bg-white/[0.03] text-slate-300 border-white/[0.08] hover:bg-white/[0.07] hover:text-white active:scale-95"
                )}
              >
                <ChevronLeft size={16} />
                Página Anterior
              </button>

              {/* Pagination Bullet Indicators */}
              <div className="hidden md:flex items-center gap-2">
                {PAGES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePageChange(idx)}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all duration-300",
                      currentPage === idx
                        ? "bg-blue-500 w-8 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                        : "bg-white/10 hover:bg-white/30"
                    )}
                  />
                ))}
              </div>

              <span className="text-xs font-black font-mono tracking-widest text-slate-500 uppercase">
                PÁG {currentPage + 1} DE {PAGES.length}
              </span>

              {/* Next Page Button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === PAGES.length - 1}
                className={cn(
                  "px-5 py-3 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all border",
                  currentPage === PAGES.length - 1
                    ? "opacity-35 cursor-not-allowed border-transparent text-slate-600 bg-transparent"
                    : "bg-white/[0.03] text-slate-300 border-white/[0.08] hover:bg-white/[0.07] hover:text-white active:scale-95"
                )}
              >
                Siguiente Página
                <ChevronRight size={16} />
              </button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}
