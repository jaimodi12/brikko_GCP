import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import {
  ACTIVE_SEED_STATES,
  SEED_CITIES,
  ensureLocationMetadataSchema,
  resolveCityMetadata,
  resolveLocationFromPostal,
} from './locationMetadata.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

app.use(express.json({ limit: '1mb' }));

// ----- Load Provisioned Firebase Config -----
const firebaseConfigPath = path.join(__dirname, 'firebase-applet-config.json');
let firebaseProjectId = null;
try {
  const rawConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
  if (rawConfig?.projectId && rawConfig.projectId !== 'remixed-project-id') {
    firebaseProjectId = rawConfig.projectId;
  }
} catch (err) {
  console.warn('Unable to read firebase-applet-config.json:', err.message);
}

const firebaseApp = firebaseProjectId
  ? (getApps().length ? getApp() : initializeApp({ projectId: firebaseProjectId }))
  : null;
const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

// ----- Supabase PostgreSQL Pool (strictly from server-side env) -----
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '';
const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
        ? false
        : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  : null;

if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err?.message || err);
  });
}

let dbReady = false;
let dbError = connectionString ? null : 'DATABASE_URL environment variable is not configured.';

async function initDatabase() {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255),
        phone VARCHAR(10) NOT NULL UNIQUE,
        role VARCHAR(50) NOT NULL,
        city VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contractors (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(150) NOT NULL,
        description VARCHAR(500),
        experience_years INTEGER NOT NULL DEFAULT 0,
        specialization VARCHAR(200),
        rating DOUBLE PRECISION DEFAULT 0.0,
        min_budget BIGINT,
        max_budget BIGINT,
        city VARCHAR(50) NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        city VARCHAR(50) NOT NULL,
        plot_area_sq_ft DOUBLE PRECISION NOT NULL,
        number_of_floors INTEGER NOT NULL,
        roof_area_sq_ft DOUBLE PRECISION NOT NULL,
        cement_type VARCHAR(50) NOT NULL,
        brick_work BOOLEAN NOT NULL,
        paint_type VARCHAR(50) NOT NULL,
        window_type VARCHAR(50) NOT NULL,
        number_of_windows INTEGER NOT NULL,
        number_of_rooms INTEGER NOT NULL,
        additional_options TEXT,
        total_estimated_cost BIGINT,
        project_name VARCHAR(200),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contractor_bids (
        id BIGSERIAL PRIMARY KEY,
        contractor_id BIGINT NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
        project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        bid_amount BIGINT NOT NULL,
        description VARCHAR(1000),
        estimated_days INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await ensureLocationMetadataSchema(pool);
    dbReady = true;
    dbError = null;
    console.log('Connected to Supabase PostgreSQL and verified schema & city metadata.');
  } catch (err) {
    dbReady = false;
    dbError = err.message || 'Database connection failed.';
    console.error('Supabase PostgreSQL initialization failed:', dbError);
  }
}

initDatabase();

// ----- Domain Enums & Cost Engine -----
const PINCODE_REGEX = /^[1-9]\d{5}$/;

function isValidPincode(val) {
  return PINCODE_REGEX.test(String(val || '').trim());
}

const CEMENT_TYPES = {
  OPC: { value: 'OPC', displayName: 'OPC - Ordinary Portland Cement', baseCostPerSqFt: 2000 },
  PPC: { value: 'PPC', displayName: 'PPC - Portland Pozzolana Cement', baseCostPerSqFt: 1800 },
  PSC: { value: 'PSC', displayName: 'PSC - Portland Slag Cement', baseCostPerSqFt: 1600 },
};

const PAINT_TYPES = {
  BASIC: { value: 'BASIC', displayName: 'Basic Paint', costPerSqFt: 50 },
  PREMIUM: { value: 'PREMIUM', displayName: 'Premium Paint', costPerSqFt: 100 },
  LUXURY: { value: 'LUXURY', displayName: 'Luxury / Texture Paint', costPerSqFt: 200 },
};

const WINDOW_TYPES = {
  STANDARD: { value: 'STANDARD', displayName: 'Standard Wooden Window', costPerWindow: 8000 },
  ALUMINUM: { value: 'ALUMINUM', displayName: 'Aluminum Sliding Window', costPerWindow: 12000 },
  UPVC: { value: 'UPVC', displayName: 'UPVC Window', costPerWindow: 15000 },
};

function sendError(res, status, message, extra = {}) {
  return res.status(status).json({
    timestamp: new Date().toISOString(),
    status,
    error: message,
    ...extra,
  });
}

function requireDb(_req, res, next) {
  if (!pool) {
    return sendError(
      res,
      503,
      'Supabase database is not configured. Please add DATABASE_URL in environment secrets.'
    );
  }
  if (!dbReady) {
    initDatabase().catch(() => {});
  }
  return next();
}

async function requireFirebaseAuth(req, res, next) {
  if (!firebaseAuth) {
    return sendError(res, 503, 'Firebase Authentication is not configured.');
  }
  const authHeader = req.header('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'Authentication required.');
  }
  const idToken = authHeader.slice(7).trim();
  if (!idToken) {
    return sendError(res, 401, 'Invalid authentication token.');
  }
  try {
    const decoded = await firebaseAuth.verifyIdToken(idToken);
    if (!decoded.email) {
      return sendError(res, 401, 'Authenticated Firebase account has no email address.');
    }
    req.auth = {
      uid: decoded.uid,
      email: decoded.email.toLowerCase(),
      name: decoded.name || '',
    };
    return next();
  } catch (err) {
    return sendError(res, 401, 'Invalid or expired authentication session.');
  }
}

function calculateBreakdownFromValues({
  id,
  projectName,
  cityMeta,
  state,
  pincode,
  locality,
  plotAreaSqFt,
  numberOfFloors,
  roofAreaSqFt,
  cementType,
  brickWork,
  paintType,
  windowType,
  numberOfWindows,
  numberOfRooms,
}) {
  const cementInfo = CEMENT_TYPES[cementType];
  const paintInfo = PAINT_TYPES[paintType];
  const windowInfo = WINDOW_TYPES[windowType];
  const multiplier = Number(cityMeta?.costMultiplier ?? 1.0);
  const tier = Number(cityMeta?.tier ?? 3);

  const builtUpArea = Number(plotAreaSqFt) * Number(numberOfFloors);
  const structureCost = Math.trunc(builtUpArea * cementInfo.baseCostPerSqFt);
  const brickWorkCost = brickWork ? Math.trunc(builtUpArea * 300) : 0;
  const roofCost = Math.trunc(Number(roofAreaSqFt) * 500);
  const paintCost = Math.trunc(builtUpArea * paintInfo.costPerSqFt);
  const windowCost = Math.trunc(windowInfo.costPerWindow * Number(numberOfWindows));
  const subtotal = structureCost + brickWorkCost + roofCost + paintCost + windowCost;
  const cityPremium = Math.trunc(subtotal * Math.max(0, multiplier - 1.0));
  const totalCost = subtotal + cityPremium;

  return {
    projectId: Number(id),
    projectName,
    city: cityMeta?.name || '',
    cityCode: cityMeta?.code || '',
    cityTier: tier,
    costMultiplier: multiplier,
    state: state || cityMeta?.state || '',
    pincode: pincode || '',
    locality: locality || '',
    plotAreaSqFt: Number(plotAreaSqFt),
    numberOfFloors: Number(numberOfFloors),
    roofAreaSqFt: Number(roofAreaSqFt),
    cementType: cementInfo.displayName,
    brickWork: Boolean(brickWork),
    paintType: paintInfo.displayName,
    windowType: windowInfo.displayName,
    numberOfWindows: Number(numberOfWindows),
    numberOfRooms: Number(numberOfRooms),
    structureCost,
    brickWorkCost,
    roofCost,
    paintCost,
    windowCost,
    cityPremium,
    totalCost,
  };
}

