import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  // Carregar variables d'entorn
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    define: {
      // Injectar variables d'entorn al build
      'import.meta.env.VITE_GEOAPIFY_API_KEY': JSON.stringify(env.VITE_GEOAPIFY_API_KEY),
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
      'import.meta.env.VITE_MAPBOX_ACCESS_TOKEN': JSON.stringify(env.VITE_MAPBOX_ACCESS_TOKEN),
    },
    envPrefix: ['VITE_'],
  };
});