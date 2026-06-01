"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";

export const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

interface ChartTimeSelectorProps {
  type?: "month" | "year";
  selectedMonths?: number[];
  selectedYears: number[];
  onMonthChange?: (val: number[]) => void;
  onYearChange?: (val: number[]) => void;
  allowAllMonth?: boolean;
  allowAllYear?: boolean;
}

const MultiSelect = ({
    label,
    options,
    selectedValues,
    onChange,
    allowAll
}: {
    label: string,
    options: { value: number, label: string }[],
    selectedValues: number[],
    onChange: (val: number[]) => void,
    allowAll: boolean
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isAllSelected = selectedValues.length === 0;

    const toggleOption = (val: number) => {
        if (selectedValues.includes(val)) {
            onChange(selectedValues.filter(v => v !== val));
        } else {
            onChange([...selectedValues, val]);
        }
    };

    const toggleAll = () => {
        if (isAllSelected) {
            // Select all specific options
            onChange(options.map(o => o.value));
        } else {
            // Clear to represent "All"
            onChange([]);
        }
    };

    return (
        <div className="relative" style={{ position: 'relative' }} ref={ref}>
            <div 
                className="flex items-center gap-2 cursor-pointer bg-transparent text-xs font-bold text-slate-300 px-2 py-1 hover:text-white transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                style={{ WebkitTapHighlightColor: 'transparent' }}
            >
                <span>{isAllSelected ? `Todos (${label})` : `${selectedValues.length} sel.`}</span>
                <ChevronDown size={14} className="text-slate-500" />
            </div>

            {isOpen && (
                <div 
                    className="absolute top-full left-0 mt-2 w-48 bg-[#0b0f19] border border-slate-700 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-2 z-[9999] max-h-[50vh] overflow-y-auto custom-scrollbar"
                    style={{ 
                        position: 'absolute', 
                        left: 0, 
                        top: '100%',
                        willChange: 'transform'
                    }}
                >
                    {allowAll && (
                        <div 
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded-lg cursor-pointer text-xs font-bold text-emerald-400"
                            onClick={toggleAll}
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            {isAllSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                            <span>Seleccionar Todos</span>
                        </div>
                    )}
                    
                    {options.map(opt => {
                        const isSelected = selectedValues.includes(opt.value);
                        return (
                            <div 
                                key={opt.value}
                                className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded-lg cursor-pointer text-xs font-medium transition-colors",
                                    isSelected ? "text-white" : "text-slate-400"
                                )}
                                onClick={() => toggleOption(opt.value)}
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                                {isSelected ? <CheckSquare size={14} className="text-blue-500" /> : <Square size={14} />}
                                <span>{opt.label}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const ChartTimeSelector: React.FC<ChartTimeSelectorProps> = ({
  type = "month",
  selectedMonths = [],
  selectedYears = [],
  onMonthChange,
  onYearChange,
  allowAllMonth = true,
  allowAllYear = true
}) => {
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 4 }, (_, i) => currentYear - i).map(y => ({ value: y, label: y.toString() }));
  const monthOptions = MONTHS.map((m, i) => ({ value: i, label: m }));

  return (
    <div className="flex items-center gap-1 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl px-1 py-1 relative z-50">
      
      {type === "month" && onMonthChange && (
        <MultiSelect 
            label="Meses" 
            options={monthOptions} 
            selectedValues={selectedMonths} 
            onChange={onMonthChange} 
            allowAll={allowAllMonth} 
        />
      )}

      {type === "month" && onMonthChange && onYearChange && <div className="w-px h-4 bg-slate-700/50 mx-1" />}

      {onYearChange && (
        <MultiSelect 
            label="Años" 
            options={yearOptions} 
            selectedValues={selectedYears} 
            onChange={onYearChange} 
            allowAll={allowAllYear} 
        />
      )}
    </div>
  );
};
