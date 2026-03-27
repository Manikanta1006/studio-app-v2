import { Schema, model } from 'mongoose'
import mongoose from 'mongoose'

const JawModelSchema = new Schema(
  {
    caseId: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: ['upper', 'lower', 'step'] },
    originalPath: { type: String, required: true },
    glbPath: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
)

export const JawModel = mongoose.models.JawModel || model('JawModel', JawModelSchema)
