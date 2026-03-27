import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// GET - List all cases
export async function GET() {
  try {
    const cases = await db.dentalCase.findMany({
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        jawModels: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: cases
    })
  } catch (error) {
    console.error('Error fetching cases:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cases' },
      { status: 500 }
    )
  }
}

// POST - Create new case
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientName, caseNumber } = body

    // Generate case number if not provided
    const generatedCaseNumber = caseNumber || `CASE-${Date.now()}`

    // Create case with initial version
    const newCase = await db.dentalCase.create({
      data: {
        caseNumber: generatedCaseNumber,
        patientName: patientName || 'New Patient',
        status: 'pending',
        versions: {
          create: {
            versionNumber: '1-1',
            status: 'draft'
          }
        }
      },
      include: {
        versions: true
      }
    })

    // Create default treatment steps
    const version = newCase.versions[0]
    if (version) {
      for (let i = 1; i <= 17; i++) {
        await db.treatmentStep.create({
          data: {
            stepNumber: i,
            name: `Step ${i}`,
            description: i === 1 
              ? 'Initial alignment - Starting position'
              : i === 17 
              ? 'Final position - Treatment complete'
              : `Treatment progression - Aligner ${i}`,
            status: 'pending',
            versionId: version.id
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: newCase
    })
  } catch (error) {
    console.error('Error creating case:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create case' },
      { status: 500 }
    )
  }
}
