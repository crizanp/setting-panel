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

    // Get image type from query parameter
    const imageType = req.query.type || 'logo';
    
    // Determine the appropriate folder based on image type
    let folder;
    switch (imageType) {
      case 'blackLogo':
        folder = 'company-logos/black';
        break;
      case 'logo':
        folder = 'company-logos/primary';
        break;
      case 'favicon':
        folder = 'company-favicons';
        break;
      default:
        folder = 'company-logos';
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.' 
      });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (req.file.size > maxSize) {
      return res.status(400).json({ 
        error: 'File too large. Maximum size is 5MB.' 
      });
    }

    // Set transformation options based on image type
    let transformOptions = {
      quality: 'auto:good',
      fetch_format: 'auto'
    };

    // Apply specific transformations for different image types
    switch (imageType) {
      case 'logo':
      case 'blackLogo':
        transformOptions = {
          ...transformOptions,
          width: 800,
          height: 400,
          crop: 'limit',
          quality: 'auto:best'
        };
        break;
      case 'favicon':
        transformOptions = {
          ...transformOptions,
          width: 64,
          height: 64,
          crop: 'fill',
          gravity: 'center'
        };
        break;
    }

    // Upload to Cloudinary with transformations
    const result = await uploadToCloudinary(req.file.buffer, folder, transformOptions);

    // Return success response with image details
    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        folder: folder,
        imageType: imageType
      }
    });

  } catch (error) {
    handleUploadError(error, req, res, () => {
      console.error('Image upload error:', error);
      
      // Provide more specific error messages
      if (error.message && error.message.includes('File too large')) {
        res.status(400).json({ error: 'Image file is too large. Please use an image under 5MB.' });
      } else if (error.message && error.message.includes('Invalid image')) {
        res.status(400).json({ error: 'Invalid image file. Please upload a valid image.' });
      } else if (error.http_code === 400) {
        res.status(400).json({ error: 'Invalid image format or corrupted file.' });
      } else {
        res.status(500).json({ error: 'Failed to upload image. Please try again.' });
      }
    });
  }
}