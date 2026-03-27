'use client'

import { useState } from 'react'
import { Download, Paperclip, AtSign, Smile } from 'lucide-react'

interface ClinicalFeedProps {
  collapsed: boolean
}

export default function ClinicalFeed({ collapsed }: ClinicalFeedProps) {
  const [activeTab, setActiveTab] = useState('comments')
  const [noteText, setNoteText] = useState('')

  return (
    <aside
      className={`border-l border-outline-variant/30 flex flex-col z-30 overflow-hidden transition-all duration-300 ${
        collapsed ? 'w-0' : 'w-[400px]'
      } bg-surface-container-low`}
    >
      {/* Header */}
      <div className="p-6 bg-white border-b border-outline-variant/10">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-black text-on-surface tracking-tight text-sm">CASE ACTIVITY</h3>
          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded uppercase tracking-tighter">
            Verified
          </span>
        </div>
        <p className="text-xs text-outline font-medium">Monitoring clinical changes and feedback</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-outline-variant/10">
        {['comments', 'notes', 'media'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab
                ? 'text-primary border-b-2 border-primary'
                : 'text-outline hover:text-on-surface border-b-2 border-transparent'
            }`}
          >
            {tab === 'comments' && 'Comments'}
            {tab === 'notes' && 'Notes'}
            {tab === 'media' && 'Media'}
          </button>
        ))}
      </div>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 no-scrollbar">
        {/* Comment Card 1 */}
        <div className="group">
          <div className="flex items-start gap-4 mb-2">
            <img
              alt="Dr. Sarah Miller"
              className="w-9 h-9 rounded-full border border-outline-variant/30 object-cover flex-shrink-0"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDgcsnaGJUn8197GhtQTDR54TIyywP1LfB0pk_mHR-jdrb7kftfbxjXLD6sKuhPGQ7LfAaqAejerf3FPRB0AEi8Z0JDa4Ee08EVcYK91X7IJeCOaySqHP9Wdx-DEBHwDGn_9Ni1_oq8KfRHA5M7hb1aAUl9aH9eobwsFRMMEb8wAiEUq5W7y8iqcgbrhFC3soWnRWC0pX2ZDuC-rFTPu7aZoFsrFR6ugw2qQesQhwGROh5-khwLfsNq3m8hmr7xN4pPeXxQkN34tSMZ"
            />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <p className="text-sm font-bold text-on-surface">Dr. Sarah Miller</p>
                <p className="text-[10px] text-outline">10:45 AM</p>
              </div>
              <p className="text-[10px] font-black text-primary uppercase tracking-tighter">Orthodontist</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-outline-variant/20 shadow-sm group-hover:border-primary/30 transition-all cursor-pointer">
            <p className="text-xs leading-relaxed text-on-surface-variant">
              Lower arch distalization looks precise at Step 8. Please ensure the attachment on #19 is verified for maximum surface contact during the next scan.
            </p>
          </div>
        </div>

        {/* Technical Card */}
        <div className="group">
          <div className="flex items-start gap-4 mb-2">
            <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-black text-sm border border-outline-variant/20 flex-shrink-0">
              L4
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <p className="text-sm font-bold text-on-surface">Lab Tech #402</p>
                <p className="text-[10px] text-outline">Yesterday</p>
              </div>
              <p className="text-[10px] font-black text-outline uppercase tracking-tighter">Technical Lab</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-outline-variant/20 shadow-sm group-hover:border-primary/30 transition-all">
            <p className="text-xs leading-relaxed text-on-surface-variant mb-3">
              IGS alignment confirmed. Model exported to fabrication queue for version 8821.
            </p>
            <div className="flex items-center gap-2 p-2.5 bg-surface-container rounded-lg border border-outline-variant/10 group/file cursor-pointer hover:bg-surface-container-high hover:border-primary/20 transition-all">
              <span className="text-primary text-xl">📄</span>
              <span className="text-[11px] font-bold text-on-surface-variant truncate">EXPORT_8821_V3.STL</span>
              <button className="text-outline ml-auto hover:text-primary transition-colors">
                <Download size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Comment Card 2 */}
        <div className="group">
          <div className="flex items-start gap-4 mb-2">
            <img
              alt="Dr. James Chen"
              className="w-9 h-9 rounded-full border border-outline-variant/30 object-cover flex-shrink-0"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHdKzFEqNz..."
            />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <p className="text-sm font-bold text-on-surface">Dr. James Chen</p>
                <p className="text-[10px] text-outline">2 days ago</p>
              </div>
              <p className="text-[10px] font-black text-primary uppercase tracking-tighter">Periodontist</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-outline-variant/20 shadow-sm group-hover:border-primary/30 transition-all cursor-pointer">
            <p className="text-xs leading-relaxed text-on-surface-variant">
              Gingival margins demonstrate excellent adaptation. No microgaps detected. Ready for final fabrication approval.
            </p>
          </div>
        </div>
      </div>

      {/* Post Note Section */}
      <div className="p-6 bg-white border-t border-outline-variant/30 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
        <div className="relative">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant/20 focus:ring-2 focus:ring-primary/20 focus:border-transparent rounded-xl p-4 text-xs text-on-surface placeholder:text-outline font-medium min-h-[100px] transition-all resize-none"
            placeholder="Add clinical note or feedback..."
          />
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              <button className="w-9 h-9 rounded-lg flex items-center justify-center text-outline hover:bg-surface-container hover:text-primary transition-colors">
                <Paperclip size={18} />
              </button>
              <button className="w-9 h-9 rounded-lg flex items-center justify-center text-outline hover:bg-surface-container hover:text-primary transition-colors">
                <AtSign size={18} />
              </button>
              <button className="w-9 h-9 rounded-lg flex items-center justify-center text-outline hover:bg-surface-container hover:text-primary transition-colors">
                <Smile size={18} />
              </button>
            </div>
            <button className="px-6 py-2.5 bg-primary text-white text-[11px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              disabled={!noteText.trim()}
            >
              Post Note
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
