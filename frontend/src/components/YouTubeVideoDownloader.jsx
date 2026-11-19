import React, { useState } from 'react';
import { Youtube, Search, Download, Clipboard, CheckCircle2, User, Clock, QrCode } from 'lucide-react';

export default function YouTubeVideoDownloader() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState('1080p');
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/media/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      setMedia(data);
    } catch (e) {
      alert('Failed to analyze video');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!media) return;
    setDownloading(true);
    for (let p = 15; p <= 100; p += 25) {
      setProgress(p);
      await new Promise(r => setTimeout(r, 300));
    }
    const res = await fetch('/api/media/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: media.url,
        title: media.title,
        format_type: 'video',
        quality: selectedQuality
      })
    });
    const data = await res.json();
    setDownloading(false);
    const a = document.createElement('a');
    a.href = data.download_url;
    a.download = data.file_name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="glass-panel p-6 sm:p-10 rounded-3xl relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold uppercase mb-2">
            <Youtube className="w-3.5 h-3.5" /> Tool 01 – YouTube Video Downloader
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Download YouTube Videos in High Definition</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Authorized downloads up to 1080p Full HD with clear audio streams.</p>
        </div>
      </div>

      <div className="bg-[#0a0518] p-3 rounded-2xl border border-violet-800/30 flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="flex items-center gap-3 w-full px-3 py-1 flex-1">
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full bg-transparent border-0 text-white placeholder-slate-500 text-sm focus:outline-none"
          />
        </div>
        <button onClick={handleAnalyze} disabled={loading} className="glow-btn w-full sm:w-auto px-7 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2">
          <span>{loading ? 'Analyzing...' : 'Analyze Video'}</span>
          <Search className="w-4 h-4" />
        </button>
      </div>

      {media && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-violet-950/20 p-6 rounded-2xl border border-violet-800/30">
          <div className="lg:col-span-5 flex flex-col gap-3">
            <img src={media.thumbnail} alt={media.title} className="w-full rounded-2xl aspect-video object-cover" />
            <h3 className="text-base font-bold text-white">{media.title}</h3>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>{media.uploader}</span>
              <span>{media.duration_formatted}</span>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-400 block mb-3">Select Quality:</span>
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                {['1080p', '720p', '480p', '360p', '240p', '144p'].map(res => (
                  <button 
                    key={res} 
                    onClick={() => setSelectedQuality(res)}
                    className={`p-3 rounded-xl border text-xs font-bold ${selectedQuality === res ? 'border-cyan-400 bg-cyan-950/40 text-white' : 'border-violet-900/40 bg-obsidian text-slate-400'}`}
                  >
                    {res} {res === '1080p' ? 'Full HD' : ''}
                  </button>
                ))}
              </div>
            </div>

            {downloading && (
              <div className="mb-4">
                <div className="flex justify-between text-xs font-bold text-cyan-400 mb-1">
                  <span>Multiplexing streams...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <button onClick={handleDownload} disabled={downloading} className="glow-btn w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              <span>Download Video Now</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
