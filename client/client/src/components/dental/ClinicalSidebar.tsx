'use client'

import { useState } from 'react'
import { Eye, Layers, Grid3X3, Ruler, MoreHorizontal, HelpCircle, AlertTriangle, Smile } from 'lucide-react'
import { useDentalStore } from '@/store/dental-store'

export default function ClinicalSidebar() {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [submenuHover, setSubmenuHover] = useState(false)
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null)
  const [gumTransparency, setGumTransparency] = useState(45)
  const [gridDensity, setGridDensity] = useState(5)
  const [gridEnabled, setGridEnabled] = useState(true)
  const [toothIdsVisible, setToothIdsVisible] = useState(true)
  const { activeTool, setActiveTool, gridPosition, setGridPosition } = useDentalStore()

  const tools = [
    {
      id: 'view',
      icon: Eye,
      label: 'View',
      type: 'visibility'
    },
    {
      id: 'tooth-ids',
      icon: Smile,
      label: 'Tooth IDs',
      type: 'toggle'
    },
    {
      id: 'superimpose',
      icon: Layers,
      label: 'Superimpose',
      type: 'layers'
    },
    {
      id: 'grid',
      icon: Grid3X3,
      label: 'Grid',
      type: 'measurement'
    },
    {
      id: 'measure',
      icon: Ruler,
      label: 'Measure',
      type: 'measure'
    },
    {
      id: 'occlusal',
      icon: Eye,
      label: 'Occlusal',
      type: 'occlusal'
    },
    {
      id: 'limits',
      icon: AlertTriangle,
      label: 'Limits & Alerts',
      type: 'alerts'
    },
  ]

  return (
    <aside 
      className={`bg-card border-r border-outline-variant/30 flex flex-col items-start py-4 gap-1 z-40 overflow-visible transition-all duration-500 ease-out flex-shrink-0 ${expanded ? 'w-[220px]' : 'w-[72px]'}`}
      onMouseEnter={() => {
        setExpanded(true)
        // Clear any pending close timeout
        if (closeTimeout) {
          clearTimeout(closeTimeout)
          setCloseTimeout(null)
        }
      }}
      onMouseLeave={() => {
        // Delay closing to allow mouse to move to submenu
        const timeout = setTimeout(() => {
          if (!submenuHover) {
            setExpanded(false)
            setHoveredTool(null)
          }
        }, 150)
        setCloseTimeout(timeout)
      }}
    >
      {/* Tool Buttons */}
      {tools.map((tool) => {
        const Icon = tool.icon
        const isHovered = hoveredTool === tool.id
        
        return (
          <div
          key={tool.id}
          className="relative sidebar-item w-full px-3"
          onMouseEnter={() => setHoveredTool(tool.id)}
        >
            {tool.type === 'toggle' ? (
              <button
                onClick={() => setToothIdsVisible(!toothIdsVisible)}
                className={`w-full h-11 rounded-lg flex items-center px-3 transition-all gap-3 ${
                  toothIdsVisible
                    ? 'bg-primary-container text-primary'
                    : 'text-outline hover:bg-primary-container hover:text-primary'
                }`}
              >
                <Icon size={24} className="flex-shrink-0" />
                <span className={`text-sm font-bold whitespace-nowrap transition-all duration-200 ${expanded ? 'opacity-100 max-w-[170px]' : 'opacity-0 max-w-0 overflow-hidden'}`}>
                  {tool.label}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
                className={`w-full h-11 rounded-lg flex items-center px-3 transition-all gap-3 ${
                  activeTool === tool.id
                    ? 'bg-primary-container text-primary'
                    : 'text-outline hover:bg-primary-container hover:text-primary'
                }`}
              >
                <Icon size={24} className="flex-shrink-0" />
                <span className={`text-sm font-bold whitespace-nowrap transition-all duration-200 ${expanded ? 'opacity-100 max-w-[170px]' : 'opacity-0 max-w-0 overflow-hidden'}`}>
                  {tool.label}
                </span>
              </button>
            )}

            {/* Nested Menus */}
            {isHovered && tool.type !== 'toggle' && (
              <div
                className="absolute top-0 left-full ml-2 w-64 bg-card shadow-2xl border border-outline-variant/30 rounded-xl p-4 z-50 animate-in fade-in slide-in-from-left-2 duration-300"
                onMouseEnter={() => {
                  setSubmenuHover(true)
                  // Clear any pending close timeout
                  if (closeTimeout) {
                    clearTimeout(closeTimeout)
                    setCloseTimeout(null)
                  }
                }}
                onMouseLeave={() => {
                  setSubmenuHover(false)
                  // Delay closing submenu to allow mouse movement
                  const timeout = setTimeout(() => {
                    setHoveredTool(null)
                  }, 100)
                  setCloseTimeout(timeout)
                }}
              >
                {tool.id === 'view' && (
                  <>
                    <h4 className="text-[10px] font-bold uppercase text-outline mb-3 tracking-widest">Visibility Settings</h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between cursor-pointer group/label">
                        <span className="text-sm font-medium text-on-surface-variant group-hover/label:text-on-surface">Teeth and gums</span>
                        <input type="radio" name="view_mode" defaultChecked className="w-4 h-4 accent-primary" />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer group/label">
                        <span className="text-sm font-medium text-on-surface-variant group-hover/label:text-on-surface">Teeth only</span>
                        <input type="radio" name="view_mode" className="w-4 h-4 accent-primary" />
                      </label>
                    </div>
                    <div className="mt-4 pt-4 border-t border-outline-variant/20">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-bold uppercase text-outline tracking-widest">Gum Transparency</label>
                        <span className="text-[10px] font-black text-primary">{gumTransparency}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={gumTransparency}
                        onChange={(e) => setGumTransparency(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>
                  </>
                )}

                {tool.id === 'superimpose' && (
                  <>
                    <h4 className="text-[10px] font-bold uppercase text-outline mb-3 tracking-widest">Superimpose Scans</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-surface-container p-2 rounded-lg">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-on-surface">Initial Scan</span>
                          <span className="text-[8px] text-outline">Jan 12, 2024</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-8 h-4 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between bg-surface-container p-2 rounded-lg border border-primary/20">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-on-surface">Current State</span>
                          <span className="text-[8px] text-outline">Active Step 8</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-8 h-4 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {tool.id === 'grid' && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-on-surface">Show 3D Grid</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gridEnabled}
                          onChange={() => setGridEnabled(!gridEnabled)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase text-outline block tracking-widest">Density</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={gridDensity}
                          onChange={(e) => setGridDensity(Number(e.target.value))}
                          className="flex-1 accent-primary cursor-pointer"
                        />
                        <span className="text-xs font-bold text-on-surface whitespace-nowrap">{gridDensity}mm</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-outline-variant/20">
                      <div className="space-y-3">
                        <label className="flex items-center justify-between cursor-pointer group/label">
                          <span className="text-sm font-medium text-on-surface-variant group-hover/label:text-on-surface">Bring to front</span>
                          <input type="radio" name="grid_pos" value="front" checked={gridPosition === 'front'} onChange={() => setGridPosition('front')} className="w-4 h-4 accent-primary" />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group/label">
                          <span className="text-sm font-medium text-on-surface-variant group-hover/label:text-on-surface">Send to back</span>
                          <input type="radio" name="grid_pos" value="back" checked={gridPosition === 'back'} onChange={() => setGridPosition('back')} className="w-4 h-4 accent-primary" />
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {tool.id === 'measure' && (
                  <>
                    <h4 className="text-[10px] font-bold uppercase text-outline mb-3 tracking-widest">Measurement Points</h4>
                    <div className="flex items-center justify-between bg-surface-container p-2 rounded-lg">
                      <span className="text-xs font-black text-on-surface">0 Points</span>
                      <div className="flex gap-1">
                        <button className="w-8 h-8 rounded bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-center text-primary hover:bg-primary-container transition-colors">
                          <span className="text-lg font-bold">+</span>
                        </button>
                        <button className="w-8 h-8 rounded bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-center text-outline hover:bg-red-50 hover:text-red-500 transition-colors">
                          <span className="text-lg font-bold">−</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {tool.id === 'limits' && (
                  <>
                    <h4 className="text-[10px] font-bold uppercase text-outline mb-3 tracking-widest">Limits & Alerts</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-on-surface">Movement Limits</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-8 h-4 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase text-outline block tracking-widest">Max Movement</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0.1"
                            max="5.0"
                            step="0.1"
                            defaultValue="2.5"
                            className="flex-1 accent-primary cursor-pointer"
                          />
                          <span className="text-xs font-bold text-on-surface whitespace-nowrap">2.5mm</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-surface-container p-2 rounded-lg">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-on-surface">Collision Alerts</span>
                          <span className="text-[8px] text-outline">Real-time detection</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-8 h-4 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between bg-surface-container p-2 rounded-lg">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-on-surface">Boundary Warnings</span>
                          <span className="text-[8px] text-outline">Treatment zone limits</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-8 h-4 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Help Button */}
      <div className="w-full px-3 mt-auto">
        <button
          onClick={() => setActiveTool(activeTool === 'help' ? null : 'help')}
          className={`w-full h-11 rounded-lg flex items-center px-3 transition-all gap-3 ${
            activeTool === 'help'
              ? 'bg-primary-container text-primary'
              : 'text-outline hover:bg-primary-container hover:text-primary'
          }`}
        >
          <HelpCircle size={24} className="flex-shrink-0" />
          <span className={`text-sm font-bold whitespace-nowrap transition-all duration-200 ${expanded ? 'opacity-100 max-w-[170px]' : 'opacity-0 max-w-0 overflow-hidden'}`}>
            Help
          </span>
        </button>
      </div>
    </aside>
  )
}
