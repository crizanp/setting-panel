// pages/api/admin/adsense/settings.js

import { AdSense } from '../../../../models/AdSense';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';
import { Admin } from '../../../../models/Admin';

// Helper function to set CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export default async function handler(req, res) {
  // Set CORS headers for all requests
  setCorsHeaders(res);

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // All methods require authentication
    const token = getTokenFromRequest(req);
    const decoded = verifyToken(token);
        
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await Admin.findByEmail(decoded.email);
    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    if (req.method === 'GET') {
      const settings = await AdSense.getSettings();
      return res.status(200).json({ success: true, data: settings });
    }
        
    else if (req.method === 'PUT') {
      const {
        publisherId,
        adClientId,
        globalSettings,
        adPlacements,
        customAdUnits,
        performance
      } = req.body;

      // Basic validation
      if (globalSettings?.enabled && !publisherId?.trim()) {
        return res.status(400).json({ error: 'Publisher ID is required when AdSense is enabled' });
      }

      const settingsData = {
        publisherId: publisherId?.trim() || "",
        adClientId: adClientId?.trim() || "",
        globalSettings: globalSettings || {},
        adPlacements: adPlacements || {},
        customAdUnits: customAdUnits || [],
        performance: performance || {}
      };

      const updatedSettings = await AdSense.updateSettings(settingsData, admin.email);
      res.status(200).json({ success: true, data: updatedSettings });
    }
        
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('AdSense settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
