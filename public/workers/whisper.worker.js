/**
 * whisper.worker.js
 * Corre Whisper Tiny 100% en el browser usando ONNX Runtime WebAssembly.
 * Sin llamadas a APIs externas en tiempo real.
 * El modelo (~40MB) se descarga una vez y queda cacheado en el browser.
 */

// Importar desde la CDN de jsdelivr (ES module worker)
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js';

// Configuración
env.allowLocalModels = false;
env.useBrowserCache = true; // cachea el modelo en Cache API del browser

let transcriber = null;
let isLoading = false;

/**
 * Inicializar el pipeline de Whisper (se llama al abrir el panel).
 * La segunda vez este proceso es instantáneo porque el modelo ya está cacheado.
 */
async function loadModel() {
    if (transcriber || isLoading) return;
    isLoading = true;

    try {
        self.postMessage({ type: 'loading', progress: 0 });

        transcriber = await pipeline(
            'automatic-speech-recognition',
            'Xenova/whisper-tiny',
            {
                // Callbacks de progreso durante la descarga
                progress_callback: (progress) => {
                    if (progress.status === 'progress') {
                        self.postMessage({
                            type: 'loading',
                            progress: Math.round(progress.progress || 0),
                            file: progress.file,
                        });
                    }
                },
            }
        );

        isLoading = false;
        self.postMessage({ type: 'ready' });
    } catch (err) {
        isLoading = false;
        self.postMessage({ type: 'error', error: err.message });
    }
}

/**
 * Transcribir audio recibido como Float32Array (16kHz, mono).
 */
async function transcribe(audioFloat32, taskId) {
    if (!transcriber) {
        self.postMessage({ type: 'error', taskId, error: 'Modelo no cargado aún.' });
        return;
    }

    try {
        const result = await transcriber(audioFloat32, {
            language: 'spanish',
            task: 'transcribe',
            // Parámetros para mejorar precisión en frases cortas
            chunk_length_s: 30,
            stride_length_s: 5,
            return_timestamps: false,
        });

        const text = (result?.text || '').trim();
        self.postMessage({ type: 'transcription', taskId, text });
    } catch (err) {
        self.postMessage({ type: 'error', taskId, error: err.message });
    }
}

// Escuchar mensajes del hilo principal
self.addEventListener('message', (event) => {
    const { type, audioData, taskId } = event.data;

    if (type === 'load') {
        loadModel();
    } else if (type === 'transcribe') {
        transcribe(audioData, taskId);
    }
});
