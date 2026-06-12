import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite acceso desde dispositivos móviles en la misma red WiFi durante desarrollo
  allowedDevOrigins: [
    "192.168.1.*",   // Red local típica
    "192.168.0.*",   // Variante común
    "10.0.0.*",      // Hotspot / redes corporativas
    "172.16.*",      // Docker / VPN
  ],
};

export default nextConfig;
