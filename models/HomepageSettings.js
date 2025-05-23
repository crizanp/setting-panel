// model/HomepageSettings.js


import clientPromise from '../lib/mongodb';

export class HomepageSettings {
  static async getDb() {
    const client = await clientPromise;
    return client.db('foxbeep');
  }

  static async getSettings() {
    const db = await this.getDb();
    let settings = await db.collection('homepage_settings').findOne({ active: true });
    
    // Return default settings if none exist
    if (!settings) {
      settings = await this.createDefaultSettings();
    }
    
    return settings;
  }

  static async createDefaultSettings() {
    const db = await this.getDb();
    const defaultSettings = {
      active: true,
      hero: {
        title: "Welcome to Our Platform",
        description: "Discover amazing features and services that will transform your experience.",
        features: [
          "Fast and Reliable",
          "User-Friendly Interface", 
          "24/7 Support"
        ]
      },
      about: {
        title: "About Us",
        description: "We are dedicated to providing exceptional services and creating meaningful connections with our users."
      },
      newsletter: {
        enabled: true,
        title: "Stay Updated",
        description: "Subscribe to our newsletter for the latest updates and news."
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('homepage_settings').insertOne(defaultSettings);
    return { ...defaultSettings, _id: result.insertedId };
  }

  static async updateSettings(settingsData, adminEmail) {
    const db = await this.getDb();
    
    // Deactivate current active settings
    await db.collection('homepage_settings').updateMany(
      { active: true },
      { $set: { active: false } }
    );

    // Create new active settings
    const newSettings = {
      ...settingsData,
      active: true,
      updatedBy: adminEmail,
      updatedAt: new Date()
    };

    const result = await db.collection('homepage_settings').insertOne(newSettings);
    return { ...newSettings, _id: result.insertedId };
  }

  static async getSettingsHistory() {
    const db = await this.getDb();
    return await db.collection('homepage_settings')
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();
  }
}

export class Newsletter {
  static async getDb() {
    const client = await clientPromise;
    return client.db('foxbeep');
  }

  static async subscribe(email, name = '') {
    const db = await this.getDb();
    
    // Check if email already exists
    const existing = await db.collection('newsletter_subscribers').findOne({ email });
    if (existing) {
      throw new Error('Email already subscribed');
    }

    const subscriber = {
      email,
      name,
      subscribed: true,
      subscribedAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('newsletter_subscribers').insertOne(subscriber);
    return { ...subscriber, _id: result.insertedId };
  }

  static async unsubscribe(email) {
    const db = await this.getDb();
    return await db.collection('newsletter_subscribers').updateOne(
      { email },
      { 
        $set: { 
          subscribed: false, 
          unsubscribedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    );
  }

  static async getSubscribers(page = 1, limit = 50) {
    const db = await this.getDb();
    const skip = (page - 1) * limit;
    
    const subscribers = await db.collection('newsletter_subscribers')
      .find({ subscribed: true })
      .sort({ subscribedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('newsletter_subscribers').countDocuments({ subscribed: true });
    
    return {
      subscribers,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: subscribers.length,
        totalSubscribers: total
      }
    };
  }

  static async getSubscriberStats() {
    const db = await this.getDb();
    
    const totalSubscribers = await db.collection('newsletter_subscribers').countDocuments({ subscribed: true });
    const totalUnsubscribed = await db.collection('newsletter_subscribers').countDocuments({ subscribed: false });
    
    // Get subscribers from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSubscribers = await db.collection('newsletter_subscribers').countDocuments({
      subscribed: true,
      subscribedAt: { $gte: thirtyDaysAgo }
    });

    return {
      totalSubscribers,
      totalUnsubscribed,
      recentSubscribers,
      totalEmails: totalSubscribers + totalUnsubscribed
    };
  }
}