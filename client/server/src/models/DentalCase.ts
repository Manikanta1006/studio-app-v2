import { Schema, model } from 'mongoose'
import mongoose from 'mongoose'

const CaseVersionSchema = new Schema(
  {
    versionNumber: { type: String, required: true },
    status: { type: String, default: 'draft' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

const CommentSchema = new Schema(
  {
    author: { type: String, required: true },
    authorRole: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

const NoteSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

const MediaSchema = new Schema(
  {
    filename: { type: String, required: true },
    filepath: { type: String, required: true },
    filetype: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

const DentalCaseSchema = new Schema(
  {
    caseNumber: { type: String, required: true, unique: true, trim: true },
    patientName: { type: String, required: true, trim: true },
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'in_review', 'approved', 'completed'],
    },
    versions: { type: [CaseVersionSchema], default: [] },
    comments: { type: [CommentSchema], default: [] },
    notes: { type: [NoteSchema], default: [] },
    media: { type: [MediaSchema], default: [] },
  },
  { timestamps: true }
)

export const DentalCase = mongoose.models.DentalCase || model('DentalCase', DentalCaseSchema)
