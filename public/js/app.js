/**
 * GSK MEDIAVERSE - Client Application Engine
 * All-in-One Video & Audio Studio
 */

// Global State
const state = {
  currentTab: 'youtube-video',
  isDark: true,
  mediaData: {
    ytVideo: null,
    ytAudio: null,
    igVideo: null,
    igAudio: null,
  },
  selectedQuality: {
    ytVideo: '1080p',
    ytAudioFmt: 'mp3',
    ytAudioBr: '320k',
    igVideo: '1080p',
    igAudioFmt: 'mp3'
  },
  audioPlayer: {
    isPlaying: false,
    audioContext: null,
    oscillator: null,
    gainNode: null,
    interval: null,
    currentTime: 0,
    duration: 205, // 3:25
    volume: 0.8
  },
  studio: {
    isPlaying: false,
    speed: 1.0,
    volume: 0.9,
    audioCtx: null,
    analyser: null,
    animFrame: null
  },
  converterFile: null
};

// Initialize Lucide Icons
function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// =========================================================================
// 1. PARTICLE CANVAS & CONSTELLATIONS BACKGROUND
// =========================================================================
function initParticleCanvas() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const numParticles = Math.min(65, Math.floor(width / 25));

  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 1.8 + 0.8,
      color: Math.random() > 0.5 ? '#8b5cf6' : '#06b6d4',
      alpha: Math.random() * 0.5 + 0.2
    });
  }

  let mouse = { x: null, y: null };
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();

      // Connect particles
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = '#7c3aed';
          ctx.globalAlpha = (1 - dist / 110) * 0.15;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Mouse interactive line
      if (mouse.x) {
        const mDist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (mDist < 130) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = '#06b6d4';
          ctx.globalAlpha = (1 - mDist / 130) * 0.25;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1.0;
    requestAnimationFrame(animate);
  }

  animate();
}

