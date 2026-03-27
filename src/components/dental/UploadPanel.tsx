'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Upload, X, File, CheckCircle, AlertCircle, Loader2, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useDentalStore } from '@/store/dental-store'
import { useToast } from '@/hooks/use-toast'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: 'upper' | 'lower' | 'step'
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  uploadedPath?: string
}

const STORAGE_KEY = 'dental-upload-files'

function loadPersistedFiles(): UploadedFile[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.map((f: UploadedFile) => ({
        ...f,
        progress: f.status === 'success' ? 100 : 0,
        status: f.status === 'success' ? 'success' : 'error',
        error: f.status !== 'success' ? 'Session interrupted' : undefined,
      }))
    }
  } catch {}
  return []
}

function persistFiles(files: UploadedFile[]) {
  try {
    const toStore = files.map(({ id, name, size, type, status, progress, error, uploadedPath }) => ({
      id, name, size, type, status, progress, error, uploadedPath,
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  } catch {}
}

function clearPersistedFiles() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

export default function UploadPanel() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [isUploadingBulk, setIsUploadingBulk] = useState(false)
  const { toast } = useToast()
  const { setIsUploading, setUploadProgress } = useDentalStore()
  const [selectedJaw, setSelectedJaw] = useState<'upper' | 'lower' | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  // Load persisted files from server on mount
  useEffect(() => {
    async function fetchUploadedFiles() {
      try {
        const response = await fetch('/api/upload?caseId=current')
        if (response.ok) {
          const result = await response.json()
          if (result.success && Array.isArray(result.data)) {
            const serverFiles: UploadedFile[] = result.data.map((f: {
              id: string
              name: string
              type: 'upper' | 'lower' | 'step'
              glbPath: string
            }) => ({
              id: f.id,
              name: f.name,
              size: 0,
              type: f.type,
              status: 'success' as const,
              progress: 100,
              uploadedPath: f.glbPath,
            }))
            if (serverFiles.length > 0) {
              setFiles(serverFiles)
              return
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch uploaded files from server:', error)
      }

      // Fallback to localStorage
      const persisted = loadPersistedFiles()
      if (persisted.length > 0) {
        setFiles(persisted)
      }
    }

    fetchUploadedFiles()
    setHasLoaded(true)
  }, [])

  // Persist files to localStorage whenever they change (after initial load)
  useEffect(() => {
    if (hasLoaded) {
      persistFiles(files)
    }
  }, [files, hasLoaded])

  // Calculate bulk statistics
  const bulkStats = useMemo(() => {
    const total = files.length
    const completed = files.filter(f => f.status === 'success').length
    const failed = files.filter(f => f.status === 'error').length
    const uploading = files.filter(f => f.status === 'uploading').length
    const pending = files.filter(f => f.status === 'pending').length
    
    // Calculate overall progress based on all files
    const totalSize = files.reduce((sum, f) => sum + f.size, 0)
    const uploadedSize = files.reduce((sum, f) => {
      if (f.status === 'success') return sum + f.size
      if (f.status === 'uploading' || f.status === 'pending') {
        return sum + (f.size * (f.progress / 100))
      }
      return sum
    }, 0)
    const overallProgress = totalSize > 0 ? (uploadedSize / totalSize) * 100 : 0

    return { total, completed, failed, uploading, pending, overallProgress }
  }, [files])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleJawSelection = useCallback((jaw: 'upper' | 'lower') => {
    setSelectedJaw(jaw)
    toast({
      title: `${jaw === 'upper' ? 'Upper' : 'Lower'} jaw selected`,
      description: `You can now upload files for the ${jaw} jaw.`,
    })
  }, [toast])

  const uploadFile = useCallback((fileObj: UploadedFile, file: File): Promise<void> => {
    return new Promise((resolve) => {
      try {
        setFiles(prev => prev.map(f =>
          f.id === fileObj.id ? { ...f, status: 'uploading' } : f
        ))

        const formData = new FormData()
        formData.append('file', file)
        formData.append('jawType', fileObj.type)
        formData.append('caseId', 'current')

        const xhr = new XMLHttpRequest()

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100
            setFiles(prev => prev.map(f =>
              f.id === fileObj.id ? { ...f, progress: percentComplete } : f
            ))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText)
            if (response.success) {
              setFiles(prev => prev.map(f =>
                f.id === fileObj.id 
                  ? { 
                      ...f, 
                      status: 'success', 
                      progress: 100,
                      uploadedPath: response.data.glbPath 
                    } 
                  : f
              ))
              toast({
                title: 'Upload successful',
                description: `${file.name} uploaded`,
              })
            } else {
              throw new Error(response.error || 'Upload failed')
            }
          } else {
            throw new Error(`Server returned ${xhr.status}`)
          }
          resolve()
        })

        xhr.addEventListener('error', () => {
          setFiles(prev => prev.map(f =>
            f.id === fileObj.id 
              ? { ...f, status: 'error', error: 'Network error', progress: 0 } 
              : f
          ))
          toast({
            title: 'Upload failed',
            description: `${file.name}: Network error`,
            variant: 'destructive',
          })
          resolve()
        })

        xhr.addEventListener('abort', () => {
          setFiles(prev => prev.map(f =>
            f.id === fileObj.id 
              ? { ...f, status: 'error', error: 'Upload cancelled', progress: 0 } 
              : f
          ))
          resolve()
        })

        xhr.open('POST', '/api/upload')
        xhr.send(formData)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed'
        setFiles(prev => prev.map(f =>
          f.id === fileObj.id ? { ...f, status: 'error', error: message, progress: 0 } : f
        ))
        resolve()
      }
    })
  }, [toast])

  const processFiles = useCallback(async (fileList: File[]) => {
    const newFiles: UploadedFile[] = []
    const fileMap = new Map<string, File>()

    // Validate and prepare files
    fileList.forEach((file, index) => {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 50MB limit`,
          variant: 'destructive',
        })
        return
      }

      // Validate file type
      const allowedTypes = ['.stl', '.obj', '.glb', '.gltf']
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!allowedTypes.includes(fileExtension)) {
        toast({
          title: 'Invalid file type',
          description: `${fileExtension} not supported. Use STL, OBJ, GLB, or GLTF`,
          variant: 'destructive',
        })
        return
      }

      // Determine file type - prefer selectedJaw, fallback to filename detection
      let type: 'upper' | 'lower' | 'step' = selectedJaw || 'step'
      if (!selectedJaw) {
        const lowerName = file.name.toLowerCase()
        if (lowerName.includes('upper') || lowerName.includes('uper') || lowerName.includes('maxillary') || lowerName.includes('max')) {
          type = 'upper'
        } else if (lowerName.includes('lower') || lowerName.includes('mandibular') || lowerName.includes('mand')) {
          type = 'lower'
        }
      }

      const fileId = `${Date.now()}-${index}`
      const fileObj: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type,
        status: 'pending',
        progress: 0
      }

      newFiles.push(fileObj)
      fileMap.set(fileId, file)
    })

    if (newFiles.length === 0) return

    setFiles(prev => [...prev, ...newFiles])
    setIsUploadingBulk(true)
    setIsUploading(true)

    // Start all uploads in parallel
    const uploadPromises = newFiles.map(fileObj => 
      uploadFile(fileObj, fileMap.get(fileObj.id)!)
    )

    // Wait for all uploads to complete
    await Promise.all(uploadPromises)
    
    setIsUploadingBulk(false)
    setIsUploading(false)
    setUploadProgress(0)

    // Show summary
    const completed = newFiles.filter(f => {
      const updated = files.find(file => file.id === f.id)
      return updated?.status === 'success'
    }).length

    if (completed > 0) {
      toast({
        title: 'Bulk upload complete',
        description: `${completed} of ${newFiles.length} files uploaded successfully`,
      })
    }
  }, [uploadFile, files, toast, setIsUploading, setUploadProgress, selectedJaw])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    processFiles(droppedFiles)
  }, [processFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      processFiles(selectedFiles)
    }
  }, [processFiles])

  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }, [])

  const retryFailedFiles = useCallback(async () => {
    const failedFiles = files.filter(f => f.status === 'error')
    if (failedFiles.length === 0) return

    setIsUploadingBulk(true)
    setIsUploading(true)

    const uploadPromises = failedFiles.map(fileObj => {
      const file = new File([], fileObj.name)
      return uploadFile(fileObj, file)
    })

    await Promise.all(uploadPromises)
    
    setIsUploadingBulk(false)
    setIsUploading(false)
    setUploadProgress(0)

    toast({
      title: 'Retry complete',
      description: `Attempted to retry ${failedFiles.length} failed uploads`,
    })
  }, [files, uploadFile, toast, setIsUploading, setUploadProgress])

  const clearCompletedFiles = useCallback(() => {
    setFiles(prev => prev.filter(f => f.status !== 'success'))
  }, [])

  const clearAllFiles = useCallback(() => {
    setFiles([])
    clearPersistedFiles()
  }, [])

  const triggerFileInput = useCallback((accept: string, multiple: boolean = false) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = multiple
    input.onchange = (e) => {
      const selectedFiles = (e.target as HTMLInputElement).files
      if (selectedFiles) processFiles(Array.from(selectedFiles))
    }
    input.click()
  }, [processFiles])

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
      <Card className="w-full max-w-3xl bg-[#2a2a2a] border-[#444] max-h-[85vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[#444] flex items-center justify-between flex-shrink-0 bg-[#2a2a2a]">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#fff]">Upload Dental Files</h3>
            <p className="text-sm text-[#888]">
              {selectedJaw === 'upper' ? 'Upper jaw selected' : selectedJaw === 'lower' ? 'Lower jaw selected' : 'Select upper or lower jaw to upload'}
            </p>
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

        <CardContent className="p-4 overflow-y-auto flex-1 min-h-0">
          {/* Bulk upload statistics */}
          {bulkStats.total > 0 && (
            <div className="mb-4 p-3 bg-[#1a1a1a] rounded-lg border border-[#444]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-[#888]">Total:</span>
                    <span className="text-[#fff] ml-1 font-semibold">{bulkStats.total}</span>
                  </div>
                  <div>
                    <span className="text-[#888]">Completed:</span>
                    <span className="text-[#4CAF50] ml-1 font-semibold">{bulkStats.completed}</span>
                  </div>
                  <div>
                    <span className="text-[#888]">Uploading:</span>
                    <span className="text-[#00B8D4] ml-1 font-semibold">{bulkStats.uploading}</span>
                  </div>
                  <div>
                    <span className="text-[#888]">Failed:</span>
                    <span className="text-[#FF6B6B] ml-1 font-semibold">{bulkStats.failed}</span>
                  </div>
                </div>
              </div>
              
              {/* Overall progress bar */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-[#888]">Overall Progress</span>
                  <span className="text-xs text-[#ccc] font-semibold">
                    {bulkStats.overallProgress.toFixed(1)}%
                  </span>
                </div>
                <Progress value={bulkStats.overallProgress} className="h-2" />
              </div>

              {/* Bulk action buttons */}
              <div className="flex gap-2 mt-3">
                {bulkStats.failed > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#FF6B6B] text-[#FF6B6B] hover:bg-[#FF6B6B10]"
                    onClick={retryFailedFiles}
                    disabled={isUploadingBulk}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Retry {bulkStats.failed}
                  </Button>
                )}
                {bulkStats.completed > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#888] text-[#888] hover:bg-[#33333]"
                    onClick={clearCompletedFiles}
                    disabled={isUploadingBulk}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear Completed
                  </Button>
                )}
                {bulkStats.total > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#888] text-[#888] hover:bg-[#333]"
                    onClick={clearAllFiles}
                    disabled={isUploadingBulk}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Drop zone */}
          {!isUploadingBulk && (
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
              <p className="text-[#ccc] mb-2">
                Drag and drop files here, or click to select
              </p>
              <p className="text-xs text-[#666] mb-4">
                Supported formats: STL, OBJ, GLB (Max 50MB per file)
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
                disabled={isUploadingBulk}
              >
                Select Files
              </Button>
            </div>
          )}

          {/* File list */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-[#ccc]">
                Files ({bulkStats.completed}/{bulkStats.total})
              </h4>
              <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg border border-[#333]"
                  >
                    <File className="w-5 h-5 text-[#888] flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-[#ccc] truncate">{file.name}</p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] flex-shrink-0 ${
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
                        <div className="mt-2">
                          <div className="flex justify-between items-center mb-1">
                            <Progress value={file.progress} className="h-1 flex-1" />
                            <span className="text-xs text-[#888] ml-2 min-w-fit">{file.progress.toFixed(0)}%</span>
                          </div>
                        </div>
                      )}

                      {file.status === 'error' && (
                        <p className="text-xs text-[#FF6B6B] mt-1">{file.error}</p>
                      )}

                      {file.status === 'success' && file.uploadedPath && (
                        <p className="text-xs text-[#4CAF50] mt-1">✓ {file.uploadedPath}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
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
                        disabled={file.status === 'uploading'}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick upload buttons */}
          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              className={`flex-1 ${selectedJaw === 'upper' ? 'border-[#00B8D4] bg-[#00B8D410] text-[#00B8D4]' : 'border-[#444] text-[#ccc] hover:bg-[#333]'}`}
              onClick={() => {
                setSelectedJaw('upper')
                triggerFileInput('.stl,.obj,.glb,.gltf', false)
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upper Jaw
            </Button>
            <Button
              variant="outline"
              className={`flex-1 ${selectedJaw === 'lower' ? 'border-[#FF6B6B] bg-[#FF6B6B10] text-[#FF6B6B]' : 'border-[#444] text-[#ccc] hover:bg-[#333]'}`}
              onClick={() => {
                setSelectedJaw('lower')
                triggerFileInput('.stl,.obj,.glb,.gltf', false)
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              Lower Jaw
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-[#444] text-[#ccc] hover:bg-[#333]"
              onClick={() => triggerFileInput('.stl,.obj,.glb,.gltf', true)}
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
