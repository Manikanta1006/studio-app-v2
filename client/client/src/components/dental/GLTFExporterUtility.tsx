import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { useDentalStore } from '@/store/dental-store'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

export default function GLTFExporterUtility() {
  const { steps, setSequenceGlbUrl } = useDentalStore()
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState('')

  const handleExport = async () => {
    setIsExporting(true)
    setProgress('Initializing...')
    
    try {
      const loader = new STLLoader()
      const group = new THREE.Group()
      
      const sequenceSteps = steps.filter(s => s.modelUrl)
      
      for (let i = 0; i < sequenceSteps.length; i++) {
        const step = sequenceSteps[i]
        setProgress(`Downloading step ${i + 1}/${sequenceSteps.length}...`)
        
        let fileUrl = step.modelUrl!
        if (step.fallbackModelUrl) {
          // Use proxy to avoid CORS in browser
          fileUrl = step.fallbackModelUrl
        }
        
        const response = await fetch(fileUrl, { headers: { Accept: 'application/octet-stream,*/*' } })
        if (!response.ok) throw new Error(`Fetch failed ${response.status}`)
        
        const arrayBuffer = await response.arrayBuffer()
        const geometry = loader.parse(arrayBuffer)
        geometry.computeVertexNormals() // Ensure normals are baked in
        
        const material = new THREE.MeshStandardMaterial({
           color: i === 0 ? '#4fd1d9' : '#dde7eb',
           transparent: i === 0,
           opacity: i === 0 ? 0.3 : 1.0,
           roughness: 0.6
        })
        
        const mesh = new THREE.Mesh(geometry, material)
        mesh.name = `step_${i}`
        
        // Save metadata so the viewer knows which step this mesh belongs to
        mesh.userData = { stepIndex: i, isBase: i === 0 }
        
        group.add(mesh)
      }
      
      setProgress('Converting to GLB (This might take a minute)...')
      
      const exporter = new GLTFExporter()
      exporter.parse(
        group,
        (gltf) => {
          setProgress('Downloading...')
          const blob = new Blob([gltf as ArrayBuffer], { type: 'application/octet-stream' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.style.display = 'none'
          a.href = url
          a.download = 'treatment_sequence.glb'
          document.body.appendChild(a)
          a.click()
          
          // Auto-load it into the application state for immediate testing!
          setSequenceGlbUrl(url)
          
          // Wait briefly before revoking to ensure download and three.js parse succeeds
          setTimeout(() => {
            document.body.removeChild(a)
            // URL.revokeObjectURL(url) // Kept alive for the 3D Viewer!
          }, 1000)
          
          setIsExporting(false)
          setProgress('Success! Now using fast GLB.')
        },
        (error) => {
          console.error('GLTF Export failed:', error)
          setProgress('Failed to export GLB')
          setIsExporting(false)
        },
        { binary: true }
      )
      
    } catch (err) {
      console.error(err)
      setProgress('Error: ' + String(err))
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 bg-card border border-outline-variant/50 p-4 rounded-2xl shadow-xl max-w-sm">
      <h3 className="font-bold text-on-surface mb-2 text-sm flex items-center gap-2">
        <Download size={16} /> GLTF Sequence Baker
      </h3>
      <p className="text-xs text-outline mb-4">
        Convert all 17 STL files into a single optimized .glb file for instant playback.
      </p>
      
      <button 
        onClick={handleExport}
        disabled={isExporting}
        className="w-full py-2 bg-primary text-on-primary rounded-xl font-bold text-xs flex justify-center items-center gap-2 disabled:opacity-50"
      >
        {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        {isExporting ? 'Processing...' : 'Bake & Download .GLB'}
      </button>
      
      {progress && (
        <p className="text-[10px] text-primary mt-2 font-mono text-center">
          {progress}
        </p>
      )}
    </div>
  )
}
