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
} from 'lucide-react'
import { useDentalStore, ToothData } from '@/store/dental-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Sample comments data
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

export default function CaseSidebar() {
  const { activeTab, setActiveTab, selectedTooth, currentCase } = useDentalStore()
  const [translateFrom, setTranslateFrom] = useState('English')

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

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'comments' | 'notes' | 'media')} className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-4">
          <TabsList className="w-full bg-[#2a2a2a]">
            <TabsTrigger
              value="comments"
              className="flex-1 data-[state=active]:bg-[#00B8D4] data-[state=active]:text-[#1a1a1a]"
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Comments
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="flex-1 data-[state=active]:bg-[#00B8D4] data-[state=active]:text-[#1a1a1a]"
            >
              <FileText className="w-4 h-4 mr-1" />
              Notes
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="flex-1 data-[state=active]:bg-[#00B8D4] data-[state=active]:text-[#1a1a1a]"
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
    </aside>
  )
}
