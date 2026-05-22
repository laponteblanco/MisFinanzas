"use client";

import React, { useState } from 'react';
import { FileSpreadsheet, Download, Loader2, Users, Calendar, X, Filter, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTransactions } from '@/store/useTransactions';
import { useSettings } from '@/store/useSettings';
import { downloadExcel } from '@/lib/excel';
import { cn } from '@/lib/utils';

export const TransactionFilters = () => {
    const { filters, setFilters, filteredTransactions, loading } = useTransactions();
    const { responsibles } = useSettings();
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (filteredTransactions.length === 0) {
            alert("No hay movimientos para exportar con los filtros actuales.");
            return;
        }

        setIsExporting(true);
        try {
            const normalizedData: any[] = [];
            
            filteredTransactions.forEach(tx => {
                const txResponsibles = Array.isArray(tx.responsibles) ? tx.responsibles : [];
                const responsiblesList = txResponsibles.map((r: any) => r.name).join(', ') || "General";
                const selectedNames = filters.responsible;

                if (selectedNames !== 'all' && selectedNames.length > 0) {
                    // Caso A: Filtro de responsables activo - Mostramos la parte de CADA responsable seleccionado
                    txResponsibles.forEach((r: any) => {
                        if (selectedNames.includes(r.name)) {
                            normalizedData.push({
                                "Fecha": tx.date,
                                "Concepto": tx.description || "Sin descripción",
                                "Categoría": tx.category || "General",
                                "Responsable": r.name,
                                "Participación": `${r.percentage}%`,
                                "Tipo": tx.type === 'income' ? "Ingreso" : "Egreso",
                                "Monto Proporcional": Number(tx.amount) * (r.percentage / 100),
                                "Monto Total": Number(tx.amount),
                                "Otros en Movimiento": responsiblesList
                            });
                        }
                    });
                } else {
                    // Caso B: Sin filtro o 'Todos' - Una fila por movimiento con la lista completa
                    normalizedData.push({
                        "Fecha": tx.date,
                        "Concepto": tx.description || "Sin descripción",
                        "Categoría": tx.category || "General",
                        "Tipo": tx.type === 'income' ? "Ingreso" : "Egreso",
                        "Monto Total": Number(tx.amount),
                        "Responsables": responsiblesList
                    });
                }
            });

            const dateStr = new Date().toISOString().split('T')[0];
            const filename = `Historial_Filtrado_${dateStr}`;
            
            downloadExcel(normalizedData, filename);
        } catch (error: any) {
            console.error("Error exportando a Excel:", error);
            alert(`Error al generar el reporte: ${error.message || "Error desconocido"}`);
        } finally {
            setIsExporting(false);
        }
    };

    const clearFilters = () => {
        setFilters({
            responsible: 'all',
            startDate: null,
            endDate: null,
            search: ""
        });
    };

    const hasActiveFilters = filters.responsible !== 'all' || filters.startDate || filters.endDate || filters.search;

    return (
        <div className="w-full flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-700 relative z-50">
            {/* Contenedor principal */}
            <div className="p-4 rounded-[2rem] bg-slate-900/60 backdrop-blur-md border border-slate-800 shadow-2xl flex flex-col gap-3 transition-all duration-500">
                
                {/* Fila 1: Filtros (wrap automático) */}
                <div className="flex flex-wrap items-center gap-3">
                    
                    {/* Filtro Responsable (Dropdown Multi-selección) */}
                    <div className="relative group flex-1 min-w-[180px] max-w-full sm:max-w-[240px]">
                        <button 
                             className="w-full flex items-center gap-2.5 bg-slate-900/40 px-4 py-3 rounded-2xl border border-slate-800/50 hover:border-blue-500/20 transition-all cursor-pointer outline-none focus:ring-1 focus:ring-blue-500/30"
                             onClick={(e) => {
                                 const menu = e.currentTarget.nextElementSibling;
                                 menu?.classList.toggle('hidden');
                             }}>
                            <Users size={15} className="text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
                            <div className="flex-1 text-left overflow-hidden">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 truncate">
                                    {filters.responsible === 'all' 
                                        ? 'Todos los Responsables' 
                                        : `${(filters.responsible as string[]).length} Seleccionados`}
                                </p>
                            </div>
                            <ChevronDown size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                        </button>

                        {/* Menú Desplegable */}
                        <div className="hidden absolute top-full left-0 mt-2 w-full bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl z-[100] p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <button
                                onClick={(e) => {
                                    setFilters({ responsible: 'all' });
                                    e.currentTarget.parentElement?.classList.add('hidden');
                                }}
                                className={cn(
                                    "w-full text-left px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all mb-1",
                                    filters.responsible === 'all' ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                                )}
                            >
                                — Seleccionar Todos
                            </button>
                            <div className="max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                                {responsibles.map(r => {
                                    const isSelected = Array.isArray(filters.responsible) && filters.responsible.includes(r.name);
                                    return (
                                        <button
                                            key={r.id}
                                            onClick={() => {
                                                const current = Array.isArray(filters.responsible) ? filters.responsible : [];
                                                if (isSelected) {
                                                    const next = current.filter(name => name !== r.name);
                                                    setFilters({ responsible: next.length === 0 ? 'all' : next });
                                                } else {
                                                    setFilters({ responsible: [...current, r.name] });
                                                }
                                            }}
                                            className={cn(
                                                "w-full text-left px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-between group/item",
                                                isSelected ? "bg-emerald-600/10 text-emerald-400" : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                                            )}
                                        >
                                            <span>{r.name}</span>
                                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Filtro Fecha Desde */}
                    <div className="flex items-center gap-2.5 bg-slate-900/40 px-4 py-3 rounded-2xl border border-slate-800/50 flex-1 min-w-[140px] max-w-full sm:max-w-[180px] hover:border-blue-500/20 transition-colors group relative">
                        <Calendar size={15} className="text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest absolute -top-1.5 left-4 bg-slate-900/80 px-1 rounded">Desde</span>
                        <input 
                            type="date"
                            value={filters.startDate || ""}
                            onChange={(e) => setFilters({ startDate: e.target.value || null })}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-300 outline-none cursor-pointer w-full"
                        />
                    </div>

                    {/* Separador */}
                    <span className="text-slate-700 font-black text-xs hidden sm:inline">—</span>

                    {/* Filtro Fecha Hasta */}
                    <div className="flex items-center gap-2.5 bg-slate-900/40 px-4 py-3 rounded-2xl border border-slate-800/50 flex-1 min-w-[140px] max-w-full sm:max-w-[180px] hover:border-blue-500/20 transition-colors group relative">
                        <Calendar size={15} className="text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
                        <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest absolute -top-1.5 left-4 bg-slate-900/80 px-1 rounded">Hasta</span>
                        <input 
                            type="date"
                            value={filters.endDate || ""}
                            onChange={(e) => setFilters({ endDate: e.target.value || null })}
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-300 outline-none cursor-pointer w-full"
                        />
                    </div>

                    {/* Botón Limpiar */}
                    <AnimatePresence>
                        {hasActiveFilters && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={clearFilters}
                                className="flex items-center gap-2 px-3 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0"
                            >
                                <X size={14} />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* Fila 2: Exportar + Resultados */}
                <div className="flex items-center justify-between gap-3 pt-1">
                    {/* Indicador de Resultados */}
                    <div className="flex items-center gap-2 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 truncate">
                            <span className="text-blue-500">{filteredTransactions.length}</span> movimientos
                        </p>
                        {hasActiveFilters && (
                            <div className="flex items-center gap-1.5 shrink-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest hidden sm:inline">Filtros Activos</span>
                            </div>
                        )}
                    </div>

                    {/* Botón Exportar */}
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleExport}
                        disabled={isExporting || loading}
                        className={cn(
                            "shrink-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 text-[9px] font-black uppercase tracking-[0.2em]",
                            (isExporting || loading) ? "opacity-50 cursor-not-allowed grayscale" : ""
                        )}
                    >
                        {isExporting ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            >
                                <Loader2 size={14} />
                            </motion.div>
                        ) : (
                            <FileSpreadsheet size={14} />
                        )}
                        {isExporting ? "Generando..." : "Exportar"}
                    </motion.button>
                </div>
            </div>
        </div>
    );
};
