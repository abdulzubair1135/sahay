import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  title: string;
  message: string;
  type: 'FLOOD' | 'CYCLONE' | 'EARTHQUAKE' | 'FIRE' | 'LANDSLIDE' | 'EXTREME_WEATHER' | 'EVACUATION' | 'GENERAL';
  severity: 'WARNING' | 'DANGER' | 'SEVERE' | 'EXTREME';
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  radiusKm?: number;
  source: 'GOVERNMENT' | 'NDMA_SACHET' | 'IMD' | 'ADMIN';
  createdBy?: mongoose.Types.ObjectId;
  expiresAt: Date;
  active: boolean;
}

const AlertSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['FLOOD', 'CYCLONE', 'EARTHQUAKE', 'FIRE', 'LANDSLIDE', 'EXTREME_WEATHER', 'EVACUATION', 'GENERAL'],
      default: 'GENERAL',
      index: true
    },
    severity: {
      type: String,
      enum: ['WARNING', 'DANGER', 'SEVERE', 'EXTREME'],
      default: 'WARNING',
      index: true
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [72.5714, 23.0225] }
    },
    radiusKm: { type: Number, default: 25 },
    source: {
      type: String,
      enum: ['GOVERNMENT', 'NDMA_SACHET', 'IMD', 'ADMIN'],
      default: 'GOVERNMENT'
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date, required: true, index: true },
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

AlertSchema.index({ location: '2dsphere' });

export const Alert = mongoose.model<IAlert>('Alert', AlertSchema);
