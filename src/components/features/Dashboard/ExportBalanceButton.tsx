"use client";

import React, { useState } from 'react';
import { FileSpreadsheet, Download, Loader2, Users, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/store/useSettings';
import { downloadExcel } from '@/lib/excel';
import { cn } from '@/lib/utils';
import { 
    startOfMonth, 
    endOfMonth, 
    subMonths, 
    startOfYear, 
    endOfYear, 
    isWithinInterval, 
    parseISO 
} from 'date-fns';

type PeriodType = 'all' | 'this_month' | 'last_month' | 'this_year';

export const ExportBalanceButton = () => {
    const { user } = useAuth();
    const { responsibles } = useSettings();
    const [selectedResponsible, setSelectedResponsible] = useState("Todos");
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("all");
    const [isExporting, setIsExporting] = useState(false);

    const getPeriodInterval = (period: PeriodType) => {
        const now = new Date();
        switch (period) {
            case 'this_month':
                return { start: startOfMonth(now), end: endOfMonth(now) };
            case 'last_month':
                const lastMonth = subMonths(now, 1);
                return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
            case 'this_year':
                return { start: startOfYear(now), end: endOfYear(now) };
            default:
                return null;
        }
    };

    const handleExport = async () => {
        if (!user) return;
        setIsExporting(true);

        try {
            let query = supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .is('deleted_at', null)
                .order('date', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;

            let filteredTransactions = data || [];

            // 1. Filtrado por responsable a nivel de cliente
            if (selectedResponsible !== "Todos") {
                filteredTransactions = filteredTransactions.filter(tx => {
                    if (!Array.isArray(tx.responsibles)) return false;
                    return tx.responsibles.some((r: any) => r.name === selectedResponsible);
                });
            }

            // 2. Filtrado por periodo a nivel de cliente
            const interval = getPeriodInterval(selectedPeriod);
            if (interval) {
                filteredTransactions = filteredTransactions.filter(tx => {
                    try {
                        const txDate = parseISO(tx.date);
                        return isWithinInterval(txDate, interval);
                    } catch (e) {
                        return false;
                    }
                });
            }

            if (filteredTransactions.length === 0) {
                alert("No hay movimientos para exportar con este criterio.");
                setIsExporting(false);
                return;
            }

            // Normalización de datos para Excel: División por responsables
            const normalizedData: any[] = [];

            filteredTransactions.forEach(tx => {
                const txResponsibles = Array.isArray(tx.responsibles) ? tx.responsibles : [];
                const responsiblesList = txResponsibles.map((r: any) => r.name).join(', ') || "General";
                
                // Manejo seguro de fecha (YYYY-MM-DD)
                let fechaStr = "N/A";
                try {
                    fechaStr = tx.date.split('T')[0];
                } catch (e) {
                    console.warn("Fecha inválida en transacción:", tx.id, tx.date);
                }

                if (selectedResponsible !== "Todos") {
                    // Caso A: Filtro por UN responsable específico - Mostramos su parte y la lista completa
                    const respData = txResponsibles.find((r: any) => r.name === selectedResponsible);
                    if (respData) {
                        normalizedData.push({
                            "Fecha": fechaStr,
                            "Concepto": tx.description || "Sin descripción",
                            "Categoría": tx.category || "General",
                            "Tipo": tx.type === 'income' ? "Ingreso" : "Egreso",
                            "Responsable": respData.name,
                            "Participación": `${respData.percentage}%`,
                            "Monto Proporcional": Number(tx.amount) * (respData.percentage / 100),
                            "Monto Total": Number(tx.amount),
                            "Todos los Responsables": responsiblesList
                        });
                    }
                } else {
                    // Caso B: Sin filtro o reporte general - Una fila por movimiento con la lista
                    normalizedData.push({
                        "Fecha": fechaStr,
                        "Concepto": tx.description || "Sin descripción",
                        "Categoría": tx.category || "General",
                        "Tipo": tx.type === 'income' ? "Ingreso" : "Egreso",
                        "Monto Total": Number(tx.amount),
                        "Responsables": responsiblesList
                    });
                }
            });

            const dateStr = new Date().toISOString().split('T')[0];
            const periodLabels: Record<PeriodType, string> = {
                all: "Historico",
                this_month: "Mes_Actual",
                last_month: "Mes_Pasado",
                this_year: "Este_Año"
            };
            const filename = `Balance_${selectedResponsible.replace(/\s+/g, '_')}_${periodLabels[selectedPeriod]}_${dateStr}`;
            
            downloadExcel(normalizedData, filename);

        } catch (error: any) {
            console.error("Error detallado exportando a Excel:", {
                message: error.message,
                details: error.details,
                error
            });
            alert(`Hubo un error al generar el reporte: ${error.message || "Error desconocido"}`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="p-4 rounded-[2.5rem] bg-slate-900/60 backdrop-blur-md border border-slate-800 shadow-2xl flex flex-col lg:flex-row items-center gap-4 transition-all duration-500">
            {/* Sector de Filtros */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                {/* Filtro Responsable */}
                <div className="flex items-center gap-3 bg-slate-900/40 px-4 py-3 rounded-2xl border border-slate-800/50 w-full sm:w-auto min-w-[200px] hover:border-blue-500/20 transition-colors group">
                    <Users size={16} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                    <select 
                        value={selectedResponsible}
                        onChange={(e) => setSelectedResponsible(e.target.value)}
                        className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-300 outline-none cursor-pointer w-full"
                    >
                        <option value="Todos" className="bg-slate-900">Todos los Responsables</option>
                        {responsibles.map(r => (
                            <option key={r.id} value={r.name} className="bg-slate-900">{r.name}</option>
                        ))}
                    </select>
                </div>

                {/* Filtro Periodo */}
                <div className="flex items-center gap-3 bg-slate-900/40 px-4 py-3 rounded-2xl border border-slate-800/50 w-full sm:w-auto min-w-[200px] hover:border-blue-500/20 transition-colors group">
                    <Calendar size={16} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                    <select 
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value as PeriodType)}
                        className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-300 outline-none cursor-pointer w-full"
                    >
                        <option value="all" className="bg-slate-900">Histórico Completo</option>
                        <option value="this_month" className="bg-slate-900">Este Mes</option>
                        <option value="last_month" className="bg-slate-900">Mes Pasado</option>
                        <option value="this_year" className="bg-slate-900">Este Año</option>
                    </select>
                </div>
            </div>

            {/* Botón de Acción */}
            <motion.button
                whileHover={{ scale: 1.01, boxShadow: "0 0 30px rgba(59, 130, 246, 0.15)" }}
                whileTap={{ scale: 0.99 }}
                onClick={handleExport}
                disabled={isExporting}
                className={cn(
                    "w-full lg:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-900/20",
                    isExporting ? "opacity-50 cursor-not-allowed grayscale" : ""
                )}
            >
                <div className="relative flex items-center justify-center w-5 h-5">
                    {isExporting ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                            <Loader2 size={18} />
                        </motion.div>
                    ) : (
                        <FileSpreadsheet size={18} />
                    )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                    {isExporting ? "Generando..." : "Exportar Balance"}
                </span>
            </motion.button>
        </div>
    );
};
