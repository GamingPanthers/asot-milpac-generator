import mongoose, { Schema, Document } from 'mongoose';
import { StoredMember, GenerationLog as GenerationLogType } from '../types';

/**
 * MongoDB Schema for Member data
 */
const memberSchema = new Schema<StoredMember & Document>(
  {
    memberID: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    discordID: { type: String, required: true, index: true },
    data: {
      // MemberData fields
      rank: { type: String, default: '' },
      corps: { type: String, default: '' },
      awards: [
        {
          date: String,
          name: String,
          type: String,
          issuedById: String,
          issuedByName: String,
        },
      ],
      qualifications: [
        {
          date: String,
          qualification: String,
          issuedById: String,
          issuedByName: String,
        },
      ],
      certificates: [
        {
          id: String,
          name: String,
          date: String,
        },
      ],
      // CertificateData fields
      Uniform: { type: String, default: '' },
      badge: { type: String, default: '' },
      medallions: [String],
      citations: [String],
      TrainingMedals: [String],
      RifleManBadge: { type: String, default: '' },
      certificateType: { type: String, enum: ['award', 'certificate'], default: 'award' },
      certificateAward: String,
    },
    lastUpdated: { type: Date, default: Date.now, index: true },
    lastGenerated: { type: Date, index: true },
    imageUrl: String,
  },
  {
    timestamps: true,
  }
);

/**
 * MongoDB Schema for Generation Logs
 */
const generationLogSchema = new Schema<GenerationLogType & Document>(
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

/**
 * Add compound index for efficient member + job queries
 */
memberSchema.index({ memberID: 1, lastUpdated: -1 });
memberSchema.index({ 'data.corps': 1 }); // Index for uniform color selection lookups
generationLogSchema.index({ memberID: 1, timestamp: -1 });

export const Member = mongoose.model<StoredMember & Document>('Member', memberSchema);
export const GenerationLogModel = mongoose.model<GenerationLogType & Document>(
  'GenerationLog',
  generationLogSchema
);
