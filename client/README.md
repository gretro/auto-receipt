# Auto Receipt – Client

Admin dashboard for managing donations and receipts. Built with Vite, TypeScript, and Material UI.

## Requirements

- Node.js 24.x

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a config file. The app loads its configuration at runtime from `public/config.json` (gitignored).

   **Fetch the Firebase config from the Firebase Console:** Project settings → Your apps → select your web app → copy the `firebaseConfig` object. Use those values in the `firebase` section below.

   Create `public/config.json` with:

   ```json
   {
     "apiUrl": "http://localhost:3001",
     "firebase": {
       "apiKey": "your-api-key",
       "authDomain": "your-project.firebaseapp.com",
       "projectId": "your-project-id",
       "storageBucket": "your-project.appspot.com",
       "messagingSenderId": "123456789",
       "appId": "1:123456789:web:abcdef"
     }
   }
   ```

3. Ensure the [server](../server) and its dependent services are running (see server README).

4. Start the dev server:

   ```bash
   npm start
   ```

   The app opens at http://localhost:3000.

## Scripts

| Script     | Description                    |
| ---------- | ------------------------------ |
| `npm start` | Start dev server (Vite)        |
| `npm run dev` | Same as `start`               |
| `npm run build` | Lint and build for production |
| `npm run preview` | Preview production build     |
| `npm test` | Run tests (Vitest)             |
| `npm run lint` | Run ESLint                    |

## Project structure

- `src/` – Application source
- `public/` – Static assets (favicon, manifest, etc.)
- `index.html` – Entry HTML (at project root, per Vite convention)

## Build output

Production builds are written to `dist/`. Serve that directory or deploy it to your hosting provider.