function mapProjectRow(row) {
  return {
    id: Number(row.id),
    projectName: row.project_name,
    city: row.city,
    cityName: row.city_name || row.city,
    cityTier: row.city_tier != null ? Number(row.city_tier) : null,
    state: row.state || '',
    pincode: row.pincode || '',
    locality: row.locality || '',
    plotAreaSqFt: Number(row.plot_area_sq_ft),
    numberOfFloors: Number(row.number_of_floors),
    roofAreaSqFt: Number(row.roof_area_sq_ft),
    cementType: row.cement_type,
    brickWork: Boolean(row.brick_work),
    paintType: row.paint_type,
    windowType: row.window_type,
    numberOfWindows: Number(row.number_of_windows),
    numberOfRooms: Number(row.number_of_rooms),
    additionalOptions: row.additional_options,
    totalEstimatedCost: Number(row.total_estimated_cost),
    createdAt: row.created_at,
  };
}

function mapContractorRow(row) {
  return {
    id: Number(row.id),
    name: row.user_name,
    email: row.user_email,
    phone: row.user_phone,
    companyName: row.company_name,
    description: row.description,
    experienceYears: Number(row.experience_years || 0),
    specialization: row.specialization,
    rating: Number(row.rating || 0),
    minBudget: row.min_budget != null ? Number(row.min_budget) : null,
    maxBudget: row.max_budget != null ? Number(row.max_budget) : null,
    city: row.city,
    state: row.state || row.user_state || '',
    pincode: row.pincode || row.user_pincode || '',
    locality: row.locality || row.user_locality || '',
    isVerified: Boolean(row.is_verified),
  };
}

function mapBidRow(row) {
  return {
    id: Number(row.id),
    projectId: Number(row.project_id),
    projectName: row.project_name || null,
    projectState: row.project_state || row.resolved_project_state || '',
    projectCity: row.project_city || row.resolved_project_city || null,
    projectPincode: row.project_pincode || row.resolved_project_pincode || '',
    projectLocality: row.project_locality || row.resolved_project_locality || '',
    contractorId: Number(row.contractor_id),
    contractorName: row.contractor_name,
    companyName: row.company_name,
    contractorRating: Number(row.contractor_rating || 0),
    experienceYears: Number(row.experience_years || 0),
    contractorState: row.contractor_state || row.resolved_contractor_state || '',
    contractorCity: row.contractor_city || row.resolved_contractor_city || '',
    contractorPincode: row.contractor_pincode || row.resolved_contractor_pincode || '',
    contractorLocality: row.contractor_locality || row.resolved_contractor_locality || '',
    bidAmount: Number(row.bid_amount),
    description: row.description,
    estimatedDays: Number(row.estimated_days),
    createdAt: row.created_at,
  };
}

function buildProfilePayload(userRow, contractorRow) {
  const payload = {
    userId: Number(userRow.id),
    name: userRow.name,
    email: userRow.email,
    role: userRow.role,
    phone: userRow.phone,
    city: userRow.city,
    state: userRow.state || contractorRow?.state || '',
    pincode: userRow.pincode || contractorRow?.pincode || '',
    locality: userRow.locality || contractorRow?.locality || '',
  };
  if (contractorRow) {
    payload.companyName = contractorRow.company_name;
    payload.description = contractorRow.description;
    payload.experienceYears = Number(contractorRow.experience_years || 0);
    payload.specialization = contractorRow.specialization;
    payload.minBudget = contractorRow.min_budget != null ? Number(contractorRow.min_budget) : null;
    payload.maxBudget = contractorRow.max_budget != null ? Number(contractorRow.max_budget) : null;
  }
  return payload;
}

// ----- Health & Options Routes -----
app.get('/api/health', async (_req, res) => {
  let connected = false;
  if (pool) {
    try {
      await pool.query('SELECT 1');
      connected = true;
      dbReady = true;
      dbError = null;
    } catch (err) {
      dbError = err.message;
    }
  }
  res.json({
    ok: true,
    firebaseConfigured: Boolean(firebaseAuth),
    dbConfigured: Boolean(pool),
    dbConnected: connected,
    dbMessage: connected ? 'Connected to Supabase PostgreSQL' : dbError,
  });
});

app.get('/api/options/cities', async (req, res) => {
  const stateFilter = String(req.query.state || '').trim();
  if (pool) {
    try {
      const result = await pool.query(
        `SELECT id, code, name, state, tier, cost_multiplier
         FROM cities
         WHERE is_active = TRUE
           AND ($1 = '' OR LOWER(state) = LOWER($1))
         ORDER BY tier ASC, name ASC`,
        [stateFilter]
      );
      if (result.rows.length > 0 || stateFilter) {
        return res.json(
          result.rows.map((c) => ({
            id: Number(c.id),
            value: c.code,
            label: c.name,
            state: c.state,
            tier: Number(c.tier),
            costMultiplier: Number(c.cost_multiplier),
          }))
        );
      }
    } catch (err) {
      console.error('Load cities metadata error:', err);
    }
  }
  const fallback = SEED_CITIES.filter(
    (c) => !stateFilter || c.state.toLowerCase() === stateFilter.toLowerCase()
  );
  return res.json(
    fallback.map((c, idx) => ({
      id: idx + 1,
      value: c.code,
      label: c.name,
      state: c.state,
      tier: c.tier,
      costMultiplier: c.costMultiplier,
    }))
  );
});

app.get('/api/options/states', async (_req, res) => {
  if (pool) {
    try {
      const result = await pool.query(
        `SELECT s.id, s.code, s.name
         FROM states s
         WHERE s.is_active = TRUE
           AND EXISTS (
             SELECT 1 FROM cities c
             WHERE LOWER(c.state) = LOWER(s.name)
               AND c.is_active = TRUE
           )
         ORDER BY s.name ASC`
      );
      if (result.rows.length > 0) {
        return res.json(
          result.rows.map((s) => ({
            id: Number(s.id),
            value: s.name,
            code: s.code,
            label: s.name,
          }))
        );
      }
    } catch (err) {
      console.error('Load states metadata error:', err);
    }
  }
  return res.json(
    ACTIVE_SEED_STATES.map((s, idx) => ({
      id: idx + 1,
      value: s,
      code: s.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
      label: s,
    }))
  );
});

function toCityOptionPayload(cityMeta) {
  if (!cityMeta) return null;
  return {
    id: Number(cityMeta.id),
    value: cityMeta.code,
    label: cityMeta.name,
    state: cityMeta.state,
    tier: Number(cityMeta.tier),
    costMultiplier: Number(cityMeta.costMultiplier),
  };
}

