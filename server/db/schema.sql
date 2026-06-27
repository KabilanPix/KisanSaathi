CREATE TABLE IF NOT EXISTS farmers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  state VARCHAR(100),
  district VARCHAR(100),
  preferred_language VARCHAR(20) DEFAULT 'hi',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cost_entries (
  id SERIAL PRIMARY KEY,
  farmer_id INTEGER REFERENCES farmers(id),
  session_id VARCHAR(100),
  category VARCHAR(50) NOT NULL,
  item_name VARCHAR(100),
  quantity DECIMAL(10,2),
  unit VARCHAR(20),
  cost_per_unit DECIMAL(10,2),
  total_cost DECIMAL(10,2) NOT NULL,
  entry_date DATE DEFAULT CURRENT_DATE,
  crop_season VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS advisory_logs (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100),
  question TEXT,
  response TEXT,
  language VARCHAR(20),
  state VARCHAR(100),
  crop VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mandi_searches (
  id SERIAL PRIMARY KEY,
  state VARCHAR(100),
  district VARCHAR(100),
  market VARCHAR(100),
  commodity VARCHAR(100),
  modal_price DECIMAL(10,2),
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  msp_at_time DECIMAL(10,2),
  searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