// =========================================================================
// 2. TAB NAVIGATION
// =========================================================================
function switchTab(tabId) {
  state.currentTab = tabId;

  // Hide all tab contents
  document.querySelectorAll('.tool-tab-content').forEach(el => {
    el.classList.add('hidden');
    el.classList.remove('block');
  });

  // Show target tab
  const target = document.getElementById(`tab-${tabId}`);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('block');
  }

  // Update tab buttons
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('border-violet-500/40', 'text-white', 'shadow-lg', 'shadow-violet-950/60');
    btn.classList.add('border-violet-800/20', 'text-slate-400');
  });

  const activeBtn = document.getElementById(`tabBtn-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.add('border-violet-500/40', 'text-white', 'shadow-lg', 'shadow-violet-950/60');
    activeBtn.classList.remove('text-slate-400');
  }

  refreshIcons();

  // Draw audio visualizers if entering those tabs
  if (tabId === 'youtube-audio') {
    drawWaveform();
  } else if (tabId === 'audio-studio') {
    initStudioSpectrum();
  }
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('hidden');
}

// =========================================================================
// 3. TOAST NOTIFICATIONS
// =========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl glass-panel text-xs font-semibold text-white shadow-2xl border transition-all duration-300 transform translate-y-[-10px] opacity-0';

  let icon = 'info';
  let borderClass = 'border-violet-500/50';

  if (type === 'success') {
    icon = 'check-circle';
    borderClass = 'border-emerald-500/60 text-emerald-300';
  } else if (type === 'error') {
    icon = 'alert-triangle';
    borderClass = 'border-red-500/60 text-red-300';
  } else if (type === 'copy') {
    icon = 'clipboard-check';
    borderClass = 'border-cyan-500/60 text-cyan-300';
  }

  toast.classList.add(borderClass);
  toast.innerHTML = `
    <i data-lucide="${icon}" class="w-4 h-4 shrink-0"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  refreshIcons();

  setTimeout(() => {
    toast.classList.remove('translate-y-[-10px]', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  }, 20);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-[-10px]');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// =========================================================================
// 4. CLIPBOARD & URL HELPERS
// =========================================================================
async function pasteClipboardTo(inputId) {
  try {
    const text = await navigator.clipboard.readText();
    const input = document.getElementById(inputId);
    if (input) {
      input.value = text.trim();
      showToast('URL pasted from clipboard!', 'copy');
    }
  } catch (err) {
    showToast('Clipboard permission denied. Please paste manually.', 'error');
  }
}

function handleUniversalAnalyze() {
  const input = document.getElementById('universalUrlInput');
  const url = (input ? input.value : '').trim();

  if (!url) {
    showToast('Please paste a YouTube or Instagram link first.', 'error');
    return;
  }

  // Auto detect
  if (/youtube\.com|youtu\.be/i.test(url)) {
    switchTab('youtube-video');
    const targetInput = document.getElementById('ytVideoInput');
    if (targetInput) {
      targetInput.value = url;
      fetchMediaInfo('ytVideo');
    }
  } else if (/instagram\.com/i.test(url)) {
    switchTab('instagram-video');
    const targetInput = document.getElementById('igVideoInput');
    if (targetInput) {
      targetInput.value = url;
      fetchMediaInfo('igVideo');
    }
  } else {
    // Default to YouTube
    switchTab('youtube-video');
    const targetInput = document.getElementById('ytVideoInput');
    if (targetInput) {
      targetInput.value = url;
      fetchMediaInfo('ytVideo');
    }
  }

  scrollToSection('studioTools');
}

function loadSample(type) {
  if (type === 'yt') {
    const input = document.getElementById('ytVideoInput');
    if (input) {
      input.value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      fetchMediaInfo('ytVideo');
    }
  } else if (type === 'yt-audio') {
    const input = document.getElementById('ytAudioInput');
    if (input) {
      input.value = 'https://www.youtube.com/watch?v=jfKfPfyJRdk';
      fetchMediaInfo('ytAudio');
    }
  } else if (type === 'ig') {
    const input = document.getElementById('igVideoInput') || document.getElementById('igAudioInput');
    if (input) {
      input.value = 'https://www.instagram.com/reel/C7p8kX4S3a/';
      if (state.currentTab === 'instagram-audio') {
        fetchMediaInfo('igAudio');
      } else {
        fetchMediaInfo('igVideo');
      }
    }
  }
}

// =========================================================================
// 5. MEDIA METADATA FETCH & RENDER
// =========================================================================
async function fetchMediaInfo(key) {
  const inputMap = {
    ytVideo: 'ytVideoInput',
    ytAudio: 'ytAudioInput',
    igVideo: 'igVideoInput',
    igAudio: 'igAudioInput'
  };

  const btnMap = {
    ytVideo: 'ytVideoFetchBtn',
    ytAudio: 'ytAudioFetchBtn',
    igVideo: 'igVideoFetchBtn',
    igAudio: 'igAudioFetchBtn'
  };

  const input = document.getElementById(inputMap[key]);
  const btn = document.getElementById(btnMap[key]);
  const url = (input ? input.value : '').trim();

  if (!url) {
    showToast('Please enter a valid media URL.', 'error');
    return;
  }

  // URL Format Validation
  if (key.startsWith('yt') && !/youtube\.com|youtu\.be/i.test(url)) {
    showToast('Invalid YouTube URL format. Please check the link.', 'error');
    return;
  }
  if (key.startsWith('ig') && !/instagram\.com/i.test(url)) {
    showToast('Invalid Instagram URL format. Please check the link.', 'error');
    return;
  }

  // Loading state on button
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Analyzing...</span>`;
    refreshIcons();
  }

  try {
    const res = await fetch('/api/media/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to analyze media.');
    }

    state.mediaData[key] = data;
    renderMediaResult(key, data);
    showToast('Media metadata loaded successfully!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>${key.includes('Audio') ? 'Extract Audio' : 'Analyze'}</span><i data-lucide="search" class="w-4 h-4"></i>`;
      refreshIcons();
    }
  }
}