async function lookupAndResolvePincode(pincodeInput) {
  const pincode = String(pincodeInput || '').trim();
  if (!isValidPincode(pincode)) {
    return null;
  }

  let areas = [];
  let district = '';
  let postalState = '';
  let cached = false;

  if (pool) {
    try {
      const cachedRes = await pool.query(
        'SELECT pincode, areas, district, state FROM pincode_cache WHERE pincode = $1',
        [pincode]
      );
      if (
        cachedRes.rows.length > 0 &&
        Array.isArray(cachedRes.rows[0].areas) &&
        cachedRes.rows[0].areas.length > 0
      ) {
        const row = cachedRes.rows[0];
        areas = row.areas;
        district = row.district || '';
        postalState = row.state || '';
        cached = true;
      }
    } catch (err) {
      console.warn('Pincode cache read skipped:', err.message);
    }
  }

  if (!cached) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const resp = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!resp.ok) {
        throw new Error(`Postal API returned HTTP ${resp.status}`);
      }
      const payload = await resp.json();
      const first = Array.isArray(payload) ? payload[0] : null;
      const postOffices =
        first?.Status === 'Success' && Array.isArray(first.PostOffice) ? first.PostOffice : [];

      areas = Array.from(
        new Set(postOffices.map((po) => String(po?.Name || '').trim()).filter(Boolean))
      );
      district = String(postOffices[0]?.District || '').trim();
      postalState = String(postOffices[0]?.State || '').trim();

      if (pool && areas.length > 0) {
        pool
          .query(
            `INSERT INTO pincode_cache (pincode, areas, district, state, created_at)
             VALUES ($1, $2::jsonb, $3, $4, NOW())
             ON CONFLICT (pincode) DO UPDATE
             SET areas = EXCLUDED.areas, district = EXCLUDED.district, state = EXCLUDED.state`,
            [pincode, JSON.stringify(areas), district, postalState]
          )
          .catch((cacheErr) => console.warn('Pincode cache write failed:', cacheErr.message));
      }
    } catch (err) {
      console.warn(`Postal lookup failed for ${pincode}:`, err.message);
      return {
        pincode,
        areas: [],
        primaryLocality: '',
        district: '',
        postalState: '',
        state: '',
        resolvedState: '',
        resolvedCity: null,
        cityMeta: null,
        cityAutoRegistered: false,
        cached: false,
        found: false,
        fallbackAllowed: true,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  let resolvedState = postalState;
  let cityMeta = null;
  let cityAutoRegistered = false;
  if (pool && (postalState || district)) {
    try {
      const resolved = await resolveLocationFromPostal(pool, { district, postalState, areas });
      resolvedState = resolved.resolvedState || postalState;
      cityMeta = resolved.resolvedCity;
      cityAutoRegistered = resolved.cityAutoRegistered;
    } catch (resolveErr) {
      console.warn('Postal city/state normalization skipped:', resolveErr.message);
    }
  }

  return {
    pincode,
    areas,
    primaryLocality: areas[0] || '',
    district,
    postalState,
    state: resolvedState,
    resolvedState,
    resolvedCity: toCityOptionPayload(cityMeta),
    cityMeta,
    cityAutoRegistered,
    cached,
    found: areas.length > 0,
    fallbackAllowed: areas.length === 0,
  };
}

async function resolveAuthoritativeLocation({ city, state, pincode }) {
  const cleanPincode = String(pincode || '').trim();
  const pincodeInfo = await lookupAndResolvePincode(cleanPincode).catch(() => null);
  if (pincodeInfo?.found && pincodeInfo.cityMeta) {
    return {
      cityMeta: pincodeInfo.cityMeta,
      cleanState: pincodeInfo.resolvedState || pincodeInfo.cityMeta.state,
      pincodeCorrected:
        Boolean(city) &&
        city.toLowerCase() !== pincodeInfo.cityMeta.name.toLowerCase() &&
        city.toUpperCase() !== pincodeInfo.cityMeta.code.toUpperCase(),
    };
  }

  const cityMeta = await resolveCityMetadata(pool, city, state).catch(() => null);
  if (!cityMeta) {
    return { error: 'Please select a valid city from the directory.' };
  }
  const requestedState = String(state || '').trim();
  if (requestedState && requestedState.toLowerCase() !== cityMeta.state.toLowerCase()) {
    return {
      error: `Selected city (${cityMeta.name}) belongs to ${cityMeta.state}, not ${requestedState}.`,
    };
  }
  return {
    cityMeta,
    cleanState: cityMeta.state,
    pincodeCorrected: false,
  };
}

app.get('/api/options/pincode/:pincode', async (req, res) => {
  const pincode = String(req.params.pincode || '').trim();
  if (!isValidPincode(pincode)) {
    return sendError(res, 400, 'Enter a valid 6-digit Indian pincode.');
  }

  const result = await lookupAndResolvePincode(pincode);
  if (!result) {
    return sendError(res, 400, 'Enter a valid 6-digit Indian pincode.');
  }

  const { cityMeta: _internalMeta, ...publicPayload } = result;
  return res.json(publicPayload);
});

app.get('/api/options/cement-types', (_req, res) => {
  res.json(Object.values(CEMENT_TYPES).map((c) => ({ value: c.value, label: c.displayName })));
});

app.get('/api/options/paint-types', (_req, res) => {
  res.json(Object.values(PAINT_TYPES).map((p) => ({ value: p.value, label: p.displayName })));
});

app.get('/api/options/window-types', (_req, res) => {
  res.json(Object.values(WINDOW_TYPES).map((w) => ({ value: w.value, label: w.displayName })));
});

// ----- Onboarding & Profile Routes (Firebase Auth Verified) -----
app.post('/api/auth/onboard', requireFirebaseAuth, requireDb, async (req, res) => {
  const {
    name,
    phone,
    role,
    city,
    state,
    pincode,
    locality,
    companyName,
    description,
    experienceYears,
    specialization,
    minBudget,
    maxBudget,
  } = req.body || {};

  const trimmedName = String(name || req.auth.name || '').trim();
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    return sendError(res, 400, 'Full name must be between 2 and 100 characters.');
  }
  if (!phone || !/^[6-9]\d{9}$/.test(String(phone))) {
    return sendError(res, 400, 'Enter a valid 10-digit Indian mobile number.');
  }
  if (role !== 'USER' && role !== 'CONTRACTOR') {
    return sendError(res, 400, 'Account role must be USER or CONTRACTOR.');
  }

  const cleanPincode = String(pincode || '').trim();
  if (!isValidPincode(cleanPincode)) {
    return sendError(res, 400, 'Enter a valid 6-digit Indian pincode.');
  }
  const cleanLocality = String(locality || '').trim().slice(0, 150);
  if (!cleanLocality) {
    return sendError(res, 400, 'Please select or enter a locality for the pincode.');
  }

  const locResolution = await resolveAuthoritativeLocation({ city, state, pincode: cleanPincode });
  if (locResolution.error || !locResolution.cityMeta) {
    return sendError(res, 400, locResolution.error || 'Please select a valid city from the directory.');
  }
  const { cityMeta, cleanState } = locResolution;

  if (role === 'CONTRACTOR' && (!companyName || !String(companyName).trim())) {
    return sendError(res, 400, 'Company name is required for contractor accounts.');
  }
  const expNum =
    experienceYears != null && experienceYears !== '' ? Number(experienceYears) : 0;
  if (!Number.isFinite(expNum) || expNum < 0) {
    return sendError(res, 400, 'Experience years must be a valid non-negative number.');
  }
  const minBudgetNum =
    minBudget != null && minBudget !== '' ? Number(minBudget) : null;
  const maxBudgetNum =
    maxBudget != null && maxBudget !== '' ? Number(maxBudget) : null;
  if (
    (minBudgetNum != null && (!Number.isFinite(minBudgetNum) || minBudgetNum < 0)) ||
    (maxBudgetNum != null && (!Number.isFinite(maxBudgetNum) || maxBudgetNum < 0))
  ) {
    return sendError(res, 400, 'Budget values must be valid non-negative numbers.');
  }
  if (minBudgetNum != null && maxBudgetNum != null && minBudgetNum > maxBudgetNum) {
    return sendError(res, 400, 'Minimum budget cannot exceed maximum budget.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existingEmail = await client.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [req.auth.email]
    );
    if (existingEmail.rows.length > 0) {
      await client.query('ROLLBACK');
      return sendError(res, 400, 'Account already registered. Please refresh your profile.');
    }

    const existingPhone = await client.query('SELECT id FROM users WHERE phone = $1', [String(phone)]);
    if (existingPhone.rows.length > 0) {
      await client.query('ROLLBACK');
      return sendError(res, 400, 'Mobile number already registered.');
    }

    const userInsert = await client.query(
      `INSERT INTO users (name, email, password, phone, role, city, state, pincode, locality, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING id, name, email, phone, role, city, state, pincode, locality`,
      [trimmedName, req.auth.email, 'firebase-auth', String(phone), role, cityMeta.name, cleanState, cleanPincode, cleanLocality]
    );
    const userRow = userInsert.rows[0];

    let contractorRow = null;
    if (role === 'CONTRACTOR') {
      const contractorInsert = await client.query(
        `INSERT INTO contractors (
          user_id, company_name, description, experience_years,
          specialization, rating, min_budget, max_budget,
          city, state, pincode, locality, is_verified, created_at
        ) VALUES ($1, $2, $3, $4, $5, 0.0, $6, $7, $8, $9, $10, $11, FALSE, NOW())
        RETURNING *`,
        [
          userRow.id,
          String(companyName).trim().slice(0, 150),
          description ? String(description).trim().slice(0, 500) : '',
          Math.trunc(expNum),
          specialization ? String(specialization).trim().slice(0, 200) : '',
          minBudgetNum != null ? Math.trunc(minBudgetNum) : null,
          maxBudgetNum != null ? Math.trunc(maxBudgetNum) : null,
          cityMeta.name,
          cleanState,
          cleanPincode,
          cleanLocality,
        ]
      );
      contractorRow = contractorInsert.rows[0];
    }

    await client.query('COMMIT');
    return res.json(buildProfilePayload(userRow, contractorRow));
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Onboarding failed:', err);
    return sendError(res, 500, 'Unable to complete account setup. Check database connectivity.');
  } finally {
    client.release();
  }
});

