"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Mic, MicOff, X, CheckCircle, Loader2, Bot,
    AlertCircle, Download, Keyboard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTransactions } from "@/store/useTransactions";
import { useSettings } from "@/store/useSettings";
import { useAuth } from "@/hooks/useAuth";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DictadoFinancieroProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = "TIPO" | "MONTO" | "DESCRIPCION" | "CATEGORIA" | "RESPONSABLES" | "FECHA" | "RESUMEN" | "FINALIZADO";
type ModelState = "idle" | "loading" | "ready" | "error";
type TranscribeMode = "detecting" | "speech-api" | "whisper" | "manual";

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

// ─── Platform helpers ─────────────────────────────────────────────────────────

const isIOS = () =>
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

/** SpeechRecognition funciona bien en Android Chrome y Desktop Chrome/Edge.
 *  En iOS es muy poco confiable — usamos Whisper para eso. */
function canUseSpeechAPI(): boolean {
    if (typeof window === "undefined") return false;
    const hasAPI = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    return hasAPI && !isIOS();
}

function getSupportedMimeType(): string {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus", "audio/ogg"];
    for (const t of types) {
        if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
    }
    return "";
}

function decodeAudioDataAsync(context: AudioContext, buffer: ArrayBuffer): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
        let isResolved = false;
        const safeResolve = (val: AudioBuffer) => {
            if (!isResolved) {
                isResolved = true;
                resolve(val);
            }
        };
        const safeReject = (err: any) => {
            if (!isResolved) {
                isResolved = true;
                reject(err);
            }
        };
        
        try {
            const res = context.decodeAudioData(buffer, safeResolve, safeReject);
            if (res && typeof res.then === "function") {
                res.then(safeResolve).catch(safeReject);
            }
        } catch (err) {
            safeReject(err);
        }
    });
}

