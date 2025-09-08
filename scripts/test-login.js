const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Manual environment variables (from .env.local)
const SUPABASE_URL = 'https://zkqinubdlorgbrwxstzx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcWludWJkbG9yZ2Jyd3hzdHp4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzMxMzkxNCwiZXhwIjoyMDcyODg5OTE0fQ.Lx-cAUzYayXNMa2mD7qPlRtXjksCnm1EVHQSNodkYSY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testLogin() {
  console.log('🔍 Testing login credentials...\n');

  try {
    const email = 'phill.mcgurk@gmail.com';
    const password = 'Sanctuary2025!';

    // Check if user exists
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.log('❌ User lookup failed:', error.message);
      console.log('🔧 Make sure to run the SQL query in Supabase dashboard first!');
      return;
    }

    if (!user) {
      console.log('❌ User not found in database');
      console.log('🔧 Make sure to run the SQL query in Supabase dashboard first!');
      return;
    }

    console.log('✅ User found in database:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Name: ${user.name}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Created: ${user.created_at}`);

    // Test password verification
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (passwordMatch) {
      console.log('\n✅ Password verification: PASSED');
      console.log('🎉 Login credentials are working correctly!');
      console.log('\n🚀 You can now sign in at: http://localhost:3000/auth/signin');
      console.log('📧 Email: phill.mcgurk@gmail.com');
      console.log('🔑 Password: Sanctuary2025!');
    } else {
      console.log('\n❌ Password verification: FAILED');
      console.log('🔧 There may be an issue with the password hash.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLogin();