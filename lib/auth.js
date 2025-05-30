// lib/auth.js - Enhanced requireAuth middleware
import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin';

export function generateToken(payload) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  console.log('Generating token for payload:', payload);
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  console.log('Token generated successfully, length:', token.length);
  return token;
}

export function verifyToken(token) {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not found in environment variables');
      return null;
    }

    if (!token) {
      console.log('No token provided to verifyToken');
      return null;
    }

    console.log('Verifying token...');
    
    // Validate JWT format (should have 3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format - should have 3 parts, got:', parts.length);
      return null;
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verification successful:', decoded);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

export function getTokenFromRequest(req) {
  console.log('--- TOKEN EXTRACTION DEBUG ---');
  
  const authHeader = req.headers.authorization;
  console.log('Authorization header:', authHeader);
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    console.log('Extracted token length:', token.length);
    return token;
  }
  
  // Fallback to cookies
  const cookieToken = req.cookies?.token;
  if (cookieToken) {
    console.log('Using cookie token, length:', cookieToken.length);
    return cookieToken;
  }
  
  console.log('No token found in headers or cookies');
  return null;
}

// Enhanced requireAuth middleware with environment admin support
export function requireAuth(handler) {
  return async (req, res) => {
    try {
      console.log('=== REQUIRE AUTH MIDDLEWARE ===');
      
      // Extract token from request
      const token = getTokenFromRequest(req);
      
      if (!token) {
        console.log('No token found, denying access');
        return res.status(401).json({
          message: 'Access denied. No token provided.',
          code: 'NO_TOKEN'
        });
      }

      // Verify token
      const decoded = verifyToken(token);
      
      if (!decoded) {
        console.log('Token verification failed, denying access');
        return res.status(401).json({
          message: 'Access denied. Invalid token.',
          code: 'INVALID_TOKEN'
        });
      }

      // Validate token payload
      if (!decoded.email) {
        console.log('Token missing email, denying access');
        return res.status(401).json({
          message: 'Access denied. Invalid token payload.',
          code: 'INVALID_PAYLOAD'
        });
      }

      let adminInfo = null;

      // Check if this is an environment admin
      if (decoded.source === 'environment' || decoded.id === 'env_admin') {
        console.log('Processing environment admin authentication');
        
        const envAdminEmail = process.env.ADMIN_EMAIL;
        const envAdminName = process.env.ADMIN_NAME || 'Environment Admin';

        if (envAdminEmail && decoded.email.toLowerCase() === envAdminEmail.toLowerCase()) {
          adminInfo = {
            id: 'env_admin',
            email: envAdminEmail.toLowerCase(),
            name: envAdminName,
            source: 'environment'
          };
          console.log('Environment admin authenticated:', adminInfo.email);
        } else {
          console.log('Environment admin token invalid or env vars missing');
          return res.status(401).json({
            message: 'Access denied. Environment admin credentials invalid.',
            code: 'INVALID_ENV_ADMIN'
          });
        }
      } else {
        // Regular database admin - verify admin exists and is active
        console.log('Processing database admin authentication');
        
        try {
          const admin = await Admin.findByEmail(decoded.email);
          
          if (!admin) {
            console.log('Database admin not found:', decoded.email);
            return res.status(401).json({
              message: 'Access denied. Admin not found.',
              code: 'ADMIN_NOT_FOUND'
            });
          }

          // Check if admin is active (if you have status field)
          if (admin.status && admin.status !== 'active') {
            console.log('Admin account is not active:', decoded.email);
            return res.status(401).json({
              message: 'Access denied. Account is not active.',
              code: 'ACCOUNT_INACTIVE'
            });
          }

          adminInfo = {
            id: admin._id,
            email: admin.email,
            name: admin.name || null,
            source: 'database'
          };
          console.log('Database admin authenticated:', adminInfo.email);
        } catch (dbError) {
          console.error('Database error during admin verification:', dbError);
          return res.status(500).json({
            message: 'Server error during authentication',
            code: 'DB_ERROR'
          });
        }
      }

      if (!adminInfo) {
        console.log('Failed to load admin info');
        return res.status(401).json({
          message: 'Access denied. Unable to verify admin.',
          code: 'ADMIN_VERIFICATION_FAILED'
        });
      }

      // Add admin info to request object
      req.admin = adminInfo;

      console.log('Authentication successful for:', adminInfo.email, '(source:', adminInfo.source, ')');
      console.log('=== END REQUIRE AUTH MIDDLEWARE ===');

      // Call the actual handler
      return handler(req, res);

    } catch (error) {
      console.error('requireAuth middleware error:', error);
      return res.status(500).json({
        message: 'Server error during authentication',
        code: 'AUTH_ERROR'
      });
    }
  };
}

// Helper function to get current admin from request
export function getCurrentAdmin(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  
  const decoded = verifyToken(token);
  return decoded ? {
    id: decoded.id,
    email: decoded.email,
    name: decoded.name || null,
    source: decoded.source || 'database'
  } : null;
}