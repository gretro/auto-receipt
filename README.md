# Auto Receipt

An app that generates donation receipts from multiple sources: manual entry and PayPal (via IPN). The server handles receipt creation and integrations; the client is an admin dashboard for managing donations and viewing receipts. It is designed to run on **Google Cloud Platform (GCP)** and depends on Firestore, Pub/Sub, and Cloud Storage (GCS).

**Repository layout**

| Directory | Role |
|-----------|------|
| [`client/`](client/) | Admin UI (Vite, TypeScript, Material UI). Setup and scripts → see [client/README.md](client/README.md). |
| [`server/`](server/) | Backend API and receipt logic. Local run and API docs → see [server/README.md](server/README.md). |

To run the full stack locally, start the server first (and its dependencies), then the client. Details for each are in their READMEs.
