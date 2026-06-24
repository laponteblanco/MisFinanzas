"use client";

import React from "react";

export const DashboardSkeleton = () => {
    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[var(--theme-surface)] transition-colors duration-500 text-white font-sans overflow-hidden">
            {/* Sidebar Skeleton */}
            <aside className="w-full md:w-20 bg-black/40 border-t md:border-r md:border-t-0 border-[var(--theme-border)] flex flex-row md:flex-col items-center justify-around md:justify-between p-4 md:py-8 fixed bottom-0 left-0 right-0 md:sticky md:top-0 md:h-screen z-[500] backdrop-blur-xl">
                <div className="hidden md:block w-10 h-10 bg-[var(--theme-glass)] rounded-xl animate-pulse" />
                <nav className="flex w-full md:w-auto flex-row md:flex-col items-center justify-around md:gap-8 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-10 h-10 bg-[var(--theme-glass)] rounded-xl animate-pulse" />
                    ))}
                </nav>
                <div className="hidden md:block w-10 h-10 rounded-full bg-[var(--theme-glass)] animate-pulse" />
            </aside>

            {/* Main Content Skeleton */}
            <main className="flex-1 p-4 md:p-10 max-w-5xl mx-auto space-y-8 w-full pb-[100px] md:pb-10">
                <header className="space-y-6 mb-2">
                    <h1 className="text-xl font-black tracking-tighter">
                        MisFinanzas<span className="text-blue-600">Personales</span>
                    </h1>
                    
                    <div className="space-y-2">
                        <div className="w-48 h-10 bg-white/5 border border-white/5 rounded-2xl animate-pulse" />
                        <div className="w-72 h-4 bg-white/5 border border-white/5 rounded-full animate-pulse" />
                    </div>
                </header>

                {/* Master Card Skeleton — Tu Patrimonio Global */}
                <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-6 sm:p-10 shadow-[0_32px_90px_-20px_rgba(0,0,0,0.9)] backdrop-blur-3xl">
                    <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.15] rounded-[2rem] px-5 py-6 sm:px-10 sm:py-8 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_50px_rgba(0,0,0,0.4)]">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <span className="w-2 h-2 rounded-full bg-cyan-400/50 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
                            <div className="w-40 h-4 bg-cyan-50/10 rounded-full animate-pulse" />
                        </div>
                        
                        <div className="w-full flex justify-center mb-3">
                            <div className="w-60 h-16 bg-white/10 rounded-2xl animate-pulse" />
                        </div>

                        {/* Sparkline Trend Skeleton */}
                        <div className="w-full flex justify-center my-4 sm:my-8 relative">
                            <div className="w-full max-w-[320px] h-[60px] bg-white/5 rounded-2xl animate-pulse border border-white/5" />
                        </div>

                        {/* Income / Expense Sub-cards Skeleton */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8">
                            {/* Ingresos */}
                            <div className="relative overflow-hidden flex items-center gap-3 sm:gap-4 bg-emerald-500/[0.02] border border-emerald-500/20 rounded-[1.5rem] px-4 py-3 sm:px-5 sm:py-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-pulse shrink-0" />
                                <div className="flex flex-col items-start gap-1 flex-1">
                                    <div className="w-28 h-5 bg-emerald-300/10 rounded-lg animate-pulse" />
                                    <div className="w-20 h-3 bg-emerald-500/10 rounded-full animate-pulse mt-1" />
                                </div>
                            </div>

                            {/* Gastos */}
                            <div className="relative overflow-hidden flex items-center gap-3 sm:gap-4 bg-rose-500/[0.02] border border-rose-500/20 rounded-[1.5rem] px-4 py-3 sm:px-5 sm:py-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 animate-pulse shrink-0" />
                                <div className="flex flex-col items-start gap-1 flex-1">
                                    <div className="w-28 h-5 bg-rose-300/10 rounded-lg animate-pulse" />
                                    <div className="w-20 h-3 bg-rose-500/10 rounded-full animate-pulse mt-1" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ModuleBook / Bitácora Flotante Skeleton */}
                <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-6 sm:p-10 shadow-xl animate-pulse">
                    <div className="flex justify-between items-center mb-6">
                        <div className="w-36 h-6 bg-white/10 rounded-lg" />
                        <div className="flex gap-2">
                            <div className="w-8 h-8 bg-white/10 rounded-lg" />
                            <div className="w-8 h-8 bg-white/10 rounded-lg" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-40 bg-white/5 border border-white/5 rounded-2xl" />
                        <div className="h-40 bg-white/5 border border-white/5 rounded-2xl" />
                    </div>
                </div>
            </main>

            {/* Custom animations */}
            <style jsx global>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-pulse {
                    background: linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0.03) 25%,
                        rgba(255, 255, 255, 0.08) 50%,
                        rgba(255, 255, 255, 0.03) 75%
                    );
                    background-size: 200% 100%;
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite, shimmer 2s infinite;
                }
            `}</style>
        </div>
    );
};

