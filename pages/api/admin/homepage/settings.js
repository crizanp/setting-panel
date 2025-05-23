//pages/api/admin/homepage/settings.js


import { HomepageSettings } from '../../../../models/HomepageSettings';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';
import { Admin } from '../../../../models/Admin';

export default async function handler(req, res) {
  try {
    // Verify admin authentication
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
      const settings = await HomepageSettings.getSettings();
      res.status(200).json({ success: true, data: settings });
    }
    
    else if (req.method === 'PUT') {
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

      const settingsData = {
        hero: {
          title: hero.title.trim(),
          description: hero.description.trim(),
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

      const updatedSettings = await HomepageSettings.updateSettings(settingsData, admin.email);
      res.status(200).json({ success: true, data: updatedSettings });
    }
    
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin homepage settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}