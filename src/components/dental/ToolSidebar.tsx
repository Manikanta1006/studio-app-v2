'use client'

import {
  Triangle,
  Eye,
  AlertTriangle,
  ArrowRightLeft,
  Grid3X3,
  MoreHorizontal,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { useDentalStore } from '@/store/dental-store'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Tool definitions
const tools = [
  { id: 'ip-distance', name: 'IP distance', icon: Triangle, description: 'Measure interproximal distance' },
  { id: 'view', name: 'View', icon: Eye, description: 'Change view settings' },
  { id: 'limits', name: 'Limits and alerts', icon: AlertTriangle, description: 'Set movement limits and alerts' },
  { id: 'superimpose', name: 'Superimpose', icon: ArrowRightLeft, description: 'Compare before/after' },
  { id: 'grid', name: 'Grid', icon: Grid3X3, description: 'Toggle measurement grid' },
  { id: 'occlusal', name: 'Occlusal', icon: Eye, description: 'Occlusal view with contacts' },
  { id: 'articulator', name: 'Articulator', icon: RotateCcw, description: 'Virtual articulator controls' },
  { id: 'contacts', name: 'Contacts', icon: Target, description: 'Show contact points' },
]

export default function ToolSidebar() {
  const { activeTool, setActiveTool } = useDentalStore()

  return (
    <TooltipProvider>
      <aside className="w-20 bg-[#1a1a1a] border-r border-[#333] flex flex-col items-center py-4">
        <div className="flex-1 flex flex-col gap-2">
          {tools.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
                  className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                    activeTool === tool.id
                      ? 'bg-[#00B8D4] text-[#1a1a1a]'
                      : 'text-[#888] hover:bg-[#2a2a2a] hover:text-[#fff]'
                  }`}
                >
                  <tool.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium truncate max-w-[50px]">
                    {tool.name.split(' ')[0]}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-[#2a2a2a] border-[#444]">
                <p className="font-medium">{tool.name}</p>
                <p className="text-xs text-[#888]">{tool.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {/* More tools */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="w-14 h-14 rounded-lg flex flex-col items-center justify-center gap-1 text-[#888] hover:bg-[#2a2a2a] hover:text-[#fff] transition-colors">
                <MoreHorizontal className="w-5 h-5" />
                <span className="text-[10px]">More</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#2a2a2a] border-[#444]">
              <p>More tools</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator className="my-3 w-12 bg-[#333]" />

        {/* Customize toolbar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="w-14 h-14 rounded-lg flex flex-col items-center justify-center gap-1 text-[#888] hover:bg-[#2a2a2a] hover:text-[#fff] transition-colors">
              <Settings className="w-5 h-5" />
              <span className="text-[10px]">Custom</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-[#2a2a2a] border-[#444]">
            <p>Customize toolbar</p>
          </TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  )
}