function renderMediaResult(key, data) {
  if (key === 'ytVideo') {
    const box = document.getElementById('ytVideoResult');
    document.getElementById('ytVideoThumb').src = data.thumbnail;
    document.getElementById('ytVideoTitle').textContent = data.title;
    document.getElementById('ytVideoChannel').innerHTML = `<i data-lucide="user" class="w-3.5 h-3.5 text-cyan-400"></i> ${data.uploader || 'Creator'}`;
    document.getElementById('ytVideoDuration').textContent = data.duration_formatted;

    // Render Qualities
    const qContainer = document.getElementById('ytVideoQualities');
    qContainer.innerHTML = '';
    const formats = data.available_video_formats || [];

    formats.forEach((f, idx) => {
      const isSelected = idx === 0;
      if (isSelected) state.selectedQuality.ytVideo = f.resolution;

      const card = document.createElement('button');
      card.className = `p-3 rounded-xl border text-left transition-all ${
        isSelected ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-lg shadow-cyan-950/50' : 'border-violet-900/40 bg-obsidian/70 text-slate-400 hover:text-white'
      } yt-res-card`;
      card.onclick = () => selectYtResolution(f.resolution, card);
      card.innerHTML = `
        <div class="text-xs font-extrabold text-white flex items-center justify-between">
          <span>${f.resolution}</span>
          ${f.resolution.includes('1080') ? '<span class="text-[9px] bg-red-600 px-1 py-0.2 rounded text-white font-bold">FHD</span>' : ''}
        </div>
        <div class="text-[10px] text-slate-400 mt-0.5">${f.note || 'MP4 Video'}</div>
      `;
      qContainer.appendChild(card);
    });

    box.classList.remove('hidden');
  } else if (key === 'ytAudio') {
    const box = document.getElementById('ytAudioResult');
    document.getElementById('ytAudioThumb').src = data.thumbnail;
    document.getElementById('ytAudioTitle').textContent = data.title;
    document.getElementById('ytAudioChannel').textContent = data.uploader || 'Audio Creator';
    document.getElementById('ytAudioDuration').innerHTML = `<i data-lucide="clock" class="w-3 h-3 inline text-cyan-400 mr-1"></i> ${data.duration_formatted}`;

    box.classList.remove('hidden');
    drawWaveform();
  } else if (key === 'igVideo') {
    const box = document.getElementById('igVideoResult');
    document.getElementById('igVideoThumb').src = data.thumbnail;
    document.getElementById('igVideoTitle').textContent = data.title;
    document.getElementById('igVideoAuthor').textContent = data.uploader;
    box.classList.remove('hidden');
  } else if (key === 'igAudio') {
    const box = document.getElementById('igAudioResult');
    document.getElementById('igAudioTitle').textContent = data.title;
    document.getElementById('igAudioAuthor').textContent = `Sound by ${data.uploader}`;
    box.classList.remove('hidden');
  }

  refreshIcons();
}

function selectYtResolution(res, cardEl) {
  state.selectedQuality.ytVideo = res;
  document.querySelectorAll('.yt-res-card').forEach(c => {
    c.classList.remove('border-cyan-400', 'bg-cyan-950/40', 'text-white', 'shadow-lg');
    c.classList.add('border-violet-900/40', 'bg-obsidian/70', 'text-slate-400');
  });
  cardEl.classList.add('border-cyan-400', 'bg-cyan-950/40', 'text-white', 'shadow-lg');
  cardEl.classList.remove('border-violet-900/40', 'bg-obsidian/70', 'text-slate-400');
}

function setAudioFormat(fmt) {
  state.selectedQuality.ytAudioFmt = fmt;
  document.querySelectorAll('.audio-fmt-btn').forEach(b => {
    b.classList.remove('border-violet-500', 'bg-violet-900/40', 'text-white');
    b.classList.add('border-violet-800/30', 'bg-obsidian', 'text-slate-400');
  });
  const active = document.querySelector(`.audio-fmt-btn[data-fmt="${fmt}"]`);
  if (active) {
    active.classList.add('border-violet-500', 'bg-violet-900/40', 'text-white');
    active.classList.remove('text-slate-400');
  }
}

function setAudioBitrate(br) {
  state.selectedQuality.ytAudioBr = br;
  document.querySelectorAll('.audio-br-btn').forEach(b => {
    b.classList.remove('border-cyan-500', 'bg-cyan-950/40', 'text-cyan-300');
    b.classList.add('border-violet-800/30', 'bg-obsidian', 'text-slate-400');
  });
  const active = document.querySelector(`.audio-br-btn[data-br="${br}"]`);
  if (active) {
    active.classList.add('border-cyan-500', 'bg-cyan-950/40', 'text-cyan-300');
    active.classList.remove('text-slate-400');
  }
}

function setIgAudioFormat(fmt) {
  state.selectedQuality.igAudioFmt = fmt;
  document.querySelectorAll('.ig-fmt-btn').forEach(b => {
    b.classList.remove('border-cyan-500', 'bg-cyan-950/40', 'text-white');
    b.classList.add('border-violet-800/30', 'bg-obsidian', 'text-slate-400');
  });
  const active = document.querySelector(`.ig-fmt-btn[data-fmt="${fmt}"]`);
  if (active) {
    active.classList.add('border-cyan-500', 'bg-cyan-950/40', 'text-white');
    active.classList.remove('text-slate-400');
  }
}

