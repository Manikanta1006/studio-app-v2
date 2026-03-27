import { Router } from 'express'
import { DentalCase } from '../models/DentalCase.js'
import { JawModel } from '../models/JawModel.js'
import { TreatmentStep } from '../models/TreatmentStep.js'
import { buildDefaultSteps } from '../utils/defaultSteps.js'

const router = Router()

function serializeCase(caseDoc: any, jawModels: any[] = []) {
  return {
    id: String(caseDoc._id),
    caseNumber: caseDoc.caseNumber,
    patientName: caseDoc.patientName,
    status: caseDoc.status,
    createdAt: caseDoc.createdAt,
    updatedAt: caseDoc.updatedAt,
    versions: (caseDoc.versions ?? []).map((version: any) => ({
      id: String(version._id),
      versionNumber: version.versionNumber,
      status: version.status,
      createdAt: version.createdAt,
    })),
    comments: caseDoc.comments ?? [],
    notes: caseDoc.notes ?? [],
    media: caseDoc.media ?? [],
    jawModels: jawModels.map((jawModel) => ({
      id: String(jawModel._id),
      type: jawModel.type,
      originalPath: jawModel.originalPath,
      glbPath: jawModel.glbPath,
      uploadedAt: jawModel.uploadedAt,
    })),
  }
}

router.get('/', async (_request, response) => {
  try {
    const cases = await DentalCase.find().sort({ createdAt: -1 }).lean()
    const caseIds = cases.map((caseDoc) => String(caseDoc._id))
    const jawModels = caseIds.length
      ? await JawModel.find({ caseId: { $in: caseIds } }).sort({ uploadedAt: -1 }).lean()
      : []

    const data = cases.map((caseDoc) => {
      const relatedJawModels = jawModels.filter((jawModel) => jawModel.caseId === String(caseDoc._id))
      return serializeCase(caseDoc, relatedJawModels)
    })

    response.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching cases:', error)
    response.status(500).json({ success: false, error: 'Failed to fetch cases' })
  }
})

router.post('/', async (request, response) => {
  try {
    const { patientName, caseNumber } = request.body as {
      patientName?: string
      caseNumber?: string
    }

    const newCase = new DentalCase({
      caseNumber: caseNumber?.trim() || `CASE-${Date.now()}`,
      patientName: patientName?.trim() || 'New Patient',
      status: 'pending',
      versions: [
        {
          versionNumber: '1-1',
          status: 'draft',
        },
      ],
    })

    await newCase.save()

    const initialVersion = newCase.versions[0]
    await TreatmentStep.insertMany(
      buildDefaultSteps(String(newCase._id), String(initialVersion._id))
    )

    response.status(201).json({
      success: true,
      data: serializeCase(newCase.toObject()),
    })
  } catch (error) {
    console.error('Error creating case:', error)
    response.status(500).json({ success: false, error: 'Failed to create case' })
  }
})

router.get('/:id', async (request, response) => {
  try {
    const dentalCase = await DentalCase.findById(request.params.id).lean()

    if (!dentalCase) {
      response.status(404).json({ success: false, error: 'Case not found' })
      return
    }

    const jawModels = await JawModel.find({ caseId: request.params.id }).lean()
    const steps = await TreatmentStep.find({ caseId: request.params.id })
      .sort({ stepNumber: 1 })
      .lean()

    response.json({
      success: true,
      case: {
        ...serializeCase(dentalCase, jawModels),
        steps: steps.map((step) => ({
          id: String(step._id),
          stepNumber: step.stepNumber,
          name: step.name,
          description: step.description,
          status: step.status,
          versionId: step.versionId,
          toothMovements: step.toothMovements,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching case:', error)
    response.status(500).json({ success: false, error: 'Failed to fetch case' })
  }
})

router.put('/:id', async (request, response) => {
  try {
    const updates = request.body as {
      patientName?: string
      caseNumber?: string
      status?: string
    }

    const updatedCase = await DentalCase.findByIdAndUpdate(
      request.params.id,
      {
        $set: {
          ...(updates.patientName ? { patientName: updates.patientName } : {}),
          ...(updates.caseNumber ? { caseNumber: updates.caseNumber } : {}),
          ...(updates.status ? { status: updates.status } : {}),
        },
      },
      { new: true }
    ).lean()

    if (!updatedCase) {
      response.status(404).json({ success: false, error: 'Case not found' })
      return
    }

    const jawModels = await JawModel.find({ caseId: request.params.id }).lean()
    response.json({ success: true, case: serializeCase(updatedCase, jawModels) })
  } catch (error) {
    console.error('Error updating case:', error)
    response.status(500).json({ success: false, error: 'Failed to update case' })
  }
})

router.delete('/:id', async (request, response) => {
  try {
    await Promise.all([
      DentalCase.findByIdAndDelete(request.params.id),
      TreatmentStep.deleteMany({ caseId: request.params.id }),
      JawModel.deleteMany({ caseId: request.params.id }),
    ])

    response.json({ success: true })
  } catch (error) {
    console.error('Error deleting case:', error)
    response.status(500).json({ success: false, error: 'Failed to delete case' })
  }
})

export default router
