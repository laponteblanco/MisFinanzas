import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@/types";

/**
 * Authentication Service (Industrial Grade SaaS)
 * Handles identity and session management.
 */
export const AuthService = {
    /**
     * Sign Up with Profile Initialization
     */
    async signUp(email: string, password: string, displayName: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName,
                },
            },
        });

        if (error) throw error;
        return data;
    },

    /**
     * Standard Email/Password Login
     */
    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data;
    },

    /**
     * Global Sign Out
     */
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /**
     * Get Current Profile (Server-side & Client-side backup)
     */
    async getProfile(userId: string): Promise<UserProfile | null> {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (error) {
            console.error("Error fetching profile:", error.message);
            return null;
        }

        return data as UserProfile;
    },

    /**
     * Social Auth Placeholder (OAuth Ready)
     */
    async signInWithGoogle() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) throw error;
        return data;
    }
};
