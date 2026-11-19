import React, { useState } from 'react';
import { RefreshCw, UploadCloud, Download } from 'lucide-react';

export default function UniversalConverter() {
  const [file, setFile] = useState(null);
  const [targetFormat, setTargetFormat] = useState('mp3');
  const [converting, setConverting] = useState(false);

  const handleConvert = async () => {
    if (!file) return;
    setConverting(true);
    try {
      const res = await fetch('/api/convert/file', {
        method: 'POST',
        headers: {
          'x-target-format': targetFormat,
          'x-file-name': file.name,
          'Content-Type': 'application/octet-stream'
        },
        body: file
      });
      const data = await res.json();
      const a = document.createElement('a');
      a.href = data.download_url;
      a.download = data.file_name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-10 rounded-3xl">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase mb-2">
        <RefreshCw className="w-3.5 h-3.5" /> Feature A – Universal Media Converter
      </div>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Convert Any Video or Audio File</h2>
      <p className="text-xs sm:text-sm text-slate-400 mb-6">Convert MP4 to MP3, MP4 to WAV, WAV to MP3, Video to GIF, and more.</p>

      <div 
        onClick={() => document.getElementById('uploader').click()}
        className="border-2 border-dashed border-violet-700/50 hover:border-cyan-400 rounded-3xl p-10 text-center cursor-pointer bg-black/40 flex flex-col items-center justify-center mb-6"
      >
        <input id="uploader" type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
        <UploadCloud className="w-10 h-10 text-violet-400 mb-2" />
        <p className="text-sm font-bold text-white">{file ? file.name : 'Click or Drag & Drop Media File'}</p>
        <span className="text-xs text-slate-400">Supports MP4, MOV, MKV, MP3, WAV up to 100MB</span>
      </div>

      {file && (
        <div className="bg-violet-950/20 p-6 rounded-2xl border border-violet-800/30 flex flex-col gap-4">
          <select value={targetFormat} onChange={(e) => setTargetFormat(e.target.value)} className="bg-black border border-violet-800 rounded-xl p-3 text-sm text-white">
            <option value="mp3">MP3 – Universal Audio (320kbps)</option>
            <option value="wav">WAV – Lossless Master Audio</option>
            <option value="gif">GIF – Animated High Quality</option>
            <option value="mp4">MP4 – Universal Video</option>
          </select>
          <button onClick={handleConvert} disabled={converting} className="glow-btn py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" /> {converting ? 'Converting...' : 'Start Conversion'}
          </button>
        </div>
      )}
    </div>
  );
}
