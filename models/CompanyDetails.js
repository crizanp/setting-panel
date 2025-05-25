// models/CompanyDetails.js
import clientPromise from '../lib/mongodb';

export class CompanyDetails {
  static async getDb() {
    const client = await clientPromise;
    return client.db('foxbeep');
  }

  static async getDetails() {
    const db = await this.getDb();
    let details = await db.collection('company_details').findOne({ active: true });
   
    // Return default settings if none exist
    if (!details) {
      details = await this.createDefaultDetails();
    }
   
    return details;
  }

  static async createDefaultDetails() {
    const db = await this.getDb();
    const defaultDetails = {
      active: true,
      companyName: "Your Company Name",
      
      // Primary logo (usually for light backgrounds)
      logo: null, // Logo URL
      logoPublicId: null, // Cloudinary public ID
      
      // Black/Dark logo variant (for specific use cases)
      blackLogo: null, // Black logo URL
      blackLogoPublicId: null, // Black logo Cloudinary public ID
      
      // Favicon
      favicon: null, // Favicon URL
      faviconPublicId: null, // Cloudinary public ID
      
      // Social media links
      socialLinks: {
        facebook: "",
        instagram: "",
        twitter: "",
        linkedin: ""
      },
      
      // Metadata
      createdAt: new Date(),
      updatedAt: new Date(),
      version: "2.0" // Adding version for future migrations
    };

    const result = await db.collection('company_details').insertOne(defaultDetails);
    return { ...defaultDetails, _id: result.insertedId };
  }

  static async updateDetails(detailsData, adminEmail) {
    const db = await this.getDb();
   
    // Deactivate current active details (for audit trail)
    await db.collection('company_details').updateMany(
      { active: true },
      { $set: { active: false, deactivatedAt: new Date() } }
    );

    // Validate the details data
    const validatedData = await this.validateDetailsData(detailsData);

    // Create new active details
    const newDetails = {
      ...validatedData,
      active: true,
      updatedBy: adminEmail,
      updatedAt: new Date(),
      version: "2.0"
    };

    const result = await db.collection('company_details').insertOne(newDetails);
    return { ...newDetails, _id: result.insertedId };
  }

  static async validateDetailsData(data) {
    // Basic validation and sanitization
    const validated = {
      companyName: data.companyName?.trim() || "Your Company Name",
      
      // Primary logo
      logo: data.logo || null,
      logoPublicId: data.logoPublicId || null,
      
      // Black logo
      blackLogo: data.blackLogo || null,
      blackLogoPublicId: data.blackLogoPublicId || null,
      
      // Favicon
      favicon: data.favicon || null,
      faviconPublicId: data.faviconPublicId || null,
      
      // Social links with validation
      socialLinks: {
        facebook: this.validateUrl(data.socialLinks?.facebook) || "",
        instagram: this.validateUrl(data.socialLinks?.instagram) || "",
        twitter: this.validateUrl(data.socialLinks?.twitter) || "",
        linkedin: this.validateUrl(data.socialLinks?.linkedin) || ""
      }
    };

    return validated;
  }

  static validateUrl(url) {
    if (!url || !url.trim()) return "";
    
    try {
      // Add protocol if missing
      let validUrl = url.trim();
      if (!/^https?:\/\//i.test(validUrl)) {
        validUrl = `https://${validUrl}`;
      }
      
      // Validate URL format
      new URL(validUrl);
      return validUrl;
    } catch (error) {
      console.warn('Invalid URL provided:', url);
      return "";
    }
  }

  // Helper method to get logo based on preference/theme
  static async getLogoByTheme(theme = 'light') {
    const details = await this.getDetails();
    
    // Return appropriate logo based on theme
    switch (theme.toLowerCase()) {
      case 'dark':
        return details.blackLogo || details.logo; // Fallback to primary logo
      case 'light':
      default:
        return details.logo || details.blackLogo; // Fallback to black logo if no primary
    }
  }

  // Helper method to get all available logos
  static async getAllLogos() {
    const details = await this.getDetails();
    
    return {
      primary: {
        url: details.logo,
        publicId: details.logoPublicId,
        available: !!details.logo
      },
      black: {
        url: details.blackLogo,
        publicId: details.blackLogoPublicId,
        available: !!details.blackLogo
      },
      favicon: {
        url: details.favicon,
        publicId: details.faviconPublicId,
        available: !!details.favicon
      }
    };
  }

  // Method to get company details for public API (without sensitive data)
  static async getPublicDetails() {
    const details = await this.getDetails();
    
    return {
      companyName: details.companyName,
      logo: details.logo,
      blackLogo: details.blackLogo,
      favicon: details.favicon,
      socialLinks: details.socialLinks
    };
  }

  // Method to cleanup old/unused images
  static async cleanupUnusedImages(retainPublicIds = []) {
    const db = await this.getDb();
    
    // Get all inactive company details with images
    const inactiveDetails = await db.collection('company_details')
      .find({ 
        active: false,
        $or: [
          { logoPublicId: { $exists: true, $ne: null } },
          { blackLogoPublicId: { $exists: true, $ne: null } },
          { faviconPublicId: { $exists: true, $ne: null } }
        ]
      })
      .toArray();

    const imagesToDelete = [];
    
    inactiveDetails.forEach(detail => {
      if (detail.logoPublicId && !retainPublicIds.includes(detail.logoPublicId)) {
        imagesToDelete.push(detail.logoPublicId);
      }
      if (detail.blackLogoPublicId && !retainPublicIds.includes(detail.blackLogoPublicId)) {
        imagesToDelete.push(detail.blackLogoPublicId);
      }
      if (detail.faviconPublicId && !retainPublicIds.includes(detail.faviconPublicId)) {
        imagesToDelete.push(detail.faviconPublicId);
      }
    });

    return imagesToDelete;
  }

  // Method to get details history for audit purposes
  static async getDetailsHistory(limit = 10) {
    const db = await this.getDb();
    
    return await db.collection('company_details')
      .find({})
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();
  }
}