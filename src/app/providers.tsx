"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Ocultar el pre-loader nativo cuando React se hidrata
  useEffect(() => {
    const preloader = document.getElementById('app-preloader');
    if (preloader) {
      preloader.style.opacity = '0';
      preloader.style.pointerEvents = 'none';
      setTimeout(() => preloader.remove(), 500);
    }
    // Seguridad: asegurar que el body sea visible
    document.body.style.pointerEvents = "auto";
    document.body.style.overflow = "auto";
  }, []);

  // Reset de estados en navegación (sin manipular opacity)
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.pointerEvents = "auto";
      document.body.style.overflow = "auto";
    }
  }, [pathname]);

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