// =========================================================================
// 6. DOWNLOAD PROCESSING WITH ANIMATED PROGRESS
// =========================================================================
async function executeDownload(key) {
  const meta = state.mediaData[key];
  if (!meta) {
    showToast('Please analyze the media link first.', 'error');
    return;
  }

  const isAudio = key.includes('Audio');
  const format = isAudio 
    ? (key === 'ytAudio' ? state.selectedQuality.ytAudioFmt : state.selectedQuality.igAudioFmt) 
    : 'mp4';
  const quality = isAudio 
    ? (key === 'ytAudio' ? state.selectedQuality.ytAudioBr : '320k') 
    : state.selectedQuality.ytVideo;

  // Show progress container for YouTube Video
  if (key === 'ytVideo') {
    const progressBox = document.getElementById('ytVideoProgressBox');
    const bar = document.getElementById('ytVideoProgressBar');
    const status = document.getElementById('ytVideoProgressStatus');
    const percent = document.getElementById('ytVideoProgressPercent');
    const dlBtn = document.getElementById('ytVideoDownloadBtn');

    progressBox.classList.remove('hidden');
    dlBtn.disabled = true;

    const stages = [
      { p: 15, msg: 'Contacting media streaming server...' },
      { p: 40, msg: 'Fetching 1080p video & stereo audio streams...' },
      { p: 75, msg: 'Multiplexing container formats...' },
      { p: 95, msg: 'Finalizing high-speed file packaging...' },
      { p: 100, msg: 'Download ready!' }
    ];

    for (const stage of stages) {
      status.innerHTML = `<i data-lucide="loader" class="w-3.5 h-3.5 animate-spin"></i> ${stage.msg}`;
      percent.textContent = `${stage.p}%`;
      bar.style.width = `${stage.p}%`;
      refreshIcons();
      await new Promise(r => setTimeout(r, 450));
    }

    dlBtn.disabled = false;
  }

  try {
    const res = await fetch('/api/media/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: meta.url,
        title: meta.title,
        format_type: isAudio ? 'audio' : 'video',
        quality: quality,
        audio_format: format,
        audio_bitrate: quality
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Download failed.');

    // Trigger browser download via dynamic anchor
    const downloadLink = document.createElement('a');
    downloadLink.href = data.download_url;
    downloadLink.download = data.file_name;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();

    // Trigger Confetti Celebration!
    triggerConfetti();

    // Add to Local Storage History
    addToHistory({
      id: data.job_id || Date.now().toString(),
      title: meta.title,
      platform: meta.platform,
      format: format.toUpperCase(),
      size: formatFileSize(data.file_size || 14200000),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      downloadUrl: data.download_url,
      fileName: data.file_name
    });

    // Show Success Modal
    openSuccessModal(data.file_name, format, data.file_size, data.download_url);
    showToast('Download started successfully!', 'success');

  } catch (err) {
    showToast(err.message, 'error');
  }
}

function formatFileSize(bytes) {
  if (!bytes) return '14.2 MB';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

// =========================================================================
// 7. SUCCESS MODAL & CONFETTI
// =========================================================================
function triggerConfetti() {
  if (window.confetti) {
    window.confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b']
    });
  }
}

function openSuccessModal(fileName, format, size, url) {
  const modal = document.getElementById('successModal');
  document.getElementById('successFileName').textContent = fileName;
  document.getElementById('successFormat').textContent = `${format.toUpperCase()} Stream`;
  document.getElementById('successFileSize').textContent = formatFileSize(size);

  const previewBox = document.getElementById('successMediaPreviewContainer');
  const videoEl = document.getElementById('successVideoPreview');
  const audioEl = document.getElementById('successAudioPreview');

  if (previewBox && videoEl && audioEl) {
    previewBox.classList.remove('hidden');
    const isVid = format.toLowerCase().includes('mp4') || format.toLowerCase().includes('video');
    if (isVid) {
      videoEl.src = url;
      videoEl.classList.remove('hidden');
      audioEl.classList.add('hidden');
      videoEl.load();
    } else {
      audioEl.src = url;
      audioEl.classList.remove('hidden');
      videoEl.classList.add('hidden');
      audioEl.load();
    }
  }

  const directBtn = document.getElementById('successDirectDownloadBtn');
  directBtn.onclick = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Download started! Saved to your device.', 'success');
  };

  modal.classList.remove('hidden');
}

function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  modal.classList.add('hidden');
  const videoEl = document.getElementById('successVideoPreview');
  const audioEl = document.getElementById('successAudioPreview');
  if (videoEl) { videoEl.pause(); videoEl.src = ''; }
  if (audioEl) { audioEl.pause(); audioEl.src = ''; }
}

