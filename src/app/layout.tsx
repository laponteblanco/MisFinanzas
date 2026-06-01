import "./globals.css";
import { Providers } from "./providers";
import { Inter } from "next/font/google";
// 1. Importamos el componente Script de Next.js
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-inter",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#050505",
};

export const metadata = {
  title: "MisFinanzasPersonales",
  description: "Tu centro de inteligencia financiera y gestión de gastos.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MisFinanzas",
    startupImage: [
      // iPhone 15 Pro Max, 14 Pro Max
      { url: '/splash/apple-splash-1290-2796.png', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 15 Pro, 15, 14 Pro
      { url: '/splash/apple-splash-1179-2556.png', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 14 Plus, 13 Pro Max, 12 Pro Max
      { url: '/splash/apple-splash-1284-2778.png', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 14, 13 Pro, 13, 12 Pro, 12
      { url: '/splash/apple-splash-1170-2532.png', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 11 Pro Max, XS Max
      { url: '/splash/apple-splash-1242-2688.png', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 11, XR
      { url: '/splash/apple-splash-828-1792.png', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)' },
      // iPhone X, XS, 11 Pro
      { url: '/splash/apple-splash-1125-2436.png', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)' },
      // iPad Pro 12.9"
      { url: '/splash/apple-splash-2048-2732.png', media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)' },
      // iPad Pro 11"
      { url: '/splash/apple-splash-1668-2388.png', media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)' },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-[var(--theme-bg)] text-[var(--theme-text)] antialiased min-h-[100dvh] selection:bg-blue-500/30 transition-colors duration-500`}>

        {/* 2. Usamos el componente Script con un ID y la estrategia beforeInteractive */}
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: `try{var l=localStorage.getItem('misfinanzas-theme');if(l){var s=JSON.parse(l).state;if(s.theme)document.documentElement.setAttribute('data-theme',s.theme);if(s.bgTheme)document.documentElement.setAttribute('data-bg',s.bgTheme || 'onyx');}}catch(e){}` }}
        />

        {/* Pre-loader nativo: visible ANTES de que React se hidrate */}
        <div id="app-preloader" style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--theme-bg, #050505)',
          transition: 'opacity 0.4s ease-out',
        }}>
          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes preloader-spin { to { transform: rotate(360deg); } }
            @keyframes preloader-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
            #app-preloader .spinner {
              width: 36px; height: 36px;
              border: 3px solid rgba(255,255,255,0.08);
              border-top-color: #3b82f6;
              border-radius: 50%;
              animation: preloader-spin 0.8s linear infinite;
            }
            #app-preloader .brand {
              margin-top: 20px;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 11px; font-weight: 900;
              letter-spacing: 0.3em; text-transform: uppercase;
              color: rgba(255,255,255,0.25);
              animation: preloader-pulse 2s ease-in-out infinite;
            }
          `}} />
          <div className="spinner" />
          <div className="brand">MisFinanzas</div>
        </div>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}