import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { parseLocalDate } from "@/lib/utils";

// Cache TTL en milisegundos (30 segundos — más corto porque las transacciones cambian frecuentemente)
const TX_CACHE_TTL = 30_000;

export interface TransactionSplit {
    name: string;
    percentage: number;
}

export interface Transaction {
  id: string; 
  amount: number; 
  type: 'income' | 'expense';
  category: string; 
  description?: string; 
  date: string;
  created_at?: string;
  user_id?: string; 
  responsibles?: TransactionSplit[] | null;
}

interface TransactionFilters {
    category: string;
    type: 'all' | 'income' | 'expense';
    search: string;
    dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
    startDate: string | null;
    endDate: string | null;
    responsible: string[] | 'all';
}

interface TransactionState {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  loading: boolean;
  budgets: Record<string, number>;
  filters: TransactionFilters;
  transactionToEdit: Transaction | null;
  isFormOpen: boolean;
  currentUserId: string | null;
  _lastFetchedAt: number | null;
  _cachedUserId: string | null;

  
  // Actions
  setIsFormOpen: (open: boolean) => void;
  fetchTransactions: (userId: string, force?: boolean) => Promise<void>;
  invalidateCache: () => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'user_id'>) => Promise<void>;
  editTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  setTransactionToEdit: (transaction: Transaction | null) => void;
  calculateKPIs: () => void;
  applyFilters: () => void;
  updateBudget: (category: string, limit: number) => Promise<void>;
}


