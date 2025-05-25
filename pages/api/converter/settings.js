// pages/api/converter/settings.js
import { ConverterSettings } from '../../../models/ConverterSettings';
import { verifyToken, getTokenFromRequest } from '../../../lib/auth';
import { Admin } from '../../../models/Admin';

// CORS helper function
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // or specify specific origins like 'https://yourdomain.com'
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
}

export default async function handler(req, res) {
  // Set CORS headers for all requests
  setCorsHeaders(res);

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { converterId, action, imagePublicId } = req.method === 'GET' ? req.query : req.body;

  try {
    // Handle public GET requests (no auth required)
    if (req.method === 'GET') {
      // Get all converter settings
      if (!converterId) {
        const allSettings = await ConverterSettings.getAllConverterSettings();
        const publicSettings = {};
        
        Object.keys(allSettings).forEach(id => {
          if (allSettings[id]) {
            publicSettings[id] = {
              hero: allSettings[id].hero,
              ways: allSettings[id].ways,
              features: allSettings[id].features
            };
          }
        });
        
        return res.status(200).json({ success: true, data: publicSettings });
      }
      
      // Get specific converter settings
      const settings = await ConverterSettings.getConverterSettings(converterId);
      const publicSettings = {
        hero: settings.hero,
        ways: settings.ways,
        features: settings.features
      };
      
      return res.status(200).json({ success: true, data: publicSettings });
    }

    // Admin authentication required for POST/PUT/DELETE
    const token = getTokenFromRequest(req);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const admin = await Admin.findByEmail(decoded.email);
    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    // Handle different admin operations
    switch (req.method) {
      case 'POST':
        // Create/Update converter settings
        if (!converterId) {
          return res.status(400).json({ error: 'Converter ID required' });
        }
        
        const updatedSettings = await ConverterSettings.updateConverterSettings(
          converterId,
          req.body,
          decoded.email
        );
        
        return res.status(200).json({
          success: true,
          data: {
            hero: updatedSettings.hero,
            ways: updatedSettings.ways,
            features: updatedSettings.features
          }
        });

      case 'DELETE':
        // Delete converter image
        if (!converterId || !imagePublicId) {
          return res.status(400).json({ error: 'Converter ID and image public ID required' });
        }
        
        // Delete from Cloudinary
        const cloudinary = require('cloudinary').v2;
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        
        try {
          await cloudinary.uploader.destroy(imagePublicId);
        } catch (cloudinaryError) {
          console.error('Cloudinary deletion error:', cloudinaryError);
          // Continue even if Cloudinary deletion fails
        }
        
        // Update database settings
        const newSettings = await ConverterSettings.deleteConverterImage(converterId, imagePublicId);
        
        return res.status(200).json({
          success: true,
          data: {
            hero: newSettings.hero,
            ways: newSettings.ways,
            features: newSettings.features
          }
        });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Converter settings API error:', error);
    
    if (error.message === 'Invalid converter type') {
      return res.status(400).json({ error: 'Invalid converter type' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}