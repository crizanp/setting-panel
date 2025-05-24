// pages/api/admin/company/upload-image.js

import { uploadSingle, uploadToCloudinary, handleUploadError } from '../../../../lib/imageUpload';
import { verifyToken, getTokenFromRequest } from '../../../../lib/auth';
import { Admin } from '../../../../models/Admin';

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for file uploads
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
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
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get image type from query parameter (logo or favicon)
    const imageType = req.query.type || 'logo';
    const folder = imageType === 'favicon' ? 'company-favicons' : 'company-logos';

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, folder);

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format
      }
    });

  } catch (error) {
    handleUploadError(error, req, res, () => {
      console.error('Image upload error:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    });
  }
}