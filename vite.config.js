import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Google AdSense: VITE_ADSENSE_CLIENT (ca-pub-...) yazılıysa site doğrulama etiketi ve reklam betiği sayfaya,
// /ads.txt dosyası da derlemeye eklenir. Boşsa hiçbir reklam kodu yüklenmez.
function adsense(client) {
  const valid = /^ca-pub-\d{10,20}$/.test(client || "");
  return {
    name: "kelimanya-adsense",
    transformIndexHtml() {
      if (!valid) return [];
      return [
        { tag: "meta", attrs: { name: "google-adsense-account", content: client }, injectTo: "head" },
        {
          tag: "script",
          attrs: { async: true, src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`, crossorigin: "anonymous" },
          injectTo: "head",
        },
      ];
    },
    generateBundle() {
      if (!valid) return;
      const pub = client.replace(/^ca-/, "");
      this.emitFile({ type: "asset", fileName: "ads.txt", source: `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    adsense(loadEnv(mode, process.cwd(), "VITE_").VITE_ADSENSE_CLIENT),
    // PWA: telefona uygulama gibi kurulur, internetsizken de açılır.
    VitePWA({
      registerType: "autoUpdate", // yeni sürüm yayınlanınca kendiliğinden güncellenir
      injectRegister: false, // kayıt src/lib/pwa.js içinde: yeni sürüm gelince sayfa yenilenir
      includeAssets: ["favicon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Kelimanya",
        short_name: "Kelimanya",
        description: "Kelimeleri kaydır, öğren: İngilizce, Almanca, İspanyolca ve Fransızca kelime pratiği.",
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
        navigateFallbackDenylist: [/^\/api\//, /^\/(gizlilik|hesap-silme)/, /^\/ads\.txt$/],
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
}));
