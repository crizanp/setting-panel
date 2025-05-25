// pages/api/admin/company/details.js

import { CompanyDetails } from '../../../../models/CompanyDetails';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';
import { Admin } from '../../../../models/Admin';
import { deleteFromCloudinary } from '../../../../lib/imageUpload';

// Helper function to set CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
    // For GET requests, make it public (no authentication required)
    if (req.method === 'GET') {
      const details = await CompanyDetails.getDetails();
      
      // Set cache headers for better performance
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      
      return res.status(200).json({ success: true, data: details });
    }

    // For all other methods (PUT, DELETE), require authentication
    const token = getTokenFromRequest(req);
    const decoded = verifyToken(token);
        
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await Admin.findByEmail(decoded.email);
    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' });
    }
        
    if (req.method === 'PUT') {
      const { 
        companyName, 
        logo, 
        logoPublicId, 
        blackLogo,
        blackLogoPublicId,
        favicon, 
        faviconPublicId, 
        socialLinks 
      } = req.body;

      // Basic validation
      if (!companyName || !companyName.trim()) {
        return res.status(400).json({ error: 'Company name is required' });
      }

      // Get current details to handle image cleanup if needed
      const currentDetails = await CompanyDetails.getDetails();

      const detailsData = {
        companyName: companyName.trim(),
        logo: logo || null,
        logoPublicId: logoPublicId || null,
        blackLogo: blackLogo || null,
        blackLogoPublicId: blackLogoPublicId || null,
        favicon: favicon || null,
        faviconPublicId: faviconPublicId || null,
        socialLinks: {
          facebook: socialLinks?.facebook?.trim() || "",
          instagram: socialLinks?.instagram?.trim() || "",
          twitter: socialLinks?.twitter?.trim() || "",
          linkedin: socialLinks?.linkedin?.trim() || ""
        }
      };

      // Clean up old images if they were changed
      const imagesToCleanup = [
        { 
          current: currentDetails.logoPublicId, 
          new: detailsData.logoPublicId, 
          type: 'logo' 
        },
        { 
          current: currentDetails.blackLogoPublicId, 
          new: detailsData.blackLogoPublicId, 
          type: 'black logo' 
        },
        { 
          current: currentDetails.faviconPublicId, 
          new: detailsData.faviconPublicId, 
          type: 'favicon' 
        }
      ];

      for (const image of imagesToCleanup) {
        if (image.current && 
            image.current !== image.new && 
            image.new) {
          try {
            await deleteFromCloudinary(image.current);
          } catch (error) {
            console.warn(`Failed to delete old ${image.type}:`, error);
          }
        }
      }

      const updatedDetails = await CompanyDetails.updateDetails(detailsData, admin.email);
      res.status(200).json({ success: true, data: updatedDetails });
    }
        
    else if (req.method === 'DELETE') {
      const { imagePublicId, imageType } = req.body;
            
      if (!imagePublicId) {
        return res.status(400).json({ error: 'Image public ID is required' });
      }

      try {
        await deleteFromCloudinary(imagePublicId);
        res.status(200).json({ 
          success: true, 
          message: `${imageType || 'Image'} deleted successfully` 
        });
      } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ error: 'Failed to delete image' });
      }
    }
        
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Company details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}