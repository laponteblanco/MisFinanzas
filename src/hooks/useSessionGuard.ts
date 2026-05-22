"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const SESSION_TOKEN_KEY = "mfp-session-token";
const POLL_INTERVAL_MS = 10_000; // Verificar cada 10 segundos

/**
 * useSessionGuard — Control de Sesión Única por Dispositivo (Actualizado a tabla profiles)
 */
export const useSessionGuard = () => {
    const { user, signOut } = useAuth();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [kicked, setKicked] = useState(false);
    const isCheckingRef = useRef(false);

    const handleSessionConflict = useCallback(async () => {
        if (kicked) return;
        setKicked(true);

        console.warn("🔒 Conflicto de sesión detectado. Cerrando sesión...");

        // Limpiar token local
        localStorage.removeItem(SESSION_TOKEN_KEY);

        // Mostrar alerta al usuario
        alert(
            "⚠️ Sesión Activa en otro dispositivo.\n\n" +
            "Se ha iniciado sesión en otro lugar. Por seguridad, esta sesión será cerrada.\n" +
            "Solo se permite una conexión activa por cuenta."
        );

        // Cerrar sesión y redirigir
        await signOut();
        window.location.href = '/login';
    }, [signOut, kicked]);

    const checkSession = useCallback(async () => {
        if (!user?.id || kicked || isCheckingRef.current) return;
        
        isCheckingRef.current = true;

        try {
            let localToken = localStorage.getItem(SESSION_TOKEN_KEY);
            
            // Si no hay token local pero hay usuario, lo generamos (para sesiones ya abiertas)
            if (!localToken) {
                console.log("🎟️ No hay token local. Registrando nueva sesión para este dispositivo...");
                localToken = await registerSessionToken(user.id);
            }

            const { data, error } = await supabase
                .from("profiles")
                .select("active_session_id")
                .eq("id", user.id)
                .single();

            if (error) {
                console.error("useSessionGuard: Error al leer perfil:", error.message);
                isCheckingRef.current = false;
                return;
            }

            // ⚡ CONFLICTO DETECTADO: El token en la DB es distinto al de este navegador
            if (data.active_session_id && data.active_session_id !== localToken) {
                console.warn("🔒 Polling: Conflicto detectado.", { db: data.active_session_id, local: localToken });
                await handleSessionConflict();
            }
        } catch (err) {
            console.error("useSessionGuard: Error inesperado:", err);
        } finally {
            isCheckingRef.current = false;
        }
    }, [user?.id, kicked, handleSessionConflict]);

    useEffect(() => {
        if (!user?.id || kicked) return;

        console.log("🛠️ Inicializando Session Guard para:", user.id);

        // Verificación inicial inmediata
        checkSession();

        // Polling periódico (como respaldo si falla el Realtime)
        intervalRef.current = setInterval(checkSession, POLL_INTERVAL_MS);

        // Escucha en tiempo real para reacción instantánea
        const channelName = `session-guard-${user.id}`;
        
        const subscription = supabase
            .channel(channelName)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "profiles",
                    filter: `id=eq.${user.id}`,
                },
                (payload) => {
                    console.log("🔔 Evento Realtime recibido:", payload);
                    const newTokenInDB = payload.new?.active_session_id;
                    const currentLocalToken = localStorage.getItem(SESSION_TOKEN_KEY);
                    
                    if (newTokenInDB && currentLocalToken && newTokenInDB !== currentLocalToken) {
                        console.warn("🔒 Realtime: La sesión fue tomada por otro dispositivo.");
                        handleSessionConflict();
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`🔌 Conectado exitosamente a Realtime (${channelName})`);
                }
            });

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            supabase.removeChannel(subscription);
        };
    }, [user?.id, kicked, checkSession, handleSessionConflict]);

    return { kicked };
};

/**
 * Registra un nuevo token de sesión en la tabla profiles.
 */
export const registerSessionToken = async (userId: string): Promise<string> => {
    const newToken = crypto.randomUUID();
    
    // Guardar en la DB
    const { error } = await supabase
        .from("profiles")
        .update({ active_session_id: newToken })
        .eq("id", userId);

    if (error) {
        console.error("❌ Error al persistir token en profiles:", error.message);
    }

    // Guardar localmente
    localStorage.setItem(SESSION_TOKEN_KEY, newToken);
    return newToken;
};

/**
 * Limpia el token de sesión local.
 */
export const clearSessionToken = () => {
    localStorage.removeItem(SESSION_TOKEN_KEY);
};
