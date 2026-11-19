import React, { useState } from 'react';
import { Instagram, Search, Download } from 'lucide-react';

export default function InstagramVideoDownloader() {
  const [url, setUrl] = useState('');
  const [media, setMedia] = useState(null);

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
        format_type: 'video',
        quality: '1080p'
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
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-pink-500/15 border border-pink-500/30 text-pink-400 text-xs font-bold uppercase mb-2">
        <Instagram className="w-3.5 h-3.5" /> Tool 03 – Instagram Video Downloader
      </div>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Download Instagram Reels, Videos & Stories</h2>
      <p className="text-xs sm:text-sm text-slate-400 mb-6">Grab authorized public reels in high definition with preserved audio.</p>

      <div className="bg-[#0a0518] p-3 rounded-2xl border border-violet-800/30 flex flex-col sm:flex-row items-center gap-3 mb-6">
        <input 
          type="text" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          placeholder="https://www.instagram.com/reel/..." 
          className="w-full bg-transparent border-0 text-white placeholder-slate-500 text-sm focus:outline-none px-3"
        />
        <button onClick={handleAnalyze} className="glow-btn px-7 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2">
          <span>Find Reel</span>
          <Search className="w-4 h-4" />
        </button>
      </div>

      {media && (
        <div className="bg-violet-950/20 p-6 rounded-2xl border border-violet-800/30 flex flex-col sm:flex-row gap-6 items-center">
          <img src={media.thumbnail} className="w-32 h-48 rounded-xl object-cover" />
          <div className="flex-1">
            <h3 className="text-base font-bold text-white">{media.title}</h3>
            <p className="text-xs text-slate-400 mt-1">{media.uploader}</p>
            <button onClick={handleDownload} className="glow-btn mt-6 py-3 px-6 rounded-xl text-sm font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4" /> Download Reel (1080p)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
