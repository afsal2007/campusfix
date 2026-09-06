import mongoose from 'mongoose';

const ComplaintActionSchema = new mongoose.Schema(
  {
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: [true, 'Complaint reference is required'],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'PerformedBy reference is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
    },
    comment: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ComplaintAction = mongoose.model('ComplaintAction', ComplaintActionSchema);

export default ComplaintAction;
