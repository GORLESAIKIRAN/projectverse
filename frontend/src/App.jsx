import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import YouTubeVideoDownloader from './components/YouTubeVideoDownloader';
import YouTubeAudioConverter from './components/YouTubeAudioConverter';
import InstagramVideoDownloader from './components/InstagramVideoDownloader';
import InstagramAudioExtractor from './components/InstagramAudioExtractor';
import UniversalConverter from './components/UniversalConverter';
import VideoEditor from './components/VideoEditor';
import AudioStudio from './components/AudioStudio';
import DownloadHistory from './components/DownloadHistory';
import WhyChooseUs from './components/WhyChooseUs';
import FAQSection from './components/FAQSection';
import Footer from './components/Footer';

export default function App() {
  const [activeTab, setActiveTab] = useState('youtube-video');
  const [isDark, setIsDark] = useState(true);

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-obsidian text-slate-100' : 'bg-slate-50 text-slate-900'} relative selection:bg-neonViolet selection:text-white`}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} isDark={isDark} setIsDark={setIsDark} />
      <Hero onSelectPlatform={(plat, url) => setActiveTab(plat)} />
      
      <main id="tools" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Four Main Tools */}
        {activeTab === 'youtube-video' && <YouTubeVideoDownloader />}
        {activeTab === 'youtube-audio' && <YouTubeAudioConverter />}
        {activeTab === 'instagram-video' && <InstagramVideoDownloader />}
        {activeTab === 'instagram-audio' && <InstagramAudioExtractor />}
        
        {/* Additional Utility Features */}
        {activeTab === 'converter' && <UniversalConverter />}
        {activeTab === 'editor' && <VideoEditor />}
        {activeTab === 'audio-studio' && <AudioStudio />}
      </main>

      <DownloadHistory />
      <WhyChooseUs />
      <FAQSection />
      <Footer onSelectTab={setActiveTab} />
    </div>
  );
}
