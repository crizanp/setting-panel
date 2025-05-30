// pages/api/admin/profile.js - Enhanced with Environment Variable Support
import { Admin } from '../../../models/Admin';
import { getTokenFromRequest, verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = getTokenFromRequest(req);
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('Invalid token');
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.log('Token decoded successfully for:', decoded.email);
    console.log('Admin source:', decoded.source || 'database');

    let admin = null;

    // Check if this is an environment admin
    if (decoded.source === 'environment' || decoded.id === 'env_admin') {
      console.log('Processing environment admin profile request');
      
      const envAdminEmail = process.env.ADMIN_EMAIL;
      const envAdminName = process.env.ADMIN_NAME || 'Environment Admin';

      if (envAdminEmail && decoded.email.toLowerCase() === envAdminEmail.toLowerCase()) {
        admin = {
          _id: 'env_admin',
          email: envAdminEmail.toLowerCase(),
          name: envAdminName,
          createdAt: new Date('2024-01-01'), // Default date for env admin
          source: 'environment'
        };
        console.log('Environment admin profile loaded');
      } else {
        console.log('Environment admin credentials mismatch or missing');
        return res.status(401).json({ message: 'Invalid environment admin token' });
      }
    } else {
      // Regular database admin
      console.log('Processing database admin profile request');
      try {
        admin = await Admin.findByEmail(decoded.email);
        if (!admin) {
          console.log('Database admin not found for email:', decoded.email);
          return res.status(404).json({ message: 'Admin not found' });
        }
        admin.source = 'database';
        console.log('Database admin profile loaded');
      } catch (dbError) {
        console.error('Database error while fetching admin:', dbError);
        return res.status(500).json({ message: 'Database error' });
      }
    }

    if (!admin) {
      console.log('No admin profile could be loaded');
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    const profileResponse = {
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        createdAt: admin.createdAt,
        source: admin.source
      }
    };

    console.log('Sending profile response for:', admin.email);
    res.status(200).json(profileResponse);

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}