import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // 🔥 Render用に修正
    base: './',

    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY || process.env.GROQ_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});