import mongoose from 'mongoose';

const ComplaintSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      default: null,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'assigned',
        'in_progress',
        'resolved',
        'rejected',
        'follow_up_required',
      ],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actionTaken: {
      type: String,
      trim: true,
      default: null,
    },
    resolution: {
      type: String,
      trim: true,
      default: null,
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
ComplaintSchema.index({ student: 1 });
ComplaintSchema.index({ location: 1 });
ComplaintSchema.index({ status: 1 });
ComplaintSchema.index({ category: 1 });
ComplaintSchema.index({ createdAt: -1 });

const Complaint = mongoose.model('Complaint', ComplaintSchema);

export default Complaint;
