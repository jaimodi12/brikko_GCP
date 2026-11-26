export const INDIA_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
];

export const TIER_MULTIPLIERS = {
  1: 1.15,
  2: 1.05,
  3: 1.0,
};

function toCode(name) {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const RAW_TIER_1 = [
  ['Ahmedabad', 'Gujarat'],
  ['Bengaluru', 'Karnataka'],
  ['Chennai', 'Tamil Nadu'],
  ['Gurgaon', 'Haryana'],
  ['Hyderabad', 'Telangana'],
  ['Kolkata', 'West Bengal'],
  ['Mumbai', 'Maharashtra'],
  ['New Delhi', 'Delhi'],
  ['Pune', 'Maharashtra'],
];

const RAW_TIER_2 = [
  ['Agra', 'Uttar Pradesh'],
  ['Ambala', 'Haryana'],
  ['Amravati', 'Maharashtra'],
  ['Amritsar', 'Punjab'],
  ['Ananthapur', 'Andhra Pradesh'],
  ['Asansol', 'West Bengal'],
  ['Belagavi', 'Karnataka'],
  ['Bhavnagar', 'Gujarat'],
  ['Bhiwandi', 'Maharashtra'],
  ['Bhopal', 'Madhya Pradesh'],
  ['Bhubaneswar', 'Odisha'],
  ['Calicut', 'Kerala'],
  ['Ch.Sambhajinagar (Aurangabad)', 'Maharashtra'],
  ['Chandigarh', 'Chandigarh'],
  ['Coimbatore', 'Tamil Nadu'],
  ['Cuttack', 'Odisha'],
  ['Davangere', 'Karnataka'],
  ['Dhanbad', 'Jharkhand'],
  ['Durg-Bhilai', 'Chhattisgarh'],
  ['Faridabad', 'Haryana'],
  ['Gandhinagar', 'Gujarat'],
  ['Ghaziabad', 'Uttar Pradesh'],
  ['Goa', 'Goa'],
  ['Greater Noida', 'Uttar Pradesh'],
  ['Guntur', 'Andhra Pradesh'],
  ['Guwahati', 'Assam'],
  ['Gwalior', 'Madhya Pradesh'],
  ['Hisar', 'Haryana'],
  ['Howrah-Hooghly', 'West Bengal'],
  ['Huballi & Dharwad', 'Karnataka'],
  ['Indore', 'Madhya Pradesh'],
  ['Jabalpur', 'Madhya Pradesh'],
  ['Jaipur', 'Rajasthan'],
  ['Jalandhar', 'Punjab'],
  ['Jalgaon', 'Maharashtra'],
  ['Jamnagar', 'Gujarat'],
  ['Jamshedpur', 'Jharkhand'],
  ['Jodhpur', 'Rajasthan'],
  ['Kadapa', 'Andhra Pradesh'],
  ['Kakinada', 'Andhra Pradesh'],
  ['Kalyan Dombivli', 'Maharashtra'],
  ['Kanpur', 'Uttar Pradesh'],
  ['Karnal', 'Haryana'],
  ['Kochi', 'Kerala'],
  ['Kolhapur', 'Maharashtra'],
  ['Kota', 'Rajasthan'],
  ['Kurnool', 'Andhra Pradesh'],
  ['Latur', 'Maharashtra'],
  ['Lucknow', 'Uttar Pradesh'],
  ['Ludhiana', 'Punjab'],
  ['Madurai', 'Tamil Nadu'],
  ['Malegaon', 'Maharashtra'],
  ['Mangaluru', 'Karnataka'],
  ['Mira Bhyander', 'Maharashtra'],
  ['Mohali', 'Punjab'],
  ['Moradabad', 'Uttar Pradesh'],
  ['Mysuru', 'Karnataka'],
  ['Nagpur', 'Maharashtra'],
  ['Nanded', 'Maharashtra'],
  ['Nashik', 'Maharashtra'],
  ['Navi Mumbai', 'Maharashtra'],
  ['Nellore', 'Andhra Pradesh'],
  ['Nizamabad', 'Telangana'],
  ['Noida', 'Uttar Pradesh'],
  ['Panchkula', 'Haryana'],
  ['Patna', 'Bihar'],
  ['Prayagraj', 'Uttar Pradesh'],
  ['Puducherry', 'Puducherry'],
  ['Raipur', 'Chhattisgarh'],
  ['Rajahmundry', 'Andhra Pradesh'],
  ['Rajkot', 'Gujarat'],
  ['Ranchi', 'Jharkhand'],
  ['Rohtak', 'Haryana'],
  ['Sagar', 'Madhya Pradesh'],
  ['Salem', 'Tamil Nadu'],
  ['Sangli', 'Maharashtra'],
  ['Satara', 'Maharashtra'],
  ['Solapur', 'Maharashtra'],
  ['Sonipat', 'Haryana'],
  ['Surat', 'Gujarat'],
  ['Thane', 'Maharashtra'],
  ['Thrissur', 'Kerala'],
  ['Tirupathi', 'Andhra Pradesh'],
  ['Trichy', 'Tamil Nadu'],
  ['Trivandrum', 'Kerala'],
  ['Udaipur', 'Rajasthan'],
  ['Vadodara', 'Gujarat'],
  ['Varanasi', 'Uttar Pradesh'],
  ['Vijayawada', 'Andhra Pradesh'],
  ['Vishakhapatnam', 'Andhra Pradesh'],
  ['Warangal', 'Telangana'],
  ['Yamuna', 'Haryana'],
];

const RAW_TIER_3 = [
  ['Ahmednagar', 'Maharashtra'],
  ['Akola', 'Maharashtra'],
  ['Aligarh', 'Uttar Pradesh'],
  ['Alwar', 'Rajasthan'],
  ['Amalner', 'Maharashtra'],
  ['Ambajogai', 'Maharashtra'],
  ['Amreli', 'Gujarat'],
  ['Anand', 'Gujarat'],
  ['Baramati', 'Maharashtra'],
  ['Bardoli', 'Gujarat'],
  ['Barshi', 'Maharashtra'],
  ['Bathinda', 'Punjab'],
  ['Becharaji', 'Gujarat'],
  ['Beed', 'Maharashtra'],
  ['Begusarai', 'Bihar'],
  ['Berhampur', 'Odisha'],
  ['Bhadradri Kothagudam', 'Telangana'],
  ['Bhandara', 'Maharashtra'],
  ['Bharatpur', 'Rajasthan'],
  ['Bharuch', 'Gujarat'],
  ['Bhimavaram', 'Andhra Pradesh'],
  ['Bhusawal', 'Maharashtra'],
  ['Bidar', 'Karnataka'],
  ['Bilaspur', 'Chhattisgarh'],
  ['Buldhana', 'Maharashtra'],
  ['Chalisgaon', 'Maharashtra'],
  ['Chandrapur', 'Maharashtra'],
  ['Chiplun', 'Maharashtra'],
  ['Dahod', 'Gujarat'],
  ['Daund', 'Maharashtra'],
  ['Dharmapuri', 'Tamil Nadu'],
  ['Dhule', 'Maharashtra'],
  ['Eluru', 'Andhra Pradesh'],
  ['Erode', 'Tamil Nadu'],
  ['Gadhinglaj', 'Maharashtra'],
  ['Gadwal', 'Telangana'],
  ['Gandhidham', 'Gujarat'],
  ['Gaya', 'Bihar'],
  ['Godhra', 'Gujarat'],
  ['Gondia', 'Maharashtra'],
  ['Gurdaspur', 'Punjab'],
  ['Hingoli', 'Maharashtra'],
  ['Hoshangabad', 'Madhya Pradesh'],
  ['Hosur', 'Tamil Nadu'],
  ['Ichalkaranji', 'Maharashtra'],
  ['Indapur', 'Maharashtra'],
  ['Islampur', 'Maharashtra'],
  ['Jagityal', 'Telangana'],
  ['Jalna', 'Maharashtra'],
  ['Jaysingpur', 'Maharashtra'],
  ['Jhansi', 'Uttar Pradesh'],
  ['Jharsuguda', 'Odisha'],
  ['Junagadh', 'Gujarat'],
  ['Kachchh', 'Gujarat'],
  ['Kadi', 'Gujarat'],
  ['Kagal', 'Maharashtra'],
  ['Kalol', 'Gujarat'],
  ['Kamareddy', 'Telangana'],
  ['Karad', 'Maharashtra'],
  ['Karim Nagar', 'Telangana'],
  ['Karwar', 'Karnataka'],
  ['Khamgaon', 'Maharashtra'],
  ['Khammam', 'Telangana'],
  ['Kharar', 'Punjab'],
  ['Kopargaon-Shirdi', 'Maharashtra'],
  ['Machilipatnam', 'Andhra Pradesh'],
  ['Mahabubnagar', 'Telangana'],
  ['Mahad', 'Maharashtra'],
  ['Malvan', 'Maharashtra'],
  ['Mancherial', 'Telangana'],
  ['Mathura', 'Uttar Pradesh'],
  ['Mehsana', 'Gujarat'],
  ['Modasa', 'Gujarat'],
  ['Mundra', 'Gujarat'],
  ['Muzaffarpur', 'Bihar'],
  ['Nadiad', 'Gujarat'],
  ['Nalgonda', 'Telangana'],
  ['Nandyala', 'Andhra Pradesh'],
  ['Narsipatnam', 'Andhra Pradesh'],
  ['Navsari', 'Gujarat'],
  ['Nilanga', 'Maharashtra'],
  ['Nirmal', 'Telangana'],
  ['North Bengal', 'West Bengal'],
  ['Omerga', 'Maharashtra'],
  ['Ongole', 'Andhra Pradesh'],
  ['Osmanabad / Dharashiv', 'Maharashtra'],
  ['Ozar', 'Maharashtra'],
  ['Pachora', 'Maharashtra'],
  ['Palakkad', 'Kerala'],
  ['Palakollu', 'Andhra Pradesh'],
  ['Palanpur', 'Gujarat'],
  ['Palghar Boisar', 'Maharashtra'],
  ['Pandharpur', 'Maharashtra'],
  ['Parbhani', 'Maharashtra'],
  ['Patan', 'Gujarat'],
  ['Phaltan', 'Maharashtra'],
  ['Pimpalgaon Baswant', 'Maharashtra'],
  ['Puri', 'Odisha'],
  ['Raigad', 'Maharashtra'],
  ['Raigarh', 'Chhattisgarh'],
  ['Ratnagiri', 'Maharashtra'],
  ['Ropar', 'Punjab'],
  ['Sabarkantha', 'Gujarat'],
  ['Sakri', 'Maharashtra'],
  ['Sambalpur', 'Odisha'],
  ['Sangrur', 'Punjab'],
  ['Sawantwadi', 'Maharashtra'],
  ['Shahada-Nandurbar', 'Maharashtra'],
  ['Shahapur Murbad', 'Maharashtra'],
  ['Shirpur', 'Maharashtra'],
  ['Siddipet', 'Telangana'],
  ['Silvassa', 'Dadra and Nagar Haveli and Daman and Diu'],
  ['Sindhudurg', 'Maharashtra'],
  ['Sinnar', 'Maharashtra'],
  ['Srikakulam', 'Andhra Pradesh'],
  ['Tirunelveli', 'Tamil Nadu'],
  ['Tuni', 'Andhra Pradesh'],
  ['Udgir', 'Maharashtra'],
  ['Udupi', 'Karnataka'],
  ['Ujjain', 'Madhya Pradesh'],
  ['Unjha', 'Gujarat'],
  ['Uran Dronagiri', 'Maharashtra'],
  ['Valsad', 'Gujarat'],
  ['Vapi', 'Gujarat'],
  ['Vijapur', 'Gujarat'],
  ['Vijayapura', 'Karnataka'],
  ['Visnagar', 'Gujarat'],
  ['Vizianagaram', 'Andhra Pradesh'],
  ['Vyara', 'Gujarat'],
  ['Wanaparthy', 'Telangana'],
  ['Wani', 'Maharashtra'],
  ['Wardha', 'Maharashtra'],
  ['Washim', 'Maharashtra'],
  ['Yavatmal', 'Maharashtra'],
  ['Zirakpur', 'Punjab'],
];

export const SEED_CITIES = [
  ...RAW_TIER_1.map(([name, state]) => ({
    code: toCode(name),
    name,
    state,
    tier: 1,
    costMultiplier: TIER_MULTIPLIERS[1],
  })),
  ...RAW_TIER_2.map(([name, state]) => ({
    code: toCode(name),
    name,
    state,
    tier: 2,
    costMultiplier: TIER_MULTIPLIERS[2],
  })),
  ...RAW_TIER_3.map(([name, state]) => ({
    code: toCode(name),
    name,
    state,
    tier: 3,
    costMultiplier: TIER_MULTIPLIERS[3],
  })),
];

export const ACTIVE_SEED_STATES = Array.from(new Set(SEED_CITIES.map((c) => c.state))).sort();

const STATE_ALIASES = {
  'nct of delhi': 'Delhi',
  'new delhi': 'Delhi',
  delhi: 'Delhi',
  pondicherry: 'Puducherry',
  puducherry: 'Puducherry',
  orissa: 'Odisha',
  odisha: 'Odisha',
  uttaranchal: 'Uttarakhand',
  uttarakhand: 'Uttarakhand',
  'jammu & kashmir': 'Jammu and Kashmir',
  'jammu and kashmir': 'Jammu and Kashmir',
  'andaman & nicobar islands': 'Andaman and Nicobar Islands',
  'andaman and nicobar islands': 'Andaman and Nicobar Islands',
  'andaman & nicobar': 'Andaman and Nicobar Islands',
  'dadra & nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'dadra and nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'daman & diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'dadra and nagar haveli and daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'the dadra and nagar haveli and daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
};

// Keys formatted as "lower(state)::lower(district)" or "*::lower(district)"
const DISTRICT_CITY_ALIASES = {
  'karnataka::bangalore': 'Bengaluru',
  'karnataka::bangalore urban': 'Bengaluru',
  'karnataka::bangalore rural': 'Bengaluru',
  'karnataka::bengaluru urban': 'Bengaluru',
  'karnataka::bengaluru rural': 'Bengaluru',
  'karnataka::dakshina kannada': 'Mangaluru',
  'karnataka::mangalore': 'Mangaluru',
  'karnataka::mysore': 'Mysuru',
  'karnataka::belgaum': 'Belagavi',
  'karnataka::dharwad': 'Huballi & Dharwad',
  'karnataka::hubli': 'Huballi & Dharwad',
  'karnataka::hubballi': 'Huballi & Dharwad',
  'karnataka::bijapur': 'Vijayapura',
  'karnataka::uttara kannada': 'Karwar',
  'maharashtra::mumbai city': 'Mumbai',
  'maharashtra::mumbai suburban': 'Mumbai',
  'maharashtra::greater mumbai': 'Mumbai',
  'maharashtra::aurangabad': 'Ch.Sambhajinagar (Aurangabad)',
  'maharashtra::chhatrapati sambhajinagar': 'Ch.Sambhajinagar (Aurangabad)',
  'maharashtra::sambhajinagar': 'Ch.Sambhajinagar (Aurangabad)',
  'maharashtra::ahmednagar': 'Ahmednagar',
  'maharashtra::ahilyanagar': 'Ahmednagar',
  'maharashtra::osmanabad': 'Osmanabad / Dharashiv',
  'maharashtra::dharashiv': 'Osmanabad / Dharashiv',
  'maharashtra::raigarh': 'Raigad',
  'maharashtra::raigarh(mh)': 'Raigad',
  'maharashtra::raigad': 'Raigad',
  'maharashtra::palghar': 'Palghar Boisar',
  'delhi::central delhi': 'New Delhi',
  'delhi::east delhi': 'New Delhi',
  'delhi::new delhi': 'New Delhi',
  'delhi::north delhi': 'New Delhi',
  'delhi::north east delhi': 'New Delhi',
  'delhi::north west delhi': 'New Delhi',
  'delhi::shahdara': 'New Delhi',
  'delhi::south delhi': 'New Delhi',
  'delhi::south east delhi': 'New Delhi',
  'delhi::south west delhi': 'New Delhi',
  'delhi::west delhi': 'New Delhi',
  'delhi::delhi': 'New Delhi',
  'haryana::gurugram': 'Gurgaon',
  'haryana::gurgaon': 'Gurgaon',
  'haryana::yamunanagar': 'Yamuna',
  'haryana::yamuna nagar': 'Yamuna',
  'telangana::rangareddy': 'Hyderabad',
  'telangana::ranga reddy': 'Hyderabad',
  'telangana::k.v.rangareddy': 'Hyderabad',
  'telangana::medchal-malkajgiri': 'Hyderabad',
  'telangana::medchal malkajgiri': 'Hyderabad',
  'telangana::karimnagar': 'Karim Nagar',
  'telangana::bhadradri kothagudem': 'Bhadradri Kothagudam',
  'telangana::jagtial': 'Jagityal',
  'telangana::jagitial': 'Jagityal',
  'tamil nadu::tiruchirappalli': 'Trichy',
  'tamil nadu::tiruchirapalli': 'Trichy',
  'tamil nadu::krishnagiri': 'Hosur',
  'kerala::thiruvananthapuram': 'Trivandrum',
  'kerala::kozhikode': 'Calicut',
  'kerala::ernakulam': 'Kochi',
  'uttar pradesh::allahabad': 'Prayagraj',
  'uttar pradesh::gautam buddha nagar': 'Noida',
  'uttar pradesh::gautam buddh nagar': 'Noida',
  'andhra pradesh::visakhapatnam': 'Vishakhapatnam',
  'andhra pradesh::tirupati': 'Tirupathi',
  'andhra pradesh::ananthapuramu': 'Ananthapur',
  'andhra pradesh::anantapur': 'Ananthapur',
  'andhra pradesh::y.s.r.': 'Kadapa',
  'andhra pradesh::ysr': 'Kadapa',
  'andhra pradesh::cuddapah': 'Kadapa',
  'andhra pradesh::east godavari': 'Rajahmundry',
  'andhra pradesh::west godavari': 'Bhimavaram',
  'andhra pradesh::krishna': 'Vijayawada',
  'andhra pradesh::prakasam': 'Ongole',
  'andhra pradesh::spsr nellore': 'Nellore',
  'andhra pradesh::nandyal': 'Nandyala',
  'gujarat::mahesana': 'Mehsana',
  'gujarat::kutch': 'Kachchh',
  'gujarat::panchmahal': 'Godhra',
  'gujarat::panch mahals': 'Godhra',
  'gujarat::tapi': 'Vyara',
  'gujarat::aravalli': 'Modasa',
  'gujarat::arvalli': 'Modasa',
  'gujarat::banaskantha': 'Palanpur',
  'gujarat::banas kantha': 'Palanpur',
  'gujarat::sabar kantha': 'Sabarkantha',
  'gujarat::gandhinagar': 'Gandhinagar',
  'gujarat::ahmadabad': 'Ahmedabad',
  'west bengal::howrah': 'Howrah-Hooghly',
  'west bengal::haora': 'Howrah-Hooghly',
  'west bengal::hooghly': 'Howrah-Hooghly',
  'west bengal::hugli': 'Howrah-Hooghly',
  'west bengal::paschim bardhaman': 'Asansol',
  'west bengal::bardhaman': 'Asansol',
  'west bengal::darjeeling': 'North Bengal',
  'west bengal::jalpaiguri': 'North Bengal',
  'chhattisgarh::durg': 'Durg-Bhilai',
  'odisha::khordha': 'Bhubaneswar',
  'odisha::khurda': 'Bhubaneswar',
  'odisha::ganjam': 'Berhampur',
  'punjab::s.a.s. nagar': 'Mohali',
  'punjab::sahibzada ajit singh nagar': 'Mohali',
  'punjab::sas nagar': 'Mohali',
  'punjab::rupnagar': 'Ropar',
  'goa::north goa': 'Goa',
  'goa::south goa': 'Goa',
  'madhya pradesh::narmadapuram': 'Hoshangabad',
  'jharkhand::east singhbhum': 'Jamshedpur',
  'jharkhand::purbi singhbhum': 'Jamshedpur',
  'assam::kamrup metropolitan': 'Guwahati',
  'assam::kamrup': 'Guwahati',
  'dadra and nagar haveli and daman and diu::dadra and nagar haveli': 'Silvassa',
  'dadra and nagar haveli and daman and diu::dadra & nagar haveli': 'Silvassa',
};

export function normalizeIndianState(rawState) {
  const clean = String(rawState || '').trim().replace(/\s+/g, ' ');
  if (!clean) return '';
  const lower = clean.toLowerCase();
  if (STATE_ALIASES[lower]) return STATE_ALIASES[lower];
  const exact = INDIA_STATES.find((s) => s.toLowerCase() === lower);
  if (exact) return exact;
  return clean;
}

function normalizeLookupKey(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export async function ensureLocationMetadataSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS states (
      id BIGSERIAL PRIMARY KEY,
      code VARCHAR(80) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL UNIQUE,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cities (
      id BIGSERIAL PRIMARY KEY,
      code VARCHAR(80) NOT NULL UNIQUE,
      name VARCHAR(120) NOT NULL UNIQUE,
      state VARCHAR(100) NOT NULL,
      tier INTEGER NOT NULL CHECK (tier IN (1, 2, 3)),
      cost_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1.0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pincode_cache (
      pincode VARCHAR(6) PRIMARY KEY,
      areas JSONB NOT NULL DEFAULT '[]'::jsonb,
      district VARCHAR(120),
      state VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Safe non-breaking evolutions on existing domain tables
  await pool.query(`ALTER TABLE users ALTER COLUMN city TYPE VARCHAR(120);`);
  await pool.query(`ALTER TABLE contractors ALTER COLUMN city TYPE VARCHAR(120);`);
  await pool.query(`ALTER TABLE projects ALTER COLUMN city TYPE VARCHAR(120);`);

  // Drop legacy Hibernate/enum CHECK constraints on city columns across domain tables
  await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_city_check;`);
  await pool.query(`ALTER TABLE contractors DROP CONSTRAINT IF EXISTS contractors_city_check;`);
  await pool.query(`ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_city_check;`);
  const legacyCityChecks = await pool.query(`
    SELECT conrelid::regclass::text AS table_name, conname
    FROM pg_constraint
    WHERE conrelid::regclass::text IN ('users', 'contractors', 'projects', 'contractor_bids')
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ~* '\\y(city|project_city|contractor_city)\\y'
  `);
  for (const row of legacyCityChecks.rows) {
    const safeTable = String(row.table_name || '').replace(/[^a-zA-Z0-9_]/g, '');
    const safeConstraint = String(row.conname || '').replace(/"/g, '""');
    if (safeTable && safeConstraint) {
      await pool.query(`ALTER TABLE ${safeTable} DROP CONSTRAINT IF EXISTS "${safeConstraint}";`);
    }
  }

  for (const tbl of ['users', 'contractors', 'projects', 'contractor_bids']) {
    await pool
      .query(
        `SELECT setval(
           pg_get_serial_sequence($1, 'id'),
           GREATEST(COALESCE((SELECT MAX(id) FROM ${tbl}), 0), 1),
           EXISTS (SELECT 1 FROM ${tbl})
         )`,
        [tbl]
      )
      .catch(() => {});
  }

  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(100);`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pincode VARCHAR(6);`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS locality VARCHAR(150);`);

  await pool.query(`ALTER TABLE contractors ADD COLUMN IF NOT EXISTS state VARCHAR(100);`);
  await pool.query(`ALTER TABLE contractors ADD COLUMN IF NOT EXISTS pincode VARCHAR(6);`);
  await pool.query(`ALTER TABLE contractors ADD COLUMN IF NOT EXISTS locality VARCHAR(150);`);

  await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS state VARCHAR(100);`);
  await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS pincode VARCHAR(6);`);
  await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS locality VARCHAR(150);`);

  await pool.query(`ALTER TABLE contractor_bids ADD COLUMN IF NOT EXISTS project_state VARCHAR(100);`);
  await pool.query(`ALTER TABLE contractor_bids ADD COLUMN IF NOT EXISTS project_city VARCHAR(120);`);
  await pool.query(`ALTER TABLE contractor_bids ADD COLUMN IF NOT EXISTS project_pincode VARCHAR(6);`);
  await pool.query(`ALTER TABLE contractor_bids ADD COLUMN IF NOT EXISTS project_locality VARCHAR(150);`);
  await pool.query(`ALTER TABLE contractor_bids ADD COLUMN IF NOT EXISTS contractor_state VARCHAR(100);`);
  await pool.query(`ALTER TABLE contractor_bids ADD COLUMN IF NOT EXISTS contractor_city VARCHAR(120);`);
  await pool.query(`ALTER TABLE contractor_bids ADD COLUMN IF NOT EXISTS contractor_pincode VARCHAR(6);`);
  await pool.query(`ALTER TABLE contractor_bids ADD COLUMN IF NOT EXISTS contractor_locality VARCHAR(150);`);

  // Seed Indian States & Union Territories metadata idempotently
  if (INDIA_STATES.length > 0) {
    const stateCodes = INDIA_STATES.map((s) => toCode(s));
    const stateNames = INDIA_STATES;
    await pool.query(
      `INSERT INTO states (code, name, is_active)
       SELECT UNNEST($1::text[]), UNNEST($2::text[]), TRUE
       ON CONFLICT (code) DO NOTHING;`,
      [stateCodes, stateNames]
    );
  }

  // Seed Tier 1, 2 & 3 Cities metadata idempotently
  if (SEED_CITIES.length > 0) {
    const codes = SEED_CITIES.map((c) => c.code);
    const names = SEED_CITIES.map((c) => c.name);
    const states = SEED_CITIES.map((c) => c.state);
    const tiers = SEED_CITIES.map((c) => c.tier);
    const multipliers = SEED_CITIES.map((c) => c.costMultiplier);

    await pool.query(
      `INSERT INTO cities (code, name, state, tier, cost_multiplier, is_active)
       SELECT
         UNNEST($1::text[]),
         UNNEST($2::text[]),
         UNNEST($3::text[]),
         UNNEST($4::int[]),
         UNNEST($5::float8[]),
         TRUE
       ON CONFLICT (code) DO NOTHING;`,
      [codes, names, states, tiers, multipliers]
    );
  }

  // Idempotent backfill for existing contractors and contractor_bids location columns
  await pool.query(`
    UPDATE contractors c
    SET
      state = COALESCE(NULLIF(c.state, ''), u.state, cm.state),
      pincode = COALESCE(NULLIF(c.pincode, ''), u.pincode),
      locality = COALESCE(NULLIF(c.locality, ''), u.locality)
    FROM users u
    LEFT JOIN cities cm ON UPPER(cm.code) = UPPER(u.city) OR LOWER(cm.name) = LOWER(u.city)
    WHERE c.user_id = u.id
      AND (
        c.state IS NULL OR c.state = '' OR
        c.pincode IS NULL OR c.pincode = '' OR
        c.locality IS NULL OR c.locality = ''
      );
  `);

  await pool.query(`
    UPDATE contractor_bids b
    SET
      project_state = COALESCE(NULLIF(b.project_state, ''), p.state, pcm.state),
      project_city = COALESCE(NULLIF(b.project_city, ''), pcm.name, p.city),
      project_pincode = COALESCE(NULLIF(b.project_pincode, ''), p.pincode),
      project_locality = COALESCE(NULLIF(b.project_locality, ''), p.locality),
      contractor_state = COALESCE(NULLIF(b.contractor_state, ''), c.state, u.state, ccm.state),
      contractor_city = COALESCE(NULLIF(b.contractor_city, ''), ccm.name, c.city, u.city),
      contractor_pincode = COALESCE(NULLIF(b.contractor_pincode, ''), c.pincode, u.pincode),
      contractor_locality = COALESCE(NULLIF(b.contractor_locality, ''), c.locality, u.locality)
    FROM projects p
    LEFT JOIN cities pcm ON UPPER(pcm.code) = UPPER(p.city) OR LOWER(pcm.name) = LOWER(p.city),
         contractors c
    JOIN users u ON u.id = c.user_id
    LEFT JOIN cities ccm ON UPPER(ccm.code) = UPPER(c.city) OR LOWER(ccm.name) = LOWER(c.city)
    WHERE b.project_id = p.id
      AND b.contractor_id = c.id
      AND (
        b.project_city IS NULL OR b.project_city = '' OR
        b.contractor_city IS NULL OR b.contractor_city = ''
      );
  `);
}

function mapCityRow(row) {
  return {
    id: Number(row.id),
    code: row.code,
    name: row.name,
    state: row.state,
    tier: Number(row.tier),
    costMultiplier: Number(row.cost_multiplier),
  };
}

export async function resolveCityMetadata(pool, cityInput, preferredState = null) {
  const clean = String(cityInput || '').trim();
  if (!clean) return null;
  if (preferredState) {
    const stateMatch = await pool.query(
      `SELECT id, code, name, state, tier, cost_multiplier
       FROM cities
       WHERE is_active = TRUE
         AND LOWER(state) = LOWER($2)
         AND (UPPER(code) = UPPER($1) OR LOWER(name) = LOWER($1))
       LIMIT 1`,
      [clean, String(preferredState).trim()]
    );
    if (stateMatch.rows.length > 0) {
      return mapCityRow(stateMatch.rows[0]);
    }
  }
  const res = await pool.query(
    `SELECT id, code, name, state, tier, cost_multiplier
     FROM cities
     WHERE is_active = TRUE
       AND (UPPER(code) = UPPER($1) OR LOWER(name) = LOWER($1))
     LIMIT 1`,
    [clean]
  );
  if (res.rows.length === 0) return null;
  return mapCityRow(res.rows[0]);
}

export async function resolveLocationFromPostal(pool, { district, postalState, areas = [] }) {
  const resolvedState = normalizeIndianState(postalState);
  const cleanDistrict = String(district || '')
    .trim()
    .replace(/\s+district$/i, '')
    .replace(/\s+/g, ' ');

  if (!resolvedState) {
    return { resolvedState: '', resolvedCity: null, cityAutoRegistered: false };
  }

  // Ensure resolved state exists and is active in states table
  const stateCode = toCode(resolvedState);
  await pool.query(
    `INSERT INTO states (code, name, is_active)
     VALUES ($1, $2, TRUE)
     ON CONFLICT (code) DO UPDATE SET is_active = TRUE`,
    [stateCode, resolvedState]
  );

  // Special area-level refinement inside shared metro districts (e.g. Thane -> Navi Mumbai/Kalyan, GBN -> Greater Noida)
  const areaBlob = (Array.isArray(areas) ? areas : []).join(' ').toLowerCase();
  const stateLower = resolvedState.toLowerCase();
  const districtLower = cleanDistrict.toLowerCase();

  let targetCityName = null;
  if (stateLower === 'uttar pradesh' && districtLower.includes('gautam') && areaBlob.includes('greater noida')) {
    targetCityName = 'Greater Noida';
  } else if (stateLower === 'maharashtra' && districtLower === 'thane') {
    if (areaBlob.includes('navi mumbai') || areaBlob.includes('vashi') || areaBlob.includes('nerul') || areaBlob.includes('kharghar') || areaBlob.includes('airoli')) {
      targetCityName = 'Navi Mumbai';
    } else if (areaBlob.includes('kalyan') || areaBlob.includes('dombivli')) {
      targetCityName = 'Kalyan Dombivli';
    } else if (areaBlob.includes('bhiwandi')) {
      targetCityName = 'Bhiwandi';
    } else if (areaBlob.includes('mira road') || areaBlob.includes('bhayandar') || areaBlob.includes('bhayander')) {
      targetCityName = 'Mira Bhyander';
    } else {
      targetCityName = 'Thane';
    }
  } else {
    targetCityName = DISTRICT_CITY_ALIASES[`${stateLower}::${districtLower}`] || null;
  }

  // 1. Try explicit alias match in resolvedState
  if (targetCityName) {
    const aliasMatch = await resolveCityMetadata(pool, targetCityName, resolvedState);
    if (aliasMatch) {
      return { resolvedState, resolvedCity: aliasMatch, cityAutoRegistered: false };
    }
  }

  // 2. Try exact or normalized name match within resolvedState
  if (cleanDistrict) {
    const stateCitiesRes = await pool.query(
      `SELECT id, code, name, state, tier, cost_multiplier
       FROM cities
       WHERE is_active = TRUE AND LOWER(state) = LOWER($1)`,
      [resolvedState]
    );
    const normDistrict = normalizeLookupKey(cleanDistrict);
    const matched = stateCitiesRes.rows.find((row) => {
      const normName = normalizeLookupKey(row.name);
      return (
        row.name.toLowerCase() === districtLower ||
        normName === normDistrict
      );
    });
    if (matched) {
      return { resolvedState, resolvedCity: mapCityRow(matched), cityAutoRegistered: false };
    }

    // 3. Auto-register missing district as active Tier 3 (1.0x) city
    let candidateName = cleanDistrict.slice(0, 120);
    let candidateCode = toCode(candidateName).slice(0, 80);

    // Check if code or name already belongs to a different state (avoid collisions)
    const collisionRes = await pool.query(
      `SELECT id, code, name, state, tier, cost_multiplier
       FROM cities
       WHERE UPPER(code) = UPPER($1) OR LOWER(name) = LOWER($2)
       LIMIT 1`,
      [candidateCode, candidateName]
    );
    if (collisionRes.rows.length > 0) {
      const existing = collisionRes.rows[0];
      if (String(existing.state || '').toLowerCase() === stateLower) {
        return { resolvedState, resolvedCity: mapCityRow(existing), cityAutoRegistered: false };
      }
      candidateName = `${candidateName} (${resolvedState})`.slice(0, 120);
      candidateCode = toCode(`${candidateCode}_${stateCode}`).slice(0, 80);
    }

    const insertRes = await pool.query(
      `INSERT INTO cities (code, name, state, tier, cost_multiplier, is_active)
       VALUES ($1, $2, $3, 3, $4, TRUE)
       ON CONFLICT DO NOTHING
       RETURNING id, code, name, state, tier, cost_multiplier`,
      [candidateCode, candidateName, resolvedState, TIER_MULTIPLIERS[3]]
    );
    if (insertRes.rows.length > 0) {
      return {
        resolvedState,
        resolvedCity: mapCityRow(insertRes.rows[0]),
        cityAutoRegistered: true,
      };
    }
    const existingRes = await pool.query(
      `SELECT id, code, name, state, tier, cost_multiplier
       FROM cities
       WHERE UPPER(code) = UPPER($1) OR LOWER(name) = LOWER($2)
       LIMIT 1`,
      [candidateCode, candidateName]
    );
    if (existingRes.rows.length > 0) {
      return {
        resolvedState,
        resolvedCity: mapCityRow(existingRes.rows[0]),
        cityAutoRegistered: false,
      };
    }
  }

  return { resolvedState, resolvedCity: null, cityAutoRegistered: false };
}

