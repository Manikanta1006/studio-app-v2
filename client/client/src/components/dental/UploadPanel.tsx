'use client'

import { useState, useCallback } from 'react'
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: 'upper' | 'lower' | 'step'
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

function inferFileType(fileName: string) {
  const lowerName = fileName.toLowerCase()

  if (lowerName.includes('upper') || lowerName.includes('maxillary') || lowerName.includes('max')) {
    return 'upper'
  }

  if (lowerName.includes('lower') || lowerName.includes('mandibular') || lowerName.includes('mand')) {
    return 'lower'
  }

  return 'step'
}

export default function UploadPanel() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const updateFile = useCallback((fileId: string, updater: (file: UploadedFile) => UploadedFile) => {
    setFiles((previous) => previous.map((file) => (file.id === fileId ? updater(file) : file)))
  }, [])

  const uploadFile = useCallback(
    (fileRecord: UploadedFile, sourceFile: File) => {
      const formData = new FormData()
      formData.append('file', sourceFile)
      formData.append('jawType', fileRecord.type)

      const request = new XMLHttpRequest()
      request.open('POST', '/api/upload')

      request.upload.onprogress = (event) => {
        if (!event.lengthComputable) {
          return
        }

        const progress = Math.round((event.loaded / event.total) * 100)
        updateFile(fileRecord.id, (file) => ({ ...file, status: 'uploading', progress }))
      }

      request.onload = () => {
        if (request.status >= 200 && request.status < 300) {
          updateFile(fileRecord.id, (file) => ({ ...file, status: 'success', progress: 100 }))
          return
        }

        let errorMessage = 'Upload failed'

        try {
          const parsed = JSON.parse(request.responseText) as { error?: string }
          errorMessage = parsed.error ?? errorMessage
        } catch {
          errorMessage = 'Upload failed'
        }

        updateFile(fileRecord.id, (file) => ({
          ...file,
          status: 'error',
          progress: 0,
          error: errorMessage,
        }))
      }

      request.onerror = () => {
        updateFile(fileRecord.id, (file) => ({
          ...file,
          status: 'error',
          progress: 0,
          error: 'Network error while uploading file',
        }))
      }

      request.send(formData)
    },
    [updateFile]
  )

  const processFiles = useCallback(
    (fileList: File[], forcedType?: 'upper' | 'lower' | 'step') => {
      const newFiles = fileList.map((file, index) => {
        const type = forcedType ?? inferFileType(file.name)

        return {
          record: {
            id: `${Date.now()}-${index}-${file.name}`,
            name: file.name,
            size: file.size,
            type,
            status: 'pending' as const,
            progress: 0,
          },
          source: file,
        }
      })

      setFiles((previous) => [...previous, ...newFiles.map(({ record }) => record)])
      newFiles.forEach(({ record, source }) => uploadFile(record, source))
    },
    [uploadFile]
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragOver(false)
      processFiles(Array.from(event.dataTransfer.files))
    },
    [processFiles]
  )

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        processFiles(Array.from(event.target.files))
        event.target.value = ''
      }
    },
    [processFiles]
  )

  const removeFile = useCallback((fileId: string) => {
    setFiles((previous) => previous.filter((file) => file.id !== fileId))
  }, [])

  const triggerFileInput = useCallback(
    (accept: string, type?: 'upper' | 'lower' | 'step', multiple = false) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = accept
      input.multiple = multiple
      input.onchange = (event) => {
        const selected = (event.target as HTMLInputElement).files
        if (selected) {
          processFiles(Array.from(selected), type)
        }
      }
      input.click()
    },
    [processFiles]
  )

  if (!showUpload) {
    return (
      <Button
        onClick={() => setShowUpload(true)}
        className="absolute top-4 right-4 z-20 bg-[#00B8D4] hover:bg-[#00A5C0] text-[#1a1a1a]"
      >
        <Upload className="w-4 h-4 mr-2" />
        Upload Files
      </Button>
    )
  }

  return (
    <div className="absolute inset-0 z-30 bg-[#1a1a1a]/95 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-[#2a2a2a] border-[#444]">
        <div className="p-4 border-b border-[#444] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#fff]">Upload Dental Files</h3>
            <p className="text-sm text-[#888]">Upload STL, OBJ, GLB, or GLTF files for the case</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowUpload(false)}
            className="text-[#888] hover:text-[#fff]"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <CardContent className="p-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-[#00B8D4] bg-[#00B8D410]'
                : 'border-[#444] hover:border-[#00B8D480]'
            }`}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-[#888]" />
            <p className="text-[#ccc] mb-2">Drag and drop files here, or click to select</p>
            <p className="text-xs text-[#666] mb-4">
              Supported formats: STL, OBJ, GLB, GLTF
            </p>
            <input
              type="file"
              multiple
              accept=".stl,.obj,.glb,.gltf"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              variant="outline"
              className="border-[#444] text-[#ccc] hover:bg-[#333]"
            >
              Select Files
            </Button>
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-[#ccc]">Uploaded Files</h4>
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg">
                  <File className="w-5 h-5 text-[#888]" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-[#ccc] truncate">{file.name}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          file.type === 'upper'
                            ? 'border-[#00B8D4] text-[#00B8D4]'
                            : file.type === 'lower'
                              ? 'border-[#FF6B6B] text-[#FF6B6B]'
                              : 'border-[#888] text-[#888]'
                        }`}
                      >
                        {file.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#666]">{formatFileSize(file.size)}</p>

                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="h-1 mt-2" />
                    )}

                    {file.status === 'error' && file.error && (
                      <p className="text-xs text-[#FF6B6B] mt-2">{file.error}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {file.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-[#4CAF50]" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-[#FF6B6B]" />
                    )}
                    {file.status === 'uploading' && (
                      <Loader2 className="w-5 h-5 text-[#00B8D4] animate-spin" />
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(file.id)}
                      className="h-8 w-8 text-[#888] hover:text-[#FF6B6B]"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-[#444] text-[#ccc] hover:bg-[#333]"
              onClick={() => triggerFileInput('.stl,.obj,.glb,.gltf', 'upper')}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upper Jaw
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-[#444] text-[#ccc] hover:bg-[#333]"
              onClick={() => triggerFileInput('.stl,.obj,.glb,.gltf', 'lower')}
            >
              <Upload className="w-4 h-4 mr-2" />
              Lower Jaw
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-[#444] text-[#ccc] hover:bg-[#333]"
              onClick={() => triggerFileInput('.stl,.obj,.glb,.gltf', 'step', true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Treatment Steps
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
