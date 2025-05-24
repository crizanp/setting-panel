//pages/api/admin/upload/image.js (FIXED)

import { uploadSingle, uploadToCloudinary, handleUploadError } from '../../../../lib/imageUpload';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';
import { Admin } from '../../../../models/Admin';

// Disable default body parser for multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    // Handle file upload
    await uploadSingle(req, res);

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Upload to Cloudinary - FIXED: removed second parameter that was causing issues
    const result = await uploadToCloudinary(req.file.buffer, 'homepage/hero');

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      }
    });

  } catch (error) {
    console.error('Image upload error:', error);
    
    // Handle specific upload errors
    if (error.message === 'File too large. Maximum size is 5MB.' || 
        error.message === 'Only image files are allowed') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to upload image' });
  }
}