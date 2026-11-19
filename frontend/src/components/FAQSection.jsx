import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null);

  const faqs = [
    { q: "How do I save downloaded videos to my iPhone Photos or Android Gallery?", a: "On iPhone / iOS: When the download completes, tap the blue Download icon in Safari's address bar, tap the file, click the Share icon, and select 'Save Video'. On Android: Downloaded files are saved automatically into your Downloads folder." },
    { q: "Is GSK MEDIAVERSE free to use?", a: "Yes! GSK MEDIAVERSE is 100% free with no subscription, no hidden charges, and zero popup ads." },
    { q: "What formats and resolutions are supported?", a: "Video resolutions include 1080p Full HD, 720p HD, 480p, 360p, 240p, and 144p in MP4 and WEBM. Audio formats include MP3 (up to 320kbps), WAV (lossless), AAC, and M4A." },
    { q: "Can I download private Instagram accounts or age-restricted videos?", a: "No. GSK MEDIAVERSE strictly respects platform terms, copyright, and user privacy. Only publicly accessible or authorized content is processed." },
    { q: "Are my uploaded files or downloaded links stored on your server?", a: "Never. Temporary files are stored in an isolated, encrypted temporary folder and automatically purged after 15 to 30 minutes. Your download history is stored exclusively inside your local browser via localStorage." },
  ];

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-white mb-3">Frequently Asked Questions</h2>
        <p className="text-sm text-slate-400">Everything you need to know about using GSK MEDIAVERSE.</p>
      </div>

      <div className="flex flex-col gap-3.5">
        {faqs.map((faq, idx) => (
          <div key={idx} className="glass-panel rounded-2xl overflow-hidden border border-violet-800/30">
            <button onClick={() => setOpenIdx(openIdx === idx ? null : idx)} className="w-full p-5 text-left flex items-center justify-between font-semibold text-sm text-white">
              <span>{faq.q}</span>
              <ChevronDown className={`w-4 h-4 text-violet-400 transition-transform ${openIdx === idx ? 'rotate-180' : ''}`} />
            </button>
            {openIdx === idx && (
              <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-violet-900/20 pt-3">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
