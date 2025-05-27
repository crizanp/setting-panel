// pages/api/admin/ads/index.js
import { Advertisement } from '../../../../models/Advertisement';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';
import { Admin } from '../../../../models/Admin';
import { deleteFromCloudinary } from '../../../../lib/imageUpload';

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
    // Verify admin authentication for all requests
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
      // Get all advertisements with filters
      const { 
        page = 1, 
        limit = 20, 
        status, 
        active, 
        type,
        campaignName 
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const filters = {};

      // Apply filters
      if (status) filters.status = status;
      if (active !== undefined) filters.active = active === 'true';
      if (type) filters.type = type;
      if (campaignName) filters.campaignName = new RegExp(campaignName, 'i');

      const result = await Advertisement.getAllAds(
        parseInt(limit), 
        skip, 
        filters
      );

      return res.status(200).json({ 
        success: true, 
        data: result.ads,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit))
        }
      });
    }

    if (req.method === 'POST') {
      // Create new advertisement
      const adData = req.body;

      // Validate required fields
      if (!adData.title || !adData.src) {
        return res.status(400).json({ 
          error: 'Title and media source are required' 
        });
      }

      const newAd = await Advertisement.createAd(adData, admin.email);
      
      return res.status(201).json({ 
        success: true, 
        data: newAd,
        message: 'Advertisement created successfully'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin ads API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}