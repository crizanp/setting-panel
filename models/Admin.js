// models/Admin.js

import clientPromise from '../lib/mongodb';
import bcrypt from 'bcryptjs';

export class Admin {
  static async getDb() {
    const client = await clientPromise;
    return client.db('foxbeep'); // Use the 'foxbeep' DB explicitly
  }

  static async findByEmail(email) {
    const db = await this.getDb();
    return await db.collection('admins').findOne({ email });
  }

  static async create(adminData) {
    const db = await this.getDb();

    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    const admin = {
      ...adminData,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('admins').insertOne(admin);
    return result;
  }

  static async updatePassword(email, newPassword) {
    const db = await this.getDb();

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    return await db.collection('admins').updateOne(
      { email },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    );
  }

  static async verifyPassword(email, password) {
    const admin = await this.findByEmail(email);
    if (!admin) return false;

    return await bcrypt.compare(password, admin.password);
  }
}
