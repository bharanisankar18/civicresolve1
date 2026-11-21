# System Architecture - CivicResolve

## 1. Architectural Philosophy

CivicResolve is built with strict modularity, separation of concerns, and clean boundaries:

- **Presentation Layer (Web)**: React 18 + Vite SPA using Tailwind CSS, TanStack Query, and React Hook Form. Components are purely presentational; business logic resides in custom hooks and shared libraries.
- **API Layer (Backend)**: Express 4 with Node.js 20, following the **Route -> Controller -> Service -> Repository** pattern.
- **Contract Layer (Shared)**: TypeScript definitions, Zod validation schemas, and domain constants shared between client and server without code duplication.

```mermaid
flowchart TD
    subgraph Client["Frontend Client (apps/web)"]
        UI[React 18 SPA]
        TQ[TanStack Query]
        I18N[i18next (EN / TA / HI)]
        Voice[Web Speech API]
        Leaflet[Leaflet + OpenStreetMap]
    end

    subgraph API["Backend API (apps/api)"]
        Routes[Express Routes]
        Middleware[Auth / RBAC / RateLimiter / Sharp]
        Controllers[Controllers]
        Services[Domain Services]
        Cron[node-cron SLA Escalator]
        Repo[Prisma Repositories]
    end

    subgraph Data["Persistence & Services"]
        SQLite[(SQLite Database dev.db)]
        Gemini[Google Gemini 1.5 Flash API]
        Fallback[Rule-Based Keyword Classifier]
    end

    UI -->|JSON / Cookies| Routes
    Routes --> Middleware
    Middleware --> Controllers
    Controllers --> Services
    Services --> Repo
    Services --> Gemini
    Gemini -.->|Failover| Fallback
    Repo --> SQLite
    Cron --> Services
```

---

## 2. Layered Backend Design

### Route Layer (`src/modules/*/routes.ts`)

- Maps HTTP verbs and URI endpoints.
- Attaches route-specific middleware (`authenticate`, `requireRole('ADMIN')`, `validate(schema)`).
- Does not contain business logic or request transformations.

### Controller Layer (`src/modules/*/controller.ts`)

- Extracts parameters, headers, cookies, and validated bodies from `Request`.
- Invokes domain services.
- Responds with standardized envelope: `{ success: true, data: ... }`.
- Centralized exception delegation via Express `next(error)`.

### Service Layer (`src/modules/*/service.ts`)

- Implements core business logic, validation rules, AI prompt dispatch, and scoring algorithms.
- **100% decoupled from Express**: Services accept and return pure TypeScript objects, making them 100% testable in isolation.
- Functions are strictly typed, files under 250 lines, with comprehensive JSDoc documentation.

### Repository Layer (`src/modules/*/repository.ts`)

- Encapsulates database queries via Prisma ORM.
- Handles pagination, spatial bounding queries, relations, and atomic transactions.

---

## 3. Package & Workspace Structure

```
CivicResolve/
├── apps/
│   ├── api/                     # Node.js + Express API
│   │   ├── prisma/              # schema.prisma, SQLite DB, seed.ts (40 grievances)
│   │   ├── src/
│   │   │   ├── config/          # env.ts, logger.ts, prisma.ts
│   │   │   ├── middleware/      # auth, rbac, errorHandler, rateLimiter, upload, validate
│   │   │   ├── modules/
│   │   │   │   ├── ai/          # geminiService, fallbackClassifier, verificationService
│   │   │   │   ├── auth/        # Controller, Service, Repository, Routes
│   │   │   │   ├── complaints/   # Controller, Service, DuplicateService, Repository, Routes
│   │   │   │   ├── departments/ # Controller, Service, Repository, Routes
│   │   │   │   └── analytics/   # Controller, Service, Repository, Routes
│   │   │   ├── jobs/            # slaEscalationCron.ts (SLA auto-escalator)
│   │   │   ├── utils/           # haversine.ts, slaCalculator.ts, errors.ts
│   │   │   └── app.ts           # Express setup, security headers, route mounting
│   │   └── tests/               # Unit and Supertest integration test suites
│   └── web/                     # React 18 + Vite PWA
│       ├── public/              # Favicon, icons, manifest
│       └── src/
│           ├── components/      # AccessibleModal, Badge, Navbar, Footer, SkipLink
│           ├── features/
│           │   ├── admin/       # TriageQueue, DepartmentSlaSettings, VerifyResolutionModal
│           │   ├── analytics/   # ResolutionCharts
│           │   ├── map/         # CivicHeatmap (Leaflet + accessible table alternative)
│           │   ├── report/      # ReportStepper (Photo -> AI -> Location -> Duplicates -> Submit)
│           │   └── tracker/     # ScoreBreakdownCard, SLACountdownCard, StatusTimeline
│           ├── hooks/           # useDebounce, useVoiceRecognition, useLanguage
│           ├── i18n/            # en, ta, hi translations
│           └── pages/           # HomePage, TrackPage, AdminPage, PublicStatsPage, Auth
├── packages/
│   └── shared/                  # Monorepo cross-boundary contracts
│       ├── src/
│       │   ├── constants/       # categories, coimbatorePoi, sla
│       │   ├── schemas/         # Zod schemas: auth, ai, complaint, department
│       │   └── types/           # DTOs, interfaces, models
│       └── dist/                # Dual CJS/ESM distribution
└── docs/                        # Complete technical and operational documentation
```
