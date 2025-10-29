import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ITaskTimeline extends Document {
  taskTitle: string;
  startDate?: string;
  endDate?: string;
  estimatedDays?: number;
  updatedAt: Date;
  createdAt: Date;
}

const TaskTimelineSchema = new Schema<ITaskTimeline>(
  {
    taskTitle: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    startDate: {
      type: String,
      default: null
    },
    endDate: {
      type: String,
      default: null
    },
    estimatedDays: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Ensure unique index on taskTitle
TaskTimelineSchema.index({ taskTitle: 1 }, { unique: true });

const TaskTimeline: Model<ITaskTimeline> = 
  mongoose.models.TaskTimeline || mongoose.model<ITaskTimeline>('TaskTimeline', TaskTimelineSchema);

export default TaskTimeline;
