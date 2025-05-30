// pages/api/admin/create.js - CREATE ADMIN ENDPOINT
import { Admin } from '../../../models/Admin';
import { requireAuth } from '../../../lib/auth';

async function createAdminHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password, name } = req.body;

    console.log('Admin creation attempt by:', req.admin.email);
    console.log('Creating admin for email:', email);

    // Validation
    if (!email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        message: 'Email and password are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({ 
        message: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Password strength validation
    if (password.length < 8) {
      console.log('Password too short');
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findByEmail(email);
    if (existingAdmin) {
      console.log('Admin already exists with email:', email);
      return res.status(409).json({ 
        message: 'Admin with this email already exists',
        code: 'ADMIN_EXISTS'
      });
    }

    // Create new admin
    const adminData = {
      email: email.toLowerCase().trim(),
      password,
      name: name?.trim() || null,
      createdBy: req.admin.email,
      status: 'active'
    };

    console.log('Creating admin with data:', { 
      email: adminData.email, 
      name: adminData.name,
      createdBy: adminData.createdBy
    });

    const result = await Admin.create(adminData);

    if (result.acknowledged) {
      console.log('Admin created successfully:', result.insertedId);
      
      // Return success response (don't include password)
      res.status(201).json({
        message: 'Admin created successfully',
        admin: {
          id: result.insertedId,
          email: adminData.email,
          name: adminData.name,
          createdBy: adminData.createdBy,
          status: adminData.status,
          createdAt: adminData.createdAt
        }
      });
    } else {
      console.error('Failed to create admin:', result);
      res.status(500).json({ 
        message: 'Failed to create admin',
        code: 'CREATE_FAILED'
      });
    }

  } catch (error) {
    console.error('Create admin error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(409).json({ 
        message: 'Admin with this email already exists',
        code: 'ADMIN_EXISTS'
      });
    }

    res.status(500).json({ 
      message: 'Server error during admin creation',
      code: 'SERVER_ERROR'
    });
  }
}

// Protect this endpoint with authentication
export default requireAuth(createAdminHandler);