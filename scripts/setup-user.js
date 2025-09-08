const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupUser() {
  console.log('🚀 Setting up user in Supabase...\n');

  try {
    // First, let's check what tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (!tablesError) {
      console.log('📋 Available tables:', tables.map(t => t.table_name));
    }

    // Since direct table creation via RPC might not work, let's try a simpler approach
    // Let's check if we can insert directly (this will fail but give us better error info)
    console.log('🔍 Checking if users table exists...');

    // Hash the password
    const password = 'Sanctuary2025!';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('Password hashed successfully');

    // Insert or update the user
    const { data, error } = await supabase
      .from('users')
      .upsert({
        email: 'phill.mcgurk@gmail.com',
        name: 'Phill McGurk',
        password_hash: hashedPassword,
        role: 'admin'
      }, {
        onConflict: 'email'
      })
      .select();

    if (error) {
      console.error('❌ Error creating user:', error);
      return;
    }

    console.log('✅ User created/updated successfully:', data);

    // Test the user can be retrieved
    const { data: testUser, error: testError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', 'phill.mcgurk@gmail.com')
      .single();

    if (testError) {
      console.error('❌ Error retrieving user:', testError);
      return;
    }

    console.log('✅ User verification successful:', testUser);

    // Test password comparison
    const passwordMatch = await bcrypt.compare(password, data[0].password_hash);
    console.log('✅ Password verification:', passwordMatch ? 'PASSED' : 'FAILED');

    console.log('\n🎉 Setup complete! You can now sign in with:');
    console.log('📧 Email: phill.mcgurk@gmail.com');
    console.log('🔑 Password: Sanctuary2025!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupUser();