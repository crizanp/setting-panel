import { AdSense } from '../../../models/AdSense';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const settings = await AdSense.getPublicSettings();
    
    // Set cache headers for better performance
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching AdSense settings:', error);
    res.status(500).json({ error: 'Failed to fetch AdSense settings' });
  }
}
