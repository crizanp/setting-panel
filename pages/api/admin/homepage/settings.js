// SOLUTION 1: Add CORS headers to your API route
// Update your pages/api/admin/homepage/settings.js

import { HomepageSettings } from '../../../../models/HomepageSettings';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';
import { Admin } from '../../../../models/Admin';
import { deleteFromCloudinary } from '../../../../lib/imageUpload';

// Helper function to set CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Or specify 'http://localhost:3001'
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
    // For GET requests, make it public (no authentication required)
    if (req.method === 'GET') {
      const settings = await HomepageSettings.getSettings();
      
      // Set cache headers for better performance
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      
      return res.status(200).json({ success: true, data: settings });
    }

    // For all other methods (PUT, DELETE), require authentication
    const token = getTokenFromRequest(req);
    const decoded = verifyToken(token);
        
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await Admin.findByEmail(decoded.email);
    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' });
    }
        
    if (req.method === 'PUT') {
      const { hero, about, newsletter } = req.body;

      // Validation
      if (!hero || !hero.title || !hero.description) {
        return res.status(400).json({ error: 'Hero title and description are required' });
      }

      if (!about || !about.title || !about.description) {
        return res.status(400).json({ error: 'About title and description are required' });
      }

      if (!Array.isArray(hero.features)) {
        return res.status(400).json({ error: 'Hero features must be an array' });
      }

      // Get current settings to handle image cleanup if needed
      const currentSettings = await HomepageSettings.getSettings();

      const settingsData = {
        hero: {
          title: hero.title.trim(),
          description: hero.description.trim(),
          image: hero.image || null,
          imageAlt: hero.imageAlt?.trim() || 'Hero image',
          imagePublicId: hero.imagePublicId || null,
          features: hero.features.filter(f => f && f.trim()).map(f => f.trim())
        },
        about: {
          title: about.title.trim(),
          description: about.description.trim()
        },
        newsletter: {
          enabled: newsletter?.enabled !== false,
          title: newsletter?.title?.trim() || "Stay Updated",
          description: newsletter?.description?.trim() || "Subscribe to our newsletter for updates"
        }
      };

      // If image was changed and old image exists, delete the old one
      if (currentSettings.hero?.imagePublicId && 
          currentSettings.hero.imagePublicId !== settingsData.hero.imagePublicId &&
          settingsData.hero.imagePublicId) {
        try {
          await deleteFromCloudinary(currentSettings.hero.imagePublicId);
        } catch (error) {
          console.warn('Failed to delete old image:', error);
        }
      }

      const updatedSettings = await HomepageSettings.updateSettings(settingsData, admin.email);
      res.status(200).json({ success: true, data: updatedSettings });
    }
        
    else if (req.method === 'DELETE') {
      const { imagePublicId } = req.body;
            
      if (!imagePublicId) {
        return res.status(400).json({ error: 'Image public ID is required' });
      }

      try {
        await deleteFromCloudinary(imagePublicId);
        res.status(200).json({ success: true, message: 'Image deleted successfully' });
      } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Failed to delete image' });
      }
    }
        
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin homepage settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
