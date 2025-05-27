// pages/api/admin/ads/analytics.js
import { Advertisement } from '../../../../models/Advertisement';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';
import { Admin } from '../../../../models/Admin';

// Helper function to set CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
      const { adId, dateRange = 30, type } = req.query;

      if (type === 'campaign-stats') {
        // Get overall campaign statistics
        const stats = await Advertisement.getCampaignStats();
        
        return res.status(200).json({ 
          success: true, 
          data: stats 
        });
      }

      if (adId) {
        // Get analytics for specific ad
        const analytics = await Advertisement.getAdAnalytics(
          adId, 
          parseInt(dateRange)
        );
        
        if (!analytics) {
          return res.status(404).json({ error: 'Analytics not found' });
        }

        return res.status(200).json({ 
          success: true, 
          data: analytics 
        });
      }

      // Get analytics for all ads (summary)
      const { page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const { ads } = await Advertisement.getAllAds(parseInt(limit), skip);
      
      const analyticsData = await Promise.all(
        ads.map(async (ad) => {
          const analytics = await Advertisement.getAdAnalytics(
            ad._id.toString(), 
            parseInt(dateRange)
          );
          
          return {
            id: ad._id.toString(),
            title: ad.title,
            status: ad.status,
            active: ad.active,
            type: ad.type,
            campaignName: ad.campaignName,
            createdAt: ad.createdAt,
            totalImpressions: ad.impressions || 0,
            totalClicks: ad.clicks || 0,
            ctr: analytics?.ctr || 0,
            priority: ad.priority
          };
        })
      );

      return res.status(200).json({ 
        success: true, 
        data: analyticsData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit)
        }
      });
    }

    if (req.method === 'POST') {
      // Bulk operations or cleanup
      const { action } = req.body;

      if (action === 'cleanup-expired') {
        const cleanedUp = await Advertisement.cleanupExpiredAds();
        
        return res.status(200).json({ 
          success: true, 
          message: `${cleanedUp} expired ads cleaned up`,
          count: cleanedUp
        });
      }

      if (action === 'toggle-status') {
        const { adId, active } = req.body;
        
        if (!adId || active === undefined) {
          return res.status(400).json({ 
            error: 'adId and active status are required' 
          });
        }

        const success = await Advertisement.toggleAdStatus(adId, active);
        
        if (!success) {
          return res.status(404).json({ error: 'Advertisement not found' });
        }

        return res.status(200).json({ 
          success: true, 
          message: `Advertisement ${active ? 'activated' : 'deactivated'} successfully` 
        });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}