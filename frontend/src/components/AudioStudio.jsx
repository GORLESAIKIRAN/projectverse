import React, { useState } from 'react';
import { Sliders, Play, Pause, Volume2, Download } from 'lucide-react';

export default function AudioStudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [volume, setVolume] = useState(0.8);

  const handleExport = () => {
    const fileName = `gsk_studio_master_${Date.now()}.mp3`;
    const a = document.createElement('a');
    a.href = `/api/media/stream/${fileName}`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="glass-panel p-6 sm:p-10 rounded-3xl">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase mb-2">
        <Sliders className="w-3.5 h-3.5" /> Feature C – Audio Studio
      </div>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Web Audio Studio & Frequency Visualizer</h2>
      <p className="text-xs sm:text-sm text-slate-400 mb-6">Multi-speed playback, volume boost, frequency visualizer, and custom audio export.</p>

      <div className="bg-violet-950/20 p-6 rounded-2xl border border-violet-800/30 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-400 text-white flex items-center justify-center">
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>
            <div>
              <h4 className="text-sm font-bold text-white">GSK Master Synthesizer Track</h4>
              <p className="text-xs text-slate-400">Harmonic Audio Engine (44.1kHz)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-24 accent-cyan-400" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Playback Speed:</span>
          {[0.5, 1.0, 1.25, 1.5, 2.0].map(s => (
            <button key={s} onClick={() => setSpeed(s)} className={`px-3 py-1 rounded-lg text-xs font-bold ${speed === s ? 'bg-violet-600 text-white' : 'bg-black text-slate-400'}`}>
              {s}x
            </button>
          ))}
        </div>

        <button onClick={handleExport} className="glow-btn py-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2">
          <Download className="w-4 h-4" /> Export Studio Audio (MP3)
        </button>
      </div>
    </div>
  );
}
