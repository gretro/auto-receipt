import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const localAppConfig = {
  apiUrl: 'http://localhost:3001',
  firebase: {},
};

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Set NODE_ENV in the inline script for production builds
    {
      name: 'html-process-env',
      transformIndexHtml(html) {
        return html.replace("NODE_ENV: 'development'", `NODE_ENV: '${mode}'`);
      },
    },
  ],
  define: {
    // Dependencies like Firebase reference process.env; define it for the browser.
    'process.env': {},
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  server: {
    port: 3000,
    open: true,
  },
}));
