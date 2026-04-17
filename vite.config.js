import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { execSync } from 'node:child_process';

let gitSha = process.env.VITE_GIT_SHA || 'unknown';
try {
  if (gitSha === 'unknown') {
    gitSha = execSync('git rev-parse --short HEAD').toString().trim();
  }
} catch {}

export default defineConfig({
  plugins: [svelte()],
  define: {
    __GIT_SHA__: JSON.stringify(gitSha),
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
