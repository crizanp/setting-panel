// lib/auth.js - FIXED VERSION

import jwt from 'jsonwebtoken';

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
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 50) + '...');
    
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
    console.error('Error type:', error.name);
    
    if (error.name === 'TokenExpiredError') {
      console.log('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      console.log('Invalid token format or signature');
    }
    
    return null;
  }
}

// FIXED: Better token extraction with more debugging
export function getTokenFromRequest(req) {
  console.log('--- TOKEN EXTRACTION DEBUG ---');
  console.log('All headers:', req.headers);
  
  const authHeader = req.headers.authorization;
  console.log('Authorization header:', authHeader);
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    console.log('Extracted token length:', token.length);
    console.log('Extracted token preview:', token.substring(0, 50) + '...');
    return token;
  }
  
  // Fallback to cookies
  const cookieToken = req.cookies?.token;
  console.log('Cookie token:', cookieToken);
  
  if (cookieToken) {
    console.log('Using cookie token, length:', cookieToken.length);
    return cookieToken;
  }
  
  console.log('No token found in headers or cookies');
  return null;
}

// DEBUGGING FUNCTION - Add this temporarily to check what's being sent
export function debugRequest(req) {
  console.log('=== REQUEST DEBUG ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Cookies:', req.cookies);
  
  // Check if authorization header exists and format
  const auth = req.headers.authorization;
  if (auth) {
    console.log('Auth header found:', auth);
    console.log('Starts with Bearer:', auth.startsWith('Bearer '));
    if (auth.startsWith('Bearer ')) {
      const token = auth.substring(7);
      console.log('Token after Bearer removal:', token);
      console.log('Token length after removal:', token.length);
    }
  } else {
    console.log('No authorization header found');
  }
  console.log('==================');
}