"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { clearSessionToken } from "@/hooks/useSessionGuard";

export interface UserProfile {
    id: string;
    display_name?: string;
    email?: string;
    role: 'admin' | 'user';
    plan_id?: string | null;
    trial_end_at?: string | null;
    subscription_status?: string | null;
    tour_completed: boolean;
    force_password_change?: boolean;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean, error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (data) {
                setProfile(data);
            } else {
                // Fallback de seguridad
                setProfile({ id: userId, display_name: "Usuario", role: "user", plan_id: null, tour_completed: false });
            }
        } catch (err) {
            setProfile({ id: userId, display_name: "Usuario", role: "user", plan_id: null, tour_completed: false });
        }
    };

    const isInitialMount = useRef(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user || null;
            setUser(currentUser);
            if (currentUser) fetchProfile(currentUser.id);
            setLoading(false);
            isInitialMount.current = false;
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'INITIAL_SESSION' || isInitialMount.current) return;
            const currentUser = session?.user || null;
            setUser(currentUser);
            if (currentUser) fetchProfile(currentUser.id);
            else setProfile(null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = useCallback(async () => {
        clearSessionToken(); // Limpiar token de sesión única
        await supabase.auth.signOut();
        window.location.href = '/login';
    }, []);

    const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
        if (!user) return { success: false, error: 'Sin sesión' };
        try {
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (!error) {
                setProfile(prev => prev ? { ...prev, ...updates } : null);
                fetchProfile(user.id);
                return { success: true };
            }
            return { success: false, error };
        } catch (err) {
            console.error("Error al actualizar perfil:", err);
            return { success: false, error: err };
        }
    }, [user]);

    const contextValue = useMemo(() => ({
        user, profile, loading, signOut, updateProfile
    }), [user, profile, loading, signOut, updateProfile]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
    return context;
};

export { AuthProvider, useAuth };