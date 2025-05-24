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
      logo: null, // Logo URL
      logoPublicId: null, // Cloudinary public ID
      favicon: null, // Favicon URL
      faviconPublicId: null, // Cloudinary public ID
      socialLinks: {
        facebook: "",
        instagram: "",
        twitter: "",
        linkedin: ""
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('company_details').insertOne(defaultDetails);
    return { ...defaultDetails, _id: result.insertedId };
  }

  static async updateDetails(detailsData, adminEmail) {
    const db = await this.getDb();
    
    // Deactivate current active details
    await db.collection('company_details').updateMany(
      { active: true },
      { $set: { active: false } }
    );

    // Create new active details
    const newDetails = {
      ...detailsData,
      active: true,
      updatedBy: adminEmail,
      updatedAt: new Date()
    };

    const result = await db.collection('company_details').insertOne(newDetails);
    return { ...newDetails, _id: result.insertedId };
  }
}