export const useTransactions = create<TransactionState>((set, get) => ({
  transactions: [],
  filteredTransactions: [],
  loading: false,
  budgets: {} as Record<string, number>,
  filters: { category: "all", type: "all", search: "", dateRange: "all", startDate: null, endDate: null, responsible: "all" },
  transactionToEdit: null,
  isFormOpen: false,
  currentUserId: null,
  _lastFetchedAt: null,
  _cachedUserId: null,


  setIsFormOpen: (open) => set({ isFormOpen: open }),

  invalidateCache: () => {
    set({ _lastFetchedAt: null });
  },

  fetchTransactions: async (userId: string, force = false) => {
    const { _lastFetchedAt, _cachedUserId, loading } = get();
    const now = Date.now();

    // Si el caché es válido y no se fuerza, no ir a la base de datos
    if (
        !force &&
        !loading &&
        _lastFetchedAt &&
        _cachedUserId === userId &&
        (now - _lastFetchedAt) < TX_CACHE_TTL
    ) {
        return; // ✅ Cache HIT — ahorramos la llamada más pesada a Supabase
    }

    if (loading) return;
    set({ loading: true });
    
    try {
      const [txRes, catDataRes] = await Promise.all([
        supabase.from("transactions")
          .select("*")
          .eq("user_id", userId)
          .is("deleted_at", null)
          .order("date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("name, budget, emoji").or(`user_id.eq.${userId},user_id.is.null`)
      ]);

      if (!txRes.error) {
        set({ transactions: txRes.data || [] });
        get().applyFilters();
        get().calculateKPIs();
      }


      if (!catDataRes.error && catDataRes.data) {
        const dynamicBudgets: Record<string, number> = {};
        catDataRes.data.forEach(c => {
          dynamicBudgets[c.name] = Number(c.budget) || 0;
        });
        set({ budgets: dynamicBudgets });
      }

      set({ _lastFetchedAt: Date.now(), _cachedUserId: userId });
    } catch (err) {
      console.error("Error al cargar transacciones:", err);
    } finally {
      set({ loading: false });
      

    }
  },



  addTransaction: async (transactionData) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // --- ACCIÓN OPTIMISTA ---
    const tempId = crypto.randomUUID();
    const newTransaction = { 
      ...transactionData, 
      id: tempId, 
      user_id: session.user.id,
      responsibles: transactionData.responsibles || []
    } as Transaction;

    const currentTransactions = [newTransaction, ...get().transactions].sort((a, b) => {
        const dDiff = parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime();
        if (dDiff !== 0) return dDiff;
        return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
    });
    
    const previousTransactions = get().transactions;
    
    // Actualizar UI inmediatamente
    set({ transactions: currentTransactions });
    get().applyFilters();
    get().calculateKPIs();

    // Sincronizar en segundo plano
    const { data, error } = await supabase.from("transactions").insert({
      ...transactionData,
      user_id: session.user.id,
      responsibles: transactionData.responsibles || []
    }).select().single();

    if (error) {
      console.error("Fallo al guardar:", error.message);
      set({ transactions: previousTransactions });
      get().applyFilters();
    } else if (data) {
      set(state => ({
        transactions: state.transactions.map(t => t.id === tempId ? data : t)
      }));
    }
  },

  editTransaction: async (id, transactionData) => {
    // --- ACCIÓN OPTIMISTA ---
    const previousTransactions = get().transactions;
    const updatedTransactions = previousTransactions
        .map(t => t.id === id ? { ...t, ...transactionData } : t)
        .sort((a, b) => {
            const dDiff = parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime();
            if (dDiff !== 0) return dDiff;
            return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
        });

    set({ transactions: updatedTransactions, transactionToEdit: null });
    get().applyFilters();
    get().calculateKPIs();

    const { error } = await supabase
        .from("transactions")
        .update({
          ...transactionData,
          responsibles: transactionData.responsibles || undefined
        })
        .eq("id", id);

    if (error) {
      set({ transactions: previousTransactions });
      get().applyFilters();
    }
  },

  deleteTransaction: async (id) => {
    // --- ACCIÓN OPTIMISTA ---
    const previousTransactions = get().transactions;
    const filtered = previousTransactions.filter(t => t.id !== id);

    set({ transactions: filtered });
    get().applyFilters();
    get().calculateKPIs();

    const { error } = await supabase
        .from("transactions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

    if (error) {
      set({ transactions: previousTransactions });
      get().applyFilters();
    }
  },

  updateBudget: async (category: string, limit: number) => {
    const userId = get().currentUserId;
    if (!userId) {
      console.error('User ID not available for budget update');
      return;
    }
    try {
      const { error } = await supabase
        .from('categories')
        .update({ budget: limit })
        .eq('name', category)
        .eq('user_id', userId);
      if (error) throw error;
      set(state => ({ budgets: { ...state.budgets, [category]: limit } }));
    } catch (err) {
      console.error('Error updating budget:', err);
    }
  },
setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
    get().applyFilters();
  },

  setTransactionToEdit: (transaction) => set({ transactionToEdit: transaction }),

  applyFilters: () => {
    const { transactions, filters } = get();
    let filtered = [...transactions];

    if (filters.type !== 'all') {
        filtered = filtered.filter(t => t.type === filters.type);
    }

    if (filters.category !== 'all') {
        filtered = filtered.filter(t => t.category === filters.category);
    }

    if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(t => 
            t.description?.toLowerCase().includes(search) || 
            t.category.toLowerCase().includes(search)
        );
    }
    
    if (filters.startDate && filters.endDate) {
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        // Ajustamos las horas para incluir todo el día en la comparación
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        filtered = filtered.filter(t => {
            const d = parseLocalDate(t.date);
            return d >= start && d <= end;
        });
    }

    if (filters.responsible !== 'all' && filters.responsible.length > 0) {
        filtered = filtered.filter(tx => {
            if (!Array.isArray(tx.responsibles)) return false;
            return tx.responsibles.some((r: any) => (filters.responsible as string[]).includes(r.name));
        });
    }

    // ⭐ REFUERZO DE ORDEN CRONOLÓGICO INVERSO (ÚLTIMO INTENTO)
    filtered.sort((a, b) => {
        const dDiff = parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime();
        if (dDiff !== 0) return dDiff;
        return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
    });

    set({ filteredTransactions: filtered });
  },

  calculateKPIs: () => {
    // KPI calculation logic can be added here if needed in the future
  }

}));