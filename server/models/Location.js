import mongoose from 'mongoose';

const LocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
    },
    building: {
      type: String,
      required: [true, 'Building is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
    },
    allowedRadius: {
      type: Number,
      required: [true, 'Allowed radius is required'],
      default: 50, // meters
    },
  },
  {
    timestamps: true,
  }
);

const Location = mongoose.model('Location', LocationSchema);

export default Location;
