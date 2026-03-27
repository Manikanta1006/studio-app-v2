'use client'

import { Bell, Settings } from 'lucide-react'

export default function TopAppBar() {
  return (
    <header className="bg-white border-b border-outline-variant/30 flex justify-between items-center w-full px-8 h-16 z-50 flex-shrink-0">
      {/* Left side: Logo and Navigation */}
      <div className="flex items-center gap-10">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#00BFA5] to-[#009688] rounded-lg flex items-center justify-center text-white font-bold text-lg">
            ⊕
          </div>
          <span className="text-lg font-extrabold uppercase tracking-tighter text-on-surface">Clinical Curator</span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex gap-6 h-full border-l border-outline-variant/20 pl-10">
          <a 
            className="flex items-center px-4 h-16 border-b-2 border-primary text-sm font-bold text-primary transition-colors" 
            href="#"
          >
            Case #8821
          </a>
          <a 
            className="flex items-center px-4 h-16 border-b-2 border-transparent text-sm font-bold text-outline hover:text-on-surface transition-colors" 
            href="#"
          >
            Digital Twin
          </a>
          <a 
            className="flex items-center px-4 h-16 border-b-2 border-transparent text-sm font-bold text-outline hover:text-on-surface transition-colors" 
            href="#"
          >
            Diagnostic View
          </a>
        </nav>
      </div>

      {/* Right side: Actions and Profile */}
      <div className="flex items-center gap-6">
        {/* Notification and Settings buttons */}
        <div className="flex gap-4">
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors text-on-surface-variant hover:text-primary">
            <Bell size={20} />
          </button>
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors text-on-surface-variant hover:text-primary">
            <Settings size={20} />
          </button>
        </div>

        {/* Profile Section */}
        <div className="flex items-center gap-3 border-l border-outline-variant/30 pl-6">
          <div className="text-right">
            <p className="text-xs font-bold text-on-surface">Dr. Julian Vance</p>
            <p className="text-[10px] text-outline font-medium">Lead Orthodontist</p>
          </div>
          <img
            alt="Profile"
            className="w-9 h-9 rounded-full object-cover border border-outline-variant/30"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEzAPXxAltU0S39N1DA62YDqcB8W0wBp-pTjiwiMt2FTM6UaYRrJLOFCZ-kt_7Oa9ljJnKPc0hg2nZE9SQGmCF8rWjX77C86n1TsKYX0D1xNoHtExeBcyAhsqBIzH45iyF7ozjXZhLdzrOvULa1E8CuoQC7HCvOM7yMG0SCqilZ00mfcykoteGB7CSG6BohcUtpXW7TJFg-OSjDmMxjGbDUfT4eKefaoMKFp9FNrfJ27AvDLZoHII2nD4NHoI94KPbFPvuwSKc_FyL"
          />
        </div>
      </div>
    </header>
  )
}
