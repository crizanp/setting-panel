import { ConverterSettings } from '../../../models/ConverterSettings';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { converterId } = req.query;

  try {
    const settings = await ConverterSettings.getConverterSettings(converterId);
    
    // Return only public data
    const publicSettings = {
      hero: settings.hero,
      ways: settings.ways,
      features: settings.features
    };
    
    res.status(200).json({ success: true, data: publicSettings });
  } catch (error) {
    console.error('Error fetching converter settings:', error);
    
    if (error.message === 'Invalid converter type') {
      return res.status(400).json({ error: 'Invalid converter type' });
    }
    
    res.status(500).json({ error: 'Failed to fetch converter settings' });
  }
}

// =================================================================
// File 3: pages/api/admin/converter/index.js (Get all converter settings)
import { ConverterSettings } from '../../../../models/ConverterSettings';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';
import { Admin } from '../../../../models/Admin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    const allSettings = await ConverterSettings.getAllConverterSettings();
    
    // Return only public data for each converter
    const publicSettings = {};
    Object.keys(allSettings).forEach(converterId => {
      if (allSettings[converterId]) {
        publicSettings[converterId] = {
          hero: allSettings[converterId].hero,
          ways: allSettings[converterId].ways,
          features: allSettings[converterId].features
        };
      }
    });
    
    res.status(200).json({ success: true, data: publicSettings });
  } catch (error) {
    console.error('Error fetching all converter settings:', error);
    res.status(500).json({ error: 'Failed to fetch converter settings' });
  }
}