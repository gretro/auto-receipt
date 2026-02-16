import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const localAppConfig = {
  apiUrl: 'http://localhost:3001',
  firebase: {},
};

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    {
      name: 'html-process-env',
      transformIndexHtml(html) {
        return html.replace("NODE_ENV: 'development'", `NODE_ENV: '${mode}'`);
      },
    },
  ],
  define: {
    'process.env': {},
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  build: {
    rollupOptions: {
      output: {
        dir: 'build',
        manualChunks: (id) => (id.includes('node_modules') ? 'vendor' : undefined),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
}));
