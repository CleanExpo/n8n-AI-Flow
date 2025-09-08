const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'Sanctuary2025!';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('Password:', password);
  console.log('Hash:', hash);
  
  // Test the hash
  const isValid = await bcrypt.compare(password, hash);
  console.log('Hash validation:', isValid ? '✓ Valid' : '✗ Invalid');
  
  return hash;
}

hashPassword().catch(console.error);