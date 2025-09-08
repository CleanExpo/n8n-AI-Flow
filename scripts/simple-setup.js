const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Manual environment variables (from .env.local)
const SUPABASE_URL = 'https://zkqinubdlorgbrwxstzx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcWludWJkbG9yZ2Jyd3hzdHp4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzMxMzkxNCwiZXhwIjoyMDcyODg5OTE0fQ.Lx-cAUzYayXNMa2mD7qPlRtXjksCnm1EVHQSNodkYSY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function setupUserTable() {
  console.log('🚀 Setting up user in Supabase...\n');

  try {
    // Hash the password first
    const password = 'Sanctuary2025!';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('✅ Password hashed successfully');
    console.log('📝 Hash:', hashedPassword);

    // Try to execute SQL through the REST API directly
    console.log('\n🛠️ Creating users table and inserting user...');
    
    // Use the SQL query to create table and insert user
    const sqlQuery = `
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

-- Insert the user with hashed password
INSERT INTO users (email, name, password_hash, role)
VALUES (
  'phill.mcgurk@gmail.com',
  'Phill McGurk',
  '${hashedPassword}',
  'admin'
) ON CONFLICT (email) 
DO UPDATE SET 
  password_hash = EXCLUDED.password_hash,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = NOW();
`;

    console.log('\n📋 SQL Query to execute in Supabase SQL editor:');
    console.log('═'.repeat(80));
    console.log(sqlQuery);
    console.log('═'.repeat(80));

    console.log('\n📌 Instructions:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/zkqinubdlorgbrwxstzx');
    console.log('2. Click on "SQL Editor" in the left sidebar');
    console.log('3. Copy and paste the SQL query above');
    console.log('4. Click "Run" to execute');
    console.log('5. Return here to test the login');

    console.log('\n🔑 Your login credentials:');
    console.log('📧 Email: phill.mcgurk@gmail.com');
    console.log('🔐 Password: Sanctuary2025!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupUserTable();