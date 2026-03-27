import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { JawModel } from '../models/JawModel.js'
import { uploadsDir } from '../config/paths.js'

const router = Router()
const allowedExtensions = new Set(['.stl', '.obj', '.glb', '.gltf'])

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, uploadsDir)
  },
  filename: (_request, file, callback) => {
    callback(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`)
  },
})

const upload = multer({
  storage,
  fileFilter: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()

    if (!allowedExtensions.has(extension)) {
      callback(new Error('Invalid file type. Allowed: STL, OBJ, GLB, GLTF'))
      return
    }

    callback(null, true)
  },
})

router.post('/', upload.single('file'), async (request, response) => {
  try {
    if (!request.file) {
      response.status(400).json({ success: false, error: 'No file provided' })
      return
    }

    const caseId = String(request.body.caseId ?? '')
    const jawType = String(request.body.jawType ?? 'upper') as 'upper' | 'lower' | 'step'
    const glbPath = `/uploads/${request.file.filename}`

    if (caseId) {
      const jawModel = await JawModel.create({
        caseId,
        type: jawType,
        originalPath: request.file.path,
        glbPath,
      })

      response.json({
        success: true,
        data: {
          id: String(jawModel._id),
          glbPath,
          type: jawType,
        },
      })
      return
    }

    response.json({
      success: true,
      data: {
        glbPath,
        fileName: request.file.filename,
        size: request.file.size,
      },
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    response.status(500).json({ success: false, error: 'Failed to upload file' })
  }
})

export default router