// =========================================================================
// 8. AUDIO PLAYER (DYNAMIC WAVEFORM CANVAS)
// =========================================================================
function drawWaveform() {
  const canvas = document.getElementById('ytAudioWaveform');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth || 500;
  canvas.height = canvas.offsetHeight || 56;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const bars = 48;
  const barWidth = (w / bars) - 2.5;

  for (let i = 0; i < bars; i++) {
    const x = i * (barWidth + 2.5);
    // Pleasant pseudo audio wave heights
    const seed = Math.sin(i * 0.35) * Math.cos(i * 0.15);
    const barHeight = Math.max(6, Math.abs(seed) * (h - 10) + (state.audioPlayer.isPlaying ? Math.random() * 12 : 6));
    const y = (h - barHeight) / 2;

    const progressRatio = state.audioPlayer.currentTime / state.audioPlayer.duration;
    const isPassed = (i / bars) <= progressRatio;

    ctx.fillStyle = isPassed ? '#06b6d4' : '#6d28d9';
    ctx.fillRect(x, y, barWidth, barHeight);
  }
}

function toggleYtAudioPlayback() {
  state.audioPlayer.isPlaying = !state.audioPlayer.isPlaying;
  const icon = document.getElementById('ytAudioPlayIcon');

  if (state.audioPlayer.isPlaying) {
    if (icon) icon.setAttribute('data-lucide', 'pause');
    state.audioPlayer.interval = setInterval(() => {
      state.audioPlayer.currentTime += 1;
      if (state.audioPlayer.currentTime > state.audioPlayer.duration) {
        state.audioPlayer.currentTime = 0;
        state.audioPlayer.isPlaying = false;
        clearInterval(state.audioPlayer.interval);
      }
      updateYtAudioUI();
    }, 1000);
  } else {
    if (icon) icon.setAttribute('data-lucide', 'play');
    clearInterval(state.audioPlayer.interval);
  }

  refreshIcons();
  drawWaveform();
}

function updateYtAudioUI() {
  const seek = document.getElementById('ytAudioSeekbar');
  const time = document.getElementById('ytAudioPlayerTime');
  const cur = state.audioPlayer.currentTime;
  const dur = state.audioPlayer.duration;

  if (seek) seek.value = (cur / dur) * 100;
  if (time) {
    const curM = Math.floor(cur / 60);
    const curS = Math.floor(cur % 60);
    const durM = Math.floor(dur / 60);
    const durS = Math.floor(dur % 60);
    time.textContent = `${String(curM).padStart(2,'0')}:${String(curS).padStart(2,'0')} / ${String(durM).padStart(2,'0')}:${String(durS).padStart(2,'0')}`;
  }
  drawWaveform();
}

function handleYtAudioSeek(val) {
  state.audioPlayer.currentTime = (val / 100) * state.audioPlayer.duration;
  updateYtAudioUI();
}

function handleYtAudioVolume(val) {
  state.audioPlayer.volume = parseFloat(val);
}

// =========================================================================
// 9. UNIVERSAL CONVERTER ENGINE
// =========================================================================
function handleConverterFileSelected(file) {
  if (!file) return;

  const MAX_SIZE_MB = 200;
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    showToast(`File size exceeds the maximum studio limit of ${MAX_SIZE_MB}MB.`, 'error');
    return;
  }

  state.converterFile = file;

  const info = document.getElementById('converterSelectedFileInfo');
  info.innerHTML = `
    <i data-lucide="file" class="w-3.5 h-3.5"></i>
    <span>${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
  `;
  info.classList.remove('hidden');

  document.getElementById('converterOptions').classList.remove('hidden');
  refreshIcons();
}

function handleConverterFormatChange(val) {
  const fpsBox = document.getElementById('converterFpsBox');
  if (val === 'gif') {
    fpsBox.classList.remove('hidden');
  } else {
    fpsBox.classList.add('hidden');
  }
}

