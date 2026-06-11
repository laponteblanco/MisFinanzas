import { create } from "zustand";
import { supabase } from "@/lib/supabase";

export interface Category {
    id: string;
    user_id: string | null;
    name: string;
    emoji: string;
    budget: number;
    type: 'income' | 'expense';
}

export interface Responsible {
    id: string;
    user_id: string;
    name: string;
}

// Cache TTL en milisegundos (60 segundos)
const SETTINGS_CACHE_TTL = 60_000;

interface SettingsState {
    categories: Category[];
    responsibles: Responsible[];
    loading: boolean;
    _lastFetchedAt: number | null;
    _cachedUserId: string | null;
    
    fetchSettings: (userId: string, force?: boolean) => Promise<void>;
    invalidateCache: () => void;
    addCategory: (userId: string, name: string, emoji: string, budget: number, type: 'income' | 'expense') => Promise<void>;
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
    _lastFetchedAt: null,
    _cachedUserId: null,

    invalidateCache: () => {
        set({ _lastFetchedAt: null });
    },

    fetchSettings: async (userId: string, force = false) => {
        const { _lastFetchedAt, _cachedUserId, loading } = get();
        const now = Date.now();

        // Si el caché es válido y no se fuerza, no ir a la base de datos
        if (
            !force &&
            !loading &&
            _lastFetchedAt &&
            _cachedUserId === userId &&
            (now - _lastFetchedAt) < SETTINGS_CACHE_TTL
        ) {
            return; // ✅ Cache HIT — ahorramos una llamada a Supabase
        }

        if (loading) return;
        set({ loading: true });
        
        try {
            const [catsRes, respsRes] = await Promise.all([
                supabase.from("categories").select("*").eq("user_id", userId),
                supabase.from("responsibles_list").select("*").eq("user_id", userId)
            ]);

            if (!catsRes.error) set({ categories: catsRes.data || [] });
            if (!respsRes.error) set({ responsibles: respsRes.data || [] });
            set({ _lastFetchedAt: Date.now(), _cachedUserId: userId });
        } catch (err) {
            console.error("Error al cargar settings:", err);
        } finally {
            set({ loading: false });
        }
    },

    addCategory: async (userId, name, emoji, budget, type) => {
        const { data, error } = await supabase
            .from("categories")
            .insert({ user_id: userId, name, emoji, budget, type })
            .select()
            .single();
        
        if (!error && data) {
            set(state => ({ categories: [...state.categories, data], _lastFetchedAt: null }));
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
                categories: state.categories.map(c => c.id === id ? data : c),
                _lastFetchedAt: null
            }));
        }
    },

    deleteCategory: async (id) => {
        const { error } = await supabase
            .from("categories")
            .delete()
            .eq("id", id);
        
        if (!error) {
            set(state => ({ categories: state.categories.filter(c => c.id !== id), _lastFetchedAt: null }));
        }
    },

    addResponsible: async (userId, name) => {
        const { data, error } = await supabase
            .from("responsibles_list")
            .insert({ user_id: userId, name })
            .select()
            .single();
        
        if (!error && data) {
            set(state => ({ responsibles: [...state.responsibles, data], _lastFetchedAt: null }));
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
                responsibles: state.responsibles.map(r => r.id === id ? data : r),
                _lastFetchedAt: null
            }));
        }
    },

    deleteResponsible: async (id) => {
        const { error } = await supabase
            .from("responsibles_list")
            .delete()
            .eq("id", id);
        
        if (!error) {
            set(state => ({ responsibles: state.responsibles.filter(r => r.id !== id), _lastFetchedAt: null }));
        }
    }
}));
