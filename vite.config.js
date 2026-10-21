import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    basicSsl(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
      manifest: {
        name: "Presensi RSUD Pasuruan",
        short_name: "Presensi",
        description: "Aplikasi Presensi Pegawai RSUD Pasuruan",
        theme_color: "#24c35c",
        background_color: "#fafafa",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icons/rsud-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/rsud-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/rsud-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/rest_pegawai": {
        target: "https://sdm-rsud.pasuruankota.go.id",
        changeOrigin: true,
        secure: false,
      },
      "/api": {
        target: "https://rsud.pasuruankota.go.id",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