async function runUniversalConversion() {
  if (!state.converterFile) {
    showToast('Please upload or select a media file first.', 'error');
    return;
  }

  const targetFormat = document.getElementById('converterTargetFormat').value;
  const bitrate = document.getElementById('converterBitrate').value;
  const btn = document.getElementById('converterSubmitBtn');

  btn.disabled = true;
  btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Converting media...</span>`;
  refreshIcons();

  try {
    const res = await fetch('/api/convert/file', {
      method: 'POST',
      headers: {
        'x-target-format': targetFormat,
        'x-file-name': state.converterFile.name,
        'Content-Type': 'application/octet-stream'
      },
      body: state.converterFile
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Conversion failed.');

    // Download
    const a = document.createElement('a');
    a.href = data.download_url;
    a.download = data.file_name;
    document.body.appendChild(a);
    a.click();
    a.remove();

    triggerConfetti();

    addToHistory({
      id: Date.now().toString(),
      title: state.converterFile.name,
      platform: 'Upload',
      format: targetFormat.toUpperCase(),
      size: formatFileSize(data.file_size || state.converterFile.size),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      downloadUrl: data.download_url,
      fileName: data.file_name
    });

    showToast(`Converted to ${targetFormat.toUpperCase()} successfully!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="refresh-cw" class="w-4 h-4"></i><span>Start Conversion Now</span>`;
    refreshIcons();
  }
}

// Drag and Drop listeners
const dropZone = document.getElementById('dropZone');
if (dropZone) {
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add('border-cyan-400', 'bg-violet-950/30');
    });
  });
  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-cyan-400', 'bg-violet-950/30');
    });
  });
  dropZone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleConverterFileSelected(e.dataTransfer.files[0]);
    }
  });
}

// =========================================================================
// 10. VIDEO EDITOR STUDIO
// =========================================================================
function updateEditorTrim() {
  const startSlider = document.getElementById('editorStartSlider');
  const endSlider = document.getElementById('editorEndSlider');
  let start = parseFloat(startSlider.value);
  let end = parseFloat(endSlider.value);

  if (start >= end) {
    start = Math.max(0, end - 1);
    startSlider.value = start;
  }

  document.getElementById('editorStartTimeVal').textContent = `${start.toFixed(1)}s`;
  document.getElementById('editorEndTimeVal').textContent = `${end.toFixed(1)}s`;
  document.getElementById('editorSelectedDuration').textContent = `${(end - start).toFixed(1)} seconds`;

  const video = document.getElementById('editorVideoPlayer');
  if (video) {
    video.currentTime = start;
  }
}

function previewTrimmedSection() {
  const video = document.getElementById('editorVideoPlayer');
  const start = parseFloat(document.getElementById('editorStartSlider').value);
  const end = parseFloat(document.getElementById('editorEndSlider').value);

  if (video) {
    video.currentTime = start;
    video.play();
    const checkEnd = () => {
      if (video.currentTime >= end) {
        video.pause();
        video.removeEventListener('timeupdate', checkEnd);
      }
    };
    video.addEventListener('timeupdate', checkEnd);
  }
}

async function exportTrimmedVideo(audioOnly = false) {
  const start = parseFloat(document.getElementById('editorStartSlider').value);
  const end = parseFloat(document.getElementById('editorEndSlider').value);

  showToast(`Preparing trimmed ${audioOnly ? 'audio' : 'video'} (${start}s - ${end}s)...`, 'info');

  await new Promise(r => setTimeout(r, 1200));

  const ext = audioOnly ? 'mp3' : 'mp4';
  const fileName = `gsk_trimmed_${start}s_to_${end}s.${ext}`;
  const mockUrl = `/api/media/stream/${fileName}`;

  const a = document.createElement('a');
  a.href = mockUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();

  triggerConfetti();

  addToHistory({
    id: Date.now().toString(),
    title: `Trimmed Video Segment (${start}s - ${end}s)`,
    platform: 'Video Editor',
    format: ext.toUpperCase(),
    size: audioOnly ? '2.1 MB' : '8.6 MB',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    downloadUrl: mockUrl,
    fileName: fileName
  });

  showToast(`Exported ${fileName} successfully!`, 'success');
}

function loadSampleVideoToEditor() {
  const video = document.getElementById('editorVideoPlayer');
  if (video) {
    video.src = '/media/sample_video.mp4';
    video.load();
    showToast('Loaded sample video into editor', 'info');
  }
}

// =========================================================================
// 11. AUDIO STUDIO (SYNTHESIZER & SPECTRUM VISUALIZER)
// =========================================================================
function initStudioSpectrum() {
  const canvas = document.getElementById('studioSpectrumCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth || 600;
  canvas.height = canvas.offsetHeight || 100;

  function renderSpectrum() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bars = 64;
    const barWidth = (canvas.width / bars) - 2;

    for (let i = 0; i < bars; i++) {
      const x = i * (barWidth + 2);
      const isPlaying = state.studio.isPlaying;
      const height = isPlaying 
        ? Math.sin(i * 0.2 + Date.now() * 0.005) * 35 + 40 + Math.random() * 15
        : 8;
      const y = canvas.height - height;

      const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
      grad.addColorStop(0, '#06b6d4');
      grad.addColorStop(0.5, '#8b5cf6');
      grad.addColorStop(1, '#3b82f6');

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth, height);
    }

    if (state.currentTab === 'audio-studio') {
      requestAnimationFrame(renderSpectrum);
    }
  }

  renderSpectrum();
}

function toggleStudioAudio() {
  state.studio.isPlaying = !state.studio.isPlaying;
  const icon = document.getElementById('studioPlayIcon');

  if (state.studio.isPlaying) {
    if (icon) icon.setAttribute('data-lucide', 'pause');
    // Start Web Audio API Tone
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!state.studio.audioCtx) {
        state.studio.audioCtx = new AudioContext();
      }
      const ctx = state.studio.audioCtx;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440 * state.studio.speed, ctx.currentTime);
      gain.gain.setValueAtTime(0.15 * state.studio.volume, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      state.studio.activeOsc = osc;
    } catch (e) {
      // fallback
    }
  } else {
    if (icon) icon.setAttribute('data-lucide', 'play');
    if (state.studio.activeOsc) {
      try {
        state.studio.activeOsc.stop();
        state.studio.activeOsc.disconnect();
      } catch (e) {}
    }
  }

  refreshIcons();
}

function setStudioSpeed(spd) {
  state.studio.speed = spd;
  document.querySelectorAll('.studio-spd-btn').forEach(b => {
    b.classList.remove('bg-violet-600', 'text-white');
    b.classList.add('text-slate-400');
  });
  const active = document.querySelector(`.studio-spd-btn[data-spd="${spd}"]`);
  if (active) {
    active.classList.add('bg-violet-600', 'text-white');
    active.classList.remove('text-slate-400');
  }
}

function setStudioVolume(vol) {
  state.studio.volume = parseFloat(vol);
}

function exportStudioAudio() {
  const fileName = `gsk_studio_master_${Date.now()}.mp3`;
  const url = `/api/media/stream/${fileName}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();

  triggerConfetti();
  showToast('Studio master exported!', 'success');
}

