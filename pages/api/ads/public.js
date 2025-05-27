// pages/api/ads/public.js
import { Advertisement } from '../../../models/Advertisement';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get active advertisements for public display
      const ads = await Advertisement.getActiveAds();
      
      // Transform ads for public consumption (remove sensitive data)
      const publicAds = ads.map(ad => ({
        id: ad._id.toString(),
        title: ad.title,
        description: ad.description,
        type: ad.type,
        src: ad.src,
        thumbnailSrc: ad.thumbnailSrc,
        learnMoreLink: ad.learnMoreLink,
        buttonText: ad.buttonText,
        displayDuration: ad.displayDuration,
        skipDelay: ad.skipDelay,
        priority: ad.priority
      }));

      // Set cache headers for better performance
      res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      
      return res.status(200).json({ 
        success: true, 
        data: publicAds,
        count: publicAds.length 
      });
    }

    if (req.method === 'POST') {
      // Handle analytics tracking
      const { action, adId, metadata } = req.body;
      
      if (!action || !adId) {
        return res.status(400).json({ error: 'Action and adId are required' });
      }

      // Record the analytics event
      switch (action) {
        case 'impression':
          await Advertisement.recordImpression(adId);
          break;
        case 'click':
          await Advertisement.recordClick(adId);
          break;
        case 'skip':
        case 'complete':
          await Advertisement.recordAnalytics(adId, action, metadata);
          break;
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }

      return res.status(200).json({ success: true, message: 'Event recorded' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Public ads API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}