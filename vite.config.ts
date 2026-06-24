import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Demo / GitHub Pages preview for the flowchart components.
 *
 * Imports the library from SOURCE (`../src`) so editing a FlowchartView
 * component hot-reloads instantly here — the fast iteration loop the
 * headless (tsup) library otherwise lacks. `npm run demo` to view,
 * `npm run demo:build` to produce the static site for GitHub Pages.
 */
export default defineConfig(({ command }) => ({
  root: 'demo',
  plugins: [react()],
  // Project-site base path for GitHub Pages (https://footprintjs.github.io/explainable-ui/).
  // Dev keeps '/' so localhost serves at the root.
  base: command === 'build' ? '/explainable-ui/' : '/',
  build: { outDir: '../demo-dist', emptyOutDir: true },
}));
