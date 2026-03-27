'use client'

import { useState } from 'react'
import {
  Menu,
  Check,
  MessageCircle,
  FileText,
  ImageIcon,
  Languages,
  ExternalLink,
  ChevronDown,
  User,
  Calendar,
  Clock,
  Target,
  Ruler,
  Zap,
  Activity,
  Eye,
  RotateCcw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Settings,
  Download,
  Upload,
  Share,
  Edit,
  Copy,
  MoreVertical,
  ChevronRight,
  Info,
  BarChart3,
  Layers,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useDentalStore, ToothData } from '@/store/dental-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

// Sample occlusion analysis data
const occlusionAnalysis = {
  overallScore: 85,
  contacts: {
    total: 42,
    ideal: 38,
    premature: 3,
    missing: 1,
  },
  interferences: [
    { tooth: '16', type: 'centric', severity: 'moderate', description: 'Premature contact on buccal cusp' },
    { tooth: '26', type: 'lateral', severity: 'mild', description: 'Light interference in right lateral movement' },
    { tooth: '36', type: 'centric', severity: 'severe', description: 'Heavy contact preventing full closure' },
  ],
  measurements: {
    overjet: 2.3,
    overbite: 1.8,
    midline: 0.5,
    canineGuidance: true,
    groupFunction: false,
  },
}

// Treatment progress data
const treatmentProgress = {
  completedSteps: 8,
  totalSteps: 17,
  currentPhase: 'Alignment',
  estimatedCompletion: '2024-02-15',
  nextMilestone: 'Mid-treatment refinement',
}
const sampleComments = [
  {
    id: 1,
    author: 'Technician',
    role: 'technician',
    content: 'Modified the treatment plan based on the doctor\'s feedback. Adjusted the upper arch alignment and corrected the midline deviation. The lower arch has been refined for better occlusion. Class one occlusion maintained with proper anterior overjet.',
    timestamp: '12/13/2022 10:30 AM'
  },
  {
    id: 2,
    author: 'Dr. Smith',
    role: 'doctor',
    content: 'Please review the attachment points for attachments #3, #7, and #11. They may need repositioning for optimal force application.',
    timestamp: '12/10/2022 2:15 PM'
  },
  {
    id: 3,
    author: 'Technician',
    role: 'technician',
    content: 'Have a nice day. Thank you!',
    timestamp: '12/13/2022 11:00 AM'
  }
]

// Sample notes data
const sampleNotes = [
  {
    id: 1,
    title: 'Treatment Notes',
    content: [
      'Upper arch expansion required',
      'Midline correction needed',
      'Lower incisor alignment',
      'IPR at positions 3, 7, 11'
    ]
  },
  {
    id: 2,
    title: 'Attachments',
    content: [
      '3 attachments upper arch',
      '2 attachments lower arch',
      'Cutouts for precision'
    ]
  },
  {
    id: 3,
    title: 'Clinical Findings',
    content: [
      'Class I molar relationship',
      'Anterior open bite tendency',
      'Crossbite on tooth #22',
      'Crowding upper anterior'
    ]
  }
]