app.get('/api/users/me', requireFirebaseAuth, requireDb, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, name, email, phone, role, city, state, pincode, locality FROM users WHERE LOWER(email) = LOWER($1)',
      [req.auth.email]
    );
    if (userResult.rows.length === 0) {
      return sendError(res, 404, 'Profile onboarding required', {
        needsOnboarding: true,
        email: req.auth.email,
        name: req.auth.name,
      });
    }
    const userRow = userResult.rows[0];
    if (userRow.city && !userRow.state) {
      const cityMeta = await resolveCityMetadata(pool, userRow.city).catch(() => null);
      if (cityMeta) userRow.state = cityMeta.state;
    }
    let contractorRow = null;
    if (userRow.role === 'CONTRACTOR') {
      const cResult = await pool.query('SELECT * FROM contractors WHERE user_id = $1', [userRow.id]);
      contractorRow = cResult.rows[0] || null;
    }
    return res.json(buildProfilePayload(userRow, contractorRow));
  } catch (err) {
    console.error('Get profile error:', err);
    return sendError(res, 500, 'Failed to load user profile from database.');
  }
});

app.put('/api/users/me', requireFirebaseAuth, requireDb, async (req, res) => {
  const {
    name,
    phone,
    city,
    state,
    pincode,
    locality,
    companyName,
    description,
    experienceYears,
    specialization,
    minBudget,
    maxBudget,
  } = req.body || {};

  const trimmedName = String(name || '').trim();
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    return sendError(res, 400, 'Full name must be between 2 and 100 characters.');
  }
  if (!phone || !/^[6-9]\d{9}$/.test(String(phone))) {
    return sendError(res, 400, 'Enter a valid 10-digit Indian mobile number.');
  }
  const cleanPincode = String(pincode || '').trim();
  if (!isValidPincode(cleanPincode)) {
    return sendError(res, 400, 'Enter a valid 6-digit Indian pincode.');
  }
  const cleanLocality = String(locality || '').trim().slice(0, 150);
  if (!cleanLocality) {
    return sendError(res, 400, 'Please select or enter a locality for the pincode.');
  }
  const locResolution = await resolveAuthoritativeLocation({ city, state, pincode: cleanPincode });
  if (locResolution.error || !locResolution.cityMeta) {
    return sendError(res, 400, locResolution.error || 'Please select a valid city from the directory.');
  }
  const { cityMeta, cleanState } = locResolution;

  const expNum =
    experienceYears != null && experienceYears !== '' ? Number(experienceYears) : null;
  if (expNum != null && (!Number.isFinite(expNum) || expNum < 0)) {
    return sendError(res, 400, 'Experience years must be a valid non-negative number.');
  }
  const minBudgetNum =
    minBudget != null && minBudget !== '' ? Number(minBudget) : null;
  const maxBudgetNum =
    maxBudget != null && maxBudget !== '' ? Number(maxBudget) : null;
  if (
    (minBudgetNum != null && (!Number.isFinite(minBudgetNum) || minBudgetNum < 0)) ||
    (maxBudgetNum != null && (!Number.isFinite(maxBudgetNum) || maxBudgetNum < 0))
  ) {
    return sendError(res, 400, 'Budget values must be valid non-negative numbers.');
  }
  if (minBudgetNum != null && maxBudgetNum != null && minBudgetNum > maxBudgetNum) {
    return sendError(res, 400, 'Minimum budget cannot exceed maximum budget.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query(
      'SELECT id, name, email, phone, role, city, state, pincode, locality FROM users WHERE LOWER(email) = LOWER($1)',
      [req.auth.email]
    );
    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return sendError(res, 404, 'User profile not found.');
    }
    const currentUser = userResult.rows[0];

    if (String(phone) !== currentUser.phone) {
      const phoneDup = await client.query(
        'SELECT id FROM users WHERE phone = $1 AND id <> $2',
        [String(phone), currentUser.id]
      );
      if (phoneDup.rows.length > 0) {
        await client.query('ROLLBACK');
        return sendError(res, 400, 'Mobile number already registered.');
      }
    }

    const updatedUserRes = await client.query(
      `UPDATE users SET name = $1, phone = $2, city = $3, state = $4, pincode = $5, locality = $6
       WHERE id = $7
       RETURNING id, name, email, phone, role, city, state, pincode, locality`,
      [trimmedName, String(phone), cityMeta.name, cleanState, cleanPincode, cleanLocality, currentUser.id]
    );
    const updatedUser = updatedUserRes.rows[0];

    let contractorRow = null;
    if (updatedUser.role === 'CONTRACTOR') {
      const cRes = await client.query(
        `UPDATE contractors
         SET company_name = COALESCE($1, company_name),
             description = $2,
             experience_years = COALESCE($3, experience_years),
             specialization = $4,
             min_budget = $5,
             max_budget = $6,
             city = $7,
             state = $8,
             pincode = $9,
             locality = $10
         WHERE user_id = $11
         RETURNING *`,
        [
          companyName ? String(companyName).trim().slice(0, 150) : null,
          description != null ? String(description).trim().slice(0, 500) : '',
          expNum != null ? Math.trunc(expNum) : null,
          specialization != null ? String(specialization).trim().slice(0, 200) : '',
          minBudgetNum != null ? Math.trunc(minBudgetNum) : null,
          maxBudgetNum != null ? Math.trunc(maxBudgetNum) : null,
          cityMeta.name,
          cleanState,
          cleanPincode,
          cleanLocality,
          updatedUser.id,
        ]
      );
      contractorRow = cRes.rows[0] || null;
    }

    await client.query('COMMIT');
    return res.json(buildProfilePayload(updatedUser, contractorRow));
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Update profile error:', err);
    return sendError(res, 500, 'Unable to update profile.');
  } finally {
    client.release();
  }
});

