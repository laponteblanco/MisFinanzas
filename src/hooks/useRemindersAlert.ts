import { useEffect, useState, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useReminders } from '@/store/useReminders';
import { isWithinInterval, addDays, parseISO, startOfDay, isToday } from 'date-fns';

export function useRemindersAlert() {
  const { user } = useAuth();
  const { reminders, fetchReminders } = useReminders();
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id) {
      fetchReminders(user.id);
    }
  }, [user?.id, fetchReminders]);

  useEffect(() => {
    if (reminders.length > 0) {
      const today = startOfDay(new Date());
      const threeDaysFromNow = addDays(today, 3);

      const alerts = reminders.filter(r => {
        if (!r.is_active) return false;
        
        try {
          const dueDate = startOfDay(parseISO(r.due_date));
          // Verificar si vence hoy o en los próximos 3 días
          return isToday(dueDate) || (dueDate > today && dueDate <= threeDaysFromNow);
        } catch (e) {
          return false;
        }
      });

      setActiveAlerts(alerts);
    }
  }, [reminders]);

  return { activeAlerts };
}