// Tooth info card
function ToothInfoCard({ tooth }: { tooth: ToothData }) {
  return (
    <Card className="bg-[#2a2a2a] border-[#444] mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-[#00B8D4]">
          Tooth #{tooth.number}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-[#ccc]">
        <p className="mb-2">{tooth.name}</p>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <span className="text-[#888]">Position X:</span> {tooth.position.x.toFixed(2)}
          </div>
          <div>
            <span className="text-[#888]">Position Y:</span> {tooth.position.y.toFixed(2)}
          </div>
          <div>
            <span className="text-[#888]">Position Z:</span> {tooth.position.z.toFixed(2)}
          </div>
          <div>
            <span className="text-[#888]">Rotation:</span> {tooth.rotation.toFixed(1)}°
          </div>
        </div>
        {tooth.movement && (
          <div className="mt-2 pt-2 border-t border-[#444]">
            <p className="text-[#00B8D4] mb-1">Movement:</p>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-[#888]">ΔX:</span> {tooth.movement.translationX.toFixed(2)}mm
              </div>
              <div>
                <span className="text-[#888]">ΔY:</span> {tooth.movement.translationY.toFixed(2)}mm
              </div>
              <div>
                <span className="text-[#888]">ΔRotation:</span> {tooth.movement.rotation.toFixed(1)}°
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

  )
}

// Hover Menu Component
function HoverMenu({ 
  isVisible, 
  position, 
  title, 
  items, 
  onItemClick 
}: { 
  isVisible: boolean
  position: { x: number; y: number }
  title: string
  items: Array<{ id: string; label: string; icon: any; description?: string }>
  onItemClick: (itemId: string) => void
}) {
  if (!isVisible) return null

  return (
    <div 
      className="fixed z-50 bg-[#1a1a1a] border border-[#444] rounded-lg shadow-xl p-3 min-w-[200px] max-w-[300px]"
      style={{ 
        left: position.x + 10, 
        top: position.y - 10,
        transform: position.x > window.innerWidth - 320 ? 'translateX(-100%)' : 'none'
      }}
    >
      <div className="text-sm font-medium text-[#00B8D4] mb-2 pb-2 border-b border-[#333]">
        {title}
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className="w-full flex items-center gap-2 p-2 rounded hover:bg-[#2a2a2a] transition-colors text-left group"
          >
            <item.icon className="w-4 h-4 text-[#888] group-hover:text-[#00B8D4]" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-[#ccc] group-hover:text-[#fff]">{item.label}</div>
              {item.description && (
                <div className="text-xs text-[#666] group-hover:text-[#888]">{item.description}</div>
              )}
            </div>
            <ChevronRight className="w-3 h-3 text-[#666] group-hover:text-[#00B8D4]" />
          </button>
        ))}
      </div>
    </div>
  )
}

// Enhanced Occlusion Analysis Card with Hover
function OcclusionAnalysisCard() {
  const { activeTool, setActiveTool } = useDentalStore()
  const [isHovered, setIsHovered] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  const handleMouseEnter = (event: React.MouseEvent) => {
    setIsHovered(true)
    const rect = event.currentTarget.getBoundingClientRect()
    setMenuPosition({ x: rect.right, y: rect.top })
  }

  const handleMenuItemClick = (itemId: string) => {
    switch (itemId) {
      case 'detailed-analysis':
        setActiveTool('occlusal')
        break
      case 'export-report':
        console.log('Export occlusion report')
        break
      case 'compare-cases':
        console.log('Compare with other cases')
        break
      case 'reset-analysis':
        console.log('Reset occlusion analysis')
        break
    }
    setIsHovered(false)
  }

  const menuItems = [
    { id: 'detailed-analysis', label: 'Detailed Analysis', icon: BarChart3, description: 'View comprehensive occlusion data' },
    { id: 'export-report', label: 'Export Report', icon: Download, description: 'Generate PDF occlusion report' },
    { id: 'compare-cases', label: 'Compare Cases', icon: Layers, description: 'Compare with previous treatments' },
    { id: 'reset-analysis', label: 'Reset Analysis', icon: RotateCcw, description: 'Clear current analysis data' },
  ]

  return (
    <>
      <Card 
        className="bg-[#2a2a2a] border-[#444] mb-4 relative group cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-[#00B8D4] flex items-center gap-2">
              <Target className="w-4 h-4" />
              Occlusion Analysis
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTool(activeTool === 'occlusal' ? null : 'occlusal')}
                className={`h-8 px-2 ${activeTool === 'occlusal' ? 'bg-[#00B8D4] text-[#1a1a1a]' : 'text-[#888] hover:text-[#fff]'}`}
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
              <MoreVertical className="w-4 h-4 text-[#666] group-hover:text-[#00B8D4] transition-colors" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-xs text-[#ccc] space-y-3">
          <div className="flex items-center justify-between">
            <span>Overall Score</span>
            <div className="flex items-center gap-2">
              <Progress value={occlusionAnalysis.overallScore} className="w-16 h-2" />
              <span className="text-[#00B8D4] font-medium">{occlusionAnalysis.overallScore}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[#888]">Contacts</span>
              <div className="mt-1 space-y-1">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="text-[#00B8D4]">{occlusionAnalysis.contacts.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ideal</span>
                  <span className="text-green-400">{occlusionAnalysis.contacts.ideal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Premature</span>
                  <span className="text-yellow-400">{occlusionAnalysis.contacts.premature}</span>
                </div>
                <div className="flex justify-between">
                  <span>Missing</span>
                  <span className="text-red-400">{occlusionAnalysis.contacts.missing}</span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[#888]">Measurements</span>
              <div className="mt-1 space-y-1">
                <div className="flex justify-between">
                  <span>Overjet</span>
                  <span>{occlusionAnalysis.measurements.overjet}mm</span>
                </div>
                <div className="flex justify-between">
                  <span>Overbite</span>
                  <span>{occlusionAnalysis.measurements.overbite}mm</span>
                </div>
                <div className="flex justify-between">
                  <span>Midline</span>
                  <span>{occlusionAnalysis.measurements.midline}mm</span>
                </div>
              </div>
            </div>
          </div>

          {occlusionAnalysis.interferences.length > 0 && (
            <div>
              <span className="text-[#888]">Interferences ({occlusionAnalysis.interferences.length})</span>
              <div className="mt-2 space-y-2">
                {occlusionAnalysis.interferences.slice(0, 2).map((interference, index) => (
                  <div key={index} className="bg-[#1a1a1a] rounded p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Tooth #{interference.tooth}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          interference.severity === 'severe' ? 'border-red-400 text-red-400' :
                          interference.severity === 'moderate' ? 'border-yellow-400 text-yellow-400' :
                          'border-green-400 text-green-400'
                        }`}
                      >
                        {interference.severity}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-[#888]">{interference.description}</p>
                  </div>
                ))}
                {occlusionAnalysis.interferences.length > 2 && (
                  <div className="text-center text-[10px] text-[#666]">
                    +{occlusionAnalysis.interferences.length - 2} more interferences
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <HoverMenu
        isVisible={isHovered}
        position={menuPosition}
        title="Occlusion Analysis Options"
        items={menuItems}
        onItemClick={handleMenuItemClick}
      />
    </>
  )
}

// Treatment Progress Card
function TreatmentProgressCard() {
  const [isHovered, setIsHovered] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  const handleMouseEnter = (event: React.MouseEvent) => {
    setIsHovered(true)
    const rect = event.currentTarget.getBoundingClientRect()
    setMenuPosition({ x: rect.right, y: rect.top })
  }

  const handleMenuItemClick = (itemId: string) => {
    switch (itemId) {
      case 'view-timeline':
        console.log('View treatment timeline')
        break
      case 'adjust-plan':
        console.log('Adjust treatment plan')
        break
      case 'predict-outcome':
        console.log('Predict treatment outcome')
        break
      case 'export-progress':
        console.log('Export progress report')
        break
    }
    setIsHovered(false)
  }

  const menuItems = [
    { id: 'view-timeline', label: 'View Timeline', icon: Activity, description: 'See detailed step-by-step progress' },
    { id: 'adjust-plan', label: 'Adjust Plan', icon: Edit, description: 'Modify treatment sequence' },
    { id: 'predict-outcome', label: 'Predict Outcome', icon: TrendingUp, description: 'AI-powered outcome prediction' },
    { id: 'export-progress', label: 'Export Report', icon: Download, description: 'Generate progress PDF' },
  ]

  return (
    <>
      <Card 
        className="bg-[#2a2a2a] border-[#444] mb-4 relative group cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-[#00B8D4] flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Treatment Progress
            </CardTitle>
            <MoreVertical className="w-4 h-4 text-[#666] group-hover:text-[#00B8D4] transition-colors" />
          </div>
        </CardHeader>
        <CardContent className="text-xs text-[#ccc] space-y-3">
          <div>
            <div className="flex justify-between mb-2">
              <span>Step {treatmentProgress.completedSteps} of {treatmentProgress.totalSteps}</span>
              <span className="text-[#00B8D4]">{Math.round((treatmentProgress.completedSteps / treatmentProgress.totalSteps) * 100)}%</span>
            </div>
            <Progress value={(treatmentProgress.completedSteps / treatmentProgress.totalSteps) * 100} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[#888]">Current Phase</span>
              <p className="font-medium text-[#00B8D4]">{treatmentProgress.currentPhase}</p>
            </div>
            <div>
              <span className="text-[#888]">Next Milestone</span>
              <p className="font-medium">{treatmentProgress.nextMilestone}</p>
            </div>
          </div>

          <div>
            <span className="text-[#888]">Estimated Completion</span>
            <p className="font-medium">{treatmentProgress.estimatedCompletion}</p>
          </div>
        </CardContent>
      </Card>

      <HoverMenu
        isVisible={isHovered}
        position={menuPosition}
        title="Treatment Progress Options"
        items={menuItems}
        onItemClick={handleMenuItemClick}
      />
    </>
  )
}

// Articulator Controls Card
function ArticulatorControlsCard() {
  const { activeTool, setActiveTool } = useDentalStore()
  const [jawPosition, setJawPosition] = useState('centric')
  const [isHovered, setIsHovered] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

  const handleMouseEnter = (event: React.MouseEvent) => {
    setIsHovered(true)
    const rect = event.currentTarget.getBoundingClientRect()
    setMenuPosition({ x: rect.right, y: rect.top })
  }

  const handleMenuItemClick = (itemId: string) => {
    switch (itemId) {
      case 'record-centric':
        setJawPosition('centric')
        console.log('Record centric relation')
        break
      case 'simulate-movement':
        console.log('Simulate jaw movement')
        break
      case 'analyze-path':
        console.log('Analyze condylar path')
        break
      case 'export-articulator':
        console.log('Export articulator settings')
        break
    }
    setIsHovered(false)
  }

  const menuItems = [
    { id: 'record-centric', label: 'Record Centric', icon: Target, description: 'Capture centric occlusion position' },
    { id: 'simulate-movement', label: 'Simulate Movement', icon: RotateCcw, description: 'Animate jaw motion patterns' },
    { id: 'analyze-path', label: 'Analyze Path', icon: Activity, description: 'Study condylar guidance' },
    { id: 'export-articulator', label: 'Export Settings', icon: Download, description: 'Save articulator configuration' },
  ]

  return (
    <>
      <Card 
        className="bg-[#2a2a2a] border-[#444] mb-4 relative group cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-[#00B8D4] flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Virtual Articulator
            </CardTitle>
            <MoreVertical className="w-4 h-4 text-[#666] group-hover:text-[#00B8D4] transition-colors" />
          </div>
        </CardHeader>
        <CardContent className="text-xs text-[#ccc] space-y-3">
          <div>
            <span className="text-[#888]">Jaw Position</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[
                { id: 'centric', label: 'Centric', icon: Target },
                { id: 'right', label: 'Right Lateral', icon: ChevronDown },
                { id: 'left', label: 'Left Lateral', icon: ChevronDown },
                { id: 'protrusive', label: 'Protrusive', icon: TrendingUp },
              ].map((position) => (
                <Button
                  key={position.id}
                  variant="outline"
                  size="sm"
                  onClick={() => setJawPosition(position.id)}
                  className={`h-8 text-[10px] ${
                    jawPosition === position.id
                      ? 'bg-[#00B8D4] border-[#00B8D4] text-[#1a1a1a]'
                      : 'border-[#444] text-[#888] hover:border-[#666]'
                  }`}
                >
                  <position.icon className="w-3 h-3 mr-1" />
                  {position.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#888]">Disocclusion</span>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              <span className="text-[10px]">Canine Guidance</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <HoverMenu
        isVisible={isHovered}
        position={menuPosition}
        title="Articulator Controls"
        items={menuItems}
        onItemClick={handleMenuItemClick}
      />
    </>
  )
}

export default function CaseSidebar() {
  const { activeTab, setActiveTab, selectedTooth, currentCase } = useDentalStore()
  const [translateFrom, setTranslateFrom] = useState('English')
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [hoveredPosition, setHoveredPosition] = useState({ x: 0, y: 0 })

  return (
    <aside className="w-80 bg-[#1a1a1a] border-l border-[#333] flex flex-col">
      {/* Patient Header */}
      <div className="p-4 border-b border-[#333]">
        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12 border-2 border-[#00B8D4]">
            <AvatarFallback className="bg-[#2a2a2a] text-[#00B8D4]">
              NN
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#fff] truncate">Nilofer N</h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#888] hover:text-[#fff]">
                  <Menu className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#00B8D4] hover:text-[#00B8D4]">
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-[#888]">CASE #1218331 (ONE)</p>
            <p className="text-xs text-[#666]">Version 1-2 | 12/06/2022</p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Badge className="bg-[#00B8D420] text-[#00B8D4] border-[#00B8D440] hover:bg-[#00B8D430]">
            <Check className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        </div>
      </div>

      {/* Selected Tooth Info */}
      {selectedTooth && (
        <div className="p-4 border-b border-[#333]">
          <ToothInfoCard tooth={selectedTooth} />
        </div>
      )}

      {/* Occlusion Analysis Section */}
      <div className="p-4 border-b border-[#333] space-y-4">
        <OcclusionAnalysisCard />
        <TreatmentProgressCard />
        <ArticulatorControlsCard />
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'comments' | 'notes' | 'media' | 'occlusion')} className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-4">
          <TabsList className="w-full bg-[#2a2a2a] grid grid-cols-4">
            <TabsTrigger
              value="comments"
              className="data-[state=active]:bg-[#00B8D4] data-[state=active]:text-[#1a1a1a]"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Comments
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="data-[state=active]:bg-[#00B8D4] data-[state=active]:text-[#1a1a1a]"
            >
              <FileText className="w-4 h-4 mr-1" />
              Notes
            </TabsTrigger>
            <TabsTrigger
              value="occlusion"
              className="data-[state=active]:bg-[#00B8D4] data-[state=active]:text-[#1a1a1a]"
            >
              <Target className="w-4 h-4 mr-1" />
              Occlusion
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="data-[state=active]:bg-[#00B8D4] data-[state=active]:text-[#1a1a1a]"
            >
              <ImageIcon className="w-4 h-4 mr-1" />
              Media
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="comments" className="flex-1 min-h-0 m-0">
          <ScrollArea className="h-full px-4 py-4">
            <div className="space-y-3">
              {sampleComments.map((comment) => (
                <div key={comment.id} className="bg-[#2a2a2a] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${comment.role === 'doctor' ? 'text-[#00B8D4]' : 'text-[#00CED1]'}`}>
                        {comment.author}
                      </span>
                      <Badge variant="outline" className="text-[10px] border-[#444] text-[#888]">
                        {comment.role}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-[#888] mb-2">{comment.timestamp}</p>
                  <p className="text-sm text-[#ccc] leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="notes" className="flex-1 min-h-0 m-0">
          <ScrollArea className="h-full px-4 py-4">
            <div className="space-y-3">
              {sampleNotes.map((note) => (
                <div key={note.id} className="bg-[#2a2a2a] rounded-lg p-3">
                  <h4 className="text-sm font-medium text-[#00B8D4] mb-2">{note.title}</h4>
                  <ul className="text-sm text-[#ccc] space-y-1">
                    {note.content.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-[#00B8D4]">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="media" className="flex-1 min-h-0 m-0">
          <ScrollArea className="h-full px-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-[#2a2a2a] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#333] transition-colors group"
                >
                  <ImageIcon className="w-8 h-8 text-[#666] group-hover:text-[#888] transition-colors" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="occlusion" className="flex-1 min-h-0 m-0">
          <ScrollArea className="h-full px-4 py-4">
            <div className="space-y-4">
              {/* Contact Points Analysis with Hover */}
              <Card 
                className="bg-[#2a2a2a] border-[#444] group cursor-pointer"
                onMouseEnter={(e) => {
                  setHoveredItem('contact-points')
                  const rect = e.currentTarget.getBoundingClientRect()
                  setHoveredPosition({ x: rect.right, y: rect.top })
                }}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-[#00B8D4] flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Contact Points
                    </CardTitle>
                    <MoreVertical className="w-4 h-4 text-[#666] group-hover:text-[#00B8D4] transition-colors" />
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-[#ccc] space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[#888]">Upper Contacts</span>
                      <div className="mt-1 space-y-1">
                        <div className="flex justify-between">
                          <span>Molars</span>
                          <span className="text-green-400">8/8</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Premolars</span>
                          <span className="text-green-400">8/8</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Canines</span>
                          <span className="text-yellow-400">2/4</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="text-[#888]">Lower Contacts</span>
                      <div className="mt-1 space-y-1">
                        <div className="flex justify-between">
                          <span>Molars</span>
                          <span className="text-green-400">8/8</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Premolars</span>
                          <span className="text-green-400">8/8</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Canines</span>
                          <span className="text-green-400">4/4</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Articulator Settings with Hover */}
              <Card 
                className="bg-[#2a2a2a] border-[#444] group cursor-pointer"
                onMouseEnter={(e) => {
                  setHoveredItem('articulator-settings')
                  const rect = e.currentTarget.getBoundingClientRect()
                  setHoveredPosition({ x: rect.right, y: rect.top })
                }}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-[#00B8D4] flex items-center gap-2">
                      <Ruler className="w-4 h-4" />
                      Articulator Settings
                    </CardTitle>
                    <MoreVertical className="w-4 h-4 text-[#666] group-hover:text-[#00B8D4] transition-colors" />
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-[#ccc] space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[#888]">Bennett Angle</span>
                      <p className="font-medium">15°</p>
                    </div>
                    <div>
                      <span className="text-[#888]">Immediate Side Shift</span>
                      <p className="font-medium">0.8mm</p>
                    </div>
                    <div>
                      <span className="text-[#888]">Protrusive Guidance</span>
                      <p className="font-medium">45°</p>
                    </div>
                    <div>
                      <span className="text-[#888]">Centric Relation</span>
                      <p className="font-medium text-green-400">Recorded</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Treatment Goals with Hover */}
              <Card 
                className="bg-[#2a2a2a] border-[#444] group cursor-pointer"
                onMouseEnter={(e) => {
                  setHoveredItem('treatment-goals')
                  const rect = e.currentTarget.getBoundingClientRect()
                  setHoveredPosition({ x: rect.right, y: rect.top })
                }}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-[#00B8D4] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Treatment Goals
                    </CardTitle>
                    <MoreVertical className="w-4 h-4 text-[#666] group-hover:text-[#00B8D4] transition-colors" />
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-[#ccc]">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                      <span>Class I molar relationship</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                      <span>Ideal overjet (2-3mm)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-3 h-3 text-yellow-400" />
                      <span>Canine guidance in lateral excursions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-3 h-3 text-red-400" />
                      <span>Minimize interferences</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

      </Tabs>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[#333] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#888]">
            <Clock className="w-3 h-3" />
            <span>Version 1-2 | 12/13/2022</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#00B8D4] hover:text-[#00B8D4] hover:bg-[#00B8D420]"
          >
            <Languages className="w-4 h-4 mr-1" />
            Translate
            <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
        </div>

        <Button className="w-full bg-[#00B8D4] hover:bg-[#00A5C0] text-[#1a1a1a] font-medium">
          <ExternalLink className="w-4 h-4 mr-2" />
          Doctor Portal
        </Button>
      </div>

      {/* Hover Menus for Occlusion Tab */}
      <HoverMenu
        isVisible={hoveredItem === 'contact-points'}
        position={hoveredPosition}
        title="Contact Points Options"
        items={[
          { id: 'view-all-contacts', label: 'View All Contacts', icon: Eye, description: 'Show all tooth contacts in 3D' },
          { id: 'highlight-interferences', label: 'Highlight Interferences', icon: AlertTriangle, description: 'Show problematic contact points' },
          { id: 'export-contact-data', label: 'Export Contact Data', icon: Download, description: 'Download contact analysis' },
          { id: 'adjust-contacts', label: 'Adjust Contacts', icon: Settings, description: 'Modify contact point settings' },
        ]}
        onItemClick={(itemId) => {
          switch (itemId) {
            case 'view-all-contacts':
              console.log('View all contacts')
              break
            case 'highlight-interferences':
              console.log('Highlight interferences')
              break
            case 'export-contact-data':
              console.log('Export contact data')
              break
            case 'adjust-contacts':
              console.log('Adjust contacts')
              break
          }
          setHoveredItem(null)
        }}
      />

      <HoverMenu
        isVisible={hoveredItem === 'articulator-settings'}
        position={hoveredPosition}
        title="Articulator Options"
        items={[
          { id: 'calibrate-articulator', label: 'Calibrate Articulator', icon: Settings, description: 'Adjust articulator parameters' },
          { id: 'record-new-position', label: 'Record New Position', icon: Target, description: 'Capture current jaw position' },
          { id: 'simulate-mandibular', label: 'Simulate Movement', icon: RotateCcw, description: 'Animate jaw motion' },
          { id: 'export-settings', label: 'Export Settings', icon: Download, description: 'Save articulator configuration' },
        ]}
        onItemClick={(itemId) => {
          switch (itemId) {
            case 'calibrate-articulator':
              console.log('Calibrate articulator')
              break
            case 'record-new-position':
              console.log('Record new position')
              break
            case 'simulate-mandibular':
              console.log('Simulate mandibular movement')
              break
            case 'export-settings':
              console.log('Export articulator settings')
              break
          }
          setHoveredItem(null)
        }}
      />

      <HoverMenu
        isVisible={hoveredItem === 'treatment-goals'}
        position={hoveredPosition}
        title="Treatment Goals Options"
        items={[
          { id: 'edit-goals', label: 'Edit Goals', icon: Edit, description: 'Modify treatment objectives' },
          { id: 'add-new-goal', label: 'Add New Goal', icon: Check, description: 'Create additional treatment goal' },
          { id: 'prioritize-goals', label: 'Prioritize Goals', icon: TrendingUp, description: 'Reorder goal importance' },
          { id: 'generate-report', label: 'Generate Report', icon: FileText, description: 'Create goals progress report' },
        ]}
        onItemClick={(itemId) => {
          switch (itemId) {
            case 'edit-goals':
              console.log('Edit treatment goals')
              break
            case 'add-new-goal':
              console.log('Add new treatment goal')
              break
            case 'prioritize-goals':
              console.log('Prioritize treatment goals')
              break
            case 'generate-report':
              console.log('Generate treatment goals report')
              break
          }
          setHoveredItem(null)
        }}
      />

    </aside>
  )
}