// ----- Project Routes -----
app.post('/api/projects/estimate', requireFirebaseAuth, requireDb, async (req, res) => {
  const {
    projectName,
    city,
    state,
    pincode,
    locality,
    plotAreaSqFt,
    numberOfFloors,
    roofAreaSqFt,
    cementType,
    brickWork,
    paintType,
    windowType,
    numberOfWindows,
    numberOfRooms,
    additionalOptions,
  } = req.body || {};

  const trimmedProjectName = String(projectName || '').trim();
  if (!trimmedProjectName) {
    return sendError(res, 400, 'Project name is required.');
  }

  const cleanPincode = String(pincode || '').trim();
  if (!isValidPincode(cleanPincode)) {
    return sendError(res, 400, 'Enter a valid 6-digit Indian pincode.');
  }
  const cleanLocality = String(locality || '').trim().slice(0, 150);
  if (!cleanLocality) {
    return sendError(res, 400, 'Please select or enter a locality for the pincode.');
  }
  const locResolution = await resolveAuthoritativeLocation({ city, state, pincode: cleanPincode });
  if (locResolution.error || !locResolution.cityMeta) {
    return sendError(res, 400, locResolution.error || 'Please select a valid city from the directory.');
  }
  const { cityMeta, cleanState } = locResolution;

  if (!Number.isFinite(Number(plotAreaSqFt)) || Number(plotAreaSqFt) < 100) {
    return sendError(res, 400, 'Plot area must be at least 100 sq ft.');
  }
  if (!Number.isInteger(Number(numberOfFloors)) || Number(numberOfFloors) < 1 || Number(numberOfFloors) > 20) {
    return sendError(res, 400, 'Number of floors must be between 1 and 20.');
  }
  if (roofAreaSqFt == null || roofAreaSqFt === '' || !Number.isFinite(Number(roofAreaSqFt)) || Number(roofAreaSqFt) < 0) {
    return sendError(res, 400, 'Roof area must be 0 or greater.');
  }
  if (!CEMENT_TYPES[cementType]) {
    return sendError(res, 400, 'Please select a valid cement type.');
  }
  if (typeof brickWork !== 'boolean') {
    return sendError(res, 400, 'Brick work option must be selected.');
  }
  if (!PAINT_TYPES[paintType]) {
    return sendError(res, 400, 'Please select a valid paint type.');
  }
  if (!WINDOW_TYPES[windowType]) {
    return sendError(res, 400, 'Please select a valid window type.');
  }
  if (!Number.isInteger(Number(numberOfWindows)) || Number(numberOfWindows) < 1) {
    return sendError(res, 400, 'Number of windows must be at least 1.');
  }
  if (!Number.isInteger(Number(numberOfRooms)) || Number(numberOfRooms) < 1) {
    return sendError(res, 400, 'Number of rooms must be at least 1.');
  }

  try {
    const userRes = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [req.auth.email]
    );
    if (userRes.rows.length === 0) {
      return sendError(res, 403, 'Complete profile onboarding before creating projects.');
    }
    const userId = userRes.rows[0].id;

    const preview = calculateBreakdownFromValues({
      id: 0,
      projectName: trimmedProjectName,
      cityMeta,
      state: cleanState,
      pincode: cleanPincode,
      locality: cleanLocality,
      plotAreaSqFt,
      numberOfFloors,
      roofAreaSqFt,
      cementType,
      brickWork,
      paintType,
      windowType,
      numberOfWindows,
      numberOfRooms,
    });

    const insertRes = await pool.query(
      `INSERT INTO projects (
        user_id, city, state, pincode, locality, plot_area_sq_ft, number_of_floors, roof_area_sq_ft,
        cement_type, brick_work, paint_type, window_type,
        number_of_windows, number_of_rooms, additional_options,
        total_estimated_cost, project_name, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW())
      RETURNING id`,
      [
        userId,
        String(cityMeta.code || cityMeta.name || '').slice(0, 120),
        String(cleanState || '').slice(0, 100),
        cleanPincode,
        cleanLocality,
        Number(plotAreaSqFt),
        Math.trunc(Number(numberOfFloors)),
        Number(roofAreaSqFt),
        cementType,
        brickWork,
        paintType,
        windowType,
        Math.trunc(Number(numberOfWindows)),
        Math.trunc(Number(numberOfRooms)),
        additionalOptions || null,
        Math.trunc(preview.totalCost),
        trimmedProjectName.slice(0, 200),
      ]
    );

    return res.json({ ...preview, projectId: Number(insertRes.rows[0].id) });
  } catch (err) {
    console.error('Create project error:', err?.code, err?.constraint, err?.message || err);
    return sendError(res, 500, 'Failed to save project estimate.');
  }
});

