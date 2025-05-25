// File 1: pages/api/admin/converter/[converterId].js
import { ConverterSettings } from '../../../../models/ConverterSettings';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';
import { Admin } from '../../../../models/Admin';

export default async function handler(req, res) {
  const { converterId } = req.query;

  try {
    // Verify admin authentication for PUT/DELETE requests
    if (req.method === 'PUT' || req.method === 'DELETE') {
      const token = getTokenFromRequest(req);
      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const admin = await Admin.findByEmail(decoded.email);
      if (!admin) {
        return res.status(401).json({ error: 'Admin not found' });
      }
    }

    switch (req.method) {
      case 'GET':
        const settings = await ConverterSettings.getConverterSettings(converterId);
        
        // Return only public data (exclude internal fields)
        const publicSettings = {
          hero: settings.hero,
          ways: settings.ways,
          features: settings.features
        };
        
        res.status(200).json({ success: true, data: publicSettings });
        break;

      case 'PUT':
        const token = getTokenFromRequest(req);
        const decoded = verifyToken(token);
        
        const updatedSettings = await ConverterSettings.updateConverterSettings(
          converterId,
          req.body,
          decoded.email
        );
        
        res.status(200).json({ 
          success: true, 
          data: {
            hero: updatedSettings.hero,
            ways: updatedSettings.ways,
            features: updatedSettings.features
          }
        });
        break;

      case 'DELETE':
        // Handle image deletion
        const { imagePublicId } = req.body;
        if (!imagePublicId) {
          return res.status(400).json({ error: 'Image public ID required' });
        }

        // Delete from Cloudinary
        const cloudinary = require('cloudinary').v2;
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        try {
          await cloudinary.uploader.destroy(imagePublicId);
        } catch (cloudinaryError) {
          console.error('Cloudinary deletion error:', cloudinaryError);
          // Continue even if Cloudinary deletion fails
        }

        // Update database settings
        const newSettings = await ConverterSettings.deleteConverterImage(converterId, imagePublicId);
        
        res.status(200).json({ 
          success: true, 
          data: {
            hero: newSettings.hero,
            ways: newSettings.ways,
            features: newSettings.features
          }
        });
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Converter settings API error:', error);
    
    if (error.message === 'Invalid converter type') {
      return res.status(400).json({ error: 'Invalid converter type' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
}

// =================================================================
// File 2: pages/api/converter/[converterId].js (Public API for frontend)
