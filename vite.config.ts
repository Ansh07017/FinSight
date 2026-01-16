import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { metaImagesPlugin } from "./vite-plugin-meta-images.ts";

export default defineConfig({
  plugins: [react(), tailwindcss(), metaImagesPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist", "public"),
    emptyOutDir: true,
    target: "esnext", // Modern JS = Smaller & Faster code
    reportCompressedSize: false, // Speeds up the build process
    rollupOptions: {
      output: {
        // CODE SPLITTING: Prevents "Heavy" modules from slowing down initial load
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts")) return "charts";
            if (id.includes("lucide-react")) return "icons";
            if (id.includes("framer-motion")) return "animations";
            return "vendor";
          }
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    fs: { strict: true, deny: ["**/.*"] },
  },
});