app.get('/api/projects/my', requireFirebaseAuth, requireDb, async (req, res) => {
  try {
    const userRes = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [req.auth.email]
    );
    if (userRes.rows.length === 0) {
      return sendError(res, 404, 'User profile not found.');
    }
    const projRes = await pool.query(
      `SELECT p.*, cm.name AS city_name, cm.tier AS city_tier, COALESCE(p.state, cm.state) AS resolved_state
       FROM projects p
       LEFT JOIN cities cm ON UPPER(cm.code) = UPPER(p.city) OR LOWER(cm.name) = LOWER(p.city)
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [userRes.rows[0].id]
    );
    return res.json(
      projRes.rows.map((r) =>
        mapProjectRow({
          ...r,
          state: r.state || r.resolved_state || '',
        })
      )
    );
  } catch (err) {
    console.error('Get my projects error:', err);
    return sendError(res, 500, 'Failed to load projects.');
  }
});

app.get('/api/projects/open', requireFirebaseAuth, requireDb, async (req, res) => {
  try {
    const userRes = await pool.query(
      `SELECT u.id, u.role, u.city AS user_city, u.state AS user_state,
              c.id AS contractor_id, c.city AS contractor_city, c.state AS contractor_state
       FROM users u
       LEFT JOIN contractors c ON c.user_id = u.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [req.auth.email]
    );
    if (userRes.rows.length === 0 || userRes.rows[0].role !== 'CONTRACTOR') {
      return sendError(res, 403, 'Only contractors can browse open projects.');
    }

    const contractor = userRes.rows[0];
    const contractorId = contractor.contractor_id ? Number(contractor.contractor_id) : null;
    const profileCity = (contractor.contractor_city || contractor.user_city || '').trim();
    const profileState = (contractor.contractor_state || contractor.user_state || '').trim();

    const cityMeta = profileCity
      ? await resolveCityMetadata(pool, profileCity, profileState).catch(() => null)
      : null;

    const cityCode = cityMeta?.code || profileCity;
    const cityName = cityMeta?.name || profileCity;
    const resolvedState = profileState || cityMeta?.state || '';

    let projRes;
    if (profileCity && resolvedState) {
      projRes = await pool.query(
        `SELECT p.*, u.name AS owner_name, cm.name AS city_name, cm.tier AS city_tier, COALESCE(p.state, cm.state) AS resolved_state
         FROM projects p
         JOIN users u ON u.id = p.user_id
         LEFT JOIN cities cm ON UPPER(cm.code) = UPPER(p.city) OR LOWER(cm.name) = LOWER(p.city)
         WHERE (UPPER(p.city) = UPPER($1) OR LOWER(p.city) = LOWER($2) OR LOWER(COALESCE(cm.name, '')) = LOWER($2))
           AND LOWER(COALESCE(p.state, cm.state, '')) = LOWER($3)
           AND p.user_id <> $4
           AND ($5::bigint IS NULL OR p.id NOT IN (SELECT project_id FROM contractor_bids WHERE contractor_id = $5))
           AND p.id NOT IN (SELECT cb.project_id FROM contractor_bids cb JOIN contractors c ON c.id = cb.contractor_id WHERE c.user_id = $4)
         ORDER BY p.created_at DESC
         LIMIT 100`,
        [cityCode, cityName, resolvedState, contractor.id, contractorId]
      );
    } else if (profileCity) {
      projRes = await pool.query(
        `SELECT p.*, u.name AS owner_name, cm.name AS city_name, cm.tier AS city_tier, COALESCE(p.state, cm.state) AS resolved_state
         FROM projects p
         JOIN users u ON u.id = p.user_id
         LEFT JOIN cities cm ON UPPER(cm.code) = UPPER(p.city) OR LOWER(cm.name) = LOWER(p.city)
         WHERE (UPPER(p.city) = UPPER($1) OR LOWER(p.city) = LOWER($2) OR LOWER(COALESCE(cm.name, '')) = LOWER($2))
           AND p.user_id <> $3
           AND ($4::bigint IS NULL OR p.id NOT IN (SELECT project_id FROM contractor_bids WHERE contractor_id = $4))
           AND p.id NOT IN (SELECT cb.project_id FROM contractor_bids cb JOIN contractors c ON c.id = cb.contractor_id WHERE c.user_id = $3)
         ORDER BY p.created_at DESC
         LIMIT 100`,
        [cityCode, cityName, contractor.id, contractorId]
      );
    } else if (resolvedState) {
      projRes = await pool.query(
        `SELECT p.*, u.name AS owner_name, cm.name AS city_name, cm.tier AS city_tier, COALESCE(p.state, cm.state) AS resolved_state
         FROM projects p
         JOIN users u ON u.id = p.user_id
         LEFT JOIN cities cm ON UPPER(cm.code) = UPPER(p.city) OR LOWER(cm.name) = LOWER(p.city)
         WHERE LOWER(COALESCE(p.state, cm.state, '')) = LOWER($1)
           AND p.user_id <> $2
           AND ($3::bigint IS NULL OR p.id NOT IN (SELECT project_id FROM contractor_bids WHERE contractor_id = $3))
           AND p.id NOT IN (SELECT cb.project_id FROM contractor_bids cb JOIN contractors c ON c.id = cb.contractor_id WHERE c.user_id = $2)
         ORDER BY p.created_at DESC
         LIMIT 100`,
        [resolvedState, contractor.id, contractorId]
      );
    } else {
      projRes = await pool.query(
        `SELECT p.*, u.name AS owner_name, cm.name AS city_name, cm.tier AS city_tier, COALESCE(p.state, cm.state) AS resolved_state
         FROM projects p
         JOIN users u ON u.id = p.user_id
         LEFT JOIN cities cm ON UPPER(cm.code) = UPPER(p.city) OR LOWER(cm.name) = LOWER(p.city)
         WHERE p.user_id <> $1
           AND ($2::bigint IS NULL OR p.id NOT IN (SELECT project_id FROM contractor_bids WHERE contractor_id = $2))
           AND p.id NOT IN (SELECT cb.project_id FROM contractor_bids cb JOIN contractors c ON c.id = cb.contractor_id WHERE c.user_id = $1)
         ORDER BY p.created_at DESC
         LIMIT 100`,
        [contractor.id, contractorId]
      );
    }

    return res.json(
      projRes.rows.map((r) => ({
        ...mapProjectRow({ ...r, state: r.state || r.resolved_state || '' }),
        ownerName: r.owner_name,
      }))
    );
  } catch (err) {
    console.error('Get open projects error:', err);
    return sendError(res, 500, 'Failed to load open projects.');
  }
});

app.get('/api/projects/:id/breakdown', requireFirebaseAuth, requireDb, async (req, res) => {
  const projectId = Number(req.params.id);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return sendError(res, 400, 'Invalid project ID.');
  }
  try {
    const userRes = await pool.query(
      'SELECT id, role FROM users WHERE LOWER(email) = LOWER($1)',
      [req.auth.email]
    );
    if (userRes.rows.length === 0) {
      return sendError(res, 403, 'Profile onboarding required.');
    }
    const caller = userRes.rows[0];

    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (projRes.rows.length === 0) {
      return sendError(res, 404, 'Project not found.');
    }
    const p = projRes.rows[0];
    if (Number(p.user_id) !== Number(caller.id) && caller.role !== 'CONTRACTOR') {
      return sendError(res, 403, 'You do not have permission to view this project breakdown.');
    }

    const cityMeta =
      (await resolveCityMetadata(pool, p.city).catch(() => null)) || {
        code: String(p.city || '').toUpperCase(),
        name: p.city || '',
        state: p.state || '',
        tier: 3,
        costMultiplier: 1.0,
      };

    return res.json(
      calculateBreakdownFromValues({
        id: p.id,
        projectName: p.project_name,
        cityMeta,
        state: p.state || cityMeta.state || '',
        pincode: p.pincode || '',
        locality: p.locality || '',
        plotAreaSqFt: p.plot_area_sq_ft,
        numberOfFloors: p.number_of_floors,
        roofAreaSqFt: p.roof_area_sq_ft,
        cementType: p.cement_type,
        brickWork: p.brick_work,
        paintType: p.paint_type,
        windowType: p.window_type,
        numberOfWindows: p.number_of_windows,
        numberOfRooms: p.number_of_rooms,
      })
    );
  } catch (err) {
    console.error('Get project breakdown error:', err);
    return sendError(res, 500, 'Failed to load project breakdown.');
  }
});

// ----- Contractor & Bid Routes -----
app.get('/api/contractors/list', requireDb, async (req, res) => {
  const rawCity = String(req.query.city || '').trim();
  try {
    const cityMeta = await resolveCityMetadata(pool, rawCity).catch(() => null);
    const cityName = cityMeta ? cityMeta.name : rawCity;
    const cityCode = cityMeta ? cityMeta.code : rawCity;

    const result = await pool.query(
      `SELECT c.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
              u.state AS user_state, u.pincode AS user_pincode, u.locality AS user_locality
       FROM contractors c
       JOIN users u ON u.id = c.user_id
       WHERE LOWER(c.city) = LOWER($1) OR UPPER(c.city) = UPPER($2)
       ORDER BY c.is_verified DESC, c.rating DESC, c.experience_years DESC`,
      [cityName, cityCode]
    );
    return res.json(result.rows.map(mapContractorRow));
  } catch (err) {
    console.error('List contractors error:', err);
    return sendError(res, 500, 'Failed to load contractors.');
  }
});

app.get('/api/contractors/match', requireDb, async (req, res) => {
  const rawCity = String(req.query.city || '').trim();
  const parsedBudget = Number(req.query.budget);
  const budget = Number.isFinite(parsedBudget) ? Math.trunc(parsedBudget) : 0;
  try {
    const cityMeta = await resolveCityMetadata(pool, rawCity).catch(() => null);
    const cityName = cityMeta ? cityMeta.name : rawCity;
    const cityCode = cityMeta ? cityMeta.code : rawCity;

    const result = await pool.query(
      `SELECT c.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone,
              u.state AS user_state, u.pincode AS user_pincode, u.locality AS user_locality
       FROM contractors c
       JOIN users u ON u.id = c.user_id
       WHERE (LOWER(c.city) = LOWER($1) OR UPPER(c.city) = UPPER($2))
         AND (c.min_budget IS NULL OR c.min_budget <= $3)
         AND (c.max_budget IS NULL OR c.max_budget >= $3)
       ORDER BY c.is_verified DESC, c.rating DESC, c.experience_years DESC`,
      [cityName, cityCode, budget]
    );
    return res.json(result.rows.map(mapContractorRow));
  } catch (err) {
    console.error('Match contractors error:', err);
    return sendError(res, 500, 'Failed to match contractors.');
  }
});

