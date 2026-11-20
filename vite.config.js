import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
