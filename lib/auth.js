//lib/auth.js

import jwt from 'jsonwebtoken';

export function generateToken(payload) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  console.log('Generating token for payload:', payload);
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  console.log('Token generated successfully');
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

export function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return req.cookies.token;
}