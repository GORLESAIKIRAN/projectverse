import React, { useState } from 'react';
import { Headphones, Search, Download } from 'lucide-react';

export default function InstagramAudioExtractor() {
  const [url, setUrl] = useState('');
  const [media, setMedia] = useState(null);
  const [format, setFormat] = useState('mp3');

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    try {
      const res = await fetch('/api/media/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      setMedia(data);
    } catch (e) {}
  };

  const handleDownload = async () => {
    if (!media) return;
    const res = await fetch('/api/media/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: media.url,
        title: media.title,
        format_type: 'audio',
        audio_format: format
      })
    });
    const data = await res.json();
    const a = document.createElement('a');
    a.href = data.download_url;
    a.download = data.file_name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="glass-panel p-6 sm:p-10 rounded-3xl">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase mb-2">
        <Headphones className="w-3.5 h-3.5" /> Tool 04 – Instagram Audio Extractor
      </div>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Extract Trending Instagram Audio & Sounds</h2>
      <p className="text-xs sm:text-sm text-slate-400 mb-6">Rip background audio and trending tracks into MP3, WAV, or M4A.</p>

      <div className="bg-[#0a0518] p-3 rounded-2xl border border-violet-800/30 flex flex-col sm:flex-row items-center gap-3 mb-6">
        <input 
          type="text" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          placeholder="Paste Instagram Reel URL..." 
          className="w-full bg-transparent border-0 text-white placeholder-slate-500 text-sm focus:outline-none px-3"
        />
        <button onClick={handleAnalyze} className="glow-btn px-7 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2">
          <span>Extract Audio</span>
          <Search className="w-4 h-4" />
        </button>
      </div>

      {media && (
        <div className="bg-violet-950/20 p-6 rounded-2xl border border-violet-800/30 flex flex-col gap-4">
          <h3 className="text-base font-bold text-white">{media.title}</h3>
          <div className="flex gap-2">
            {['mp3', 'wav', 'm4a'].map(fmt => (
              <button key={fmt} onClick={() => setFormat(fmt)} className={`px-4 py-2 rounded-xl text-xs font-bold ${format === fmt ? 'bg-cyan-600 text-white' : 'bg-black text-slate-400'}`}>
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={handleDownload} className="glow-btn py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Download Audio Track
          </button>
        </div>
      )}
    </div>
  );
}
