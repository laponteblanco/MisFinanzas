/**
 * SaaS Domain Types
 */

export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  avatar_url?: string;
  plan_id?: string;
  trial_end_at?: string;
  tour_completed: boolean;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface FinancialMovement {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  description?: string;
  is_recurring: boolean;
  recurring_group_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  due_date: string;
  is_active: boolean;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'PUSH' | 'EMAIL' | 'IN_APP';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period: 'monthly';
  alert_threshold: number;
  created_at: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'TR' | 'CAT' | 'BD';
  entity_id: string;
  metadata?: Record<string, any>;
  created_at: string;
}
