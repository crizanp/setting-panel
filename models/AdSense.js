// models/AdSense.js
import clientPromise from '../lib/mongodb';

export class AdSense {
  static async getDb() {
    const client = await clientPromise;
    return client.db('foxbeep');
  }

  static async getSettings() {
    const db = await this.getDb();
    let settings = await db.collection('adsense_settings').findOne({ active: true });
   
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
      
      // AdSense Account Configuration
      publisherId: "", // ca-pub-xxxxxxxxxxxxxxxxx
      adClientId: "", // Your AdSense client ID
      
      // Global AdSense Settings
      globalSettings: {
        enabled: false, // Master switch for all ads
        autoAds: false, // Enable Google Auto Ads
        adBlockDetection: false, // Detect ad blockers
        respectDoNotTrack: true, // Respect Do Not Track headers
        lazyLoading: true, // Enable lazy loading for ads
        testMode: false // Test mode for development
      },
      
      // Ad Unit Placements
      adPlacements: {
        header: {
          enabled: false,
          adSlot: "",
          adFormat: "auto",
          status: "draft" // draft, published, unpublished
        },
        sidebar: {
          enabled: false,
          adSlot: "",
          adFormat: "rectangle",
          status: "draft"
        },
        footer: {
          enabled: false,
          adSlot: "",
          adFormat: "horizontal",
          status: "draft"
        },
        inContent: {
          enabled: false,
          adSlot: "",
          adFormat: "auto",
          position: "middle", // top, middle, bottom
          status: "draft"
        },
        mobile: {
          enabled: false,
          adSlot: "",
          adFormat: "mobile-banner",
          status: "draft"
        }
      },
      
      // Custom Ad Units
      customAdUnits: [],
      
      // Performance Settings
      performance: {
        trackClicks: true,
        trackImpressions: true,
        reportingEnabled: true
      },
      
      // Metadata
      createdAt: new Date(),
      updatedAt: new Date(),
      version: "1.0"
    };

