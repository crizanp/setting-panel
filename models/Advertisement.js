// models/Advertisement.js
import clientPromise from '../lib/mongodb';

export class Advertisement {
  static async getDb() {
    const client = await clientPromise;
    return client.db('foxbeep');
  }

  static async getActiveAds() {
    const db = await this.getDb();
    const ads = await db.collection('advertisements')
      .find({ 
        active: true,
        status: 'published',
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      })
      .sort({ priority: -1, createdAt: -1 })
      .toArray();
   
    return ads;
  }

  static async getAllAds(limit = 50, skip = 0, filters = {}) {
    const db = await this.getDb();
    const query = { ...filters };
    
    const ads = await db.collection('advertisements')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();
      
    const total = await db.collection('advertisements').countDocuments(query);
    
    return { ads, total };
  }

  static async getAdById(id) {
    const db = await this.getDb();
    const { ObjectId } = require('mongodb');
    
    try {
      const ad = await db.collection('advertisements').findOne({ 
        _id: new ObjectId(id) 
      });
      return ad;
    } catch (error) {
      console.error('Error fetching ad by ID:', error);
      return null;
    }
  }

  static async createAd(adData, adminEmail) {
    const db = await this.getDb();
    
    // Validate the ad data
    const validatedData = await this.validateAdData(adData);

    const newAd = {
      ...validatedData,
      createdBy: adminEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
      clicks: 0,
      impressions: 0,
      version: "1.0"
    };

    const result = await db.collection('advertisements').insertOne(newAd);
    return { ...newAd, _id: result.insertedId };
  }

