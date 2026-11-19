import React from 'react';
import { Zap, Award, ShieldCheck, Smartphone, Scissors, Heart } from 'lucide-react';

export default function WhyChooseUs() {
  const cards = [
    { icon: Zap, title: "Ultra-High Speed Processing", desc: "Concurrent multi-threaded stream pipelines deliver instantaneous metadata resolution and rapid media fetching without artificial delays." },
    { icon: Award, title: "Lossless Studio Fidelity", desc: "Preserve pure audio fidelity up to 320kbps MP3 and uncompressed 44.1kHz master WAV formats, engineered for audiophiles and producers." },
    { icon: ShieldCheck, title: "Bank-Grade Privacy & Safety", desc: "Your links and files are never stored permanently. Automatic ephemeral storage cleans files after 15 minutes to guarantee absolute privacy." },
    { icon: Smartphone, title: "Flawless Mobile & Gallery Support", desc: "Optimized for Android, iPhone, iPad, and desktop. Clear instructions guide you to effortlessly save media straight into your Camera Roll or Gallery." },
    { icon: Scissors, title: "Integrated Video Trimmer & Studio", desc: "No external software needed. Trim unwanted clips, adjust playback speed, boost volume, or convert into animated GIFs directly in your browser." },
    { icon: Heart, title: "Always 100% Free & Unlimited", desc: "Zero paywalls, zero shady redirect popups, and no monthly quotas. Pure high-performance media utilities available anytime." },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
          Why Creators Choose <span className="gradient-text">GSK MEDIAVERSE</span>
        </h2>
        <p className="text-sm text-slate-400">Engineered with cutting-edge media processing pipelines, zero ad clutter, and studio-grade audio synthesis.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="glass-panel p-6 rounded-2xl flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-cyan-400">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">{c.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{c.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
