import React, { useState } from 'react';
import { Music, Search, Download, Volume2, Play, Pause } from 'lucide-react';

export default function YouTubeAudioConverter() {
  const [url, setUrl] = useState('');
  const [media, setMedia] = useState(null);
  const [format, setFormat] = useState('mp3');
  const [bitrate, setBitrate] = useState('320k');
  const [isPlaying, setIsPlaying] = useState(false);

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
        audio_format: format,
        audio_bitrate: bitrate
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
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase mb-2">
        <Music className="w-3.5 h-3.5" /> Tool 02 – YouTube Audio Converter
      </div>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Convert YouTube Media into Studio Audio</h2>
      <p className="text-xs sm:text-sm text-slate-400 mb-6">Extract high-fidelity MP3, WAV, AAC, and M4A audio tracks with built-in preview player.</p>

      <div className="bg-[#0a0518] p-3 rounded-2xl border border-violet-800/30 flex flex-col sm:flex-row items-center gap-3 mb-6">
        <input 
          type="text" 
          value={url} 
          onChange={(e) => setUrl(e.target.value)} 
          placeholder="Paste YouTube music or video link..." 
          className="w-full bg-transparent border-0 text-white placeholder-slate-500 text-sm focus:outline-none px-3"
        />
        <button onClick={handleAnalyze} className="glow-btn px-7 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2">
          <span>Extract Audio</span>
          <Search className="w-4 h-4" />
        </button>
      </div>

      {media && (
        <div className="bg-violet-950/20 p-6 rounded-2xl border border-violet-800/30 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <img src={media.thumbnail} className="w-20 h-20 rounded-xl object-cover" />
            <div>
              <h3 className="text-base font-bold text-white">{media.title}</h3>
              <p className="text-xs text-slate-400">{media.uploader} • {media.duration_formatted}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-2">Format</label>
              <div className="grid grid-cols-4 gap-2">
                {['mp3', 'wav', 'aac', 'm4a'].map(fmt => (
                  <button key={fmt} onClick={() => setFormat(fmt)} className={`py-2 rounded-xl text-xs font-bold ${format === fmt ? 'bg-violet-600 text-white' : 'bg-black text-slate-400'}`}>
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-2">Bitrate</label>
              <div className="grid grid-cols-4 gap-2">
                {['320k', '256k', '192k', '128k'].map(br => (
                  <button key={br} onClick={() => setBitrate(br)} className={`py-2 rounded-xl text-xs font-bold ${bitrate === br ? 'bg-cyan-600 text-white' : 'bg-black text-slate-400'}`}>
                    {br}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={handleDownload} className="glow-btn py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Download Converted Audio
          </button>
        </div>
      )}
    </div>
  );
}
