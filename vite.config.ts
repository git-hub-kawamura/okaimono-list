import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

// ESM環境で __dirname を使えるように定義（これがないとビルドエラーになります）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // GitHub Pagesのリポジトリ名に合わせて設定
    base: '/okaimono-list/',
    plugins: [react(), tailwindcss()],
    define: {
      // クライアント側で import.meta.env.VITE_GEMINI_API_KEY として使えるように設定
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY),
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
      // AI Studioのプレビュー環境用設定（編集時のチラつき防止）
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