app.post('/api/contractors/bid', requireFirebaseAuth, requireDb, async (req, res) => {
  const { projectId, bidAmount, description, estimatedDays } = req.body || {};

  if (projectId == null || !Number.isInteger(Number(projectId)) || Number(projectId) <= 0) {
    return sendError(res, 400, 'Valid Project ID is required.');
  }
  if (!Number.isFinite(Number(bidAmount)) || Number(bidAmount) < 10000) {
    return sendError(res, 400, 'Bid amount must be at least ₹10,000.');
  }
  const cleanDesc = String(description || '').trim();
  if (cleanDesc.length < 20 || cleanDesc.length > 1000) {
    return sendError(res, 400, 'Scope description must be between 20 and 1000 characters.');
  }
  if (!Number.isInteger(Number(estimatedDays)) || Number(estimatedDays) < 1 || Number(estimatedDays) > 3650) {
    return sendError(res, 400, 'Estimated days must be between 1 and 3650.');
  }

  try {
    const userRes = await pool.query(
      'SELECT id, role, city, state, pincode, locality FROM users WHERE LOWER(email) = LOWER($1)',
      [req.auth.email]
    );
    if (userRes.rows.length === 0) {
      return sendError(res, 403, 'User profile not found.');
    }
    if (userRes.rows[0].role !== 'CONTRACTOR') {
      return sendError(res, 403, 'Only contractors can submit bids.');
    }
    const callerUser = userRes.rows[0];

    const contractorRes = await pool.query(
      'SELECT id, city, state, pincode, locality FROM contractors WHERE user_id = $1',
      [callerUser.id]
    );
    if (contractorRes.rows.length === 0) {
      return sendError(res, 400, 'Contractor profile not found.');
    }
    const contractor = contractorRes.rows[0];

    const projRes = await pool.query(
      'SELECT id, user_id, city, state, pincode, locality FROM projects WHERE id = $1',
      [Number(projectId)]
    );
    if (projRes.rows.length === 0) {
      return sendError(res, 404, 'Project not found.');
    }
    const proj = projRes.rows[0];

    if (Number(proj.user_id) === Number(callerUser.id)) {
      return sendError(res, 400, 'You cannot bid on your own project.');
    }

    const existingBidRes = await pool.query(
      `SELECT id FROM contractor_bids
       WHERE project_id = $1
         AND (contractor_id = $2 OR contractor_id IN (SELECT id FROM contractors WHERE user_id = $3))`,
      [Number(projectId), contractor.id, callerUser.id]
    );
    if (existingBidRes.rows.length > 0) {
      return sendError(
        res,
        400,
        'You have already submitted a bid for this project. Please edit your submitted bid in the My Bids tab.'
      );
    }

    const projCityMeta = await resolveCityMetadata(pool, proj.city, proj.state).catch(() => null);
    const contractorCityMeta = await resolveCityMetadata(
      pool,
      contractor.city || callerUser.city,
      contractor.state || callerUser.state
    ).catch(() => null);

    const projectState = proj.state || projCityMeta?.state || '';
    const projectCity = projCityMeta?.name || proj.city || '';
    const projectPincode = proj.pincode || '';
    const projectLocality = proj.locality || '';

    const contractorState = contractor.state || callerUser.state || contractorCityMeta?.state || '';
    const contractorCity = contractorCityMeta?.name || contractor.city || callerUser.city || '';
    const contractorPincode = contractor.pincode || callerUser.pincode || '';
    const contractorLocality = contractor.locality || callerUser.locality || '';

    const insertRes = await pool.query(
      `INSERT INTO contractor_bids (
        contractor_id, project_id, bid_amount, description, estimated_days,
        project_state, project_city, project_pincode, project_locality,
        contractor_state, contractor_city, contractor_pincode, contractor_locality,
        created_at
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
       RETURNING id`,
      [
        contractor.id,
        Number(projectId),
        Number(bidAmount),
        cleanDesc,
        Number(estimatedDays),
        projectState,
        projectCity,
        projectPincode,
        projectLocality,
        contractorState,
        contractorCity,
        contractorPincode,
        contractorLocality,
      ]
    );

    const joinedRes = await pool.query(
      `SELECT b.*, c.company_name, c.rating AS contractor_rating, c.experience_years,
              u.name AS contractor_name, p.project_name,
              COALESCE(NULLIF(b.project_city, ''), pcm.name, p.city) AS resolved_project_city,
              COALESCE(NULLIF(b.project_state, ''), p.state, pcm.state) AS resolved_project_state,
              COALESCE(NULLIF(b.project_pincode, ''), p.pincode) AS resolved_project_pincode,
              COALESCE(NULLIF(b.project_locality, ''), p.locality) AS resolved_project_locality,
              COALESCE(NULLIF(b.contractor_city, ''), ccm.name, c.city, u.city) AS resolved_contractor_city,
              COALESCE(NULLIF(b.contractor_state, ''), c.state, u.state, ccm.state) AS resolved_contractor_state,
              COALESCE(NULLIF(b.contractor_pincode, ''), c.pincode, u.pincode) AS resolved_contractor_pincode,
              COALESCE(NULLIF(b.contractor_locality, ''), c.locality, u.locality) AS resolved_contractor_locality
       FROM contractor_bids b
       JOIN contractors c ON c.id = b.contractor_id
       JOIN users u ON u.id = c.user_id
       JOIN projects p ON p.id = b.project_id
       LEFT JOIN cities pcm ON UPPER(pcm.code) = UPPER(p.city) OR LOWER(pcm.name) = LOWER(p.city)
       LEFT JOIN cities ccm ON UPPER(ccm.code) = UPPER(c.city) OR LOWER(ccm.name) = LOWER(c.city)
       WHERE b.id = $1`,
      [insertRes.rows[0].id]
    );
    return res.json(mapBidRow(joinedRes.rows[0]));
  } catch (err) {
    console.error('Submit bid error:', err);
    return sendError(res, 500, 'Failed to submit bid.');
  }
});

