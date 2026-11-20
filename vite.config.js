import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // PWA: telefona uygulama gibi kurulur, internetsizken de açılır.
    VitePWA({
      registerType: "autoUpdate", // yeni sürüm yayınlanınca kendiliğinden güncellenir
      injectRegister: "auto",
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "SwipeVocab",
        short_name: "SwipeVocab",
        description: "Kelimeleri kaydır, öğren: oyunlaştırılmış İngilizce kelime pratiği.",
        lang: "tr",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#150F1F",
        theme_color: "#150F1F",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Uygulama kabuğu önbelleğe alınır; canlı konuşma parçası (yalnızca çevrimiçi) hariç.
        // Yazı tiplerinden yalnızca Türkçe için gereken Latin dosyaları; diğer alfabeler gerekirse inerken önbelleğe alınır.
        globPatterns: ["**/*.{js,css,html,svg,png}", "**/*-latin-*.woff2"],
        globIgnores: ["**/Talk-*.js", "audio/**"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith(".woff2"),
            handler: "CacheFirst",
            options: { cacheName: "fonts", expiration: { maxEntries: 30 } },
          },
          {
            // Kelime ses kayıtları: bir kez indirilince internetsiz de çalar.
            urlPattern: ({ url }) => url.pathname.startsWith("/audio/"),
            handler: "CacheFirst",
            options: {
              cacheName: "audio",
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    // Canlı konuşma parçası (LiveKit) ~600 KB; yalnızca o ekran açılınca indirilir.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Kütüphaneler ayrı dosyalarda: uygulama kodu değişince tarayıcı bunları yeniden indirmez.
        manualChunks: {
          react: ["react", "react-dom"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
});
