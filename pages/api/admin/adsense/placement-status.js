// pages/api/admin/adsense/placement-status.js

import { AdSense } from '../../../../models/AdSense';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';
import { Admin } from '../../../../models/Admin';

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
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

    const { placementKey, status } = req.body;

    if (!placementKey || !status) {
      return res.status(400).json({ error: 'Placement key and status are required' });
    }

    if (!['draft', 'published', 'unpublished'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedSettings = await AdSense.updatePlacementStatus(placementKey, status, admin.email);
    res.status(200).json({ 
      success: true, 
      data: updatedSettings,
      message: `Placement ${placementKey} status updated to ${status}` 
    });

  } catch (error) {
    console.error('Placement status update error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}