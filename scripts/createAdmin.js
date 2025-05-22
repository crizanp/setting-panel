// scripts/createAdmin.js
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createAdmin() {
  try {
    console.log('🚀 Admin User Creation Script');
    console.log('==============================');

    const email = await askQuestion('Enter admin email (default: admin@example.com): ') || 'admin@example.com';
    const name = await askQuestion('Enter admin name (default: Admin User): ') || 'Admin User';
    const password = await askQuestion('Enter admin password (default: admin123): ') || 'admin123';

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();

    // Check if admin already exists
    const existingAdmin = await db.collection('admins').findOne({ email });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user with this email already exists');
      rl.close();
      await client.close();
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const result = await db.collection('admins').insertOne({
      email,
      password: hashedPassword,
      name,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('================================');
    console.log('📧 Email:', email);
    console.log('👤 Name:', name);
    console.log('🔑 Password:', password);
    console.log('🆔 Admin ID:', result.insertedId);
    console.log('\n🌐 You can now login at: http://localhost:3000/admin/login');
    
    rl.close();
    await client.close();
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    rl.close();
    process.exit(1);
  }
}

createAdmin();