"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price_id?: string | null;
  features?: any;
}

interface Profile {
  trial_end_at: string | null;
}

export default function SupportPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const router = useRouter();

  // Load user profile
  useEffect(() => {
    async function fetchProfile() {
      const { data, error } = await supabase.from("profiles").select("trial_end_at").single();
      if (!error && data) {
        setProfile(data);
        if (data.trial_end_at && new Date(data.trial_end_at) < new Date()) {
          setShowBanner(true);
        }
      }
    }
    fetchProfile();
  }, []);

  // Load plans
  useEffect(() => {
    async function fetchPlans() {
      const { data, error } = await supabase.from("plans").select("id, name, price_id, features");
      if (!error && data) setPlans(data as Plan[]);
    }
    fetchPlans();
  }, []);

  const handleBuy = (planId: string) => {
    // TODO: integrate real checkout (Stripe / etc.)
    alert(`Próximamente podrás comprar el plan ${planId}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[var(--theme-text)] p-8">
      <h1 className="text-3xl font-bold mb-6">Planes y suscripciones</h1>

      {showBanner && (
        <div className="flex items-center justify-between bg-yellow-600/20 border border-yellow-500 text-yellow-200 p-4 rounded-xl mb-6">
          <span>Tu periodo de prueba gratuito ha expirado. ¡Actualiza ahora y sigue disfrutando de todas las funcionalidades!</span>
          <button onClick={() => setShowBanner(false)} className="p-2 hover:bg-white/10 rounded-full">
            <X size={20} />
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="border border-[var(--theme-border)] rounded-2xl p-6 bg-[#111]">
            <h2 className="text-xl font-semibold mb-2">{plan.name}</h2>
            <p className="text-sm mb-4">{plan.features ? JSON.stringify(plan.features) : ""}</p>
            <button
              onClick={() => handleBuy(plan.id)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-[var(--theme-text)] py-2 rounded-xl transition-colors"
            >
              {plan.price_id ? "Comprar" : "Plan gratuito"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
