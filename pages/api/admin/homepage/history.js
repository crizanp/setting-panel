//pages/api/admin/homepage/history.js


import { HomepageSettings } from '../../../../models/HomepageSettings';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';
import { Admin } from '../../../../models/Admin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = getTokenFromRequest(req);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await Admin.findByEmail(decoded.email);
    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    const history = await HomepageSettings.getSettingsHistory();
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error('Settings history error:', error);
    res.status(500).json({ error: 'Failed to fetch settings history' });
  }
}
