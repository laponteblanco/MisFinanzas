"use server";

import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getAdminStats() {
    // 1. Verificación de Autenticación y Autorización
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
        throw new Error("No autorizado");
    }

    // Verificar si es administrador usando el service_role (bypasea RLS por seguridad)
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (profile?.role !== 'admin') {
        throw new Error("Acceso denegado: Se requiere rol de administrador");
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
        totalUsers: totalUsers || 0,
        activeUsers,
        expiredTrialUsers,
        totalTransactions: totalTransactions || 0,
        planDistribution
    };
}
