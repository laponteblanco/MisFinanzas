"use client";

import React from "react";
import { cn } from "@/lib/utils";

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
            <main className="flex-1 p-4 md:p-10 max-w-5xl mx-auto space-y-8 w-full">
                <header className="space-y-4">
                    <div className="w-32 h-6 bg-[var(--theme-glass)] rounded-lg animate-pulse" />
                    <div className="w-64 h-10 bg-[var(--theme-glass)] rounded-xl animate-pulse" />
                </header>

                {/* Glass Card Skeleton */}
                <div className="relative overflow-hidden rounded-[2rem] border border-[var(--theme-border)] bg-white/[0.02] p-6 sm:p-10 h-80 animate-in fade-in duration-1000">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-20" />
                    <div className="flex flex-col items-center justify-center h-full space-y-6">
                        <div className="w-48 h-4 bg-white/10 rounded-full animate-pulse" />
                        <div className="w-72 h-16 bg-white/10 rounded-2xl animate-pulse" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <div className="h-20 bg-[var(--theme-glass)] rounded-2xl border border-[var(--theme-border)] animate-pulse" />
                            <div className="h-20 bg-[var(--theme-glass)] rounded-2xl border border-[var(--theme-border)] animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Sections Skeleton */}
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-white/[0.02] border border-[var(--theme-border)] rounded-2xl flex items-center px-6 animate-pulse">
                            <div className="w-4 h-4 bg-white/10 rounded mr-4" />
                            <div className="w-40 h-3 bg-white/10 rounded-full" />
                        </div>
                    ))}
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
