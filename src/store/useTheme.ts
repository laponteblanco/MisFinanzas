import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeColor = 'blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan';
export type ThemeBackground = 'onyx' | 'pure' | 'nordic' | 'ocean' | 'forest' | 'wine';

interface ThemeState {
    theme: ThemeColor;
    bgTheme: ThemeBackground;
    setTheme: (theme: ThemeColor) => void;
    setBgTheme: (bgTheme: ThemeBackground) => void;
}

export const useTheme = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'blue',
            bgTheme: 'onyx',
            setTheme: (theme) => {
                set({ theme });
                if (typeof document !== 'undefined') {
                    document.documentElement.setAttribute('data-theme', theme);
                }
            },
            setBgTheme: (bgTheme) => {
                set({ bgTheme });
                if (typeof document !== 'undefined') {
                    document.documentElement.setAttribute('data-bg', bgTheme);
                }
            },
        }),
        {
            name: 'misfinanzas-theme',
            onRehydrateStorage: () => (state) => {
                if (state && typeof document !== 'undefined') {
                    document.documentElement.setAttribute('data-theme', state.theme);
                    document.documentElement.setAttribute('data-bg', state.bgTheme || 'onyx');
                }
            }
        }
    )
);

