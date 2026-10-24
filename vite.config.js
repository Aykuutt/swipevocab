import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "server", "");
  const secret = env.SWIPEVOCAB_API_SECRET || "";

  return {
    server: {
      proxy: {
        "/api/progress": {
          target: "http://127.0.0.1:3001",
          changeOrigin: false,
          rewrite: (path) => path.replace(/^\/api/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyRequest) => {
              if (secret) proxyRequest.setHeader("Authorization", `Bearer ${secret}`);
            });
          },
        },
      },
    },
  };
});
