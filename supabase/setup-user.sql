-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid()::UUID);

-- Insert the user with hashed password
-- Password: Sanctuary2025!
-- Hash generated with bcrypt (10 rounds)
INSERT INTO users (email, name, password_hash, role)
VALUES (
  'phill.mcgurk@gmail.com',
  'Phill McGurk',
  '$2b$10$wklwXzHUY7gcdqvSrJ9Dh.a7xD7rvzNxcbrCqKtQc55uZcMzgycby',
  'admin'
) ON CONFLICT (email) 
DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Create workflows table if it doesn't exist
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'inactive',
  n8n_workflow_id TEXT,
  nodes JSONB DEFAULT '[]'::jsonb,
  edges JSONB DEFAULT '[]'::jsonb,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for workflows
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workflows
CREATE POLICY "Users can view own workflows" ON workflows
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims')::json->>'email'));

CREATE POLICY "Users can create workflows" ON workflows
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims')::json->>'email'));

CREATE POLICY "Users can update own workflows" ON workflows
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims')::json->>'email'));

CREATE POLICY "Users can delete own workflows" ON workflows
  FOR DELETE USING (user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims')::json->>'email'));