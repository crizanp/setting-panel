import { Newsletter } from '../../../models/HomepageSettings';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const subscriber = await Newsletter.subscribe(email.toLowerCase().trim(), name?.trim());
    
    res.status(201).json({ 
      success: true, 
      message: 'Successfully subscribed to newsletter',
      data: { email: subscriber.email, name: subscriber.name }
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    
    if (error.message === 'Email already subscribed') {
      return res.status(409).json({ error: 'Email already subscribed' });
    }
    
    res.status(500).json({ error: 'Failed to subscribe to newsletter' });
  }
}
