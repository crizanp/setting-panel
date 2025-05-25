import { Newsletter } from '../../../models/HomepageSettings';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await Newsletter.unsubscribe(email.toLowerCase().trim());
    
    res.status(200).json({ 
      success: true, 
      message: 'Successfully unsubscribed from newsletter'
    });
  } catch (error) {
    console.error('Newsletter unsubscription error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe from newsletter' });
  }
}