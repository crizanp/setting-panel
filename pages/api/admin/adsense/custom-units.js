// pages/api/admin/adsense/custom-units.js

import { AdSense } from '../../../../models/AdSense';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';
import { Admin } from '../../../../models/Admin';

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    if (req.method === 'GET') {
      const settings = await AdSense.getSettings();
      return res.status(200).json({ 
        success: true, 
        data: settings.customAdUnits || [] 
      });
    }

    else if (req.method === 'POST') {
      const { name, adSlot, adFormat, placement, enabled } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ error: 'Ad unit name is required' });
      }

      const unitData = {
        name: name.trim(),
        adSlot: adSlot?.trim() || "",
        adFormat: adFormat || "auto",
        placement: placement?.trim() || "",
        enabled: Boolean(enabled)
      };

      const result = await AdSense.addCustomAdUnit(unitData, admin.email);
      res.status(201).json({ 
        success: true, 
        data: result.newUnit,
        message: 'Custom ad unit created successfully' 
      });
    }

    else if (req.method === 'PUT') {
      const { unitId, status } = req.body;

      if (!unitId || !status) {
        return res.status(400).json({ error: 'Unit ID and status are required' });
      }

      if (!['draft', 'published', 'unpublished'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const updatedSettings = await AdSense.updateCustomAdUnitStatus(unitId, status, admin.email);
      res.status(200).json({ 
        success: true, 
        data: updatedSettings,
        message: `Custom ad unit status updated to ${status}` 
      });
    }

    else if (req.method === 'DELETE') {
      const { unitId } = req.body;

      if (!unitId) {
        return res.status(400).json({ error: 'Unit ID is required' });
      }

      const updatedSettings = await AdSense.removeCustomAdUnit(unitId, admin.email);
      res.status(200).json({ 
        success: true, 
        data: updatedSettings,
        message: 'Custom ad unit removed successfully' 
      });
    }

    else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Custom ad units error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}