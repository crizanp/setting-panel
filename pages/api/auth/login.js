// pages/api/auth/login.js - Enhanced with Environment Variable Fallback
import { Admin } from '../../../models/Admin';
import { generateToken } from '../../../lib/auth';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // First, try to authenticate against database
    let admin = null;
    let isValidCredentials = false;

    try {
      // Check database first
      console.log('Checking database for admin:', email);
      const isValid = await Admin.verifyPassword(email, password);
      console.log('Database password verification result:', isValid);
      
      if (isValid) {
        admin = await Admin.findByEmail(email);
        if (admin) {
          console.log('Admin found in database:', admin.email);
          isValidCredentials = true;
        }
      }
    } catch (dbError) {
      console.log('Database authentication failed, checking environment variables:', dbError.message);
    }

    // If database auth fails, check environment variables
    if (!isValidCredentials) {
      console.log('Checking environment variables for admin credentials');
      
      const envAdminEmail = process.env.ADMIN_EMAIL;
      const envAdminPassword = process.env.ADMIN_PASSWORD;
      const envAdminName = process.env.ADMIN_NAME || 'Environment Admin';

      if (envAdminEmail && envAdminPassword) {
        console.log('Environment admin credentials found');
        console.log('Comparing emails:', { provided: email, env: envAdminEmail });
        
        // Check if email matches environment admin email
        if (email.toLowerCase() === envAdminEmail.toLowerCase()) {
          console.log('Email matches environment admin');
          
          // Check password - support both plain text and hashed passwords in env
          let passwordMatch = false;
          
          // If the env password starts with $2a, $2b, or $2y, it's likely a bcrypt hash
          if (envAdminPassword.startsWith('$2a') || envAdminPassword.startsWith('$2b') || envAdminPassword.startsWith('$2y')) {
            console.log('Environment password appears to be hashed, comparing with bcrypt');
            passwordMatch = await bcrypt.compare(password, envAdminPassword);
          } else {
            console.log('Environment password appears to be plain text, comparing directly');
            passwordMatch = (password === envAdminPassword);
          }
          
          console.log('Environment password verification result:', passwordMatch);
          
          if (passwordMatch) {
            console.log('Environment admin authentication successful');
            isValidCredentials = true;
            
            // Create a virtual admin object for environment admin
            admin = {
              _id: 'env_admin',
              email: envAdminEmail.toLowerCase(),
              name: envAdminName,
              source: 'environment'
            };
          }
        }
      } else {
        console.log('Environment admin credentials not configured');
      }
    }

    // If neither database nor environment auth succeeded
    if (!isValidCredentials || !admin) {
      console.log('Authentication failed for email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('Authentication successful for:', admin.email, '(source:', admin.source || 'database', ')');

    // Generate token with appropriate payload
    const tokenPayload = {
      id: admin._id,
      adminId: admin._id,
      email: admin.email,
      name: admin.name,
      source: admin.source || 'database'
    };

    const token = generateToken(tokenPayload);
    console.log('Token generated successfully');

    const response = {
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name || admin.email,
        source: admin.source || 'database'
      }
    };

    console.log('Sending successful response');
    res.status(200).json(response);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
}