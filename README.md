# Brikko — Construction Cost Estimator & Contractor Marketplace

Brikko is a full-stack residential construction cost estimation and contractor bidding platform built for India. Homeowners can estimate itemized building costs across Indian states, cities, and pincodes, while verified contractors browse location-matched open projects and submit or update competitive bids.

---

## Tech Stack

- **Backend Runtime & API**: Node.js (ESM) + Express 4 (`server.js`)
- **Frontend**: React 19 + React Router 7 + Material UI (MUI v6) (`frontend/`)
- **Authentication**: Firebase Authentication (Google Sign-In client SDK + `firebase-admin` token verification)
- **Database**: PostgreSQL / Supabase (`pg` connection pool + auto-initialized schema & metadata migrations)
- **Location Metadata**: Pan-India states/UTs, Tier 1/2/3 city multipliers, and pincode lookup/cache (`locationMetadata.js`)
- **Typography**: Unified **Plus Jakarta Sans** across landing, workspace dashboards, numeric tables (`tabular-nums`), and startup screens

---

## Project Structure

```text
.
├── server.js                  # Express API server, auth/DB guards, cost engine & SPA static host
├── locationMetadata.js        # Indian states, Tier 1/2/3 cities, pincode resolver & schema migrations
├── scripts/setup-frontend.mjs # Frontend dependency setup (Bun/npm) & production build runner
├── package.json               # Root server & build scripts (build, gcp-build, dev, start, lint)
├── firebase-applet-config.json# Firebase project configuration
├── frontend/                  # React application
│   ├── .npmrc                 # Enforces legacy-peer-deps=true for clean npm ci/install
│   ├── public/                # HTML entry, static assets, landing stylesheet
│   └── src/                   # Pages, components, AuthContext, Axios API client
└── backend/                   # Legacy Java Spring Boot codebase (preserved; inactive)
```

---

## Prerequisites & Environment Variables

- **Node.js** `20+` (tested on `v22`)
- **npm** `10+` (and optionally **Bun** for faster frontend dependency installation)
- **PostgreSQL / Supabase** database connection string

Create environment variables (see `.env.example`):

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL / Supabase connection URI | — |
| `SUPABASE_DB_URL` | Alternate PostgreSQL connection URI | — |
| `PORT` | HTTP port to bind | `3000` |
| `BROWSER` | Prevents auto-opening browser during build/start | `none` |

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```
`postinstall` automatically syncs `firebase-applet-config.json` into `frontend/src/`.

### 2. Build Frontend Bundle
```bash
npm run build
```
This installs frontend dependencies if missing (preferring `bun`, falling back to `npm --include=dev --legacy-peer-deps`), syncs Firebase config, and builds `frontend/build` without sourcemaps.

### 3. Start Server
```bash
# Development
npm run dev

# Production
npm start
```
The server listens on `http://0.0.0.0:${PORT:-3000}`, exposes `/api/*`, and serves the built React app from `frontend/build`. In local/dev environments, if `frontend/build` is missing on boot, the server displays a startup progress view and compiles the frontend asynchronously in the background.

### 4. Lint Syntax
```bash
npm run lint
```

---

## Application Flows

### Homeowners (`USER`)
1. **Landing & Sign-In (`/login`)**: Public landing showcase with Google Sign-In.
2. **Onboarding (`/signup`)**: Select role (`Homeowner`) and set phone, State, City, 6-digit Pincode, and Locality.
3. **Projects Overview (`/`)**: Search and review saved estimates with plot specs and total costs.
4. **New Cost Estimate (`/new-project`)**: 5-step guided wizard covering location, plot/roof dimensions, cement & masonry, paint/windows, and full review.
5. **Cost Breakdown (`/cost-result/:projectId`)**: Itemized breakdown across structure, brickwork, roof finishing, paint, windows, and city-tier premium.
6. **Matched Contractors (`/contractors/:projectId`)**: Browse verified contractors in your city/state and compare submitted bids.
7. **Account Settings (`/profile`)**: Update contact and location details.

### Contractors (`CONTRACTOR`)
1. **Onboarding (`/signup`)**: Register company name, specialization, experience, budget range, and operating State/City/Pincode.
2. **Bidding Console (`/contractor-dashboard`)**:
   - **Open Projects**: View homeowner projects matching your operating city and state (excluding your own projects and projects you have already bid on).
   - **My Bids**: Track submitted quotes and edit bid amount, timeline, or scope via **Edit Bid**.
3. **Account Settings (`/profile`)**: Update company profile and operating location.

---

## Cost Estimation Logic

| Component | Rate / Formula |
|---|---|
| Built-Up Area | `plotAreaSqFt * numberOfFloors` |
| OPC Cement | `₹2,000 / sq ft` (built-up area) |
| PPC Cement | `₹1,800 / sq ft` (built-up area) |
| PSC Cement | `₹1,600 / sq ft` (built-up area) |
| Brick Work | `+₹300 / sq ft` (built-up area, optional) |
| Roof Finishing | `₹500 / sq ft` (`roofAreaSqFt`) |
| Basic / Premium / Luxury Paint | `₹50` / `₹100` / `₹200` per sq ft (built-up area) |
| Standard / Aluminum / UPVC Window | `₹8,000` / `₹12,000` / `₹15,000` per unit |
| City Tier Multiplier | Tier 1: `1.15x` (+15%), Tier 2: `1.05x` (+5%), Tier 3: `1.00x` |

---

## API Endpoints

### Health & Options (Public)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server, Firebase, PostgreSQL, and frontend build status |
| `GET` | `/api/options/states` | Indian states & UTs plus active seeded states |
| `GET` | `/api/options/cities?state=...` | Active cities with tier and multiplier metadata |
| `GET` | `/api/options/pincode/:pincode` | Resolve Indian 6-digit pincode to state, city, and localities |
| `GET` | `/api/options/cement-types` | Cement grade options and rates |
| `GET` | `/api/options/paint-types` | Paint grade options and rates |
| `GET` | `/api/options/window-types` | Window material options and unit prices |

### Auth & Profile (Firebase Bearer Token Required)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/onboard` | Complete user or contractor onboarding profile |
| `GET` | `/api/users/me` | Fetch authenticated user & contractor profile |
| `PUT` | `/api/users/me` | Update user & contractor profile details |

### Projects (Firebase Bearer Token Required)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/projects/estimate` | Validate specifications, compute cost breakdown, and save project |
| `GET` | `/api/projects/my` | List projects created by the authenticated user |
| `GET` | `/api/projects/open` | List open projects scoped to contractor city & state (excluding own & already-bid projects) |
| `GET` | `/api/projects/:id/breakdown` | Fetch detailed cost breakdown for a project |

### Contractors & Bids
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/contractors/list?city=...` | Public | List contractors filtered by city |
| `GET` | `/api/contractors/match?city=...&budget=...` | Public | Match contractors by city and budget range |
| `POST` | `/api/contractors/bid` | Contractor | Submit a bid on an open project (duplicate & self-bid guarded) |
| `PUT` | `/api/contractors/bids/:id` | Contractor | Edit an existing submitted bid |
| `GET` | `/api/contractors/bids/project/:projectId` | Authenticated | List all bids submitted for a project |
| `GET` | `/api/contractors/bids/my` | Contractor | List all bids submitted by the authenticated contractor |