    const result = await db.collection('adsense_settings').insertOne(defaultSettings);
    return { ...defaultSettings, _id: result.insertedId };
  }

  static async updateSettings(settingsData, adminEmail) {
    const db = await this.getDb();
   
    // Deactivate current active settings (for audit trail)
    await db.collection('adsense_settings').updateMany(
      { active: true },
      { $set: { active: false, deactivatedAt: new Date() } }
    );

    // Validate the settings data
    const validatedData = await this.validateSettingsData(settingsData);

    // Create new active settings
    const newSettings = {
      ...validatedData,
      active: true,
      updatedBy: adminEmail,
      updatedAt: new Date(),
      version: "1.0"
    };

    const result = await db.collection('adsense_settings').insertOne(newSettings);
    return { ...newSettings, _id: result.insertedId };
  }

  static async validateSettingsData(data) {
    // Basic validation and sanitization
    const validated = {
      publisherId: data.publisherId?.trim() || "",
      adClientId: data.adClientId?.trim() || "",
      
      globalSettings: {
        enabled: Boolean(data.globalSettings?.enabled),
        autoAds: Boolean(data.globalSettings?.autoAds),
        adBlockDetection: Boolean(data.globalSettings?.adBlockDetection),
        respectDoNotTrack: Boolean(data.globalSettings?.respectDoNotTrack),
        lazyLoading: Boolean(data.globalSettings?.lazyLoading),
        testMode: Boolean(data.globalSettings?.testMode)
      },
      
      adPlacements: this.validateAdPlacements(data.adPlacements || {}),
      customAdUnits: this.validateCustomAdUnits(data.customAdUnits || []),
      
      performance: {
        trackClicks: Boolean(data.performance?.trackClicks ?? true),
        trackImpressions: Boolean(data.performance?.trackImpressions ?? true),
        reportingEnabled: Boolean(data.performance?.reportingEnabled ?? true)
      }
    };

    return validated;
  }

  static validateAdPlacements(placements) {
    const validStatuses = ['draft', 'published', 'unpublished'];
    const validFormats = ['auto', 'rectangle', 'horizontal', 'vertical', 'mobile-banner', 'leaderboard'];
    
    const defaultPlacement = {
      enabled: false,
      adSlot: "",
      adFormat: "auto",
      status: "draft"
    };

    return {
      header: {
        ...defaultPlacement,
        ...placements.header,
        status: validStatuses.includes(placements.header?.status) ? placements.header.status : 'draft',
        adFormat: validFormats.includes(placements.header?.adFormat) ? placements.header.adFormat : 'auto'
      },
      sidebar: {
        ...defaultPlacement,
        adFormat: "rectangle",
        ...placements.sidebar,
        status: validStatuses.includes(placements.sidebar?.status) ? placements.sidebar.status : 'draft',
        adFormat: validFormats.includes(placements.sidebar?.adFormat) ? placements.sidebar.adFormat : 'rectangle'
      },
      footer: {
        ...defaultPlacement,
        adFormat: "horizontal",
        ...placements.footer,
        status: validStatuses.includes(placements.footer?.status) ? placements.footer.status : 'draft',
        adFormat: validFormats.includes(placements.footer?.adFormat) ? placements.footer.adFormat : 'horizontal'
      },
      inContent: {
        ...defaultPlacement,
        position: "middle",
        ...placements.inContent,
        status: validStatuses.includes(placements.inContent?.status) ? placements.inContent.status : 'draft',
        adFormat: validFormats.includes(placements.inContent?.adFormat) ? placements.inContent.adFormat : 'auto',
        position: ['top', 'middle', 'bottom'].includes(placements.inContent?.position) ? placements.inContent.position : 'middle'
      },
      mobile: {
        ...defaultPlacement,
        adFormat: "mobile-banner",
        ...placements.mobile,
        status: validStatuses.includes(placements.mobile?.status) ? placements.mobile.status : 'draft',
        adFormat: validFormats.includes(placements.mobile?.adFormat) ? placements.mobile.adFormat : 'mobile-banner'
      }
    };
  }

  static validateCustomAdUnits(customUnits) {
    if (!Array.isArray(customUnits)) return [];
    
    return customUnits.map(unit => ({
      id: unit.id || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: unit.name?.trim() || "Custom Ad Unit",
      adSlot: unit.adSlot?.trim() || "",
      adFormat: unit.adFormat || "auto",
      placement: unit.placement?.trim() || "",
      enabled: Boolean(unit.enabled),
      status: ['draft', 'published', 'unpublished'].includes(unit.status) ? unit.status : 'draft',
      createdAt: unit.createdAt || new Date(),
      updatedAt: new Date()
    }));
  }

  // Get public settings for frontend
  static async getPublicSettings() {
    const settings = await this.getSettings();
    
    // Only return settings needed for frontend
    return {
      publisherId: settings.publisherId,
      adClientId: settings.adClientId,
      globalSettings: settings.globalSettings,
      adPlacements: this.getPublishedPlacements(settings.adPlacements),
      customAdUnits: settings.customAdUnits.filter(unit => 
        unit.enabled && unit.status === 'published'
      )
    };
  }

  static getPublishedPlacements(placements) {
    const published = {};
    
    Object.keys(placements).forEach(key => {
      const placement = placements[key];
      if (placement.enabled && placement.status === 'published' && placement.adSlot) {
        published[key] = {
          adSlot: placement.adSlot,
          adFormat: placement.adFormat,
          position: placement.position // for inContent
        };
      }
    });
    
    return published;
  }

  // Update individual ad placement status
  static async updatePlacementStatus(placementKey, status, adminEmail) {
    if (!['draft', 'published', 'unpublished'].includes(status)) {
      throw new Error('Invalid status');
    }

    const currentSettings = await this.getSettings();
    
    if (!currentSettings.adPlacements[placementKey]) {
      throw new Error('Invalid placement key');
    }

    currentSettings.adPlacements[placementKey].status = status;
    
    return await this.updateSettings(currentSettings, adminEmail);
  }

  // Update custom ad unit status
  static async updateCustomAdUnitStatus(unitId, status, adminEmail) {
    if (!['draft', 'published', 'unpublished'].includes(status)) {
      throw new Error('Invalid status');
    }

    const currentSettings = await this.getSettings();
    const unitIndex = currentSettings.customAdUnits.findIndex(unit => unit.id === unitId);
    
    if (unitIndex === -1) {
      throw new Error('Custom ad unit not found');
    }

    currentSettings.customAdUnits[unitIndex].status = status;
    currentSettings.customAdUnits[unitIndex].updatedAt = new Date();
    
    return await this.updateSettings(currentSettings, adminEmail);
  }

  // Add new custom ad unit
  static async addCustomAdUnit(unitData, adminEmail) {
    const currentSettings = await this.getSettings();
    
    const newUnit = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: unitData.name?.trim() || "Custom Ad Unit",
      adSlot: unitData.adSlot?.trim() || "",
      adFormat: unitData.adFormat || "auto",
      placement: unitData.placement?.trim() || "",
      enabled: Boolean(unitData.enabled),
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    currentSettings.customAdUnits.push(newUnit);
    
    const updatedSettings = await this.updateSettings(currentSettings, adminEmail);
    return { settings: updatedSettings, newUnit };
  }

  // Remove custom ad unit
  static async removeCustomAdUnit(unitId, adminEmail) {
    const currentSettings = await this.getSettings();
    const unitIndex = currentSettings.customAdUnits.findIndex(unit => unit.id === unitId);
    
    if (unitIndex === -1) {
      throw new Error('Custom ad unit not found');
    }

    currentSettings.customAdUnits.splice(unitIndex, 1);
    
    return await this.updateSettings(currentSettings, adminEmail);
  }

  // Get settings history for audit purposes
  static async getSettingsHistory(limit = 10) {
    const db = await this.getDb();
    
    return await db.collection('adsense_settings')
      .find({})
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();
  }

  // Get analytics/performance data structure
  static async getPerformanceStats(dateRange = 30) {
    const db = await this.getDb();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);
    
    // This would integrate with actual AdSense reporting API
    // For now, return structure for frontend
    return {
      summary: {
        impressions: 0,
        clicks: 0,
        ctr: 0,
        revenue: 0,
        rpm: 0
      },
      dailyStats: [],
      topPerformingUnits: [],
      dateRange: {
        start: startDate,
        end: new Date()
      }
    };
  }
}