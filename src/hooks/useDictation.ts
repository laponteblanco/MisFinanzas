import { useState, useCallback, useRef } from 'react';

type DictationStatus = 'idle' | 'listening' | 'processing' | 'success' | 'error';

interface DictationResult {
  monto: number;
  tipo: 'gasto' | 'ingreso';
  categoria: string;
  fecha: string;
  descripcion: string;
}

export const useDictation = () => {
    const [status, setStatus] = useState<DictationStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    const initRecognition = useCallback(() => {
        if (typeof window === 'undefined') return null;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError('La transcripción de voz nativa no está soportada en este navegador.');
            setStatus('error');
            return null;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-MX';
        recognition.continuous = false;
        recognition.interimResults = false;

        return recognition;
    }, []);

    const processText = async (text: string): Promise<DictationResult | null> => {
        try {
            setStatus('processing');
            const response = await fetch('/api/dictation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    currentDate: new Date().toISOString()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al procesar el dictado');
            }

            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000); // Reset after 3 seconds
            return data.data as DictationResult;
            
        } catch (err: any) {
            console.warn('Error in processText:', err);
            setError(err.message);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 5000); // Reset to idle after a while
            return null;
        }
    };

    const startDictation = useCallback(async (): Promise<DictationResult | null> => {
        return new Promise((resolve, reject) => {
            setError(null);
            
            const recognition = initRecognition();
            if (!recognition) {
                resolve(null);
                setTimeout(() => setStatus('idle'), 5000);
                return;
            }

            recognitionRef.current = recognition;

            recognition.onstart = () => {
                setStatus('listening');
            };

            recognition.onresult = async (event: any) => {
                const text = event.results[0][0].transcript;
                if (text) {
                    const result = await processText(text);
                    if (result) {
                        resolve(result);
                    } else {
                        resolve(null);
                    }
                }
            };

            recognition.onerror = (event: any) => {
                console.warn('Speech recognition error:', event.error);
                let errorMsg = 'Error en el reconocimiento de voz';
                if (event.error === 'not-allowed') {
                    errorMsg = 'Permiso de micrófono denegado.';
                }
                setError(errorMsg);
                setStatus('error');
                setTimeout(() => setStatus('idle'), 5000);
                resolve(null);
            };

            recognition.onend = () => {
                // If it ends and status is still listening, it means no speech was detected
                if (status === 'listening') {
                    setStatus('idle');
                    resolve(null);
                }
            };

            try {
                recognition.start();
            } catch (e) {
                console.warn("Error starting recognition:", e);
                setError("Error al iniciar el micrófono.");
                setStatus('error');
                resolve(null);
            }
        });
    }, [initRecognition, status]);

    const stopDictation = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // ignore
            }
        }
        setStatus('idle');
    }, []);

    return {
        startDictation,
        stopDictation,
        status,
        error
    };
};
