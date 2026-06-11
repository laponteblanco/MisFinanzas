"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, X, CheckCircle, Loader2, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { useTransactions } from "@/store/useTransactions";
import { useSettings } from "@/store/useSettings";
import { useAuth } from "@/hooks/useAuth";

// Fix for TypeScript not knowing about SpeechRecognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface DictadoFinancieroProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'TIPO' | 'MONTO' | 'DESCRIPCION' | 'CATEGORIA' | 'RESPONSABLES' | 'FECHA' | 'RESUMEN' | 'FINALIZADO';

export const DictadoFinanciero = ({ isOpen, onClose }: DictadoFinancieroProps) => {
    const { user } = useAuth();
    const addTransaction = useTransactions(state => state.addTransaction);
    const availableCategories = useSettings(state => state.categories);
    const availableResponsibles = useSettings(state => state.responsibles);

    const [isListening, setIsListening] = useState(false);
    const [currentStep, setCurrentStep] = useState<Step>('TIPO');
    const [transcript, setTranscript] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Estado consolidado
    const [data, setData] = useState({
        tipo: "",
        monto: 0,
        descripcion: "",
        categoria: "",
        responsibles: [] as any[],
        fecha: new Date().toISOString().split('T')[0]
    });

    const recognitionRef = useRef<any>(null);
    const stepRef = useRef<Step>('TIPO');
    const dataRef = useRef(data);
    const lastSpokenRef = useRef<string>("");

    // Mantener refs sincronizados con el estado
    useEffect(() => {
        stepRef.current = currentStep;
    }, [currentStep]);

    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    // Inicializar Speech Recognition
    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.lang = 'es-ES';
                recognition.continuous = true; // Mantener el micrófono abierto siempre
                recognition.interimResults = false;

                recognition.onresult = (event: any) => {
                    // En modo continuous, obtenemos el último resultado añadido
                    const lastResultIndex = event.results.length - 1;
                    const text = event.results[lastResultIndex][0].transcript;
                    
                    setTranscript(text);
                    setIsProcessing(true);
                    setTimeout(() => {
                        handleStepLogic(text);
                        setIsProcessing(false);
                    }, 100);
                };

                recognition.onend = () => {
                    // Chrome apaga el mic automáticamente tras ~60s de silencio.
                    // Si no hemos terminado, lo volvemos a prender automáticamente.
                    if (stepRef.current !== 'FINALIZADO') {
                        try {
                            recognition.start();
                        } catch (e) {}
                    } else {
                        setIsListening(false);
                    }
                };

                recognitionRef.current = recognition;
            } else {
                console.warn("Speech Recognition API not supported in this browser.");
            }
        }
    }, []);

    // Reseteo al abrir
    useEffect(() => {
        if (isOpen) {
            setCurrentStep('TIPO');
            setTranscript("");
            setData({
                tipo: "",
                monto: 0,
                descripcion: "",
                categoria: "",
                responsibles: [],
                fecha: new Date().toISOString().split('T')[0]
            });
            speak("Hola. Para empezar, ¿este registro es un ingreso o un egreso?");
            // Prender micrófono inicialmente
            setTimeout(() => {
                if (recognitionRef.current) {
                    try {
                        recognitionRef.current.start();
                        setIsListening(true);
                    } catch(e) {}
                }
            }, 500);
        } else {
            window.speechSynthesis.cancel();
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch(e){}
            }
            setIsListening(false);
        }
    }, [isOpen]);

    // Limpieza al desmontar
    useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch(e){}
            }
        };
    }, []);

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Detener audios anteriores
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES';
            lastSpokenRef.current = normalizeStr(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    const parseWrittenNumbers = (text: string): string => {
        const wordToNum: {[key: string]: string} = {
            'cero': '0', 'uno': '1', 'un': '1', 'dos': '2', 'tres': '3', 'cuatro': '4', 'cinco': '5',
            'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9', 'diez': '10',
            'once': '11', 'doce': '12', 'trece': '13', 'catorce': '14', 'quince': '15',
            'veinte': '20', 'treinta': '30', 'cuarenta': '40', 'cincuenta': '50',
            'sesenta': '60', 'setenta': '70', 'ochenta': '80', 'noventa': '90',
            'cien': '100', 'ciento': '100', 'doscientos': '200', 'trescientos': '300',
            'cuatrocientos': '400', 'quinientos': '500', 'seiscientos': '600',
            'setecientos': '700', 'ochocientos': '800', 'novecientos': '900'
        };
        let newText = text;
        Object.keys(wordToNum).forEach(w => {
            newText = newText.replace(new RegExp(`\\b${w}\\b`, 'gi'), wordToNum[w]);
        });
        
        // Sumar decenas y unidades: "80 y 5" -> "85"
        newText = newText.replace(/([2-9]0)\s+y\s+([1-9])\b/g, (match, p1, p2) => {
            return (parseInt(p1, 10) + parseInt(p2, 10)).toString();
        });
        // Sumar centenas y el resto: "100 50", "100 85" -> "150", "185"
        newText = newText.replace(/([1-9]00)\s+([1-9][0-9]?)\b/g, (match, p1, p2) => {
            return (parseInt(p1, 10) + parseInt(p2, 10)).toString();
        });

        return newText;
    };

    const normalizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    // NLU Extractors
    const extractTipo = (textNorm: string) => {
        if (textNorm.includes('ingreso') || textNorm.includes('entrada') || textNorm.includes('ganancia') || textNorm.includes('pago recibido')) return 'income';
        if (textNorm.includes('egreso') || textNorm.includes('salida') || textNorm.includes('gasto') || textNorm.includes('compra') || textNorm.includes('pago')) return 'expense';
        return null;
    };

    const extractMonto = (textNorm: string) => {
        let t = parseWrittenNumbers(textNorm);
        
        // Convertir multiplicadores: "85 mil" -> "85000"
        t = t.replace(/(\d+)\s*mil\b/g, (m, p1) => (parseInt(p1, 10) * 1000).toString());
        t = t.replace(/(\d+)\s*millones?\b/g, (m, p1) => (parseInt(p1, 10) * 1000000).toString());
        t = t.replace(/(\d+)\s*millon\b/g, (m, p1) => (parseInt(p1, 10) * 1000000).toString());

        // Manejar "mil 200" (sin el 1)
        t = t.replace(/\bmil\s+(\d+)\b/g, (m, p1) => (1000 + parseInt(p1, 10)).toString());
        t = t.replace(/\bmil\b/g, "1000"); // si dice solo "mil"
        
        // Unir números separados por puntos o comas (ej. "85.000" -> "85000")
        t = t.replace(/(\d)[.,](\d)/g, "$1$2");
        t = t.replace(/(\d)[.,](\d)/g, "$1$2"); 
        
        const matches = t.match(/\d+/g);
        if (!matches) return null;
        
        // Tomar el número más grande encontrado
        const numbers = matches.map(n => parseInt(n, 10));
        return Math.max(...numbers);
    };

    const extractCategoria = (textNorm: string, tipo: string) => {
        const validCats = availableCategories.filter(c => !c.type || c.type === (tipo || 'expense'));
        return validCats.find(c => {
            const cNorm = normalizeStr(c.name);
            if (textNorm.includes(cNorm) || cNorm.includes(textNorm)) return true;
            const cFirstWord = cNorm.split(/\s+/)[0];
            return cFirstWord.length > 2 && textNorm.split(/\s+/).includes(cFirstWord);
        });
    };

    const extractResponsables = (textNorm: string) => {
        let foundResps: any[] = [];
        const spokenWords = textNorm.split(/\s+/);
        for (const r of availableResponsibles) {
            const rNorm = normalizeStr(r.name);
            if (textNorm.includes(rNorm)) {
                if (!foundResps.find(fr => fr.name === r.name)) foundResps.push({ name: r.name, percentage: 0 });
                continue;
            }
            const rFirstName = rNorm.split(/\s+/)[0];
            if (rFirstName.length >= 2 && spokenWords.includes(rFirstName)) {
                if (!foundResps.find(fr => fr.name === r.name)) foundResps.push({ name: r.name, percentage: 0 });
            }
        }
        return foundResps;
    };

    const extractFecha = (textNorm: string) => {
        if (textNorm.includes('ayer')) {
            const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0];
        }
        if (textNorm.includes('antier')) {
            const d = new Date(); d.setDate(d.getDate() - 2); return d.toISOString().split('T')[0];
        }
        if (textNorm.includes('mañana')) {
            const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0];
        }
        if (textNorm.includes('hoy')) return new Date().toISOString().split('T')[0];
        return null;
    };

    const handleStepLogic = (text: string) => {
        let currentData = { ...dataRef.current };
        const textNormalized = normalizeStr(text);
        const lastSpoken = lastSpokenRef.current;

        // Anti-Echo filter
        if (textNormalized.length > 3 && lastSpoken.includes(textNormalized)) return;

        // --- Voice Navigation & Correction Commands ---
        if (textNormalized.match(/\b(corregir|cambiar|editar|modificar|equivoque)\b/)) {
            let handled = false;
            if (textNormalized.includes('monto') || textNormalized.includes('valor')) {
                currentData.monto = 0; handled = true;
            }
            if (textNormalized.includes('categoria')) {
                currentData.categoria = ""; handled = true;
            }
            if (textNormalized.includes('tipo') || textNormalized.includes('ingreso') || textNormalized.includes('egreso')) {
                currentData.tipo = ""; handled = true;
            }
            if (textNormalized.includes('responsable') || textNormalized.includes('persona')) {
                currentData.responsibles = []; handled = true;
            }
            if (textNormalized.includes('descripcion') || textNormalized.includes('concepto')) {
                currentData.descripcion = ""; handled = true;
            }
            
            if (handled) {
                setData(currentData);
                dataRef.current = currentData;
                speak("De acuerdo, vamos a corregirlo.");
                determineNextStep(currentData, false);
                return;
            }
        }

        if (textNormalized.includes('omitir') || textNormalized.includes('saltar') || textNormalized.includes('siguiente') || textNormalized.includes('adelantar')) {
            if (stepRef.current === 'DESCRIPCION') {
                currentData.descripcion = currentData.categoria || "Sin descripción";
                setData(currentData);
                dataRef.current = currentData;
                determineNextStep(currentData, true);
                return;
            } else if (stepRef.current === 'FECHA') {
                currentData.fecha = new Date().toISOString().split('T')[0];
                setData(currentData);
                dataRef.current = currentData;
                determineNextStep(currentData, true);
                return;
            } else {
                speak("No puedes omitir este dato, es obligatorio.");
                return;
            }
        }

        if (textNormalized.includes('cancelar todo') || textNormalized.includes('reiniciar') || textNormalized.includes('empezar de nuevo')) {
            currentData = { tipo: "", monto: 0, descripcion: "", categoria: "", responsibles: [], fecha: new Date().toISOString().split('T')[0] };
            setData(currentData); dataRef.current = currentData;
            setCurrentStep('TIPO'); stepRef.current = 'TIPO';
            speak("Registro cancelado. ¿Qué movimiento empezamos?");
            return;
        }

        // Final confirmation handler
        if (stepRef.current === 'RESUMEN') {
            if (textNormalized.includes('aprobado') || textNormalized.includes('si') || textNormalized.includes('ok') || textNormalized.includes('correcto') || textNormalized.includes('apruebo')) {
                setCurrentStep('FINALIZADO');
                stepRef.current = 'FINALIZADO';
                speak("¡Perfecto! El movimiento ha sido registrado exitosamente.");
                submitTransaction(currentData);
                setTimeout(() => onClose(), 3000);
            } else if (textNormalized.includes('no') || textNormalized.includes('cancelar') || textNormalized.includes('incorrecto')) {
                currentData = { tipo: "", monto: 0, descripcion: "", categoria: "", responsibles: [], fecha: new Date().toISOString().split('T')[0] };
                setData(currentData);
                dataRef.current = currentData;
                setCurrentStep('TIPO');
                stepRef.current = 'TIPO';
                speak("Cancelando el registro. Empecemos de nuevo. ¿Qué movimiento registramos?");
            } else {
                speak("¿Está aprobado este movimiento? Responde sí o no.");
            }
            return;
        }

        // Slot Filling Logic
        let updated = false;

        const tipo = extractTipo(textNormalized);
        if (tipo && !currentData.tipo) { currentData.tipo = tipo; updated = true; }
        
        const monto = extractMonto(textNormalized);
        if (monto && currentData.monto === 0) { currentData.monto = monto; updated = true; }
        
        const catObj = extractCategoria(textNormalized, currentData.tipo || 'expense');
        if (catObj && !currentData.categoria) { currentData.categoria = catObj.name; updated = true; }
        
        const resps = extractResponsables(textNormalized);
        if (resps.length > 0 && currentData.responsibles.length === 0) {
            const pct = Math.floor(100 / resps.length);
            currentData.responsibles = resps.map((r, i) => ({ ...r, percentage: i === resps.length - 1 ? 100 - (pct * (resps.length - 1)) : pct }));
            updated = true;
        }
        
        const fecha = extractFecha(textNormalized);
        if (fecha && textNormalized.match(/\b(ayer|antier|mañana|hoy)\b/)) { currentData.fecha = fecha; updated = true; }

        if (stepRef.current === 'DESCRIPCION' && text.trim().length > 2) {
            currentData.descripcion = text;
            updated = true;
        }

        setData(currentData);
        dataRef.current = currentData;

        determineNextStep(currentData, updated);
    };

    const determineNextStep = (currentData: typeof data, updated: boolean) => {
        let missingFields = [];
        if (!currentData.tipo) missingFields.push('TIPO');
        if (currentData.monto === 0) missingFields.push('MONTO');
        if (!currentData.descripcion) missingFields.push('DESCRIPCION');
        if (!currentData.categoria) missingFields.push('CATEGORIA');
        if (currentData.responsibles.length === 0) missingFields.push('RESPONSABLES');
        
        if (missingFields.length === 0) {
            setCurrentStep('RESUMEN');
            stepRef.current = 'RESUMEN';
            speak(`Resumen: Es un ${currentData.tipo === 'income' ? 'Ingreso' : 'Egreso'} de ${currentData.monto} pesos para ${currentData.categoria}. Responsables: ${currentData.responsibles.map((r:any) => r.name).join(', ')}. ¿Aprobado?`);
            return;
        }

        const next = missingFields[0] as Step;
        setCurrentStep(next);
        stepRef.current = next;

        if (!updated) {
            if (next === 'TIPO') speak("No detecté la intención. ¿Es un ingreso o un egreso?");
            else if (next === 'MONTO') speak("No detecté un número. ¿Me repites de cuánto es el monto?");
            else if (next === 'DESCRIPCION') speak("Dime en qué se gastó o el concepto de la transacción.");
            else if (next === 'CATEGORIA') speak("No reconocí la categoría. Por favor lee una de la lista.");
            else if (next === 'RESPONSABLES') speak("No detecté a ningún responsable. Menciona uno de la lista.");
            return;
        }

        if (next === 'TIPO') speak("¿Qué tipo de movimiento es?");
        else if (next === 'MONTO') speak(`Perfecto, ${currentData.tipo === 'income' ? 'ingreso' : 'egreso'}. ¿De cuánto es el monto?`);
        else if (next === 'DESCRIPCION') speak(`Monto de ${currentData.monto}. ¿Qué descripción breve le ponemos?`);
        else if (next === 'CATEGORIA') speak("Anotado. ¿En qué categoría lo clasificamos?");
        else if (next === 'RESPONSABLES') speak(`Categoría ${currentData.categoria}. Muy bien. ¿Quiénes son los responsables?`);
    };

    const submitTransaction = (finalData: typeof data) => {
        if (!user) return;
        addTransaction({
            userId: user.id,
            type: finalData.tipo as any || 'expense',
            amount: finalData.monto,
            description: finalData.descripcion,
            category: finalData.categoria,
            date: finalData.fecha,
            responsibles: finalData.responsibles.length > 0 ? finalData.responsibles : [{ name: "Principal", percentage: 100 }]
        });
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            window.speechSynthesis.cancel();
        } else {
            // Repetir instrucción
            handleStepLogic(""); // trigger logic error fallback
            try {
                recognitionRef.current?.start();
                setIsListening(true);
            } catch(e) {}
        }
    };

    if (!isOpen) return null;

    const stepLabels = {
        'TIPO': 'Tipo de Movimiento',
        'MONTO': 'Monto',
        'DESCRIPCION': 'Descripción',
        'CATEGORIA': 'Categoría',
        'RESPONSABLES': 'Responsables',
        'FECHA': 'Confirmar Fecha',
        'RESUMEN': 'Confirmación Final',
        'FINALIZADO': '¡Completado!'
    };

    return (
        <div className="fixed bottom-[8.5rem] right-6 md:bottom-32 md:right-10 z-[500] flex items-end justify-end pointer-events-none">
            <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 50, x: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 50, x: 20 }}
                className="relative w-[calc(100vw-3rem)] md:w-[400px] bg-slate-900/95 border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(0,245,255,0.15)] overflow-hidden backdrop-blur-xl pointer-events-auto"
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Bot size={20} className="text-emerald-400" />
                        Asistente Inteligente
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4">
                    {/* Visualizer */}
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center border border-white/10 ${isListening ? 'bg-blue-500/20' : 'bg-slate-800'}`}>
                                <Mic className={`w-6 h-6 ${isListening ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`} />
                            </div>
                            
                            {/* Simple ring animation */}
                            {isListening && (
                                <motion.div
                                    className="absolute inset-0 rounded-full border-2 border-blue-400/50"
                                    animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                            )}
                        </div>
                    </div>

                    <div className="text-center mb-4 min-h-[40px]">
                        <h3 className="text-blue-400 font-semibold mb-1 text-sm">{stepLabels[currentStep]}</h3>
                    </div>

                    {/* Transcript area */}
                    <div className="bg-black/20 rounded-2xl p-4 min-h-[80px] border border-white/5 relative overflow-hidden">
                        {isProcessing ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="animate-spin text-blue-500" size={24} />
                            </div>
                        ) : (
                            <p className="text-sm font-medium text-white italic text-center">
                                "{transcript || 'Escuchando...'}"
                            </p>
                        )}
                    </div>

                    {/* Hint sections for categories and responsibles */}
                    {currentStep === 'CATEGORIA' && (
                        <div className="flex flex-wrap justify-center gap-2 mt-4 px-2 max-h-24 overflow-y-auto custom-scrollbar">
                            {availableCategories.filter(c => !c.type || c.type === (data.tipo || 'expense')).map(cat => (
                                <span key={cat.id} className="text-[10px] font-medium bg-white/5 text-slate-300 px-2 py-1 rounded-full border border-white/5">
                                    {cat.emoji} {cat.name}
                                </span>
                            ))}
                        </div>
                    )}
                    {currentStep === 'RESPONSABLES' && (
                        <div className="flex flex-wrap justify-center gap-2 mt-4 px-2 max-h-24 overflow-y-auto custom-scrollbar">
                            {availableResponsibles.map(r => (
                                <span key={r.id} className="text-[10px] font-medium bg-blue-500/10 text-blue-300 px-2 py-1 rounded-full border border-blue-500/20">
                                    {r.name}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-center pt-4 pb-2">
                        <button 
                            onClick={toggleListening}
                            className={`px-4 py-2 rounded-full font-medium transition-all text-sm ${
                                isListening 
                                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                        >
                            {isListening ? 'Pausar Escucha' : 'Reanudar Escucha'}
                        </button>
                    </div>

                    {/* Progress indicators */}
                    <div className="flex justify-between items-center px-2 pt-3 border-t border-white/10">
                        {['TIPO', 'MONTO', 'DESCRIPCION', 'CATEGORIA', 'RESPONSABLES', 'FECHA', 'RESUMEN'].map((s, i) => {
                            const stepsArr = ['TIPO', 'MONTO', 'DESCRIPCION', 'CATEGORIA', 'RESPONSABLES', 'FECHA', 'RESUMEN', 'FINALIZADO'];
                            const isPast = stepsArr.indexOf(s) < stepsArr.indexOf(currentStep);
                            const isCurrent = s === currentStep;
                            return (
                                <div 
                                    key={s} 
                                    className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                                        isPast ? 'bg-emerald-500' : isCurrent ? 'bg-blue-500 w-3' : 'bg-white/20'
                                    }`}
                                />
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
