import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  base: './',
  publicDir: 'public',
  resolve: {
    alias: {
      '#modules': path.resolve(__dirname, 'src/modules'),
      '#shared': path.resolve(__dirname, 'src/shared'),
      '#ui': path.resolve(__dirname, 'src/ui'),
      '#styles': path.resolve(__dirname, 'src/styles'),
      '#assets': path.resolve(__dirname, 'src/assets')
    }
  }
});
