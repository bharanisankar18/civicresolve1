# Deployment Guide - CivicResolve

CivicResolve is architected for modern serverless and cloud hosting using **Firebase Hosting** for the React Vite SPA and **Google Cloud Run** for the Node.js Express API.

---

## 1. Architecture Overview

```
[Citizens / Admins]
        │
        ├──> [Firebase Hosting (CDN)] ────> React 18 SPA (apps/web/dist)
        │
        └──> [Google Cloud Run] ─────────> Node.js Express Container (apps/api)
                     │
                     ├──> Google Cloud SQL / Litestream SQLite
                     └──> Google Gemini 1.5 Flash API
```

---

## 2. Deploying Web to Firebase Hosting

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### Step 2: Initialize Firebase in Root

```bash
firebase init hosting
```

- Select public directory: `apps/web/dist`
- Configure as single-page app (rewrite all URLs to `/index.html`): `Yes`
- Set up automatic builds and deploys with GitHub: `Optional`

### Step 3: Build & Deploy

```bash
# Build shared contracts and web client
npm --workspace=@civicresolve/shared run build
npm --workspace=@civicresolve/web run build

# Deploy to Firebase
firebase deploy --only hosting
```

---

## 3. Deploying API to Google Cloud Run

Google Cloud Run provides auto-scaling, containerized execution with automatic HTTPS and custom domains.

### Step 1: Set Google Cloud Project

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud auth configure-docker
```

### Step 2: Build Container

From the root workspace, create a `Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
RUN npm install
RUN npm --workspace=@civicresolve/shared run build
RUN npm --workspace=@civicresolve/api run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 5000
CMD ["node", "apps/api/dist/server.js"]
```

### Step 3: Deploy to Cloud Run

```bash
gcloud run deploy civicresolve-api \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,PORT=5000,GEMINI_API_KEY=YOUR_GEMINI_API_KEY,JWT_SECRET=YOUR_PRODUCTION_SECRET
```

---

## 4. Production Environment Variables Checklist

| Variable         | Description                       | Example                        |
| :--------------- | :-------------------------------- | :----------------------------- |
| `NODE_ENV`       | Environment identifier            | `production`                   |
| `PORT`           | API Server listen port            | `5000`                         |
| `DATABASE_URL`   | SQLite / PostgreSQL connection    | `file:/data/civicresolve.db`   |
| `JWT_SECRET`     | Secret key for JWT session tokens | Strong 64-char random string   |
| `CORS_ORIGIN`    | Allowed web frontend origin       | `https://civicresolve.web.app` |
| `GEMINI_API_KEY` | Google AI Studio API Key          | `AIzaSy...`                    |
| `GEMINI_MODEL`   | Gemini model name                 | `gemini-1.5-flash`             |
