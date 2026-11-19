import React from 'react';
import { Play, Video, Music, Instagram, RefreshCw, Scissors, History, Sun, Moon } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, isDark, setIsDark }) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#05020c]/75 border-b border-violet-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <a href="#" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 p-[2px] shadow-lg shadow-violet-500/25">
            <div className="w-full h-full bg-[#05020c] rounded-[10px] flex items-center justify-center">
              <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-bold text-lg text-white">GSK</span>
              <span className="font-bold text-lg gradient-text">MEDIAVERSE</span>
            </div>
            <span className="text-[10px] tracking-widest text-cyan-400/80 uppercase font-semibold">Media Studio</span>
          </div>
        </a>

        <nav className="hidden lg:flex items-center gap-1 bg-violet-950/20 p-1.5 rounded-full border border-violet-800/30">
          <button onClick={() => setActiveTab('youtube-video')} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'youtube-video' ? 'bg-violet-900/60 text-white' : 'text-slate-300 hover:text-white'}`}>
            <Video className="w-3.5 h-3.5 text-red-400" /> YouTube Video
          </button>
          <button onClick={() => setActiveTab('youtube-audio')} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'youtube-audio' ? 'bg-violet-900/60 text-white' : 'text-slate-300 hover:text-white'}`}>
            <Music className="w-3.5 h-3.5 text-purple-400" /> YouTube Audio
          </button>
          <button onClick={() => setActiveTab('instagram-video')} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'instagram-video' ? 'bg-violet-900/60 text-white' : 'text-slate-300 hover:text-white'}`}>
            <Instagram className="w-3.5 h-3.5 text-pink-400" /> Instagram Reels
          </button>
          <button onClick={() => setActiveTab('converter')} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'converter' ? 'bg-violet-900/60 text-white' : 'text-slate-300 hover:text-white'}`}>
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Converter
          </button>
          <button onClick={() => setActiveTab('editor')} className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'editor' ? 'bg-violet-900/60 text-white' : 'text-slate-300 hover:text-white'}`}>
            <Scissors className="w-3.5 h-3.5 text-emerald-400" /> Video Editor
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button onClick={() => setIsDark(!isDark)} className="p-2.5 rounded-xl border border-violet-800/40 bg-violet-950/30 text-slate-300 hover:text-white">
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-600" />}
          </button>
          <a href="#tools" className="glow-btn px-5 py-2.5 rounded-xl text-xs font-bold text-white tracking-wide uppercase shadow-lg shadow-violet-900/40">
            Open Studio
          </a>
        </div>
      </div>
    </header>
  );
}
