'use client'

import { useState } from 'react'
import { Eye, Layers, Grid3X3, Ruler, MoreHorizontal, HelpCircle } from 'lucide-react'
import { useDentalStore } from '@/lib/store/dental-store'

export default function ClinicalSidebar() {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null)
  const [gumTransparency, setGumTransparency] = useState(45)
  const [gridDensity, setGridDensity] = useState(5)
  const [gridEnabled, setGridEnabled] = useState(true)
  const [toothIdsVisible, setToothIdsVisible] = useState(true)
  const { activeTool, setActiveTool } = useDentalStore()

  const tools = [
    {
      id: 'view',
      icon: Eye,
      label: 'View',
      type: 'visibility'
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
  ]

  return (
    <aside 
      className="bg-white border-r border-outline-variant/30 flex flex-col items-start py-4 gap-1 z-40 overflow-visible w-72 hover:w-72 transition-all duration-300 group"
      onMouseLeave={() => setHoveredTool(null)}
    >
      {/* Tool Buttons */}
      {tools.map((tool) => {
        const Icon = tool.icon
        const isHovered = hoveredTool === tool.id
        
        return (
          <div key={tool.id} className="relative sidebar-item w-full px-3">
            <button
              onClick={() => setActiveTool(tool.id)}
              onMouseEnter={() => setHoveredTool(tool.id)}
              className={`w-full h-11 rounded-lg flex items-center px-3 transition-all duration-300 ease-out ${
                activeTool === tool.id
                  ? 'bg-primary-container text-primary'
                  : 'text-outline hover:bg-primary-container hover:text-primary'
              }`}
            >
              <Icon size={24} className="flex-shrink-0" />
              <span className="ml-3 text-sm font-bold whitespace-nowrap">{tool.label}</span>
            </button>

            {/* Nested Menus */}
            {isHovered && (
              <div className="absolute top-0 left-full ml-2 w-64 bg-white shadow-2xl border border-outline-variant/30 rounded-xl p-4 z-50 animate-in fade-in slide-in-from-left-2 duration-300">
                {tool.id === 'view' && (
                  <>
                    <h4 className="text-[10px] font-bold uppercase text-outline mb-3 tracking-widest">Visibility Settings</h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between cursor-pointer group/label">
                        <span className="text-sm font-medium text-on-surface-variant group-hover/label:text-on-surface">Teeth and gums</span>
                        <input type="radio" name="view_mode" defaultChecked className="w-4 h-4" />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer group/label">
                        <span className="text-sm font-medium text-on-surface-variant group-hover/label:text-on-surface">Teeth only</span>
                        <input type="radio" name="view_mode" className="w-4 h-4" />
                      </label>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-outline-variant/10">
                        <span className="text-sm font-medium text-on-surface-variant">Tooth IDs</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={toothIdsVisible}
                            onChange={() => setToothIdsVisible(!toothIdsVisible)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
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
                          <div className="w-8 h-4 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between bg-surface-container p-2 rounded-lg border border-primary/20">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-on-surface">Current State</span>
                          <span className="text-[8px] text-outline">Active Step 8</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-8 h-4 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
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
                        <div className="w-9 h-5 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
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
                  </>
                )}

                {tool.id === 'measure' && (
                  <>
                    <h4 className="text-[10px] font-bold uppercase text-outline mb-3 tracking-widest">Measurement Points</h4>
                    <div className="flex items-center justify-between bg-surface-container p-2 rounded-lg">
                      <span className="text-xs font-black text-on-surface">0 Points</span>
                      <div className="flex gap-1">
                        <button className="w-8 h-8 rounded bg-white border border-outline-variant/20 flex items-center justify-center text-primary hover:bg-primary-container transition-colors">
                          <span className="text-lg font-bold">+</span>
                        </button>
                        <button className="w-8 h-8 rounded bg-white border border-outline-variant/20 flex items-center justify-center text-outline hover:bg-red-50 hover:text-red-500 transition-colors">
                          <span className="text-lg font-bold">−</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Navigation / More Options */}
      <div className="relative sidebar-item w-full px-3 mt-auto">
        <button
          onMouseEnter={() => setHoveredTool('navigation')}
          className="w-full h-11 rounded-lg flex items-center px-3 text-outline hover:bg-primary-container hover:text-primary transition-all duration-300 ease-out"
        >
          <MoreHorizontal size={24} className="flex-shrink-0" />
          <span className="ml-3 text-sm font-bold whitespace-nowrap">Navigation</span>
        </button>

        {hoveredTool === 'navigation' && (
          <div className="absolute bottom-0 left-full ml-2 w-64 bg-white shadow-2xl border border-outline-variant/30 rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="flex flex-col">
              <button className="px-4 py-3 text-left text-sm font-medium text-on-surface-variant hover:bg-primary-container hover:text-primary transition-colors flex items-center gap-3 border-b border-outline-variant/10">
                <span className="text-lg">✓</span>
                Treatment overview
              </button>
              <button className="px-4 py-3 text-left text-sm font-medium text-on-surface-variant hover:bg-primary-container hover:text-primary transition-colors flex items-center gap-3 border-b border-outline-variant/10">
                <span className="text-lg">⊞</span>
                Multiview
              </button>
              <button className="px-4 py-3 text-left text-sm font-medium text-on-surface-variant hover:bg-primary-container hover:text-primary transition-colors flex items-center gap-3">
                <span className="text-lg">⇄</span>
                Side-by-side view
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Help Button */}
      <div className="w-full px-3">
        <button className="w-full h-11 rounded-lg flex items-center px-3 text-outline hover:bg-surface-container transition-all duration-300 ease-out">
          <HelpCircle size={24} className="flex-shrink-0" />
          <span className="ml-3 text-sm font-bold whitespace-nowrap">Help</span>
        </button>
      </div>
    </aside>
  )
}
