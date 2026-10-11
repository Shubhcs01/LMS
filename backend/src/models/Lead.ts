import mongoose, { Document, Schema } from 'mongoose';

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  DOCUMENT_PENDING = 'DOCUMENT_PENDING',
  FOLLOW_UP_REQUIRED = 'FOLLOW_UP_REQUIRED',
  CONVERTED = 'CONVERTED',
  DROPPED = 'DROPPED',
}

export interface ILeadNote {
  note: string;
  addedBy: mongoose.Types.ObjectId;
  addedByName: string;
  addedAt: Date;
}

export interface ILead extends Document {
  borrowerId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  currentStep: number;
  leadStatus: LeadStatus;
  assignedTo?: mongoose.Types.ObjectId;
  assignedToName?: string;
  notes: ILeadNote[];
  lastContactedAt?: Date;
  hasApplied: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILead>(
  {
    borrowerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    currentStep: { type: Number, default: 1 },
    leadStatus: {
      type: String,
      enum: Object.values(LeadStatus),
      default: LeadStatus.NEW,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedToName: String,
    notes: [
      {
        note: { type: String, required: true },
        addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        addedByName: { type: String, required: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    lastContactedAt: Date,
    hasApplied: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Lead = mongoose.model<ILead>('Lead', leadSchema);
