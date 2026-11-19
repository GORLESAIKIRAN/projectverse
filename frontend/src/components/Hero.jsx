import React, { useState } from 'react';
import { Sparkles, Link as LinkIcon, Clipboard, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

export default function Hero({ onSelectPlatform }) {
  const [url, setUrl] = useState('');

  const handleProcess = () => {
    if (!url.trim()) return;
    if (/youtube\.com|youtu\.be/i.test(url)) {
      onSelectPlatform('youtube-video', url);
    } else if (/instagram\.com/i.test(url)) {
      onSelectPlatform('instagram-video', url);
    } else {
      onSelectPlatform('youtube-video', url);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch (e) {}
  };

  return (
    <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-950/40 backdrop-blur-md mb-8">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            ⚡ NEXT-GEN MEDIA SUITE 3.0 • POWERED BY GSK
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Everything Media. <br />
          <span className="gradient-text">One Powerful Studio.</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Your ultimate destination for video, audio and media tools. Lightning-fast downloads, seamless conversions, studio-grade audio extraction & precision editing.
        </p>

        <div className="w-full max-w-2xl glass-panel p-2 rounded-2xl flex flex-col sm:flex-row items-center gap-2 shadow-2xl">
          <div className="flex items-center gap-2 w-full px-3 py-1 flex-1">
            <LinkIcon className="w-5 h-5 text-violet-400 shrink-0" />
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube or Instagram link here..."
              className="w-full bg-transparent border-0 text-white placeholder-slate-500 text-sm focus:outline-none"
            />
            <button onClick={handlePaste} className="text-xs px-2.5 py-1 rounded-lg bg-violet-900/40 text-violet-300 hover:text-white flex items-center gap-1">
              <Clipboard className="w-3 h-3" /> Paste
            </button>
          </div>
          <button onClick={handleProcess} className="glow-btn w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2">
            <span>Process Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Authorized public content processing • 100% Free
        </p>
      </div>
    </section>
  );
}
