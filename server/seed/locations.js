/**
 * server/seed/locations.js
 *
 * Development-only seed script to populate the database with campus locations.
 *
 * Usage:
 *   cd server
 *   node seed/locations.js
 *
 * WARNING: Do not run this in production without understanding the implications.
 * Running it multiple times will create duplicate entries unless the existing
 * data is cleared first.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Location from '../models/Location.js';

// Resolve .env relative to THIS file (server/seed/), so path is ../  → server/
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Sample campus locations
// latitude/longitude/allowedRadius are placeholder values for dev purposes.
// GPS verification is not active in Day 4.
const CAMPUS_LOCATIONS = [
  {
    name: 'Main Block',
    building: 'Main Block',
    latitude: 11.0168,
    longitude: 76.9558,
    allowedRadius: 50,
  },
  {
    name: 'Computer Lab 1',
    building: 'Main Block',
    latitude: 11.0170,
    longitude: 76.9560,
    allowedRadius: 50,
  },
  {
    name: 'Computer Lab 2',
    building: 'Main Block',
    latitude: 11.0171,
    longitude: 76.9561,
    allowedRadius: 50,
  },
  {
    name: 'Library',
    building: 'Library Block',
    latitude: 11.0172,
    longitude: 76.9562,
    allowedRadius: 50,
  },
  {
    name: 'Canteen',
    building: 'Amenities Block',
    latitude: 11.0173,
    longitude: 76.9563,
    allowedRadius: 50,
  },
  {
    name: 'Hostel Block A',
    building: 'Hostel',
    latitude: 11.0174,
    longitude: 76.9564,
    allowedRadius: 50,
  },
  {
    name: 'Seminar Hall',
    building: 'Main Block',
    latitude: 11.0175,
    longitude: 76.9565,
    allowedRadius: 50,
  },
  {
    name: 'Parking Area',
    building: 'Outdoor',
    latitude: 11.0176,
    longitude: 76.9566,
    allowedRadius: 100,
  },
  {
    name: 'Sports Ground',
    building: 'Outdoor',
    latitude: 11.0177,
    longitude: 76.9567,
    allowedRadius: 100,
  },
  {
    name: 'Administrative Office',
    building: 'Admin Block',
    latitude: 11.0178,
    longitude: 76.9568,
    allowedRadius: 50,
  },
];

const seedLocations = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding.');

    // Check how many locations already exist
    const existingCount = await Location.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing location(s). Skipping seed to avoid duplicates.`);
      console.log('To re-seed, manually delete all locations from the database first.');
      process.exit(0);
    }

    const created = await Location.insertMany(CAMPUS_LOCATIONS);
    console.log(`Successfully seeded ${created.length} campus locations:`);
    created.forEach((loc) => console.log(`  • ${loc.name} (${loc._id})`));

    process.exit(0);
  } catch (error) {
    console.error('Error seeding locations:', error.message);
    process.exit(1);
  }
};

seedLocations();
