import mongoose, { Schema, Document } from 'mongoose';
import { StoredMember, GenerationLog } from '../types';

/**
 * MongoDB Schema for Member data
 */
const memberSchema = new Schema<StoredMember & Document>(
  {
    memberID: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    discordID: { type: String, required: true },
    data: {
      rank: String,
      Uniform: String,
      badge: String,
      medallions: [String],
      citations: [String],
      TrainingMedals: [String],
      RifleManBadge: String,
    },
    lastUpdated: { type: Date, default: Date.now },
    lastGenerated: Date,
    imageUrl: String,
  },
  {
    timestamps: true,
  }
);

/**
 * MongoDB Schema for Generation Logs
 */
const generationLogSchema = new Schema<GenerationLog & Document>(
  {
    memberID: { type: String, required: true, index: true },
    jobId: { type: String, required: true, unique: true },
    timestamp: { type: Date, default: Date.now, index: true },
    status: { type: String, enum: ['success', 'failed'], required: true },
    executionTime: { type: Number, required: true },
    error: String,
    imageSize: Number,
  },
  {
    timestamps: false,
  }
);

/**
 * Add TTL index to generation logs (keep for 30 days)
 */
generationLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

export const Member = mongoose.model<StoredMember & Document>('Member', memberSchema);
export const GenerationLog = mongoose.model<GenerationLog & Document>(
  'GenerationLog',
  generationLogSchema
);
