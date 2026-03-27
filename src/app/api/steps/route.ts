import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get steps for a case version
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const versionId = searchParams.get('versionId')

    if (!versionId) {
      return NextResponse.json(
        { success: false, error: 'Version ID required' },
        { status: 400 }
      )
    }

    const steps = await db.treatmentStep.findMany({
      where: { versionId },
      include: {
        toothMovements: true
      },
      orderBy: { stepNumber: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: steps
    })
  } catch (error) {
    console.error('Error fetching steps:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch steps' },
      { status: 500 }
    )
  }
}

// PUT - Update step status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { stepId, status } = body

    const step = await db.treatmentStep.update({
      where: { id: stepId },
      data: { status }
    })

    return NextResponse.json({
      success: true,
      data: step
    })
  } catch (error) {
    console.error('Error updating step:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update step' },
      { status: 500 }
    )
  }
}
