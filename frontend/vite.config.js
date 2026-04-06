import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendTarget = env.VITE_BACKEND_PROXY_TARGET || "http://localhost:5001";

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        "/api": { target: backendTarget, changeOrigin: true },
        "/uploads": { target: backendTarget, changeOrigin: true },
      },
      hmr: {
        protocol: "ws",
        host: "localhost",
        port: 3000,
      },
    },
    // Copy public folder (manifest, sw.js, icons)
    publicDir: "public",
    build: {
      outDir: "dist",
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            axios: ["axios"],
          },
        },
      },
    },
  };
});
