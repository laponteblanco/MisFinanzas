"use server";

import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getAdminStats() {
    try {
    // 1. Verificación de Autenticación y Autorización
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll().map(cookie => ({
                        name: cookie.name,
                        value: cookie.value,
                    }));
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // setAll is called from a Server Component where setting
                        // cookies is not possible. This can be safely ignored if
                        // you have middleware refreshing sessions.
                    }
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
        throw new Error("No autorizado");
    }

    if (!supabaseAdmin) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY no está configurada en las variables de entorno de este entorno (Netlify).");
    }

    // Verificar si es administrador usando el service_role (bypasea RLS por seguridad)
    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    const loggedInEmail = session.user.email?.toLowerCase();
    
    // Si el usuario es el administrador principal por correo
    if (loggedInEmail === 'luisaponteblanco@gmail.com') {
        if (!profile || profile.role !== 'admin') {
            console.log(`[getAdminStats] Detectado administrador principal ${loggedInEmail} con rol incorrecto o sin perfil. Auto-reparando...`);
            
            if (!profile) {
                // Crear perfil si no existe
                await supabaseAdmin.from('profiles').insert({
                    id: session.user.id,
                    email: session.user.email,
                    display_name: 'Luis Aponte Blanco',
                    role: 'admin',
                    tour_completed: true,
                    subscription_status: 'active'
                });
            } else {
                // Actualizar a admin si existe pero no lo es
                await supabaseAdmin.from('profiles')
                    .update({ role: 'admin', subscription_status: 'active' })
                    .eq('id', session.user.id);
            }
            
            // Re-verificar
            const { data: refreshedProfile } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            
            if (refreshedProfile?.role !== 'admin') {
                throw new Error(`Acceso denegado: No se pudo auto-reparar el perfil de administrador para ${session.user.email}`);
            }
        }
    } else {
        // Para cualquier otro usuario
        if (!profile || profile.role !== 'admin') {
            throw new Error(`Acceso denegado: Se requiere rol de administrador. Estás conectado como: ${session.user.email || 'correo desconocido'}`);
        }
    }

    // 2. Extracción de Métricas (usando service_role para ver toda la BD)
    
    // Total de usuarios
    const { count: totalUsers } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    // Total de transacciones
    const { count: totalTransactions } = await supabaseAdmin
        .from('transactions')
        .select('*', { count: 'exact', head: true });

    // Distribución de planes y usuarios activos
    const { data: profilesData } = await supabaseAdmin
        .from('profiles')
        .select('*, plans(name)');

    const planCounts: Record<string, number> = {};
    let activeUsers = 0;
    let expiredTrialUsers = 0;
    const now = new Date();

    if (profilesData) {
        profilesData.forEach((p: any) => {
            // Extraer nombre del plan, ya que el join lo pone dentro del objeto "plans"
            const planName = p.plans?.name || 'Gratis / Desconocido';
            planCounts[planName] = (planCounts[planName] || 0) + 1;
            
            // Consideramos activo si no está eliminado y tiene un plan
            if (!p.deleted_at) {
                activeUsers++;
            }

            const isTrialExpired = p.trial_end_at && new Date(p.trial_end_at) < now;
            if (isTrialExpired && (!p.plan_id || planName === 'Gratis / Desconocido')) {
                expiredTrialUsers++;
            }
        });
    }

    const planDistribution = Object.keys(planCounts).map(name => ({
        name,
        value: planCounts[name]
    }));

    return {
        data: {
            totalUsers: totalUsers || 0,
            activeUsers,
            expiredTrialUsers,
            totalTransactions: totalTransactions || 0,
            planDistribution
        },
        error: null
    };
    } catch (error: any) {
        console.error("[getAdminStats] Error:", error);
        return { data: null, error: error?.message || "Error al obtener métricas de administración" };
    }
}
