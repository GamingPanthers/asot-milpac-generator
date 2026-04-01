import mongoose, { Schema, Document } from 'mongoose';

export interface MilpacImageData extends Document {
  milpacId: string; // Reference to milpac_data _id
  memberID: string;
  name: string;
  discordID: string;
  data: any; // Store the snapshot of milpac data used for image
  imageUrl: string;
  dateCreated: Date;
  dateModified: Date;
  lastChecked: Date;
  logs: Array<{
    timestamp: Date;
    action: string;
    details: any;
  }>;
}

const milpacImageDataSchema = new Schema<MilpacImageData>({
  milpacId: { type: String, required: true, index: true },
  memberID: { type: String, required: true },
  name: { type: String, required: true },
  discordID: { type: String, required: true },
  data: { type: Schema.Types.Mixed, required: true },
  imageUrl: { type: String, required: true },
  dateCreated: { type: Date, default: Date.now },
  dateModified: { type: Date, default: Date.now },
  lastChecked: { type: Date, default: Date.now },
  logs: [
    {
      timestamp: { type: Date, default: Date.now },
      action: { type: String, required: true },
      details: { type: Schema.Types.Mixed },
    },
  ],
});

export const MilpacImageDataModel = mongoose.model<MilpacImageData>('MilpacImageData', milpacImageDataSchema);
