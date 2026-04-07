import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    environmentMatchGlobs: [
      ['tests/api/**', 'node'],
      ['tests/lib/**', 'node'],
      ['tests/components/**', 'happy-dom'],
    ],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