  static async updateAd(id, adData, adminEmail) {
    const db = await this.getDb();
    const { ObjectId } = require('mongodb');
    
    try {
      // Validate the ad data
      const validatedData = await this.validateAdData(adData);

      const updateData = {
        ...validatedData,
        updatedBy: adminEmail,
        updatedAt: new Date()
      };

      const result = await db.collection('advertisements').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        throw new Error('Advertisement not found');
      }

      return await this.getAdById(id);
    } catch (error) {
      console.error('Error updating ad:', error);
      throw error;
    }
  }

  static async deleteAd(id) {
    const db = await this.getDb();
    const { ObjectId } = require('mongodb');
    
    try {
      const result = await db.collection('advertisements').deleteOne({ 
        _id: new ObjectId(id) 
      });
      
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting ad:', error);
      throw error;
    }
  }

  static async toggleAdStatus(id, active) {
    const db = await this.getDb();
    const { ObjectId } = require('mongodb');
    
    try {
      const result = await db.collection('advertisements').updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            active: active,
            updatedAt: new Date()
          }
        }
      );

      return result.matchedCount > 0;
    } catch (error) {
      console.error('Error toggling ad status:', error);
      throw error;
    }
  }

  static async validateAdData(data) {
    // Basic validation and sanitization
    const validated = {
      title: data.title?.trim() || "Untitled Ad",
      description: data.description?.trim() || "",
      type: data.type || 'image', // 'image' or 'video'
      
      // Media URLs
      src: data.src?.trim() || "",
      thumbnailSrc: data.thumbnailSrc?.trim() || "", // For video thumbnails
      
      // Cloudinary public IDs for cleanup
      srcPublicId: data.srcPublicId || null,
      thumbnailPublicId: data.thumbnailPublicId || null,
      
      // Campaign settings
      active: data.active !== undefined ? Boolean(data.active) : true,
      status: data.status || 'draft', // 'draft', 'published', 'paused', 'expired'
      priority: Math.max(0, Math.min(100, parseInt(data.priority) || 0)), // 0-100
      
      // Links and actions
      learnMoreLink: this.validateUrl(data.learnMoreLink) || "",
      buttonText: data.buttonText?.trim() || "Learn More",
      
      // Targeting and scheduling
      targetAudience: data.targetAudience?.trim() || "general",
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      
      // Display settings
      displayDuration: Math.max(3, Math.min(30, parseInt(data.displayDuration) || 5)), // 3-30 seconds
      skipDelay: Math.max(0, Math.min(15, parseInt(data.skipDelay) || 5)), // 0-15 seconds
      
      // Campaign metadata
      campaignName: data.campaignName?.trim() || "",
      tags: Array.isArray(data.tags) ? data.tags.filter(tag => tag && tag.trim()) : [],
      
      // Analytics settings
      trackClicks: data.trackClicks !== undefined ? Boolean(data.trackClicks) : true,
      trackImpressions: data.trackImpressions !== undefined ? Boolean(data.trackImpressions) : true,
    };

    // Additional validation
    if (!validated.src) {
      throw new Error('Advertisement media source is required');
    }

    if (validated.type === 'video' && !validated.thumbnailSrc) {
      console.warn('Video ad without thumbnail may have poor performance');
    }

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

  // Analytics methods
  static async recordImpression(id) {
    const db = await this.getDb();
    const { ObjectId } = require('mongodb');
    
    try {
      await db.collection('advertisements').updateOne(
        { _id: new ObjectId(id) },
        { 
          $inc: { impressions: 1 },
          $set: { lastImpression: new Date() }
        }
      );
      
      // Also record detailed analytics
      await this.recordAnalytics(id, 'impression');
    } catch (error) {
      console.error('Error recording impression:', error);
    }
  }

  static async recordClick(id) {
    const db = await this.getDb();
    const { ObjectId } = require('mongodb');
    
    try {
      await db.collection('advertisements').updateOne(
        { _id: new ObjectId(id) },
        { 
          $inc: { clicks: 1 },
          $set: { lastClick: new Date() }
        }
      );
      
      // Also record detailed analytics
      await this.recordAnalytics(id, 'click');
    } catch (error) {
      console.error('Error recording click:', error);
    }
  }

  static async recordAnalytics(adId, eventType, metadata = {}) {
    const db = await this.getDb();
    const { ObjectId } = require('mongodb');
    
    try {
      const analyticsRecord = {
        adId: new ObjectId(adId),
        eventType, // 'impression', 'click', 'skip', 'complete'
        timestamp: new Date(),
        metadata: {
          userAgent: metadata.userAgent || '',
          ip: metadata.ip || '',
          referrer: metadata.referrer || '',
          ...metadata
        }
      };

      await db.collection('ad_analytics').insertOne(analyticsRecord);
    } catch (error) {
      console.error('Error recording analytics:', error);
    }
  }

  // Get analytics for an ad
  static async getAdAnalytics(id, dateRange = 30) {
    const db = await this.getDb();
    const { ObjectId } = require('mongodb');
    
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);
      
      const analytics = await db.collection('ad_analytics').aggregate([
        {
          $match: {
            adId: new ObjectId(id),
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: "$eventType",
            count: { $sum: 1 },
            dates: { $push: "$timestamp" }
          }
        }
      ]).toArray();
      
      // Get basic ad info
      const ad = await this.getAdById(id);
      
      const result = {
        adId: id,
        adTitle: ad?.title || 'Unknown',
        totalImpressions: ad?.impressions || 0,
        totalClicks: ad?.clicks || 0,
        ctr: ad?.impressions > 0 ? ((ad?.clicks || 0) / ad.impressions * 100).toFixed(2) : 0,
        analytics: analytics.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            dates: item.dates
          };
          return acc;
        }, {})
      };
      
      return result;
    } catch (error) {
      console.error('Error getting ad analytics:', error);
      return null;
    }
  }

  // Cleanup expired ads
  static async cleanupExpiredAds() {
    const db = await this.getDb();
    
    try {
      const result = await db.collection('advertisements').updateMany(
        {
          expiresAt: { $lt: new Date() },
          status: { $ne: 'expired' }
        },
        {
          $set: {
            status: 'expired',
            active: false,
            updatedAt: new Date()
          }
        }
      );
      
      return result.modifiedCount;
    } catch (error) {
      console.error('Error cleaning up expired ads:', error);
      return 0;
    }
  }

  // Get campaign statistics
  static async getCampaignStats() {
    const db = await this.getDb();
    
    try {
      const stats = await db.collection('advertisements').aggregate([
        {
          $group: {
            _id: null,
            totalAds: { $sum: 1 },
            activeAds: {
              $sum: {
                $cond: [{ $eq: ["$active", true] }, 1, 0]
              }
            },
            totalImpressions: { $sum: "$impressions" },
            totalClicks: { $sum: "$clicks" },
            avgCtr: {
              $avg: {
                $cond: [
                  { $gt: ["$impressions", 0] },
                  { $multiply: [{ $divide: ["$clicks", "$impressions"] }, 100] },
                  0
                ]
              }
            }
          }
        }
      ]).toArray();
      
      return stats[0] || {
        totalAds: 0,
        activeAds: 0,
        totalImpressions: 0,
        totalClicks: 0,
        avgCtr: 0
      };
    } catch (error) {
      console.error('Error getting campaign stats:', error);
      return null;
    }
  }
}