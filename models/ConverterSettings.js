// model/ConverterSettings.js

import clientPromise from '../lib/mongodb';

export class ConverterSettings {
  static async getDb() {
    const client = await clientPromise;
    return client.db('foxbeep');
  }

  static converterTypes = [
    'mp4-to-mkv',
    'mkv-to-mp4', 
    'avi-to-mp4',
    'webm-to-mp4',
    'mov-to-mp4',
    'mp4-to-webm'
  ];

  static getConverterInfo(converterId) {
    const converterMap = {
      'mp4-to-mkv': { from: 'MP4', to: 'MKV', name: 'MP4 to MKV' },
      'mkv-to-mp4': { from: 'MKV', to: 'MP4', name: 'MKV to MP4' },
      'avi-to-mp4': { from: 'AVI', to: 'MP4', name: 'AVI to MP4' },
      'webm-to-mp4': { from: 'WEBM', to: 'MP4', name: 'WEBM to MP4' },
      'mov-to-mp4': { from: 'MOV', to: 'MP4', name: 'MOV to MP4' },
      'mp4-to-webm': { from: 'MP4', to: 'WEBM', name: 'MP4 to WEBM' }
    };
    return converterMap[converterId];
  }

  static async getConverterSettings(converterId) {
    if (!this.converterTypes.includes(converterId)) {
      throw new Error('Invalid converter type');
    }

    const db = await this.getDb();
    let settings = await db.collection('converter_settings').findOne({ 
      converterId,
      active: true 
    });
    
    // Return default settings if none exist
    if (!settings) {
      settings = await this.createDefaultSettings(converterId);
    }
    
    return settings;
  }

  static async createDefaultSettings(converterId) {
    const converterInfo = this.getConverterInfo(converterId);
    if (!converterInfo) {
      throw new Error('Invalid converter type');
    }

    const db = await this.getDb();
    const defaultSettings = {
      converterId,
      active: true,
      hero: {
        title: `Convert ${converterInfo.from} to ${converterInfo.to} Online`,
        description: `Convert your ${converterInfo.from} files to ${converterInfo.to} format quickly and easily. High quality conversion with fast processing.`,
        image: null,
        imageAlt: `${converterInfo.from} to ${converterInfo.to} converter`,
        imagePublicId: null
      },
      ways: {
        title: 'How to Convert',
        description: `Follow these simple steps to convert your ${converterInfo.from} files to ${converterInfo.to}`,
        image: null,
        imageAlt: 'Conversion process',
        imagePublicId: null,
        steps: [
          `Upload your ${converterInfo.from} file`,
          'Choose conversion settings',
          `Download your ${converterInfo.to} file`
        ]
      },
      features: {
        title: 'Why Choose Our Converter',
        items: [
          'Fast conversion speed',
          'High quality output',
          'Secure file processing',
          'No registration required'
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('converter_settings').insertOne(defaultSettings);
    return { ...defaultSettings, _id: result.insertedId };
  }

  static async updateConverterSettings(converterId, settingsData, adminEmail) {
    if (!this.converterTypes.includes(converterId)) {
      throw new Error('Invalid converter type');
    }

    const db = await this.getDb();
    
    // Deactivate current active settings for this converter
    await db.collection('converter_settings').updateMany(
      { converterId, active: true },
      { $set: { active: false } }
    );

    // Create new active settings
    const newSettings = {
      ...settingsData,
      converterId,
      active: true,
      updatedBy: adminEmail,
      updatedAt: new Date()
    };

    const result = await db.collection('converter_settings').insertOne(newSettings);
    return { ...newSettings, _id: result.insertedId };
  }

  static async getAllConverterSettings() {
    const db = await this.getDb();
    const settings = {};
    
    for (const converterId of this.converterTypes) {
      try {
        settings[converterId] = await this.getConverterSettings(converterId);
      } catch (error) {
        console.error(`Error fetching settings for ${converterId}:`, error);
        settings[converterId] = null;
      }
    }
    
    return settings;
  }

  static async getConverterSettingsHistory(converterId) {
    if (!this.converterTypes.includes(converterId)) {
      throw new Error('Invalid converter type');
    }

    const db = await this.getDb();
    return await db.collection('converter_settings')
      .find({ converterId })
      .sort({ updatedAt: -1 })
      .toArray();
  }

  static async deleteConverterImage(converterId, imagePublicId) {
    if (!this.converterTypes.includes(converterId)) {
      throw new Error('Invalid converter type');
    }

    const db = await this.getDb();
    
    // Find current active settings
    const currentSettings = await db.collection('converter_settings').findOne({
      converterId,
      active: true
    });

    if (!currentSettings) {
      throw new Error('No active settings found');
    }

    // Update settings to remove image references
    const updatedSettings = { ...currentSettings };
    
    // Check hero section
    if (updatedSettings.hero?.imagePublicId === imagePublicId) {
      updatedSettings.hero.image = null;
      updatedSettings.hero.imagePublicId = null;
    }
    
    // Check ways section
    if (updatedSettings.ways?.imagePublicId === imagePublicId) {
      updatedSettings.ways.image = null;
      updatedSettings.ways.imagePublicId = null;
    }

    // Create new settings entry
    await this.updateConverterSettings(converterId, updatedSettings, 'system');
    
    return updatedSettings;
  }
}