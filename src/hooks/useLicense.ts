"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export interface LicenseStatus {
    has_active_access: boolean;
    days_left: number;
    is_trial: boolean;
    plan_name: string;
    loading: boolean;
}

/**
 * useLicense Hook
 * Arquitectura de protección de acceso en tiempo real para MisFinanzas Pro.
 * Consume la vista dinámica 'user_license_status'.
 */
export const useLicense = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState<LicenseStatus>({
        has_active_access: true,
        days_left: 15,
        is_trial: true,
        plan_name: "Cargando...",
        loading: true, // Solo bloquea la primera vez
    });

    const [isInitialized, setIsInitialized] = useState(false);

    const fetchLicenseStatus = useCallback(async () => {
        if (!user?.id) return;

        try {
            const { data, error } = await supabase
                .from('user_license_status')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) {
                // Si el error es que no se encontró el registro (PGRST116), es un usuario nuevo
                if (error.code === 'PGRST116') {
                    console.log("Nueva cuenta: Activando trial por defecto.");
                    setIsInitialized(true);
                    setStatus(prev => ({ ...prev, loading: false }));
                    return;
                }
                throw error;
            }

            if (data) {
                setStatus({
                    has_active_access: data.has_active_access,
                    days_left: data.trial_days_left,
                    is_trial: data.billing_cycle === 'trial',
                    plan_name: data.plan_name,
                    loading: false,
                });
                setIsInitialized(true);
            }
        } catch (err: any) {
            console.error("Error al sincronizar licencia:", err?.message || err);
            // FAIL-SAFE: En caso de error técnico, permitimos el acceso para no bloquear al usuario
            setStatus(prev => ({ ...prev, loading: false, has_active_access: true }));
            setIsInitialized(true);
        }
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;

        fetchLicenseStatus();

        // Generamos un sufijo único por montura para evitar conflictos de "already subscribed" en dev
        const mountId = Math.random().toString(36).substring(7);
        const channelName = `license-live-${user.id}-${mountId}`;
        
        const subscription = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'profiles', 
                    filter: `id=eq.${user.id}` 
                },
                () => {
                    console.log("Licencia actualizada en tiempo real");
                    fetchLicenseStatus();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user?.id, fetchLicenseStatus]);

    return { ...status, isInitialized };
};