app.put('/api/contractors/bids/:id', requireFirebaseAuth, requireDb, async (req, res) => {
  const bidId = Number(req.params.id);
  if (!Number.isInteger(bidId) || bidId <= 0) {
    return sendError(res, 400, 'Invalid bid ID.');
  }

  const { bidAmount, description, estimatedDays } = req.body || {};

  if (!Number.isFinite(Number(bidAmount)) || Number(bidAmount) < 10000) {
    return sendError(res, 400, 'Bid amount must be at least ₹10,000.');
  }
  const cleanDesc = String(description || '').trim();
  if (cleanDesc.length < 20 || cleanDesc.length > 1000) {
    return sendError(res, 400, 'Scope description must be between 20 and 1000 characters.');
  }
  if (!Number.isInteger(Number(estimatedDays)) || Number(estimatedDays) < 1 || Number(estimatedDays) > 3650) {
    return sendError(res, 400, 'Estimated days must be between 1 and 3650.');
  }

  try {
    const userRes = await pool.query(
      'SELECT id, role FROM users WHERE LOWER(email) = LOWER($1)',
      [req.auth.email]
    );
    if (userRes.rows.length === 0) {
      return sendError(res, 403, 'User profile not found.');
    }
    if (userRes.rows[0].role !== 'CONTRACTOR') {
      return sendError(res, 403, 'Only contractors can update bids.');
    }
    const callerUser = userRes.rows[0];

    const contractorRes = await pool.query(
      'SELECT id FROM contractors WHERE user_id = $1',
      [callerUser.id]
    );
    if (contractorRes.rows.length === 0) {
      return sendError(res, 400, 'Contractor profile not found.');
    }
    const contractor = contractorRes.rows[0];

    const bidRes = await pool.query(
      'SELECT id, contractor_id, project_id FROM contractor_bids WHERE id = $1',
      [bidId]
    );
    if (bidRes.rows.length === 0) {
      return sendError(res, 404, 'Bid not found.');
    }
    const existingBid = bidRes.rows[0];
    if (Number(existingBid.contractor_id) !== Number(contractor.id)) {
      return sendError(res, 403, 'You do not have permission to edit this bid.');
    }

    await pool.query(
      `UPDATE contractor_bids
       SET bid_amount = $1, description = $2, estimated_days = $3
       WHERE id = $4`,
      [Number(bidAmount), cleanDesc, Number(estimatedDays), bidId]
    );

    const joinedRes = await pool.query(
      `SELECT b.*, c.company_name, c.rating AS contractor_rating, c.experience_years,
              u.name AS contractor_name, p.project_name,
              COALESCE(NULLIF(b.project_city, ''), pcm.name, p.city) AS resolved_project_city,
              COALESCE(NULLIF(b.project_state, ''), p.state, pcm.state) AS resolved_project_state,
              COALESCE(NULLIF(b.project_pincode, ''), p.pincode) AS resolved_project_pincode,
              COALESCE(NULLIF(b.project_locality, ''), p.locality) AS resolved_project_locality,
              COALESCE(NULLIF(b.contractor_city, ''), ccm.name, c.city, u.city) AS resolved_contractor_city,
              COALESCE(NULLIF(b.contractor_state, ''), c.state, u.state, ccm.state) AS resolved_contractor_state,
              COALESCE(NULLIF(b.contractor_pincode, ''), c.pincode, u.pincode) AS resolved_contractor_pincode,
              COALESCE(NULLIF(b.contractor_locality, ''), c.locality, u.locality) AS resolved_contractor_locality
       FROM contractor_bids b
       JOIN contractors c ON c.id = b.contractor_id
       JOIN users u ON u.id = c.user_id
       JOIN projects p ON p.id = b.project_id
       LEFT JOIN cities pcm ON UPPER(pcm.code) = UPPER(p.city) OR LOWER(pcm.name) = LOWER(p.city)
       LEFT JOIN cities ccm ON UPPER(ccm.code) = UPPER(c.city) OR LOWER(ccm.name) = LOWER(c.city)
       WHERE b.id = $1`,
      [bidId]
    );

    return res.json(mapBidRow(joinedRes.rows[0]));
  } catch (err) {
    console.error('Update bid error:', err);
    return sendError(res, 500, 'Failed to update bid.');
  }
});

app.get('/api/contractors/bids/project/:projectId', requireFirebaseAuth, requireDb, async (req, res) => {
  const projectId = Number(req.params.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    return sendError(res, 400, 'Invalid project ID.');
  }
  try {
    const result = await pool.query(
      `SELECT b.*, c.company_name, c.rating AS contractor_rating, c.experience_years,
              u.name AS contractor_name, p.project_name,
              COALESCE(NULLIF(b.project_city, ''), pcm.name, p.city) AS resolved_project_city,
              COALESCE(NULLIF(b.project_state, ''), p.state, pcm.state) AS resolved_project_state,
              COALESCE(NULLIF(b.project_pincode, ''), p.pincode) AS resolved_project_pincode,
              COALESCE(NULLIF(b.project_locality, ''), p.locality) AS resolved_project_locality,
              COALESCE(NULLIF(b.contractor_city, ''), ccm.name, c.city, u.city) AS resolved_contractor_city,
              COALESCE(NULLIF(b.contractor_state, ''), c.state, u.state, ccm.state) AS resolved_contractor_state,
              COALESCE(NULLIF(b.contractor_pincode, ''), c.pincode, u.pincode) AS resolved_contractor_pincode,
              COALESCE(NULLIF(b.contractor_locality, ''), c.locality, u.locality) AS resolved_contractor_locality
       FROM contractor_bids b
       JOIN contractors c ON c.id = b.contractor_id
       JOIN users u ON u.id = c.user_id
       JOIN projects p ON p.id = b.project_id
       LEFT JOIN cities pcm ON UPPER(pcm.code) = UPPER(p.city) OR LOWER(pcm.name) = LOWER(p.city)
       LEFT JOIN cities ccm ON UPPER(ccm.code) = UPPER(c.city) OR LOWER(ccm.name) = LOWER(c.city)
       WHERE b.project_id = $1
       ORDER BY b.bid_amount ASC`,
      [projectId]
    );
    return res.json(result.rows.map(mapBidRow));
  } catch (err) {
    console.error('Get bids for project error:', err);
    return sendError(res, 500, 'Failed to load project bids.');
  }
});

app.get('/api/contractors/bids/my', requireFirebaseAuth, requireDb, async (req, res) => {
  try {
    const userRes = await pool.query(
      'SELECT id, role FROM users WHERE LOWER(email) = LOWER($1)',
      [req.auth.email]
    );
    if (userRes.rows.length === 0 || userRes.rows[0].role !== 'CONTRACTOR') {
      return sendError(res, 403, 'Contractor account required.');
    }
    const cRes = await pool.query('SELECT id FROM contractors WHERE user_id = $1', [userRes.rows[0].id]);
    if (cRes.rows.length === 0) {
      return sendError(res, 400, 'Contractor profile not found.');
    }

    const result = await pool.query(
      `SELECT b.*, c.company_name, c.rating AS contractor_rating, c.experience_years,
              u.name AS contractor_name, p.project_name,
              COALESCE(NULLIF(b.project_city, ''), pcm.name, p.city) AS resolved_project_city,
              COALESCE(NULLIF(b.project_state, ''), p.state, pcm.state) AS resolved_project_state,
              COALESCE(NULLIF(b.project_pincode, ''), p.pincode) AS resolved_project_pincode,
              COALESCE(NULLIF(b.project_locality, ''), p.locality) AS resolved_project_locality,
              COALESCE(NULLIF(b.contractor_city, ''), ccm.name, c.city, u.city) AS resolved_contractor_city,
              COALESCE(NULLIF(b.contractor_state, ''), c.state, u.state, ccm.state) AS resolved_contractor_state,
              COALESCE(NULLIF(b.contractor_pincode, ''), c.pincode, u.pincode) AS resolved_contractor_pincode,
              COALESCE(NULLIF(b.contractor_locality, ''), c.locality, u.locality) AS resolved_contractor_locality
       FROM contractor_bids b
       JOIN contractors c ON c.id = b.contractor_id
       JOIN users u ON u.id = c.user_id
       JOIN projects p ON p.id = b.project_id
       LEFT JOIN cities pcm ON UPPER(pcm.code) = UPPER(p.city) OR LOWER(pcm.name) = LOWER(p.city)
       LEFT JOIN cities ccm ON UPPER(ccm.code) = UPPER(c.city) OR LOWER(ccm.name) = LOWER(c.city)
       WHERE b.contractor_id = $1
       ORDER BY b.created_at DESC`,
      [cRes.rows[0].id]
    );
    return res.json(result.rows.map(mapBidRow));
  } catch (err) {
    console.error('Get my bids error:', err);
    return sendError(res, 500, 'Failed to load contractor bids.');
  }
});

// ----- Serve Built React Frontend + SPA Fallback -----
const buildDir = path.join(__dirname, 'frontend', 'build');
app.use(express.static(buildDir));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return sendError(res, 404, 'Endpoint not found.');
  }
  const indexPath = path.join(buildDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.status(200).send('<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Brikko</title></head><body><div id="root">Loading Brikko...</div></body></html>');
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Brikko server running on http://${HOST}:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    process.exit(0);
  });
});
