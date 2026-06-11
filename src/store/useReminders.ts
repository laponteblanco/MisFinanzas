import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Reminder } from '@/types';
import { addMonths, format, parseISO } from 'date-fns';

// Cache TTL en milisegundos (60 segundos)
const REMINDERS_CACHE_TTL = 60_000;

interface RemindersState {
  reminders: Reminder[];
  loading: boolean;
  error: string | null;
  _lastFetchedAt: number | null;
  _cachedUserId: string | null;
  fetchReminders: (userId: string, force?: boolean) => Promise<void>;
  invalidateCache: () => void;
  addReminder: (reminder: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleReminderActive: (id: string, currentStatus: boolean) => Promise<void>;
}

export const useReminders = create<RemindersState>((set, get) => ({
  reminders: [],
  loading: false,
  error: null,
  _lastFetchedAt: null,
  _cachedUserId: null,

  invalidateCache: () => {
    set({ _lastFetchedAt: null });
  },

  fetchReminders: async (userId, force = false) => {
    const { _lastFetchedAt, _cachedUserId, loading } = get();
    const now = Date.now();

    // Si el caché es válido y no se fuerza, no ir a la base de datos
    if (
        !force &&
        !loading &&
        _lastFetchedAt &&
        _cachedUserId === userId &&
        (now - _lastFetchedAt) < REMINDERS_CACHE_TTL
    ) {
        return; // ✅ Cache HIT
    }

    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      set({ reminders: data || [], loading: false, _lastFetchedAt: Date.now(), _cachedUserId: userId });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  addReminder: async (reminder) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('reminders')
        .insert([reminder])
        .select()
        .single();

      if (error) throw error;
      set((state) => ({ 
        reminders: [...state.reminders, data].sort((a, b) => 
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        ), 
        loading: false,
        _lastFetchedAt: null
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateReminder: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      set((state) => ({
        reminders: state.reminders.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        _lastFetchedAt: null
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  deleteReminder: async (id) => {
    try {
      const { error } = await supabase.from('reminders').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        reminders: state.reminders.filter((r) => r.id !== id),
        _lastFetchedAt: null
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  toggleReminderActive: async (id, currentStatus) => {
    const { reminders, addReminder } = get();
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;

    const nextStatus = !currentStatus;

    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_active: nextStatus })
        .eq('id', id);

      if (error) throw error;

      // Actualizar estado local inmediatamente
      set((state) => ({
        reminders: state.reminders.map((r) => (r.id === id ? { ...r, is_active: nextStatus } : r))
      }));

      // LÓGICA DE RECURRENCIA:
      // Si el recordatorio se marca como PAGADO (inactive) y es RECURRENTE
      if (currentStatus === true && nextStatus === false && reminder.is_recurring) {
        const nextDueDate = format(addMonths(parseISO(reminder.due_date), 1), 'yyyy-MM-dd');
        
        await addReminder({
          user_id: reminder.user_id,
          title: reminder.title,
          amount: reminder.amount,
          due_date: nextDueDate,
          is_active: true,
          is_recurring: true
        });
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  }
}));
