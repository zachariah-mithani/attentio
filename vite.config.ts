import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';
  
  return {
    plugins: [react()],
    server: {
      port: Number(env.PORT ?? 5173),
    },
    define: {
      // API URL - defaults to localhost in dev, can be overridden via env
      'import.meta.env.VITE_API_URL': JSON.stringify(
        env.VITE_API_URL || (isProd ? '/api' : 'http://localhost:3001/api')
      ),
    },
    build: {
      outDir: 'dist',
      sourcemap: !isProd,
    },
  };
});
