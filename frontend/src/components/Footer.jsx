import React from 'react';
import { Play } from 'lucide-react';

export default function Footer({ onSelectTab }) {
  return (
    <footer className="border-t border-violet-950/50 bg-[#05020c]/90 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center text-white">
                <Play className="w-4 h-4 fill-white" />
              </div>
              <span className="font-extrabold text-xl text-white">GSK</span>
              <span className="font-extrabold text-xl gradient-text">MEDIAVERSE</span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              GSK MEDIAVERSE is an all-in-one media studio providing video downloading, audio conversion, precision trimming, and format transcoding.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Brand Identity: <strong>GSK MEDIAVERSE – One Platform. Endless Media Possibilities.</strong>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Studio Tools</h4>
            <ul className="flex flex-col gap-2.5 text-xs text-slate-400">
              <li><button onClick={() => onSelectTab('youtube-video')} className="hover:text-cyan-400">YouTube Video Downloader</button></li>
              <li><button onClick={() => onSelectTab('youtube-audio')} className="hover:text-cyan-400">YouTube Audio Converter</button></li>
              <li><button onClick={() => onSelectTab('instagram-video')} className="hover:text-cyan-400">Instagram Reel Downloader</button></li>
              <li><button onClick={() => onSelectTab('instagram-audio')} className="hover:text-cyan-400">Instagram Audio Extractor</button></li>
              <li><button onClick={() => onSelectTab('converter')} className="hover:text-cyan-400">Universal Media Converter</button></li>
              <li><button onClick={() => onSelectTab('editor')} className="hover:text-cyan-400">Precision Video Editor</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Legal & Compliance</h4>
            <ul className="flex flex-col gap-2.5 text-xs text-slate-500">
              <li>Fair Use & Public Access Policy</li>
              <li>Respect Platform Copyright Terms</li>
              <li>Zero Log Ephemeral Storage</li>
              <li>Status: <span className="text-emerald-400 font-bold">Operational 100%</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-violet-950/40 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 GSK MEDIAVERSE Studio. All Rights Reserved. Engineered by Saikiran Gorle (GSK).</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>FastAPI</span>
            <span>•</span>
            <span>FFmpeg</span>
            <span>•</span>
            <span>React</span>
            <span>•</span>
            <span>Tailwind</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
