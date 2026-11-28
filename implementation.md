# Brikko — Technical Implementation Overview

This document describes the production architecture, database schema, API design, frontend conventions, and build/deployment pipeline currently implemented in Brikko.

---

## 1. System Architecture

Brikko runs as a unified Node.js + Express monolith (`server.js`) that serves both the `/api/*` JSON endpoints and the compiled React single-page application (`frontend/build`).

```text
Browser (React 19 + MUI v6 SPA)
  │
  ├─► Firebase Auth (Google Sign-In -> ID Token)
  │
  └─► Axios API Client (/api/* with Bearer Token)
         │
         ▼
Express Server (server.js on 0.0.0.0:PORT)
  ├─► firebase-admin (Verifies Firebase ID Tokens)
  ├─► locationMetadata.js (India States, Tier 1/2/3 Cities, Pincode Resolution)
  ├─► Cost Calculation Engine & Contractor Bid Rules
  ├─► PostgreSQL Pool (pg -> Supabase / PostgreSQL)
  └─► Static SPA Hosting + Dev Cold-Boot Auto-Builder
```

### Key Runtime Design Decisions
- **Non-Blocking Startup**: `app.listen(PORT, HOST)` binds immediately without awaiting PostgreSQL initialization or frontend compilation. `initDatabase()` initializes schema and retries with exponential backoff (`5s` up to `30s`) while `requireDb` returns structured `503` responses if the database is temporarily unavailable.
- **Process Resilience**: Global `unhandledRejection`, `uncaughtException`, `server.on('error')`, `SIGTERM`, and `SIGINT` handlers are configured alongside `keepAliveTimeout = 65000` and `headersTimeout = 66000` for Cloud Run / reverse-proxy compatibility.

---

## 2. Authentication & Access Control

- **Client Authentication**: `frontend/src/firebase.js` initializes Firebase Auth using `firebase-applet-config.json` (synced from root to `frontend/src/firebase-applet-config.json` during setup/build).
- **Axios Interceptor (`frontend/src/api/axios.js`)**: Automatically attaches `Authorization: Bearer <firebase-id-token>` on every API request and rejects accidental HTML responses on `/api/*`.
- **Server Verification (`requireFirebaseAuth`)**: Validates Firebase ID tokens via `firebase-admin/auth`, normalizes `req.auth.email`, and enforces role checks (`USER` vs `CONTRACTOR`) against PostgreSQL records.

---

## 3. Database Schema & Migrations

Schema creation and idempotent column migrations run automatically at server boot (`initDatabase()` in `server.js` and `ensureLocationMetadataSchema()` in `locationMetadata.js`).

### Core Tables
1. **`users`**: Stores `id`, `name`, `email` (unique), `phone` (unique 10-digit), `role` (`USER` | `CONTRACTOR`), `city`, `state`, `pincode`, `locality`, `created_at`.
2. **`contractors`**: Linked 1-to-1 with `users(id)` (`ON DELETE CASCADE`); stores `company_name`, `description`, `experience_years`, `specialization`, `rating`, `min_budget`, `max_budget`, `city`, `state`, `pincode`, `locality`, `is_verified`.
3. **`projects`**: Linked to `users(id)`; stores location (`city`, `state`, `pincode`, `locality`), dimensions (`plot_area_sq_ft`, `number_of_floors`, `roof_area_sq_ft`), material specs (`cement_type`, `brick_work`, `paint_type`, `window_type`, `number_of_windows`, `number_of_rooms`, `additional_options`), and `total_estimated_cost`.
4. **`contractor_bids`**: Linked to `contractors(id)` and `projects(id)`; stores `bid_amount`, `description`, `estimated_days`, plus denormalized snapshot fields (`project_state`, `project_city`, `project_pincode`, `project_locality`, `contractor_state`, `contractor_city`, `contractor_pincode`, `contractor_locality`).
5. **`states` & `cities`**: Stores 36 Indian states/UTs and seeded Tier 1 (`1.15x`), Tier 2 (`1.05x`), and Tier 3 (`1.00x`) cities. Unknown cities resolved from pincode or custom entry default cleanly to Tier 3 metadata.
6. **`pincode_cache`**: Caches postal lookups (`pincode`, `state`, `district`, `city`, `localities` JSONB) to minimize repeat external postal queries.

---

