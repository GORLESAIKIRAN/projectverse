import React, { useState } from 'react';
import { Scissors, Play, Download } from 'lucide-react';

export default function VideoEditor() {
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);

  const handleExport = (audioOnly = false) => {
    const ext = audioOnly ? 'mp3' : 'mp4';
    const a = document.createElement('a');
    a.href = `/api/media/stream/gsk_trimmed_${startTime}s_to_${endTime}s.${ext}`;
    a.download = `gsk_trimmed_${startTime}s_to_${endTime}s.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="glass-panel p-6 sm:p-10 rounded-3xl">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase mb-2">
        <Scissors className="w-3.5 h-3.5" /> Feature B – Video Editor Studio
      </div>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Precision Video Trimmer & Audio Extractor</h2>
      <p className="text-xs sm:text-sm text-slate-400 mb-6">Cut unwanted portions, select start and end timestamps, and preview before export.</p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-black rounded-2xl overflow-hidden aspect-video border border-violet-800/40">
          <video className="w-full h-full object-contain" controls src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" />
        </div>

        <div className="lg:col-span-5 bg-violet-950/20 p-6 rounded-2xl border border-violet-800/30 flex flex-col gap-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">Start Timestamp:</span>
              <span className="text-cyan-400 font-bold">{startTime}s</span>
            </div>
            <input type="range" min="0" max="15" value={startTime} onChange={(e) => setStartTime(Number(e.target.value))} className="w-full accent-cyan-400" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">End Timestamp:</span>
              <span className="text-pink-400 font-bold">{endTime}s</span>
            </div>
            <input type="range" min="0" max="15" value={endTime} onChange={(e) => setEndTime(Number(e.target.value))} className="w-full accent-pink-400" />
          </div>

          <button onClick={() => handleExport(false)} className="glow-btn py-3.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 mt-4">
            <Scissors className="w-4 h-4" /> Export Trimmed Video (MP4)
          </button>
          <button onClick={() => handleExport(true)} className="py-2.5 rounded-xl border border-violet-700 text-xs font-bold text-violet-300 hover:text-white">
            Extract Audio Only (MP3)
          </button>
        </div>
      </div>
    </div>
  );
}
