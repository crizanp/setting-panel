require('dotenv').config({ path: '.env.local' });
const { Admin } = require('../models/Admin');

async function testLogin() {
  try {
    console.log('Testing login functionality...');
    
    const admin = await Admin.findByEmail('admin@foxbeep.com');
    console.log('Admin found:', !!admin);
    
    if (admin) {
      const isValid = await Admin.verifyPassword('admin@foxbeep.com', 'foxbeep123');
      console.log('Password valid:', isValid);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
  process.exit(0);
}

testLogin();