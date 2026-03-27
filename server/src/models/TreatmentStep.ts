import { Schema, model } from 'mongoose'
import mongoose from 'mongoose'

const ToothMovementSchema = new Schema(
  {
    toothNumber: { type: String, required: true },
    rotation: { type: Number, default: 0 },
    translationX: { type: Number, default: 0 },
    translationY: { type: Number, default: 0 },
    translationZ: { type: Number, default: 0 },
  },
  { _id: true }
)

const TreatmentStepSchema = new Schema(
  {
    caseId: { type: String, required: true, index: true },
    versionId: { type: String, required: true, index: true },
    stepNumber: { type: Number, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'completed'],
    },
    toothMovements: { type: [ToothMovementSchema], default: [] },
  },
  { timestamps: true }
)

export const TreatmentStep =
  mongoose.models.TreatmentStep || model('TreatmentStep', TreatmentStepSchema)
