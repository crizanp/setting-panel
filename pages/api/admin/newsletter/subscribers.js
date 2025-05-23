//pages/api/admin/newsletter/subscribe.js


import { Newsletter } from '../../../../models/HomepageSettings';
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
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      
      const result = await Newsletter.getSubscribers(page, limit);
      res.status(200).json({ success: true, ...result });
    }
    
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Newsletter subscribers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}