// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     dedupe: ["react", "react-dom"],
//   },
// });
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    historyApiFallback: true,
    hmr: {
      overlay: true,
    },
    proxy: {
      "/api": {
        // In dev, point to local backend by default. Override with VITE_DEV_API_TARGET if needed.
        target: process.env.VITE_DEV_API_TARGET || "http://localhost:3005",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
