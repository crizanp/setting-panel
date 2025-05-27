// pages/api/admin/ads/[id].js
import { Advertisement } from '../../../../models/Advertisement';
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

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Advertisement ID is required' });
  }

  try {
    // Verify admin authentication for all requests
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
      // Get single advertisement by ID
      const ad = await Advertisement.getAdById(id);
      
      if (!ad) {
        return res.status(404).json({ error: 'Advertisement not found' });
      }

      return res.status(200).json({ success: true, data: ad });
    }

    if (req.method === 'PUT') {
      // Update advertisement
      const adData = req.body;

      // Get current ad to handle media cleanup if needed
      const currentAd = await Advertisement.getAdById(id);
      if (!currentAd) {
        return res.status(404).json({ error: 'Advertisement not found' });
      }

      // Clean up old media if they were changed
      const mediaToCleanup = [
        { 
          current: currentAd.srcPublicId, 
          new: adData.srcPublicId, 
          type: 'main media' 
        },
        { 
          current: currentAd.thumbnailPublicId, 
          new: adData.thumbnailPublicId, 
          type: 'thumbnail' 
        }
      ];

      for (const media of mediaToCleanup) {
        if (media.current && 
            media.current !== media.new && 
            media.new) {
          try {
            await deleteFromCloudinary(media.current);
            console.log(`Deleted old ${media.type}: ${media.current}`);
          } catch (error) {
            console.warn(`Failed to delete old ${media.type}:`, error);
          }
        }
      }

      const updatedAd = await Advertisement.updateAd(id, adData, admin.email);
      
      return res.status(200).json({ 
        success: true, 
        data: updatedAd,
        message: 'Advertisement updated successfully'
      });
    }

    if (req.method === 'DELETE') {
      // Delete advertisement
      const ad = await Advertisement.getAdById(id);
      if (!ad) {
        return res.status(404).json({ error: 'Advertisement not found' });
      }

      // Clean up associated media files
      const mediaToDelete = [
        ad.srcPublicId,
        ad.thumbnailPublicId
      ].filter(Boolean);

      for (const publicId of mediaToDelete) {
        try {
          await deleteFromCloudinary(publicId);
          console.log(`Deleted media: ${publicId}`);
        } catch (error) {
          console.warn(`Failed to delete media ${publicId}:`, error);
        }
      }

      const deleted = await Advertisement.deleteAd(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Advertisement not found' });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Advertisement deleted successfully' 
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Single ad API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}