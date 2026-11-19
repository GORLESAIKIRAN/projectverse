import React, { useState, useEffect } from 'react';
import { History, Download, Trash2, Video, Music } from 'lucide-react';

export default function DownloadHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('gsk_mediaverse_history_v1') || '[]');
      setHistory(data);
    } catch (e) {}
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('gsk_mediaverse_history_v1');
    setHistory([]);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="glass-panel p-6 sm:p-10 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">Recently Processed Media Files</h3>
            <p className="text-xs text-slate-400">Stored locally in your browser. Never uploaded to third-party databases.</p>
          </div>
          {history.length > 0 && (
            <button onClick={clearHistory} className="px-4 py-2 rounded-xl border border-red-800/40 text-red-400 hover:bg-red-950/40 text-xs font-bold flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> Clear History
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No downloads in history yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/40 text-slate-400 border-b border-violet-900/40">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-950/40 text-slate-300">
                {history.map(item => (
                  <tr key={item.id}>
                    <td className="py-3 px-4 font-bold text-white">{item.title}</td>
                    <td className="py-3 px-4">{item.format}</td>
                    <td className="py-3 px-4">{item.size}</td>
                    <td className="py-3 px-4">{item.date}</td>
                    <td className="py-3 px-4 text-right">
                      <a href={item.downloadUrl} download={item.fileName} className="text-cyan-400 hover:underline">Download</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
