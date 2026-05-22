import { supabase } from "../lib/supabase";
import { FinancialMovement } from "@/types";

/**
 * Transaction Service (SaaS Core)
 * Handles financial movements with RLS security.
 */
export const TransactionService = {
  /**
   * Fetch all user movements (RLS enforced)
   */
  async getTransactions(userId: string): Promise<FinancialMovement[]> {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null) // Exclude soft-deleted records
      .order("date", { ascending: false });

    if (error) throw error;
    return data as FinancialMovement[];
  },

  /**
   * Create a new transaction (Income or Expense)
   */
  async createTransaction(movement: Omit<FinancialMovement, "id" | "created_at">) {
    const { data, error } = await supabase
      .from("transactions")
      .insert([movement])
      .select()
      .single();

    if (error) throw error;
    return data as FinancialMovement;
  },

  /**
   * Soft delete a transaction
   */
  async deleteTransaction(id: string) {
    const { error } = await supabase
      .from("transactions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    return true;
  }
};