async function decodeAndResample(blob: Blob): Promise<Float32Array> {
    const buf = await blob.arrayBuffer();
    
    const AudioContextClass = typeof window !== "undefined" ? (window.AudioContext || (window as any).webkitAudioContext) : null;
    const OfflineAudioContextClass = typeof window !== "undefined" ? (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext) : null;
    
    if (!AudioContextClass || !OfflineAudioContextClass) {
        throw new Error("AudioContext or OfflineAudioContext not supported in this browser");
    }

    // Decode audio data using a temporary native AudioContext
    const tempCtx = new AudioContextClass();
    let decoded: AudioBuffer;
    try {
        decoded = await decodeAudioDataAsync(tempCtx, buf);
    } finally {
        tempCtx.close();
    }

    // Resample to 16000Hz using OfflineAudioContext
    const offlineCtx = new OfflineAudioContextClass(
        1, // mono
        Math.round(decoded.duration * 16000), // length
        16000 // target sample rate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = decoded;
    source.connect(offlineCtx.destination);
    source.start();

    const renderedBuffer = await offlineCtx.startRendering();
    return renderedBuffer.getChannelData(0);
}

// ─── Component ───────────────────────────────────────────────────────────────

export const DictadoFinanciero = ({ isOpen, onClose }: DictadoFinancieroProps) => {
    const { user } = useAuth();
    const addTransaction = useTransactions((s) => s.addTransaction);
    const availableCategories = useSettings((s) => s.categories);
    const availableResponsibles = useSettings((s) => s.responsibles);

    // ── UI state ──
    const [mode, setMode] = useState<TranscribeMode>("detecting");
    const [isListening, setIsListening] = useState(false);
    const [currentStep, setCurrentStep] = useState<Step>("TIPO");
    const [transcript, setTranscript] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [modelState, setModelState] = useState<ModelState>("idle");
    const [loadProgress, setLoadProgress] = useState(0);
    const [loadFile, setLoadFile] = useState("");
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [statusMsg, setStatusMsg] = useState("Iniciando…");
    const [manualText, setManualText] = useState("");

    // ── Transaction data ──
    const [data, setData] = useState({
        tipo: "", monto: 0, descripcion: "", categoria: "",
        responsibles: [] as any[],
        fecha: new Date().toISOString().split("T")[0],
    });

    // ── Refs ──
    const workerRef = useRef<Worker | null>(null);
    const recognitionRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const stepRef = useRef<Step>("TIPO");
    const dataRef = useRef(data);
    const isSpeakingRef = useRef(false);
    const shouldAutoRef = useRef(false);
    const taskIdRef = useRef(0);
    const modelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const modeRef = useRef(mode);
    const modelStateRef = useRef(modelState);
    const isListeningRef = useRef(isListening);
    const isProcessingRef = useRef(isProcessing);
    const scheduleNextRecordRef = useRef<() => void>(() => {});

    useEffect(() => { stepRef.current = currentStep; }, [currentStep]);
    useEffect(() => { dataRef.current = data; }, [data]);
    useEffect(() => { modeRef.current = mode; }, [mode]);
    useEffect(() => { modelStateRef.current = modelState; }, [modelState]);
    useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
    useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);

    // ─── TTS ─────────────────────────────────────────────────────────────────

    const speak = useCallback((text: string, onEnd?: () => void) => {
        if (!("speechSynthesis" in window)) { onEnd?.(); return; }
        window.speechSynthesis.cancel();
        isSpeakingRef.current = true;
        const utt = new SpeechSynthesisUtterance(text);
        utt.lang = "es-MX";
        utt.rate = 0.95;
        utt.onend = () => { isSpeakingRef.current = false; onEnd?.(); };
        utt.onerror = () => { isSpeakingRef.current = false; onEnd?.(); };
        window.speechSynthesis.speak(utt);
    }, []);

    // ─── Mode detection ───────────────────────────────────────────────────────

    const detectMode = useCallback(() => {
        if (canUseSpeechAPI()) {
            setMode("speech-api");
            setModelState("ready");
            setStatusMsg("Toca el micrófono para hablar");
        } else {
            setMode("whisper");
            initWhisperWorker();
        }
    }, []);

    // ─── Web Speech API (Android / Desktop) ───────────────────────────────────

    const initSpeechAPI = useCallback(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = "es-MX";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (e: any) => {
            const text = e.results[e.results.length - 1][0].transcript;
            if (text?.trim()) {
                setTranscript(text);
                setIsListening(false);
                setIsProcessing(true);
                setTimeout(() => {
                    handleStepLogic(text);
                    setIsProcessing(false);
                }, 80);
            }
        };

        recognition.onerror = (e: any) => {
            if (e.error === "not-allowed") {
                setPermissionDenied(true);
                setStatusMsg("Permiso de micrófono denegado.");
            } else if (e.error !== "no-speech") {
                setStatusMsg("No te escuché. Toca el micrófono e intenta de nuevo.");
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
    }, []);

    const startSpeechAPI = useCallback(() => {
        if (!recognitionRef.current) initSpeechAPI();
        try {
            recognitionRef.current?.start();
            setIsListening(true);
            setStatusMsg("Escuchando… habla ahora");
        } catch { /* already started */ }
    }, [initSpeechAPI]);

    const stopSpeechAPI = useCallback(() => {
        try { recognitionRef.current?.stop(); } catch { /* ignore */ }
        setIsListening(false);
    }, []);

    // ─── Whisper Worker (iOS) ─────────────────────────────────────────────────

    const initWhisperWorker = useCallback(() => {
        if (workerRef.current) return;

        setModelState("loading");
        setStatusMsg("Descargando motor de voz…");

        let worker: Worker;
        try {
            worker = new Worker("/workers/whisper.worker.js", { type: "module" });
        } catch (e) {
            // Module worker not supported → fall back to manual
            setMode("manual");
            setModelState("error");
            setStatusMsg("Tu navegador no soporta el motor de voz. Usa el teclado.");
            return;
        }

        workerRef.current = worker;

        // Timeout: if model not ready in 90s, show error
        modelTimeoutRef.current = setTimeout(() => {
            if (modelState !== "ready") {
                setModelState("error");
                setStatusMsg("El modelo tardó demasiado. Verifica tu conexión a internet.");
            }
        }, 90_000);

        worker.onmessage = (e: MessageEvent) => {
            const msg = e.data;
            switch (msg.type) {
                case "loading":
                    setLoadProgress(msg.progress ?? 0);
                    setLoadFile(msg.file ?? "");
                    break;
                case "ready":
                    if (modelTimeoutRef.current) clearTimeout(modelTimeoutRef.current);
                    setModelState("ready");
                    setStatusMsg("Toca el micrófono para hablar");
                    break;
                case "transcription":
                    setIsProcessing(false);
                    if (msg.text?.trim()) {
                        setTranscript(msg.text);
                        handleStepLogic(msg.text);
                    } else {
                        setStatusMsg("No te escuché bien. Intenta de nuevo.");
                        if (shouldAutoRef.current) scheduleNextRecord();
                    }
                    break;
                case "error":
                    setIsProcessing(false);
                    setStatusMsg("Error al procesar. Intenta de nuevo.");
                    if (shouldAutoRef.current) scheduleNextRecord();
                    break;
            }
        };

        worker.onerror = (e) => {
            console.error("Whisper worker error:", e.message);
            if (modelTimeoutRef.current) clearTimeout(modelTimeoutRef.current);
            setModelState("error");
            setStatusMsg("Error cargando el motor de voz.");
        };

        worker.postMessage({ type: "load" });
    }, []);

    // ─── MediaRecorder (iOS / Whisper path) ───────────────────────────────────

    const acquireStream = useCallback(async (): Promise<MediaStream | null> => {
        if (streamRef.current) return streamRef.current;
        try {
            const s = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000, channelCount: 1 }
            });
            streamRef.current = s;
            setPermissionDenied(false);
            return s;
        } catch {
            setPermissionDenied(true);
            setStatusMsg("Permiso de micrófono denegado.");
            return null;
        }
    }, []);

    const startWhisperRecord = useCallback(async () => {
        if (isProcessingRef.current || modelStateRef.current !== "ready") return;
        const stream = await acquireStream();
        if (!stream) return;

        chunksRef.current = [];
        const mimeType = getSupportedMimeType();
        let recorder: MediaRecorder;
        try { recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined); }
        catch { recorder = new MediaRecorder(stream); }
        recorderRef.current = recorder;

        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

        recorder.onstop = async () => {
            if (!chunksRef.current.length || stepRef.current === "FINALIZADO") return;
            const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
            setIsProcessing(true);
            setStatusMsg("Procesando…");
            try {
                const float32 = await decodeAndResample(blob);
                if (float32.length < 1600) {
                    setIsProcessing(false);
                    setStatusMsg("Muy corto. Habla un poco más.");
                    if (shouldAutoRef.current) scheduleNextRecordRef.current();
                    return;
                }
                const taskId = ++taskIdRef.current;
                workerRef.current?.postMessage({ type: "transcribe", audioData: float32, taskId }, [float32.buffer]);
            } catch (err) {
                console.error("Error decoding audio:", err);
                setIsProcessing(false);
                setStatusMsg("Error de audio. Intenta de nuevo.");
                if (shouldAutoRef.current) scheduleNextRecordRef.current();
            }
        };

        recorder.start(); // start recording without timeslice to prevent chunk corruption on iOS/Safari
        setIsListening(true);
        setStatusMsg("Escuchando… habla ahora");
        setTimeout(() => {
            if (recorderRef.current?.state === "recording") {
                recorderRef.current.stop();
                setIsListening(false);
            }
        }, 7000);
    }, [acquireStream]);

    const stopWhisperRecord = useCallback(() => {
        if (recorderRef.current?.state === "recording") recorderRef.current.stop();
        setIsListening(false);
    }, []);

    const scheduleNextRecord = useCallback(() => {
        if (!shouldAutoRef.current || stepRef.current === "FINALIZADO") return;
        setTimeout(() => {
            if (shouldAutoRef.current && !isSpeakingRef.current && modeRef.current === "whisper") {
                startWhisperRecord();
            }
        }, 600);
    }, [startWhisperRecord]);

    useEffect(() => {
        scheduleNextRecordRef.current = scheduleNextRecord;
    }, [scheduleNextRecord]);

    // ─── Manual text submit (fallback) ────────────────────────────────────────

    const handleManualSubmit = () => {
        const text = manualText.trim();
        if (!text) return;
        setTranscript(text);
        setManualText("");
        handleStepLogic(text);
    };

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    useEffect(() => {
        if (isOpen) {
            shouldAutoRef.current = true;
            setCurrentStep("TIPO");
            setTranscript("");
            setPermissionDenied(false);
            setManualText("");
            setData({ tipo: "", monto: 0, descripcion: "", categoria: "", responsibles: [], fecha: new Date().toISOString().split("T")[0] });
            detectMode();
            speak("Hola. ¿Este registro es un ingreso o un egreso?", () => {
                if (!shouldAutoRef.current) return;
                if (mode === "speech-api") startSpeechAPI();
            });
        } else {
            shouldAutoRef.current = false;
            window.speechSynthesis?.cancel();
            stopSpeechAPI();
            stopWhisperRecord();
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    }, [isOpen]);

    // Auto-start recording when mode is resolved and panel is open
    useEffect(() => {
        if (!isOpen || !shouldAutoRef.current) return;
        if (mode === "speech-api" && modelState === "ready" && !isListening && !isSpeakingRef.current) {
            // Speech API starts on button tap, not auto
        }
        if (mode === "whisper" && modelState === "ready" && !isListening && !isSpeakingRef.current) {
            startWhisperRecord();
        }
    }, [mode, modelState, isOpen, isListening, startWhisperRecord]);

    useEffect(() => () => {
        shouldAutoRef.current = false;
        window.speechSynthesis?.cancel();
        streamRef.current?.getTracks().forEach((t) => t.stop());
        workerRef.current?.terminate();
        if (modelTimeoutRef.current) clearTimeout(modelTimeoutRef.current);
    }, []);

    // ─── NLU ─────────────────────────────────────────────────────────────────

    const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    const parseWrittenNumbers = (text: string) => {
        const map: Record<string, string> = {
            cero:"0",uno:"1",un:"1",dos:"2",tres:"3",cuatro:"4",cinco:"5",seis:"6",siete:"7",ocho:"8",nueve:"9",diez:"10",
            once:"11",doce:"12",trece:"13",catorce:"14",quince:"15",veinte:"20",treinta:"30",cuarenta:"40",cincuenta:"50",
            sesenta:"60",setenta:"70",ochenta:"80",noventa:"90",cien:"100",ciento:"100",doscientos:"200",trescientos:"300",
            cuatrocientos:"400",quinientos:"500",seiscientos:"600",setecientos:"700",ochocientos:"800",novecientos:"900",
        };
        let t = text;
        Object.entries(map).forEach(([w, n]) => { t = t.replace(new RegExp(`\\b${w}\\b`, "gi"), n); });
        t = t.replace(/([2-9]0)\s+y\s+([1-9])\b/g, (_, a, b) => (parseInt(a) + parseInt(b)).toString());
        t = t.replace(/([1-9]00)\s+([1-9][0-9]?)\b/g, (_, a, b) => (parseInt(a) + parseInt(b)).toString());
        return t;
    };

    const extractTipo = (t: string) => {
        if (t.match(/\b(ingreso|entrada|ganancia|cobro|cobranza|pago recibido)\b/)) return "income";
        if (t.match(/\b(egreso|salida|gasto|compra|pague|gaste|compre|pago)\b/)) return "expense";
        return null;
    };

    const extractMonto = (raw: string) => {
        let t = parseWrittenNumbers(raw);
        t = t.replace(/(\d+)\s*mil\b/g, (_, p) => (parseInt(p) * 1000).toString());
        t = t.replace(/(\d+)\s*millones?\b/g, (_, p) => (parseInt(p) * 1_000_000).toString());
        t = t.replace(/\bmil\s+(\d+)\b/g, (_, p) => (1000 + parseInt(p)).toString());
        t = t.replace(/\bmil\b/g, "1000");
        t = t.replace(/(\d)[.,](\d)/g, "$1$2").replace(/(\d)[.,](\d)/g, "$1$2");
        const nums = (t.match(/\d+/g) || []).map(Number);
        return nums.length ? Math.max(...nums) : null;
    };

    const extractCategoria = (t: string, tipo: string) => {
        const valid = availableCategories.filter((c) => !c.type || c.type === (tipo || "expense"));
        return valid.find((c) => {
            const cn = norm(c.name);
            if (t.includes(cn) || cn.includes(t)) return true;
            const first = cn.split(/\s+/)[0];
            return first.length > 2 && t.split(/\s+/).includes(first);
        });
    };

    const extractResponsables = (t: string) => {
        const found: any[] = [];
        const words = t.split(/\s+/);
        for (const r of availableResponsibles) {
            const rn = norm(r.name);
            const first = rn.split(/\s+/)[0];
            if (t.includes(rn) || (first.length >= 2 && words.includes(first))) {
                if (!found.find((f) => f.name === r.name)) found.push({ name: r.name, percentage: 0 });
            }
        }
        return found;
    };

    const extractFecha = (t: string) => {
        const d = new Date();
        if (t.includes("ayer")) { d.setDate(d.getDate() - 1); return d.toISOString().split("T")[0]; }
        if (t.includes("antier")) { d.setDate(d.getDate() - 2); return d.toISOString().split("T")[0]; }
        if (t.includes("mañana")) { d.setDate(d.getDate() + 1); return d.toISOString().split("T")[0]; }
        if (t.includes("hoy")) return new Date().toISOString().split("T")[0];
        return null;
    };

    // ─── Step logic ───────────────────────────────────────────────────────────

    const handleStepLogic = useCallback((text: string) => {
        let cur = { ...dataRef.current };
        const t = norm(text);

        if (t.match(/\b(corregir|cambiar|editar|modificar|me equivoque)\b/)) {
            let handled = false;
            if (t.includes("monto") || t.includes("valor")) { cur.monto = 0; handled = true; }
            if (t.includes("categoria")) { cur.categoria = ""; handled = true; }
            if (t.match(/\b(tipo|ingreso|egreso)\b/)) { cur.tipo = ""; handled = true; }
            if (t.match(/\b(responsable|persona)\b/)) { cur.responsibles = []; handled = true; }
            if (t.match(/\b(descripcion|concepto)\b/)) { cur.descripcion = ""; handled = true; }
            if (handled) { commit(cur); speak("Vamos a corregirlo.", () => triggerRecord()); determineNextStep(cur, false); return; }
        }

        if (t.match(/\b(omitir|saltar|siguiente|adelantar)\b/)) {
            if (stepRef.current === "DESCRIPCION") { cur.descripcion = cur.categoria || "Sin descripción"; commit(cur); determineNextStep(cur, true); return; }
            if (stepRef.current === "FECHA") { cur.fecha = new Date().toISOString().split("T")[0]; commit(cur); determineNextStep(cur, true); return; }
            speak("Ese dato es obligatorio.", () => triggerRecord()); return;
        }

        if (t.match(/\b(cancelar todo|reiniciar|empezar de nuevo)\b/)) {
            cur = { tipo: "", monto: 0, descripcion: "", categoria: "", responsibles: [], fecha: new Date().toISOString().split("T")[0] };
            commit(cur); setCurrentStep("TIPO"); stepRef.current = "TIPO";
            speak("Cancelado. ¿Ingreso o egreso?", () => triggerRecord()); return;
        }

        if (stepRef.current === "RESUMEN") {
            if (t.match(/\b(aprobado|si|sí|ok|correcto|apruebo|confirmo|dale|listo)\b/)) {
                setCurrentStep("FINALIZADO"); stepRef.current = "FINALIZADO";
                shouldAutoRef.current = false;
                speak("¡Perfecto! Movimiento registrado.");
                submitTransaction(cur);
                setTimeout(() => onClose(), 3000);
            } else if (t.match(/\b(no|cancelar|incorrecto|mal)\b/)) {
                cur = { tipo: "", monto: 0, descripcion: "", categoria: "", responsibles: [], fecha: new Date().toISOString().split("T")[0] };
                commit(cur); setCurrentStep("TIPO"); stepRef.current = "TIPO";
                speak("Cancelado. ¿Ingreso o egreso?", () => triggerRecord());
            } else { speak("¿Aprobado? Responde sí o no.", () => triggerRecord()); }
            return;
        }

        let updated = false;
        const tipo = extractTipo(t);
        if (tipo && !cur.tipo) { cur.tipo = tipo; updated = true; }
        const monto = extractMonto(t);
        if (monto && cur.monto === 0) { cur.monto = monto; updated = true; }
        const cat = extractCategoria(t, cur.tipo || "expense");
        if (cat && !cur.categoria) { cur.categoria = cat.name; updated = true; }
        const resps = extractResponsables(t);
        if (resps.length > 0 && cur.responsibles.length === 0) {
            const pct = Math.floor(100 / resps.length);
            cur.responsibles = resps.map((r, i) => ({ ...r, percentage: i === resps.length - 1 ? 100 - pct * (resps.length - 1) : pct }));
            updated = true;
        }
        const fecha = extractFecha(t);
        if (fecha && t.match(/\b(ayer|antier|mañana|hoy)\b/)) { cur.fecha = fecha; updated = true; }
        if (stepRef.current === "DESCRIPCION" && text.trim().length > 2) { cur.descripcion = text.trim(); updated = true; }

        commit(cur);
        determineNextStep(cur, updated);
    }, [availableCategories, availableResponsibles]);

    const commit = (d: typeof data) => { setData(d); dataRef.current = d; };

    const triggerRecord = useCallback(() => {
        if (!shouldAutoRef.current || stepRef.current === "FINALIZADO") return;
        const currentMode = modeRef.current;
        if (currentMode === "speech-api") {
            setTimeout(() => {
                if (shouldAutoRef.current && !isSpeakingRef.current) startSpeechAPI();
            }, 400);
        } else if (currentMode === "whisper") {
            scheduleNextRecord();
        }
    }, [startSpeechAPI, scheduleNextRecord]);

    const determineNextStep = useCallback((cur: typeof data, updated: boolean) => {
        const missing: Step[] = [];
        if (!cur.tipo) missing.push("TIPO");
        if (cur.monto === 0) missing.push("MONTO");
        if (!cur.descripcion) missing.push("DESCRIPCION");
        if (!cur.categoria) missing.push("CATEGORIA");
        if (cur.responsibles.length === 0) missing.push("RESPONSABLES");

        if (missing.length === 0) {
            setCurrentStep("RESUMEN"); stepRef.current = "RESUMEN";
            const msg = `Resumen: ${cur.tipo === "income" ? "Ingreso" : "Egreso"} de ${cur.monto} pesos, categoría ${cur.categoria}, responsables: ${cur.responsibles.map((r: any) => r.name).join(", ")}. ¿Aprobado?`;
            speak(msg, () => triggerRecord()); return;
        }

        const next = missing[0];
        setCurrentStep(next); stepRef.current = next;

        const prompts: Record<string, [string, string]> = {
            TIPO: ["No detecté. ¿Es un ingreso o un egreso?", "¿Tipo de movimiento?"],
            MONTO: ["No detecté el monto. ¿De cuánto es?", `${cur.tipo === "income" ? "Ingreso" : "Egreso"}. ¿De cuánto es el monto?`],
            DESCRIPCION: ["Dime el concepto.", `Monto ${cur.monto}. ¿Qué descripción le ponemos?`],
            CATEGORIA: ["No reconocí la categoría. Di una de la lista.", "Anotado. ¿En qué categoría?"],
            RESPONSABLES: ["No detecté responsables. Menciona uno.", `Categoría ${cur.categoria}. ¿Quiénes son los responsables?`],
        };

        const [err, ok] = prompts[next] ?? ["Continúa.", "Continúa."];
        speak(updated ? ok : err, () => triggerRecord());
    }, [speak, triggerRecord]);

    const submitTransaction = (d: typeof data) => {
        if (!user) return;
        addTransaction({
            type: (d.tipo as any) || "expense", amount: d.monto,
            description: d.descripcion, category: d.categoria, date: d.fecha,
            responsibles: d.responsibles.length > 0 ? d.responsibles : [{ name: "Principal", percentage: 100 }],
        });
    };

    // ─── Mic button ───────────────────────────────────────────────────────────

    const handleMicButton = async () => {
        if (isProcessing) return;
        if (mode === "speech-api") {
            isListening ? stopSpeechAPI() : startSpeechAPI();
        } else if (mode === "whisper") {
            isListening ? stopWhisperRecord() : startWhisperRecord();
        }
    };

    const micDisabled = isProcessing || currentStep === "FINALIZADO" ||
        (mode === "whisper" && (modelState === "loading" || modelState === "error")) ||
        mode === "detecting" || mode === "manual";

    // ─── Render ───────────────────────────────────────────────────────────────

    if (!isOpen) return null;

    const stepLabels: Record<Step, string> = {
        TIPO: "Tipo de Movimiento", MONTO: "Monto", DESCRIPCION: "Descripción",
        CATEGORIA: "Categoría", RESPONSABLES: "Responsables", FECHA: "Fecha",
        RESUMEN: "Confirmación Final", FINALIZADO: "¡Completado!",
    };
    const stepsArr: Step[] = ["TIPO","MONTO","DESCRIPCION","CATEGORIA","RESPONSABLES","FECHA","RESUMEN","FINALIZADO"];

    return (
        <div className="fixed bottom-[8.5rem] right-6 md:bottom-32 md:right-10 z-[500] flex items-end justify-end pointer-events-none">
            <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 40, x: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 40, x: 10 }}
                transition={{ type: "spring", damping: 22, stiffness: 320 }}
                className="relative w-[calc(100vw-3rem)] md:w-[430px] bg-slate-900/96 border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,200,255,0.12)] overflow-hidden backdrop-blur-2xl pointer-events-auto"
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-white/8 flex justify-between items-center bg-white/4">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Bot size={18} className="text-emerald-400" />
                        Asistente de Voz
                        {mode === "speech-api" && (
                            <span className="text-[10px] font-medium text-emerald-400/70 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                                Nativo
                            </span>
                        )}
                        {mode === "whisper" && modelState === "ready" && (
                            <span className="text-[10px] font-medium text-blue-400/70 bg-blue-400/10 px-2 py-0.5 rounded-full border border-blue-400/20">
                                Whisper IA
                            </span>
                        )}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <X size={17} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <AnimatePresence>
                        {/* Whisper model loading */}
                        {mode === "whisper" && modelState === "loading" && (
                            <motion.div key="loading" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className="bg-blue-500/8 border border-blue-500/25 rounded-2xl p-3.5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Download size={14} className="text-blue-400 shrink-0" />
                                        <p className="text-xs font-semibold text-blue-300">Descargando motor de voz (solo primera vez)</p>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden">
                                        <motion.div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                                            animate={{ width: `${loadProgress}%` }} transition={{ ease: "linear" }} />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1.5 truncate">{loadFile || "Iniciando…"} — {loadProgress}%</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">~40 MB · después funciona sin internet</p>
                                    {/* Fallback: switch to manual while downloading */}
                                    <button onClick={() => setMode("manual")}
                                        className="mt-2 text-[10px] text-slate-500 hover:text-slate-300 underline transition-colors">
                                        Usar teclado mientras descarga
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Whisper error */}
                        {mode === "whisper" && modelState === "error" && (
                            <motion.div key="wh-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className="bg-amber-500/8 border border-amber-500/25 rounded-2xl p-3 flex items-start gap-2">
                                    <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-amber-300">No se pudo cargar el motor de voz.</p>
                                        <button onClick={() => setMode("manual")}
                                            className="text-[10px] text-amber-400/70 underline mt-1">
                                            Continuar con teclado
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Mic permission error */}
                        {permissionDenied && (
                            <motion.div key="perm" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className="bg-red-500/8 border border-red-500/25 rounded-2xl p-3 flex items-start gap-2">
                                    <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-300">Micrófono bloqueado. Ve a <strong>Ajustes → Privacidad → Micrófono</strong>.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Mic button */}
                    {mode !== "manual" && (
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 ${isListening ? "bg-red-500/30 scale-150" : "bg-blue-500/15"}`} />
                                <button onClick={handleMicButton} disabled={micDisabled}
                                    className={`relative w-[72px] h-[72px] rounded-full flex items-center justify-center border-2 transition-all duration-300 active:scale-90 focus:outline-none ${
                                        isListening ? "bg-red-500/25 border-red-400 shadow-[0_0_24px_rgba(239,68,68,0.5)]"
                                        : micDisabled ? "bg-slate-800/60 border-white/10 cursor-not-allowed opacity-50"
                                        : "bg-blue-500/20 border-blue-400/70 hover:bg-blue-500/30 hover:border-blue-400 shadow-[0_0_24px_rgba(59,130,246,0.35)] cursor-pointer"
                                    }`}>
                                    {isProcessing ? <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
                                        : isListening ? <MicOff className="w-7 h-7 text-red-400" />
                                        : <Mic className="w-7 h-7 text-blue-400" />}
                                </button>
                                {isListening && (
                                    <>
                                        <motion.div className="absolute inset-0 rounded-full border-2 border-red-400/50"
                                            animate={{ scale: [1, 1.5], opacity: [0.8, 0] }} transition={{ duration: 1.1, repeat: Infinity }} />
                                        <motion.div className="absolute inset-0 rounded-full border border-red-400/25"
                                            animate={{ scale: [1, 1.8], opacity: [0.5, 0] }} transition={{ duration: 1.1, repeat: Infinity, delay: 0.35 }} />
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Switch to manual button */}
                    {mode !== "manual" && modelState !== "loading" && (
                        <div className="flex justify-center">
                            <button onClick={() => setMode("manual")}
                                className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
                                <Keyboard size={11} />
                                Usar teclado
                            </button>
                        </div>
                    )}

                    {/* Status line */}
                    {mode !== "manual" && (
                        <p className="text-center text-xs font-medium min-h-[18px]">
                            {isListening ? <span className="text-red-400 animate-pulse">● Grabando — toca para detener</span>
                                : isProcessing ? <span className="text-blue-400">Procesando…</span>
                                : <span className="text-slate-400">{statusMsg}</span>}
                        </p>
                    )}

                    {/* Step label */}
                    <div className="text-center">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400/80">
                            {stepLabels[currentStep]}
                        </span>
                    </div>

                    {/* Transcript / Manual input */}
                    {mode === "manual" ? (
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <input
                                    value={manualText}
                                    onChange={(e) => setManualText(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                                    placeholder="Escribe tu respuesta…"
                                    className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                                <button onClick={handleManualSubmit} disabled={!manualText.trim()}
                                    className="px-3 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-xl text-sm font-medium transition-all disabled:opacity-40">
                                    OK
                                </button>
                            </div>
                            <button onClick={() => setMode(canUseSpeechAPI() ? "speech-api" : "whisper")}
                                className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors mx-auto">
                                <Mic size={11} /> Volver al micrófono
                            </button>
                        </div>
                    ) : (
                        <div className="bg-black/25 rounded-2xl p-4 min-h-[68px] border border-white/5 flex items-center justify-center">
                            <AnimatePresence mode="wait">
                                {transcript ? (
                                    <motion.p key={transcript} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                        className="text-sm font-medium text-white italic text-center">"{transcript}"</motion.p>
                                ) : (
                                    <motion.p key="ph" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="text-sm text-slate-600 text-center">Tu voz aparecerá aquí…</motion.p>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Category chips */}
                    {currentStep === "CATEGORIA" && (
                        <div className="flex flex-wrap justify-center gap-1.5 max-h-24 overflow-y-auto">
                            {availableCategories.filter((c) => !c.type || c.type === (data.tipo || "expense")).map((cat) => (
                                <button key={cat.id} onClick={() => { handleStepLogic(cat.name); }}
                                    className="text-[10px] font-medium bg-white/5 hover:bg-white/10 text-slate-300 px-2.5 py-1 rounded-full border border-white/8 transition-colors active:scale-95">
                                    {cat.emoji} {cat.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Responsible chips */}
                    {currentStep === "RESPONSABLES" && (
                        <div className="flex flex-wrap justify-center gap-1.5 max-h-24 overflow-y-auto">
                            {availableResponsibles.map((r) => (
                                <button key={r.id} onClick={() => { handleStepLogic(r.name); }}
                                    className="text-[10px] font-medium bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-500/20 transition-colors active:scale-95">
                                    {r.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Completed */}
                    {currentStep === "FINALIZADO" && (
                        <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-2 py-2">
                            <CheckCircle className="w-10 h-10 text-emerald-400" />
                            <p className="text-sm font-bold text-emerald-400">¡Transacción registrada!</p>
                        </motion.div>
                    )}

                    {/* Progress dots */}
                    <div className="flex justify-between items-center pt-3 border-t border-white/8 px-1">
                        {["TIPO","MONTO","DESCRIPCION","CATEGORIA","RESPONSABLES","FECHA","RESUMEN"].map((s) => {
                            const idx = stepsArr.indexOf(s as Step);
                            const curIdx = stepsArr.indexOf(currentStep);
                            return (
                                <div key={s} title={stepLabels[s as Step]}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${
                                        idx < curIdx ? "bg-emerald-500 flex-1 mx-0.5"
                                        : s === currentStep ? "bg-blue-500 w-8 mx-0.5"
                                        : "bg-white/15 w-1.5 mx-0.5"
                                    }`} />
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
