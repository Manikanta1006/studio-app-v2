import { Router } from 'express'
import { TreatmentStep } from '../models/TreatmentStep.js'

interface IStep {
  _id: unknown
  stepNumber: number
  name: string
  description: string
  status: string
  versionId: string
  toothMovements: unknown[]
}

const router = Router()

router.get('/', async (request, response) => {
  try {
    const versionId = String(request.query.versionId ?? '')

    if (!versionId) {
      response.status(400).json({ success: false, error: 'Version ID required' })
      return
    }

    const steps = (await TreatmentStep.find({ versionId }).sort({ stepNumber: 1 }).lean()) as unknown as IStep[]

    response.json({
      success: true,
      data: steps.map((step) => ({
        id: String(step._id),
        stepNumber: step.stepNumber,
        name: step.name,
        description: step.description,
        status: step.status,
        versionId: step.versionId,
        toothMovements: step.toothMovements,
      })),
    })
  } catch (error) {
    console.error('Error fetching steps:', error)
    response.status(500).json({ success: false, error: 'Failed to fetch steps' })
  }
})

router.put('/', async (request, response) => {
  try {
    const { stepId, status } = request.body as { stepId?: string; status?: string }

    if (!stepId || !status) {
      response.status(400).json({ success: false, error: 'stepId and status are required' })
      return
    }

    const step = (await TreatmentStep.findByIdAndUpdate(
      stepId,
      { $set: { status } },
      { new: true }
    ).lean()) as IStep | null

    if (!step) {
      response.status(404).json({ success: false, error: 'Step not found' })
      return
    }

    response.json({
      success: true,
      data: {
        id: String(step._id),
        stepNumber: step.stepNumber,
        name: step.name,
        description: step.description,
        status: step.status,
        versionId: step.versionId,
        toothMovements: step.toothMovements,
      },
    })
  } catch (error) {
    console.error('Error updating step:', error)
    response.status(500).json({ success: false, error: 'Failed to update step' })
  }
})

export default router
