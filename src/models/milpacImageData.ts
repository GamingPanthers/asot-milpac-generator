import mongoose, { Schema, Document } from 'mongoose';
import { MemberData } from '../types';

/**
 * Image audit trail and snapshot data
 * Tracks both the data used to generate images and generation history
 * 
 * Key features:
 * - Stores denormalized corps and selected uniform for fast lookups
 * - Maintains complete snapshot of member data at time of generation
 * - Tracks generation history through logs array
 * - Supports querying by uniform type or corps affiliation
 */
export interface MilpacImageData extends Document {
  milpacId: string; // Reference to milpac_data _id
  memberID: string; // Denormalized from member - for fast lookups
  name: string;
  discordID: string;
  corps: string; // Denormalized from data - for fast lookups and uniform selection
  uniform: string; // Track which uniform was selected (blue_uniform or brown_uniform)
  data: MemberData; // Snapshot of member data used for generation
  imageUrl?: string; // Optional - only set after successful generation
  dateCreated: Date;
  dateModified: Date;
  lastChecked: Date;
  logs: Array<{
    timestamp: Date;
    action: string;
    details?: Record<string, any>;
  }>;
}

const milpacImageDataSchema = new Schema<MilpacImageData>(
  {
    milpacId: { type: String, required: true, index: true },
    memberID: { type: String, required: true, index: true },
    name: { type: String, required: true },
    discordID: { type: String, required: true },
    corps: { type: String, default: '', index: true }, // Denormalized for fast lookups
    uniform: { type: String, enum: ['blue_uniform', 'brown_uniform'], default: 'blue_uniform' }, // Track selected uniform
    data: { type: Schema.Types.Mixed, required: true }, // Stores snapshot of member data
    imageUrl: { type: String, default: null }, // Optional - populated after image generation
    dateCreated: { type: Date, default: Date.now, index: true },
    dateModified: { type: Date, default: Date.now, index: true },
    lastChecked: { type: Date, default: Date.now },
    logs: [
      {
        timestamp: { type: Date, default: Date.now },
        action: { type: String, required: true },
        details: { type: Schema.Types.Mixed, default: null },
      },
    ],
  },
  {
    timestamps: false, // Using explicit dateCreated/dateModified
  }
);

/**
 * Compound index for efficient member history queries
 */
milpacImageDataSchema.index({ memberID: 1, dateCreated: -1 });

/**
 * Index for finding records by both milpac and member IDs
 */
milpacImageDataSchema.index({ milpacId: 1, memberID: 1 });

/**
 * Index for uniform and corps tracking
 */
milpacImageDataSchema.index({ uniform: 1, corps: 1 });

export const MilpacImageDataModel = mongoose.model<MilpacImageData>('MilpacImageData', milpacImageDataSchema);
