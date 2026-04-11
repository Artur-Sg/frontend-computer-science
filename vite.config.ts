import { resolve } from 'node:path';
import ts from 'typescript';
import { defineConfig } from 'vite';
import { vitePluginTypescriptTransform } from 'vite-plugin-typescript-transform';

export default defineConfig({
  base: './',
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, process.env.ENTRY ?? 'index.html')
      }
    }
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      '#app': resolve(import.meta.dirname, 'src/app'),
      '#modules': resolve(import.meta.dirname, 'src/modules'),
      '#core': resolve(import.meta.dirname, 'src/core'),
      '#ui': resolve(import.meta.dirname, 'src/ui'),
      '#styles': resolve(import.meta.dirname, 'src/styles'),
      '#decorators': resolve(import.meta.dirname, 'src/decorators')
    }
  },
  plugins: [
    vitePluginTypescriptTransform({
      enforce: 'pre',
      filter: {
        files: {
          include: /\.ts$/
        }
      },
      tsconfig: {
        override: {
          target: ts.ScriptTarget.ES2024
        }
      }
    })
  ]
});
