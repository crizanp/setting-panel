import { HomepageSettings } from '../../../models/HomepageSettings';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const settings = await HomepageSettings.getSettings();
    
    // Return only public data (exclude internal fields)
    const publicSettings = {
      hero: settings.hero,
      about: settings.about,
      newsletter: settings.newsletter
    };

    res.status(200).json({ success: true, data: publicSettings });
  } catch (error) {
    console.error('Error fetching homepage settings:', error);
    res.status(500).json({ error: 'Failed to fetch homepage settings' });
  }
}