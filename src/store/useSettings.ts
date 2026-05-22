import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface Category {
    id: string;
    user_id: string | null;
    name: string;
    emoji: string;
    budget: number;
}

export interface Responsible {
    id: string;
    user_id: string;
    name: string;
}

interface SettingsState {
    categories: Category[];
    responsibles: Responsible[];
    loading: boolean;
    
    fetchSettings: (userId: string) => Promise<void>;
    addCategory: (userId: string, name: string, emoji: string, budget: number) => Promise<void>;
    updateCategory: (id: string, updates: Partial<Omit<Category, 'id' | 'user_id'>>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    addResponsible: (userId: string, name: string) => Promise<void>;
    updateResponsible: (id: string, name: string) => Promise<void>;
    deleteResponsible: (id: string) => Promise<void>;
}

export const useSettings = create<SettingsState>((set, get) => ({
    categories: [],
    responsibles: [],
    loading: false,

    fetchSettings: async (userId: string) => {
        set({ loading: true });
        
        try {
            const [catsRes, respsRes] = await Promise.all([
                supabase.from("categories").select("*").eq("user_id", userId),
                supabase.from("responsibles_list").select("*").eq("user_id", userId)
            ]);

            if (!catsRes.error) set({ categories: catsRes.data || [] });
            if (!respsRes.error) set({ responsibles: respsRes.data || [] });
        } catch (err) {
            console.error("Error al cargar settings:", err);
        } finally {
            set({ loading: false });
        }
    },

    addCategory: async (userId, name, emoji, budget) => {
        const { data, error } = await supabase
            .from("categories")
            .insert({ user_id: userId, name, emoji, budget })
            .select()
            .single();
        
        if (!error && data) {
            set(state => ({ categories: [...state.categories, data] }));
        }
    },

    updateCategory: async (id, updates) => {
        const { data, error } = await supabase
            .from("categories")
            .update(updates)
            .eq("id", id)
            .select()
            .single();
        
        if (!error && data) {
            set(state => ({ 
                categories: state.categories.map(c => c.id === id ? data : c) 
            }));
        }
    },

    deleteCategory: async (id) => {
        const { error } = await supabase
            .from("categories")
            .delete()
            .eq("id", id);
        
        if (!error) {
            set(state => ({ categories: state.categories.filter(c => c.id !== id) }));
        }
    },

    addResponsible: async (userId, name) => {
        const { data, error } = await supabase
            .from("responsibles_list")
            .insert({ user_id: userId, name })
            .select()
            .single();
        
        if (!error && data) {
            set(state => ({ responsibles: [...state.responsibles, data] }));
        }
    },

    updateResponsible: async (id, name) => {
        const { data, error } = await supabase
            .from("responsibles_list")
            .update({ name })
            .eq("id", id)
            .select()
            .single();
        
        if (!error && data) {
            set(state => ({ 
                responsibles: state.responsibles.map(r => r.id === id ? data : r) 
            }));
        }
    },

    deleteResponsible: async (id) => {
        const { error } = await supabase
            .from("responsibles_list")
            .delete()
            .eq("id", id);
        
        if (!error) {
            set(state => ({ responsibles: state.responsibles.filter(r => r.id !== id) }));
        }
    }
}));
