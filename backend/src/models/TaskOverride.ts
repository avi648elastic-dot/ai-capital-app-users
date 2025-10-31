import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ITaskOverride extends Document {
  taskId: string; // The original task ID
  originalTitle?: string; // Original title for reference
  title?: string; // Overridden title
  description?: string; // Overridden description
  updatedAt: Date;
  createdAt: Date;
}

const TaskOverrideSchema = new Schema<ITaskOverride>(
  {
    taskId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    originalTitle: {
      type: String,
      default: null,
      trim: true
    },
    title: {
      type: String,
      default: null,
      trim: true
    },
    description: {
      type: String,
      default: null,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Ensure unique index on taskId
TaskOverrideSchema.index({ taskId: 1 }, { unique: true });

const TaskOverride: Model<ITaskOverride> = 
  mongoose.models.TaskOverride || mongoose.model<ITaskOverride>('TaskOverride', TaskOverrideSchema);

export default TaskOverride;


