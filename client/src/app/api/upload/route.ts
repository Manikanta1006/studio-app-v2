import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// Ensure upload directory exists
async function ensureUploadDir() {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }
  return uploadDir
}

// POST - Upload dental model files
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const caseId = formData.get('caseId') as string
    const jawType = formData.get('jawType') as string // 'upper' or 'lower'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['.stl', '.obj', '.glb', '.gltf']
    const fileExtension = path.extname(file.name).toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: STL, OBJ, GLB, GLTF' },
        { status: 400 }
      )
    }

    // Save file
    const uploadDir = await ensureUploadDir()
    const fileName = `${Date.now()}-${file.name}`
    const filePath = path.join(uploadDir, fileName)
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create GLB path (in production, you would convert STL to GLB using Blender)
    const glbPath = `/uploads/${fileName}`

    // If caseId provided, save to database
    if (caseId) {
      const jawModel = await db.jawModel.create({
        data: {
          type: jawType || 'upper',
          originalPath: filePath,
          glbPath: glbPath,
          caseId: caseId
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          id: jawModel.id,
          glbPath: glbPath,
          type: jawType
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        glbPath: glbPath,
        fileName: fileName,
        size: file.size
      }
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
