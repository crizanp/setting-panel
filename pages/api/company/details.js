// pages/api/company/details.js

import { CompanyDetails } from '../../../models/CompanyDetails';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const details = await CompanyDetails.getDetails();
   
    // Return only public data (exclude internal fields)
    const publicDetails = {
      companyName: details.companyName,
      logo: details.logo,
      favicon: details.favicon,
      socialLinks: details.socialLinks
    };

    // Set cache headers for better performance
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    res.status(200).json({ success: true, data: publicDetails });
  } catch (error) {
    console.error('Error fetching company details:', error);
    res.status(500).json({ error: 'Failed to fetch company details' });
  }
}