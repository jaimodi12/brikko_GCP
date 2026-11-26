# Brikko – Online platform for House Owner and Contractor

A full-stack construction cost estimation app for India (Pune & Mumbai), built with **Java Spring Boot** + **React JS**.

---

## Project Structure

```
construction-app/
├── backend/      →  Spring Boot (Java 17)
└── frontend/     →  React 18 + Material UI
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Java | 17+ |
| Maven | 3.8+ |
| Node.js | 18+ |
| PostgreSQL | 14+ |

---

## 📋 Quick Start Guide

### Step 1: Set up PostgreSQL

```sql
-- Run in psql or any PostgreSQL client
CREATE USER constructuser WITH PASSWORD 'constructpass';
CREATE DATABASE constructiondb OWNER constructuser;
GRANT ALL PRIVILEGES ON DATABASE constructiondb TO constructuser;
```

Verify PostgreSQL is running on `localhost:5432`.

### Step 2: Start Backend

In Terminal 1:
```bash
cd /workspaces/Brikko/backend
mvn clean install -DskipTests
mvn spring-boot:run 
```

Backend runs on **http://localhost:8080**  
Spring will auto-create all tables on first run using Hibernate's `ddl-auto=update` setting.

**Troubleshooting:**  
If the backend fails to connect, verify PostgreSQL is running on `localhost:5432` and the databa

**Troubleshooting:**  
If the backend fails to connect, verify PostgreSQL is running on `localhost:5432` and the database credentials match those in `backend/src/main/resources/application.properties`.

### Step 3: Start Frontend

In Terminal 2:
```bash
cd /workspaces/Brikko/frontend
npm install
npm start
```

Frontend runs on **http://localhost:3000**  
 `/api` requests are proxied to `http://localhost:8080` via the `package.json` proxy configuration.

> **Note:** If your environment cannot open a browser automatically (such as a Linux container), `BROWSER=none` is set in the npm start script so it runs without `xdg-open`.
---

## Verify Everything is Running

Once backend and frontend are both running:

```bash
# Check backend health
curl http://localhost:8080/api/options/cities

# Backend should be accessible at
http://localhost:8080

# Frontend should be accessible at
http://localhost:3000
```

---

## Application Flow

### For Users
1. **Sign Up** as a User → choose city (Pune / Mumbai)
2. **Login**
3. **New Project** wizard (5 steps):
   - Step 1: Project name + City
   - Step 2: Plot area, floors, roof area, rooms
   - Step 3: Cement type + Brick work toggle
   - Step 4: Paint type, window type, number of windows
   - Step 5: Review → Generate Estimate
4. **Cost Result** – full cost breakdown with bar chart
5. **Find Contractors** – see registered contractors matching city & budget, plus their bids

### For Contractors
1. **Sign Up** as a Contractor → add company details, experience, budget range
2. **Login** → lands on Contractor Dashboard
3. **Submit Bids** against project IDs

## Cost Estimation Logic

| Component | Rate |
|-----------|------|
| OPC Cement | ₹2,000 / sq ft |
| PPC Cement | ₹1,800 / sq ft |
| PSC Cement | ₹1,600 / sq ft |
| Brick Work | +₹300 / sq ft |
| Roof Finishing | ₹500 / sq ft (roof area) |
| Basic Paint | ₹50 / sq ft |
| Premium Paint | ₹100 / sq ft |
| Luxury Paint | ₹200 / sq ft |
4. Track all submitted bids and totals

---
| Standard Window | ₹8,000 / unit |
| Aluminum Window | ₹12,000 / unit |
| UPVC Window | ₹15,000 / unit |
| Mumbai Premium | +15% on total |

---

## API Endpoints

### Auth (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register (User or Contractor) |
| POST | `/api/auth/login` | Login → returns JWT |

### Projects (Auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects/estimate` | Create project + calculate cost |
| GET | `/api/projects/my` | Get my projects |
| GET | `/api/projects/{id}/breakdown` | Get cost breakdown |

### Contractors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contractors/list?city=Pune` | List contractors by city (public) |
| GET | `/api/contractors/match?city=Pune&budget=5000000` | Match by budget |
| POST | `/api/contractors/bid` | Submit a bid (contractor only) |
| GET | `/api/contractors/bids/project/{id}` | Get bids for a project |
| GET | `/api/contractors/bids/my` | Contractor's own bids |

### Options (dropdown data)
`GET /api/options/cities` | `/api/options/cement-types` | `/api/options/paint-types` | `/api/options/window-types`

---

## Adding New Cities / Materials (Future Extension)

- **New City**: Add to `City.java` enum with display name + cost multiplier
- **New Material**: Add to respective enum (`CementType`, `PaintType`, `WindowType`)
- **Additional Options**: Use `additionalOptions` JSON field in `Project` entity
- No DB migration needed for enum changes — Spring auto-updates the schema

---

## Persistence & Data

- **Local Development**: Data stored in local PostgreSQL instance; connection configured in `backend/src/main/resources/application.properties`
- **Schema Migrations**: Handled automatically by Spring Data JPA with Hibernate (`spring.jpa.hibernate.ddl-auto=update`)

---

## Tech Stack

**Backend**
- Spring Boot 3.5.13
- Spring Security + JWT (jjwt 0.12.6)
- Spring Data JPA + PostgreSQL
- Lombok, Bean Validation

**Frontend**
- React 18 + React Router 6
- Material UI (MUI) v5 — responsive for web and mobile
- Axios with JWT interceptor

**Infrastructure**
- PostgreSQL 16