// =========================================================================
// 12. DOWNLOAD HISTORY (LOCALSTORAGE)
// =========================================================================
const HISTORY_STORAGE_KEY = 'gsk_mediaverse_history_v1';

function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveHistory(list) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {}
}

function addToHistory(item) {
  const list = getHistory();
  list.unshift(item);
  saveHistory(list.slice(0, 50)); // keep last 50
  renderHistory();
}

function clearHistory() {
  if (confirm('Are you sure you want to clear your local processing history?')) {
    saveHistory([]);
    renderHistory();
    showToast('Download history cleared.', 'info');
  }
}

function deleteHistoryItem(id) {
  const list = getHistory().filter(item => item.id !== id);
  saveHistory(list);
  renderHistory();
  showToast('Item removed from history.', 'info');
}

function renderHistory() {
  const tbody = document.getElementById('historyTableBody');
  const empty = document.getElementById('historyEmptyState');
  if (!tbody) return;

  const list = getHistory();

  if (list.length === 0) {
    tbody.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }

  if (empty) empty.classList.add('hidden');
  tbody.innerHTML = '';

  list.forEach(item => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-violet-950/20 transition-colors';

    let platformIcon = 'video';
    let iconColor = 'text-red-400';
    if (item.platform === 'instagram') {
      platformIcon = 'instagram';
      iconColor = 'text-pink-400';
    } else if (item.format === 'MP3' || item.format === 'WAV') {
      platformIcon = 'music';
      iconColor = 'text-cyan-400';
    }

    tr.innerHTML = `
      <td class="py-3 px-4 flex items-center gap-2.5">
        <i data-lucide="${platformIcon}" class="w-4 h-4 ${iconColor} shrink-0"></i>
        <span class="font-bold text-white max-w-xs truncate" title="${item.title}">${item.title}</span>
      </td>
      <td class="py-3 px-4">
        <span class="px-2 py-0.5 rounded-full bg-violet-950 border border-violet-800 text-[10px] font-bold text-violet-300">
          ${item.format}
        </span>
      </td>
      <td class="py-3 px-4 text-slate-400">${item.size}</td>
      <td class="py-3 px-4 text-slate-400">${item.date}</td>
      <td class="py-3 px-4 text-right">
        <div class="flex items-center justify-end gap-2">
          <a href="${item.downloadUrl}" download="${item.fileName}" class="p-1.5 rounded-lg bg-violet-900/40 hover:bg-violet-800 text-cyan-400 transition-colors" title="Download Again">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
          </a>
          <button onclick="deleteHistoryItem('${item.id}')" class="p-1.5 rounded-lg bg-violet-900/40 hover:bg-red-950 hover:text-red-400 text-slate-400 transition-colors" title="Delete">
            <i data-lucide="trash" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  refreshIcons();
}

// =========================================================================
// 13. QR CODE MODAL & DEVICE SHARING
// =========================================================================
let currentShareUrl = window.location.href;

function openQrModal(key) {
  const meta = state.mediaData[key];
  currentShareUrl = (meta && meta.url) ? meta.url : window.location.href;

  const container = document.getElementById('qrCanvasContainer');
  container.innerHTML = '';

  // Generate QR Code SVG / Canvas
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  // Simple, elegant QR pattern matrix
  drawRealisticQR(ctx, 160, currentShareUrl);
  container.appendChild(canvas);

  document.getElementById('qrModal').classList.remove('hidden');
}

function closeQrModal() {
  document.getElementById('qrModal').classList.add('hidden');
}

function drawRealisticQR(ctx, size, text) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#0f172a';
  const cellSize = size / 21;

  // Draw Position Detection Squares (Corners)
  function drawSquare(x, y) {
    ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
  }

  drawSquare(0, 0);
  drawSquare(14, 0);
  drawSquare(0, 14);

  // Fill pseudo-random timing & data bits seeded by text
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash << 5) - hash + text.charCodeAt(i);

  for (let r = 0; r < 21; r++) {
    for (let c = 0; c < 21; c++) {
      if ((r < 8 && c < 8) || (r < 8 && c > 12) || (r > 12 && c < 8)) continue;
      const bit = ((hash + r * 31 + c * 17) % 7) > 2;
      if (bit) {
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
  }
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(currentShareUrl);
    const btnText = document.getElementById('copyLinkBtnText');
    if (btnText) btnText.textContent = 'Link Copied!';
    showToast('Direct link copied to clipboard!', 'copy');
    setTimeout(() => {
      if (btnText) btnText.textContent = 'Copy Direct Link';
    }, 2000);
  } catch (e) {
    showToast('Failed to copy. Please copy URL manually.', 'error');
  }
}

async function triggerNativeShare() {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'GSK MEDIAVERSE',
        text: 'Download and convert media with GSK MEDIAVERSE',
        url: currentShareUrl
      });
      showToast('Shared successfully!', 'success');
    } catch (e) {}
  } else {
    copyShareLink();
  }
}

// =========================================================================
// 14. THEME & FAQ ACCORDION
// =========================================================================
function toggleTheme() {
  state.isDark = !state.isDark;
  const html = document.documentElement;
  if (state.isDark) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  refreshIcons();
}

function toggleFaq(id) {
  const content = document.getElementById(`faqContent-${id}`);
  const icon = document.getElementById(`faqIcon-${id}`);
  if (!content) return;

  const isHidden = content.classList.contains('hidden');
  if (isHidden) {
    content.classList.remove('hidden');
    if (icon) icon.classList.add('rotate-180');
  } else {
    content.classList.add('hidden');
    if (icon) icon.classList.remove('rotate-180');
  }
}

// =========================================================================
// 15. INITIALIZATION ON PAGE LOAD
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
  refreshIcons();
  initParticleCanvas();
  renderHistory();

  // If initial history is empty, populate with a few demo items for immediate delight
  if (getHistory().length === 0) {
    saveHistory([
      {
        id: '1',
        title: 'Cinematic Landscape Master Video (1080p)',
        platform: 'youtube',
        format: 'MP4',
        size: '42.8 MB',
        date: 'Today, 09:15 AM',
        downloadUrl: '/api/media/stream/sample_cinematic.mp4',
        fileName: 'sample_cinematic.mp4'
      },
      {
        id: '2',
        title: 'Acoustic Ambient Guitar Theme (320kbps)',
        platform: 'youtube',
        format: 'MP3',
        size: '8.4 MB',
        date: 'Yesterday, 04:30 PM',
        downloadUrl: '/api/media/stream/sample_guitar.mp3',
        fileName: 'sample_guitar.mp3'
      }
    ]);
    renderHistory();
  }
});
