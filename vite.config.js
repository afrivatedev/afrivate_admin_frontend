import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The Content Security Policy in index.html applies to the built app only.
// The dev server injects an inline React refresh script that a strict policy
// would block, so the policy is removed for `npm start`.
function devSkipsCsp() {
  return {
    name: 'dev-skips-csp',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (!ctx.server) return html;
        return html.replace(/<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>/, '');
      },
    },
  };
}

export default defineConfig({
  // Relative asset paths, so the build works from any folder on the static host.
  base: './',
  plugins: [react(), devSkipsCsp()],
  // Treat .js files as JSX, as Create React App did, so existing files need no renaming.
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  // The dependency scanner runs its own esbuild pass, so it needs the same JSX rule.
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  server: { port: 3001 },
  preview: { port: 3001 },
  build: {
    // Same output folder as before, so the static host's publish setting does not change.
    outDir: 'build',
  },
});
