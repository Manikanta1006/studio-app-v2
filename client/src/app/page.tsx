'use client'

import dynamic from 'next/dynamic'
import { Suspense, useState } from 'react'
import { Loader2, Visibility, Layers, Grid3X3, Straighten, MoreHorizontal, HelpCircle, RotateCcw, PlayArrow, SkipBack, SkipForward, FastRewind, FastForward, ChevronRight, Settings, Bell } from 'lucide-react'
import DentalViewer from '@/components/dental/DentalViewer'
import ClinicalSidebar from '@/components/dental/ClinicalSidebar'
import ClinicalFeed from '@/components/dental/ClinicalFeed'
import TopAppBar from '@/components/dental/TopAppBar'

export default function DentalStudio() {
  const [feedCollapsed, setFeedCollapsed] = useState(false)
  const [currentStep, setCurrentStep] = useState(8)

  return (
    <div className="h-screen w-screen bg-[#f5f7f7] flex flex-col overflow-hidden">
      {/* Top App Bar */}
      <TopAppBar />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <ClinicalSidebar />

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col relative bg-gradient-to-br from-[#f0f4f4] to-[#eaeef0] overflow-hidden">
          {/* Viewport */}
          <div className="flex-1 relative bg-[radial-gradient(circle,_#c9d3d0_0.5px,_transparent_0.5px)] bg-[length:24px_24px]">
            <Suspense fallback={
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-[#00BFA5] animate-spin mx-auto mb-4" />
                  <p className="text-[#6C7A76]">Loading 3D Viewer...</p>
                </div>
              </div>
            }>
              <DentalViewer />
            </Suspense>

            {/* Floating Viewport Widgets */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button className="w-10 h-10 bg-white border border-[#BBCAC4]/30 shadow-md rounded-lg flex items-center justify-center text-[#191C1D] hover:bg-[#ECEEEE] transition-colors">
                <RotateCcw size={20} />
              </button>
            </div>

            {/* Focus Indicator */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#BBCAC4]/30 shadow-lg">
              <p className="text-[10px] font-bold text-[#6C7A76] uppercase tracking-widest mb-0.5">Focus Active</p>
              <p className="text-xs font-black text-[#00BFA5]">TOOTH #8 — SUPERIOR DISTAL</p>
            </div>

            {/* Clinical Panel Toggle */}
            <button 
              onClick={() => setFeedCollapsed(!feedCollapsed)}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-[#BBCAC4]/30 w-6 h-14 rounded-l-xl flex items-center justify-center text-[#6C7A76] hover:text-[#00BFA5] shadow-sm z-50 group transition-all"
            >
              <ChevronRight size={20} className={`group-hover:scale-110 transition-transform ${feedCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Bottom Playback Bar */}
          <div className="h-28 bg-white border-t border-[#BBCAC4]/30 px-10 flex items-center justify-between gap-10 z-40">
            {/* CAD Controls */}
            <div className="flex items-center gap-6 border-r border-[#BBCAC4]/20 pr-10">
              <button className="text-[#6C7A76] hover:text-[#00BFA5] transition-all hover:scale-110"><FastRewind size={22} /></button>
              <button className="text-[#6C7A76] hover:text-[#00BFA5] transition-all hover:scale-110"><SkipBack size={22} /></button>
              <button className="w-14 h-14 rounded-full bg-[#00BFA5] text-white flex items-center justify-center shadow-xl shadow-[#00BFA5]/30 hover:scale-105 active:scale-95 transition-all">
                <PlayArrow size={28} fill="white" />
              </button>
              <button className="text-[#6C7A76] hover:text-[#00BFA5] transition-all hover:scale-110"><SkipForward size={22} /></button>
              <button className="text-[#6C7A76] hover:text-[#00BFA5] transition-all hover:scale-110"><FastForward size={22} /></button>
            </div>

            {/* Timeline */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-extrabold text-[#6C7A76] uppercase tracking-widest">Movement Timeline</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold text-[#00BFA5] uppercase tracking-widest">Step {currentStep} / 17</span>
                </div>
              </div>
              <div className="flex items-end gap-1.5 h-12">
                {Array.from({ length: 17 }, (_, i) => {
                  const step = i + 1
                  const isCurrent = step === currentStep
                  const isPast = step < currentStep
                  return (
                    <button
                      key={step}
                      onClick={() => setCurrentStep(step)}
                      className={`flex-1 transition-all cursor-pointer relative group rounded border border-transparent
                        ${isCurrent ? 'h-11 bg-[#00BFA5] ring-4 ring-[#E0F7F5] shadow-lg shadow-[#00BFA5]/20 z-10' : 'h-8 bg-[#ECEEEE]'} 
                        hover:border-[#00BFA5]/30`}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity text-[#00BFA5]">S{step}</span>
                      <span className={`text-[10px] font-black ${isCurrent ? 'text-white' : 'text-[#6C7A76]'}`}>{step}</span>
                      {isPast && <div className="absolute bottom-0 left-0 h-1 bg-[#00BFA5]/40 w-full rounded-b"></div>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="border-l border-[#BBCAC4]/20 pl-10 flex gap-8">
              <div>
                <p className="text-[10px] font-bold text-[#6C7A76] uppercase tracking-wider mb-1">CAD Speed</p>
                <div className="px-3 py-1 bg-[#ECEEEE] rounded-md flex items-center gap-2 cursor-pointer hover:bg-[#E6E8E8] transition-colors">
                  <p className="text-sm font-black text-[#191C1D]">1.25x</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#6C7A76] uppercase tracking-wider mb-1">Dev Rate</p>
                <div className="px-3 py-1 bg-[#ECEEEE] rounded-md">
                  <p className="text-sm font-black text-[#191C1D]">0.25mm</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Clinical Feed Panel */}
        <ClinicalFeed collapsed={feedCollapsed} />
      </div>
    </div>
  )
}
      </main>

      {/* Right Sidebar - Case Information */}
      <CaseSidebar />
    </div>
  )
}
