"use client";

import React from "react";

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] text-white">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full" />
      
      <div className="relative flex flex-col items-center gap-6">
        <div className="relative w-16 h-16">
          {/* Animated Spinner Outer */}
          <div className="absolute inset-0 border-t-2 border-l-2 border-blue-500 rounded-full animate-spin" />
          {/* Animated Spinner Inner */}
          <div className="absolute inset-2 border-b-2 border-r-2 border-blue-400/50 rounded-full animate-spin-slow" />
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-lg font-black tracking-tighter uppercase">
            MisFinanzas<span className="text-blue-500">Personales</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">
            Sincronizando Inteligencia...
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