## 4. Location Intelligence & Contractor Bidding Rules

- **Pincode & City Resolution (`locationMetadata.js`)**:
  - Validates 6-digit Indian pincodes (`^[1-9]\d{5}$`).
  - Normalizes state names across aliases/legacy spellings (`normalizeIndianState`) and resolves city codes/tiers (`resolveCityMetadata`).
  - `/api/options/pincode/:pincode` resolves state, district/city, and locality list with PostgreSQL caching.
- **Contractor Open Projects Scoping (`GET /api/projects/open`)**:
  - Matches projects to the contractor's profile `city` and `state` across all pincodes in that city/state.
  - Excludes projects owned by the contractor (`p.user_id <> caller.id`) and projects where the contractor has already placed a bid.
- **Bid Integrity (`POST /api/contractors/bid` & `PUT /api/contractors/bids/:id`)**:
  - Validates `bidAmount >= 10000`, `20 <= description.length <= 1000`, and `1 <= estimatedDays <= 3650`.
  - Prevents self-bidding and duplicate bids on the same project.
  - Allows contractors to update their own existing bids in-place via `PUT /api/contractors/bids/:id`.

---

## 5. Frontend Architecture & Design System

- **Routing & Role Guards (`frontend/src/App.js`, `ProtectedRoute.js`)**:
  - Public routes: `/login`, `/signup`
  - Homeowner routes (`USER`): `/`, `/new-project`, `/cost-result/:projectId`, `/contractors/:projectId`, `/profile`
  - Contractor routes (`CONTRACTOR`): `/contractor-dashboard`, `/profile`
- **Navigation (`frontend/src/components/Navbar.js`)**:
  - Fixed desktop sidebar + responsive mobile drawer with role-based navigation links.
  - Header quick action (`New Estimate`) is suppressed on `/`, `/profile`, and `/new-project` to avoid redundant CTAs where navigation or primary actions already exist.
- **Unified Typography**:
  - Every screen (landing/login via `landing.css`, workspace MUI theme in `App.js`, global CSS in `index.css`, and server startup/recovery HTML templates in `server.js`) uses **Plus Jakarta Sans** (`400`–`800`).
  - `.tabular-nums` enforces `font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1;` while inheriting `Plus Jakarta Sans` rather than switching to monospace.

---

## 6. Build, Cold-Boot Recovery & Cloud Run Deployment

- **Fast `postinstall`**: `npm run postinstall` runs `node scripts/setup-frontend.mjs sync-config` (takes <100ms), avoiding slow synchronous frontend installs during container startup so `npm run dev` binds port `3000` immediately.
- **Resilient Frontend Build (`scripts/setup-frontend.mjs`)**:
  - Used by both `npm run build` and `npm run gcp-build`.
  - Checks whether `frontend/node_modules/.bin/react-scripts` and `ajv` are installed and fresh (supporting both npm `.package-lock.json` and Bun `.bun` stamps).
  - Prefers `bun install --cwd frontend` (~7s) when Bun is available and falls back cleanly to `npm --prefix frontend install --include=dev --no-audit --no-fund --prefer-offline --legacy-peer-deps`.
  - Strips inherited production/omit-dev npm env flags (`NPM_CONFIG_PRODUCTION`, `npm_config_omit`, etc.) during dependency installation, keeps `ajv` in `frontend/package.json` `dependencies`, enforces `legacy-peer-deps=true` in `frontend/.npmrc`, and builds with `GENERATE_SOURCEMAP=false`.
  - Uses a temp lockfile (`/tmp/brikko-frontend-build.lock`) so `server.js` never triggers a conflicting background build while a CLI/deploy build is actively running.
- **Environment-Aware Runtime Recovery (`server.js`)**:
  - Distinguishes AI Studio dev Cloud Run containers (`K_SERVICE=ais-dev-*`) from deployed production Cloud Run services (`isDeployedCloudRunProd = Boolean(kServiceName) && !kServiceName.startsWith('ais-dev-')`).
  - In dev/local runtimes without a prebuilt `frontend/build/index.html`, `ensureFrontendBuild()` restores dependencies and compiles the frontend in the background while serving a polling loading page (`/?retryBuild=1` recovery supported).
  - In deployed production Cloud Run revisions, runtime webpack compilation is disabled (relying on `gcp-build` at image build time) to prevent container memory exhaustion.
