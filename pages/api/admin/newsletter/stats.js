//pages/api/admin/newsletter/stats.js


import { Newsletter } from '../../../../models/HomepageSettings';
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

    const stats = await Newsletter.getSubscriberStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error('Newsletter stats error:', error);
    res.status(500).json({ error: 'Failed to fetch newsletter statistics' });
  }
}