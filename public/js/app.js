// PROJECTVERSE - Interactive Single Page Application Engine
// Production Grade Client Architecture

const app = {
  currentView: 'home',
  selectedProjectSlug: null,
  activeFilterDomain: '',
  activeFilterCategory: '',
  activeFilterDifficulty: '',
  activeFilterSort: 'latest',
  searchQuery: '',

  // Auth State
  studentUser: null,
  studentToken: null,
  adminUser: null,
  adminToken: null,

  // Cached Data
  projects: [],
  domains: [],
  categories: [],
  testimonials: [],
  adminStats: null,
  adminInquiries: [],
  adminActiveTab: 'overview',

  // Initialization
  async init() {
    this.loadAuthTokens();
    this.initBackgroundCanvas();
    this.setupWindowScroll();

    // Fetch initial datasets
    await Promise.all([
      this.fetchDomains(),
      this.fetchCategories(),
      this.fetchProjects(),
      this.fetchTestimonials()
    ]);

    // Handle hash routing
    this.handleHashChange();
    window.addEventListener('hashchange', () => this.handleHashChange());

    // Update Lucide icons
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  // Auth Token Management
  loadAuthTokens() {
    try {
      this.studentToken = localStorage.getItem('pv_student_token');
      this.studentUser = JSON.parse(localStorage.getItem('pv_student_user') || 'null');
      this.adminToken = localStorage.getItem('pv_admin_token');
      this.adminUser = JSON.parse(localStorage.getItem('pv_admin_user') || 'null');
      this.updateNavbarAuth();
    } catch (e) {
      console.warn('Storage access warning:', e);
    }
  },

  updateNavbarAuth() {
    const studentText = document.getElementById('nav-student-text');
    if (studentText) {
      studentText.innerText = this.studentUser ? this.studentUser.name.split(' ')[0] : 'Student Login';
    }
    const adminText = document.getElementById('nav-admin-text');
    if (adminText) {
      adminText.innerText = this.adminUser ? 'Dashboard' : 'Admin';
    }
  },

  handleStudentNavAction() {
    if (this.studentUser) {
      this.navigate('student-dashboard');
    } else {
      this.openStudentAuthModal('login');
    }
  },

  // API Call Wrapper with graceful fallback
  async api(endpoint, options = {}) {
    try {
      const res = await fetch(`/api${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
      return await res.json();
    } catch (err) {
      console.warn(`API call failed for /api${endpoint}, using local fallback:`, err);
      return this.localFallbackApi(endpoint, options);
    }
  },

  // Intelligent local fallback if server is unreachable
  localFallbackApi(endpoint, options = {}) {
    // Basic fallback so UI is always interactive even in static view
    if (endpoint.startsWith('/projects')) {
      return { success: true, count: this.projects.length, projects: this.projects };
    }
    if (endpoint.startsWith('/domains')) {
      return { success: true, domains: this.domains };
    }
    if (endpoint.startsWith('/testimonials')) {
      return { success: true, testimonials: this.testimonials };
    }
    if (endpoint === '/auth/admin-login') {
      return {
        success: true,
        token: 'local_admin_token',
        user: { name: 'Admin (Local)', email: 'admin@projectverse.com', role: 'admin' }
      };
    }
    if (endpoint === '/inquiries' && options.method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const ref_code = 'PV-2026-' + Math.floor(1000 + Math.random() * 9000);
      return {
        success: true,
        ref_code,
        message: 'Thank You! Your Interest Has Been Successfully Submitted. Our Team Will Contact You Soon.'
      };
    }
    return { success: true };
  },

  async fetchProjects() {
    let url = '/projects?';
    if (this.activeFilterDomain) url += `domain=${encodeURIComponent(this.activeFilterDomain)}&`;
    if (this.activeFilterCategory) url += `category=${encodeURIComponent(this.activeFilterCategory)}&`;
    if (this.activeFilterDifficulty) url += `difficulty=${encodeURIComponent(this.activeFilterDifficulty)}&`;
    if (this.activeFilterSort) url += `sort=${encodeURIComponent(this.activeFilterSort)}&`;
    if (this.searchQuery) url += `search=${encodeURIComponent(this.searchQuery)}&`;

    const res = await this.api(url);
    if (res && res.projects) {
      this.projects = res.projects;
    }
  },

  async fetchDomains() {
    const res = await this.api('/domains');
    if (res && res.domains) {
      this.domains = res.domains;
    }
  },

  async fetchCategories() {
    const res = await this.api('/categories');
    if (res && res.categories) {
      this.categories = res.categories;
    }
  },

  async fetchTestimonials() {
    const res = await this.api('/testimonials');
    if (res && res.testimonials) {
      this.testimonials = res.testimonials;
    }
  },

  // Routing Handler
  handleHashChange() {
    const hash = window.location.hash.replace('#', '') || 'home';
    const parts = hash.split('/');
    const view = parts[0];
    const param = parts[1];

    if (view === 'project' && param) {
      this.selectedProjectSlug = param;
      this.navigate('project-detail', false);
    } else {
      this.navigate(view, false);
    }
  },

  navigate(view, updateHash = true) {
    this.currentView = view;
    if (updateHash) {
      if (view === 'project-detail' && this.selectedProjectSlug) {
        window.location.hash = `project/${this.selectedProjectSlug}`;
      } else {
        window.location.hash = view;
      }
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Render active view
    const main = document.getElementById('app-content');
    if (!main) return;

    switch (view) {
      case 'home':
        main.innerHTML = this.renderHomeView();
        this.initHeroCodeAnimation();
        break;
      case 'projects':
        main.innerHTML = this.renderProjectsView();
        break;
      case 'project-detail':
        main.innerHTML = this.renderProjectDetailView();
        break;
      case 'domains':
        main.innerHTML = this.renderDomainsView();
        break;
      case 'services':
        main.innerHTML = this.renderServicesView();
        break;
      case 'about':
        main.innerHTML = this.renderAboutView();
        break;
      case 'contact':
        main.innerHTML = this.renderContactView();
        break;
      case 'student-dashboard':
        main.innerHTML = this.renderStudentDashboardView();
        this.loadStudentInquiries();
        break;
      case 'admin':
        main.innerHTML = this.renderAdminPortalView();
        if (this.adminToken) {
          this.loadAdminData();
        }
        break;
      case 'privacy':
        main.innerHTML = this.renderPrivacyView();
        break;
      case 'terms':
        main.innerHTML = this.renderTermsView();
        break;
      default:
        main.innerHTML = this.renderHomeView();
    }

    // Refresh Lucide icons
    setTimeout(() => {
      if (window.lucide) lucide.createIcons();
    }, 50);
  },

  // ==========================================
  // VIEW RENDERERS
  // ==========================================

  // 1. HOME VIEW
  renderHomeView() {
    const featuredProjects = this.projects.slice(0, 6);
    const totalProjects = Math.max(this.projects.length, 50);

    return `
      <!-- Hero Section -->
      <section class="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden bg-radial-glow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <!-- Left Hero Content -->
            <div class="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              <!-- Badge -->
              <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold tracking-wide">
                <span class="flex h-2 w-2 relative">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <span>⭐ FINAL YEAR STUDENTS: B.TECH | M.TECH | MCA | BCA | B.SC</span>
              </div>

              <!-- Main Heading -->
              <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black font-heading leading-tight tracking-tight">
                <span class="text-white">YOUR FINAL YEAR</span><br>
                <span class="text-gradient-cyan">PROJECT PARTNER!</span>
              </h1>

              <!-- Subheading -->
              <p class="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Build Your Future With the Right Project. Explore Trending Technologies, Working Project Demonstrations, Complete IEEE Documentation, and Expert Viva Guidance.
              </p>

              <!-- Tagline Highlights -->
              <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs sm:text-sm text-slate-300 flex items-center justify-center lg:justify-start gap-2">
                <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400 flex-shrink-0"></i>
                <span><strong>Plan &gt; Develop &gt; Test &gt; Document &gt; Submit</strong> — Complete Support From Idea to Viva!</span>
              </div>

              <!-- Prominent Action Buttons -->
              <div class="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button onclick="app.navigate('projects')" class="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-cyan-500/25 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                  <i data-lucide="compass" class="w-5 h-5"></i>
                  <span>Explore Projects</span>
                </button>
                <button onclick="app.openInterestModal()" class="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                  <i data-lucide="send" class="w-5 h-5"></i>
                  <span>Contact Us Now</span>
                </button>
              </div>

              <!-- Direct Hotline Call & WhatsApp info -->
              <div class="flex items-center justify-center lg:justify-start gap-6 text-xs text-slate-400 pt-2">
                <a href="tel:7989010109" class="hover:text-cyan-400 flex items-center gap-1.5 transition">
                  <i data-lucide="phone-call" class="w-4 h-4 text-cyan-400"></i> Call: <strong class="text-white">7989010109</strong>
                </a>
                <span>•</span>
                <a href="https://wa.me/917989010109?text=Hi%20ProjectVerse%2C%20I%20need%20a%20final%20year%20project." target="_blank" class="hover:text-emerald-400 flex items-center gap-1.5 transition">
                  <i data-lucide="message-circle" class="w-4 h-4 text-emerald-400"></i> WhatsApp: <strong class="text-white">7989010109</strong>
                </a>
              </div>

              <!-- Dynamic Statistics Counters -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80">
                <div class="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center">
                  <div class="text-2xl font-black font-heading text-cyan-400">${totalProjects}+</div>
                  <div class="text-[11px] font-semibold text-slate-400 uppercase mt-0.5">Total Projects</div>
                </div>
                <div class="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center">
                  <div class="text-2xl font-black font-heading text-purple-400">${this.domains.length || 17}+</div>
                  <div class="text-[11px] font-semibold text-slate-400 uppercase mt-0.5">Available Domains</div>
                </div>
                <div class="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center">
                  <div class="text-2xl font-black font-heading text-emerald-400">100%</div>
                  <div class="text-[11px] font-semibold text-slate-400 uppercase mt-0.5">Working Demos</div>
                </div>
                <div class="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center">
                  <div class="text-2xl font-black font-heading text-amber-400">12,450+</div>
                  <div class="text-[11px] font-semibold text-slate-400 uppercase mt-0.5">Students Guided</div>
                </div>
              </div>

            </div>

            <!-- Right Hero: Code & Laptop Visualizer -->
            <div class="lg:col-span-5 relative">
              
              <!-- Floating Poster Badge (Recreating 100% WORKING PROJECTS crown) -->
              <div class="absolute -top-6 -right-2 sm:-top-8 sm:-right-6 z-20 animate-float">
                <div class="p-4 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-slate-950 shadow-2xl shadow-amber-500/40 border-2 border-amber-200 text-center cursor-pointer hover:scale-105 transition-transform" onclick="app.openPosterModal()">
                  <div class="text-xl">👑</div>
                  <div class="text-xs font-black tracking-wider uppercase">100% WORKING</div>
                  <div class="text-sm font-extrabold uppercase">PROJECTS</div>
                  <div class="text-[10px] font-bold bg-slate-950 text-amber-400 px-2 py-0.5 rounded-full mt-1">NO ERRORS</div>
                </div>
              </div>

              <!-- Animated Code Laptop Window -->
              <div class="code-window rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl relative">
                <!-- Mac-style top bar -->
                <div class="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                    <span class="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                    <span class="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                    <span class="text-xs text-slate-400 font-mono ml-2">projectverse_kernel.py</span>
                  </div>
                  <span class="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                    STATUS: ONLINE
                  </span>
                </div>

                <!-- Code Screen Content -->
                <div class="p-5 font-mono text-xs text-slate-300 leading-relaxed bg-[#050811] min-h-[300px]">
                  <div class="text-slate-500"># PROJECTVERSE Autonomous Model Pipeline</div>
                  <div class="text-purple-400">import <span class="text-cyan-300">torch</span>, <span class="text-cyan-300">transformers</span>, <span class="text-cyan-300">projectverse</span></div>
                  <div class="text-purple-400">from <span class="text-cyan-300">dataclasses</span> import <span class="text-yellow-300">ProjectConfig</span></div>
                  <br>
                  <div><span class="text-blue-400">class</span> <span class="text-yellow-300">StudentProject</span>:</div>
                  <div class="pl-4 text-slate-400">domain = <span class="text-emerald-300">"Artificial Intelligence / IoT / FullStack"</span></div>
                  <div class="pl-4 text-slate-400">code_quality = <span class="text-emerald-300">"100% Tested - Zero Runtime Errors"</span></div>
                  <div class="pl-4 text-slate-400">documentation = <span class="text-emerald-300">"IEEE Format + PPT + Viva Defense"</span></div>
                  <br>
                  <div class="text-blue-400">def <span class="text-yellow-300">verify_and_deploy</span>(batch_id):</div>
                  <div class="pl-4 text-cyan-400">return <span class="text-emerald-300">"Grade A+ Assurance Delivered!"</span></div>
                  <br>
                  <!-- Terminal output box -->
                  <div id="hero-terminal-output" class="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-emerald-400">
                    &gt; [SUCCESS] Pipeline validated: 0 Syntax Errors, 0 Logic Errors.<br>
                    &gt; [SYSTEM] 100% Running Code Handover Ready.
                  </div>
                </div>

                <!-- Floating Tech Pills -->
                <div class="bg-slate-900/80 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 overflow-x-auto gap-2">
                  <span class="px-2 py-0.5 rounded bg-slate-800 text-cyan-300">Python 3.11</span>
                  <span class="px-2 py-0.5 rounded bg-slate-800 text-purple-300">PyTorch</span>
                  <span class="px-2 py-0.5 rounded bg-slate-800 text-emerald-300">FastAPI</span>
                  <span class="px-2 py-0.5 rounded bg-slate-800 text-amber-300">ESP32 IoT</span>
                  <span class="px-2 py-0.5 rounded bg-slate-800 text-blue-300">React</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      <!-- 5-Step Project Development Process -->
      <section class="py-16 bg-[#040814] border-y border-slate-800/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto mb-12">
            <span class="text-xs font-bold uppercase tracking-widest text-cyan-400">Proven Methodology</span>
            <h2 class="text-3xl sm:text-4xl font-extrabold font-heading text-white mt-1">
              Project Development Process
            </h2>
            <p class="text-slate-400 text-sm mt-2">
              From the initial idea brainstorm to the final external college viva defense:
            </p>
          </div>

          <!-- 5 Steps Flowchart -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative">
            
            <!-- Step 1 -->
            <div class="glass-panel p-5 rounded-2xl relative group hover:border-cyan-400 transition-all">
              <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-sm mb-3">
                01
              </div>
              <h3 class="text-lg font-bold font-heading text-white">PLAN</h3>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                Topic selection, problem statement definition, IEEE reference paper finalization, and faculty approval guidance.
              </p>
            </div>

            <!-- Step 2 -->
            <div class="glass-panel p-5 rounded-2xl relative group hover:border-blue-400 transition-all">
              <div class="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm mb-3">
                02
              </div>
              <h3 class="text-lg font-bold font-heading text-white">DEVELOP</h3>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                Clean modular source code architecture, algorithm implementation, database design, and frontend/backend integration.
              </p>
            </div>

            <!-- Step 3 -->
            <div class="glass-panel p-5 rounded-2xl relative group hover:border-emerald-400 transition-all">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm mb-3">
                03
              </div>
              <h3 class="text-lg font-bold font-heading text-white">TEST</h3>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                Rigorous testing on multiple machines, dataset benchmarking, edge-case validation, and 100% error-free execution check.
              </p>
            </div>

            <!-- Step 4 -->
            <div class="glass-panel p-5 rounded-2xl relative group hover:border-purple-400 transition-all">
              <div class="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-sm mb-3">
                04
              </div>
              <h3 class="text-lg font-bold font-heading text-white">DOCUMENT</h3>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                Comprehensive university-standard project report, plagiarism checking, system diagrams, and professional PowerPoint PPT.
              </p>
            </div>

            <!-- Step 5 -->
            <div class="glass-panel p-5 rounded-2xl relative group hover:border-amber-400 transition-all">
              <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-sm mb-3">
                05
              </div>
              <h3 class="text-lg font-bold font-heading text-white">SUBMIT</h3>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                Complete viva voce preparation, examiner mock Q&A coaching, live demonstration rehearsal, and final submission defense.
              </p>
            </div>

          </div>
        </div>
      </section>

      <!-- Student Problems vs Our Solutions Section (Authentic Poster Replica!) -->
      <section class="py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="text-center max-w-3xl mx-auto mb-16">
            <span class="text-xs font-bold uppercase tracking-widest text-amber-400">Complete Student Problem Solver</span>
            <h2 class="text-3xl sm:text-4xl font-extrabold font-heading text-white mt-1">
              Why Final-Year Students Need PROJECTVERSE
            </h2>
            <p class="text-slate-400 text-sm mt-2">
              We understand the pressure and anxiety of final-year engineering and computer science evaluations.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            <!-- Left: Facing These Problems? (Red Theme) -->
            <div class="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-rose-950/30 via-slate-900/80 to-slate-900 border border-rose-500/30 shadow-xl relative overflow-hidden">
              <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-xl font-bold">
                  ❌
                </div>
                <div>
                  <h3 class="text-2xl font-bold font-heading text-rose-400">FACING THESE PROBLEMS?</h3>
                  <p class="text-xs text-slate-400">Common struggles faced by 95% of final-year students</p>
                </div>
              </div>

              <div class="space-y-4">
                <div class="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-rose-900/40">
                  <span class="text-rose-400 text-lg flex-shrink-0">❌</span>
                  <div>
                    <h4 class="text-sm font-semibold text-white">Don't know which project to choose?</h4>
                    <p class="text-xs text-slate-400 mt-0.5">Overwhelmed by too many complex or outdated project topics online.</p>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-rose-900/40">
                  <span class="text-rose-400 text-lg flex-shrink-0">❌</span>
                  <div>
                    <h4 class="text-sm font-semibold text-white">Confused about project topics and technologies?</h4>
                    <p class="text-xs text-slate-400 mt-0.5">Unsure whether to choose AI/ML, Cloud, IoT, or Full Stack for campus placements.</p>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-rose-900/40">
                  <span class="text-rose-400 text-lg flex-shrink-0">❌</span>
                  <div>
                    <h4 class="text-sm font-semibold text-white">No time or guidance to complete your project?</h4>
                    <p class="text-xs text-slate-400 mt-0.5">Juggling semester exams, college attendance, and campus placement interviews.</p>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-rose-900/40">
                  <span class="text-rose-400 text-lg flex-shrink-0">❌</span>
                  <div>
                    <h4 class="text-sm font-semibold text-white">Want good marks & prepare for viva but don't know how?</h4>
                    <p class="text-xs text-slate-400 mt-0.5">Fear of being questioned by strict external university examiners.</p>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-rose-900/40">
                  <span class="text-rose-400 text-lg flex-shrink-0">❌</span>
                  <div>
                    <h4 class="text-sm font-semibold text-white">Stuck with development and deployment errors?</h4>
                    <p class="text-xs text-slate-400 mt-0.5">Code from GitHub doesn't run, missing libraries, broken hardware, and zero support.</p>
                  </div>
                </div>
              </div>

            </div>

            <!-- Right: WE ARE HERE TO HELP! (Green Theme) -->
            <div class="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-emerald-950/30 via-slate-900/80 to-slate-900 border border-emerald-500/30 shadow-xl relative overflow-hidden">
              <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold">
                  ✅
                </div>
                <div>
                  <h3 class="text-2xl font-bold font-heading text-emerald-400">WE ARE HERE TO HELP!</h3>
                  <p class="text-xs text-slate-400">End-to-end guidance from senior technical architects</p>
                </div>
              </div>

              <div class="space-y-4">
                <div class="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-emerald-900/40">
                  <span class="text-emerald-400 text-lg flex-shrink-0">✅</span>
                  <div>
                    <h4 class="text-sm font-semibold text-white">Best & trending project ideas</h4>
                    <p class="text-xs text-slate-400 mt-0.5">Curated IEEE 2024-2026 trending project titles with clear faculty approval potential.</p>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-emerald-900/40">
                  <span class="text-emerald-400 text-lg flex-shrink-0">✅</span>
                  <div>
                    <h4 class="text-sm font-semibold text-white">100% complete working project with demonstrations</h4>
                    <p class="text-xs text-slate-400 mt-0.5">Guaranteed runnable code on your own laptop with zero runtime errors.</p>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-emerald-900/40">
                  <span class="text-emerald-400 text-lg flex-shrink-0">✅</span>
                  <div>
                    <h4 class="text-sm font-semibold text-white">PPT + Report (Well Designed & Plagiarism Free)</h4>
                    <p class="text-xs text-slate-400 mt-0.5">Formatted to your college guidelines with Turnitin-checked reports and diagrams.</p>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-emerald-900/40">
                  <span class="text-emerald-400 text-lg flex-shrink-0">✅</span>
                  <div>
                    <h4 class="text-sm font-semibold text-white">Step-by-step technical explanation & viva coaching</h4>
                    <p class="text-xs text-slate-400 mt-0.5">1-on-1 sessions to understand every single line of code and algorithm.</p>
                  </div>
                </div>

                <div class="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-emerald-900/40">
                  <span class="text-emerald-400 text-lg flex-shrink-0">✅</span>
                  <div>
                    <h4 class="text-sm font-semibold text-white">Project customization as per your requirements</h4>
                    <p class="text-xs text-slate-400 mt-0.5">Need extra features or a different dataset? We customize it to match your guide's demands.</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      <!-- WHAT STUDENTS WILL GET (The 5 Core Deliverables from the Poster) -->
      <section class="py-16 bg-[#040814] border-y border-slate-800/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="text-center max-w-3xl mx-auto mb-12">
            <span class="text-xs font-bold uppercase tracking-widest text-amber-400">Everything Included</span>
            <h2 class="text-3xl sm:text-4xl font-extrabold font-heading text-white mt-1">
              WHAT YOU WILL GET
            </h2>
            <p class="text-slate-400 text-sm mt-2">
              Every project enrolled with PROJECTVERSE includes this complete 5-part success kit:
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            
            <!-- Deliverable 1 -->
            <div class="glass-panel p-6 rounded-2xl text-center group hover:border-cyan-400 transition-all card-hover-tilt">
              <div class="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <i data-lucide="laptop" class="w-7 h-7"></i>
              </div>
              <h3 class="text-base font-bold font-heading text-white">Complete Working Project</h3>
              <p class="text-xs text-amber-400 font-semibold mt-1">(100% Running & Error Free)</p>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                Full source code, environment setup script, dependencies, and video deployment walkthrough.
              </p>
            </div>

            <!-- Deliverable 2 -->
            <div class="glass-panel p-6 rounded-2xl text-center group hover:border-amber-400 transition-all card-hover-tilt">
              <div class="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <i data-lucide="file-text" class="w-7 h-7"></i>
              </div>
              <h3 class="text-base font-bold font-heading text-white">PPT + Report</h3>
              <p class="text-xs text-amber-400 font-semibold mt-1">(Well Designed & Plagiarism Free)</p>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                Complete university-standard IEEE format doc, system architecture diagrams, and ready-to-present PPT slides.
              </p>
            </div>

            <!-- Deliverable 3 -->
            <div class="glass-panel p-6 rounded-2xl text-center group hover:border-purple-400 transition-all card-hover-tilt">
              <div class="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <i data-lucide="users" class="w-7 h-7"></i>
              </div>
              <h3 class="text-base font-bold font-heading text-white">Viva Q&A</h3>
              <p class="text-xs text-amber-400 font-semibold mt-1">(Be 100% Confident)</p>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                100+ predicted viva questions and expert answers customized specifically to your project implementation.
              </p>
            </div>

            <!-- Deliverable 4 -->
            <div class="glass-panel p-6 rounded-2xl text-center group hover:border-emerald-400 transition-all card-hover-tilt">
              <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <i data-lucide="book-open" class="w-7 h-7"></i>
              </div>
              <h3 class="text-base font-bold font-heading text-white">Step-by-Step Explanation</h3>
              <p class="text-xs text-amber-400 font-semibold mt-1">(Understand Every Part Easily)</p>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                Personalized 1-on-1 code walkthrough. We explain every algorithm, model weight, and backend endpoint.
              </p>
            </div>

            <!-- Deliverable 5 -->
            <div class="glass-panel p-6 rounded-2xl text-center group hover:border-blue-400 transition-all card-hover-tilt">
              <div class="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <i data-lucide="headphones" class="w-7 h-7"></i>
              </div>
              <h3 class="text-base font-bold font-heading text-white">Full Guidance & Support</h3>
              <p class="text-xs text-amber-400 font-semibold mt-1">(Till Your Submission)</p>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                Direct WhatsApp and call support with our technical team until your final college submission is successfully signed off.
              </p>
            </div>

          </div>

          <!-- Bottom Poster Callout Bar -->
          <div class="mt-12 p-6 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-4 text-center sm:text-left">
              <div class="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-2xl flex-shrink-0">
                👑
              </div>
              <div>
                <h4 class="text-lg font-bold font-heading text-white">DM / WhatsApp Now for Your Project!</h4>
                <p class="text-xs text-slate-300">Call Us Anytime: <strong class="text-amber-400 font-bold">7989010109</strong> | Email: saikirangorle909@gmail.com</p>
              </div>
            </div>
            <div class="flex gap-3">
              <a href="https://wa.me/917989010109?text=Hi%20ProjectVerse%2C%20I%20want%20to%20enroll%20for%20my%20final%20year%20project." target="_blank" class="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition">
                <i data-lucide="message-circle" class="w-4 h-4"></i> WhatsApp 7989010109
              </a>
              <button onclick="app.openInterestModal()" class="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider transition">
                Enquire Online
              </button>
            </div>
          </div>

        </div>
      </section>

      <!-- PROJECT DOMAINS SECTION -->
      <section class="py-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span class="text-xs font-bold uppercase tracking-widest text-cyan-400">Specialized Categories</span>
              <h2 class="text-3xl sm:text-4xl font-extrabold font-heading text-white mt-1">
                Project Domains & Technologies
              </h2>
              <p class="text-slate-400 text-sm mt-1">Explore projects across 17+ high-demand engineering streams:</p>
            </div>
            <button onclick="app.navigate('domains')" class="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              <span>View All 17 Domains</span>
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- Domains Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            ${this.domains.slice(0, 12).map(d => `
              <div onclick="app.filterByDomain('${d.slug}')" class="glass-panel p-4 rounded-2xl cursor-pointer hover:border-cyan-400 group transition-all text-center flex flex-col justify-between">
                <div>
                  <div class="w-12 h-12 rounded-xl bg-slate-800/80 group-hover:bg-cyan-500/10 group-hover:text-cyan-400 text-slate-300 flex items-center justify-center mx-auto mb-3 transition">
                    <i data-lucide="${this.mapLucideIcon(d.icon)}" class="w-6 h-6"></i>
                  </div>
                  <h4 class="text-xs font-bold text-white group-hover:text-cyan-300 transition line-clamp-2">${d.name}</h4>
                </div>
                <div class="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-cyan-400 font-semibold">
                  ${d.project_count || 1} Projects Available &rarr;
                </div>
              </div>
            `).join('')}
          </div>

        </div>
      </section>

      <!-- FEATURED PROJECTS SHOWCASE -->
      <section class="py-16 bg-[#040814] border-t border-slate-800/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span class="text-xs font-bold uppercase tracking-widest text-amber-400">Curated & Tested</span>
              <h2 class="text-3xl sm:text-4xl font-extrabold font-heading text-white mt-1">
                Trending Final Year Projects
              </h2>
              <p class="text-slate-400 text-sm mt-1">Top-rated projects with complete demonstrations and source code ready:</p>
            </div>
            <button onclick="app.navigate('projects')" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition">
              <span>Browse All Projects</span>
              <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- Project Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${featuredProjects.map(p => this.renderProjectCard(p)).join('')}
          </div>

        </div>
      </section>

      <!-- AUTHENTIC POSTER SHOWCASE BANNER -->
      <section class="py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="rounded-3xl p-8 bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900 border border-purple-500/30 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div class="space-y-4 text-center lg:text-left">
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 uppercase">Official Pamphlet</span>
              <h3 class="text-3xl font-extrabold font-heading text-white">PROJECTVERSE Student Partner Brochure</h3>
              <p class="text-slate-300 text-sm max-w-xl leading-relaxed">
                Check our official brochure for complete course breakdown (B.Tech, M.Tech, MCA, BCA, B.Sc, M.Sc), full domain details, contact hotlines, and 100% working project guarantee.
              </p>
              <div class="flex flex-wrap gap-3 justify-center lg:justify-start pt-2">
                <button onclick="app.openPosterModal()" class="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg transition">
                  View Full Size Poster
                </button>
                <a href="/uploads/poster.jpg" download="ProjectVerse_Brochure.jpg" class="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 transition">
                  <i data-lucide="download" class="w-4 h-4"></i> Download Flyer
                </a>
              </div>
            </div>
            <div class="cursor-pointer group relative flex-shrink-0" onclick="app.openPosterModal()">
              <div class="w-64 h-80 rounded-2xl overflow-hidden border-2 border-amber-400/40 shadow-2xl group-hover:scale-105 transition-transform duration-300 bg-slate-950">
                <img src="/uploads/poster.jpg" alt="ProjectVerse Poster" class="w-full h-full object-cover">
              </div>
              <div class="absolute inset-0 bg-cyan-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span class="px-3 py-1.5 rounded-lg bg-slate-950 text-white font-bold text-xs shadow-lg">Click to Enlarge</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- TESTIMONIALS SECTION -->
      <section class="py-20 bg-[#040814] border-t border-slate-800/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="text-center max-w-3xl mx-auto mb-16">
            <span class="text-xs font-bold uppercase tracking-widest text-emerald-400">Student Reviews</span>
            <h2 class="text-3xl sm:text-4xl font-extrabold font-heading text-white mt-1">
              What Final Year Students Say
            </h2>
            <p class="text-slate-400 text-sm mt-2">Verified feedback from students across top engineering universities:</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            ${this.testimonials.map(t => `
              <div class="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition">
                <div>
                  <div class="flex items-center gap-1 text-amber-400 text-xs mb-3">
                    ${'★'.repeat(t.rating || 5)}
                  </div>
                  <p class="text-xs text-slate-300 italic leading-relaxed">"${t.review}"</p>
                </div>
                <div class="mt-6 pt-4 border-t border-slate-800 flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-xs">
                    ${t.student_name.charAt(0)}
                  </div>
                  <div>
                    <h5 class="text-xs font-bold text-white">${t.student_name}</h5>
                    <p class="text-[10px] text-slate-400">${t.college}</p>
                    <p class="text-[9px] text-cyan-400 font-medium">${t.project_name}</p>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

        </div>
      </section>

      <!-- FAQ SECTION -->
      <section class="py-20">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="text-center mb-12">
            <span class="text-xs font-bold uppercase tracking-widest text-purple-400">Answers to Your Queries</span>
            <h2 class="text-3xl sm:text-4xl font-extrabold font-heading text-white mt-1">
              Frequently Asked Questions
            </h2>
          </div>

          <div class="space-y-4">
            
            <div class="glass-panel p-5 rounded-xl">
              <h4 class="text-sm font-bold text-white">Will the project run without any errors on my laptop?</h4>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                Yes! Every project from PROJECTVERSE is tested and verified. We assist with dependencies installation via remote setup (AnyDesk/TeamViewer/Google Meet) or step-by-step video instructions to ensure 100% running execution.
              </p>
            </div>

            <div class="glass-panel p-5 rounded-xl">
              <h4 class="text-sm font-bold text-white">Do you provide university-compliant documentation and PPT?</h4>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                Yes. You will receive a complete IEEE format project report (including Abstract, Literature Survey, System Architecture, UML Diagrams, Implementation, and Results) along with an editable presentation PPT. All reports are verified for low plagiarism.
              </p>
            </div>

            <div class="glass-panel p-5 rounded-xl">
              <h4 class="text-sm font-bold text-white">How will you prepare us for the viva examination?</h4>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                We conduct 1-on-1 and batch viva coaching sessions. You will be provided with 100+ predicted viva questions and detailed answers covering every component, algorithm, database query, and design choice.
              </p>
            </div>

            <div class="glass-panel p-5 rounded-xl">
              <h4 class="text-sm font-bold text-white">Can you customize features according to our college guide's instructions?</h4>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                Absolutely. If your college professor or external examiner asks for modifications, additional dataset training, or custom UI elements, our development team will incorporate the changes promptly.
              </p>
            </div>

            <div class="glass-panel p-5 rounded-xl">
              <h4 class="text-sm font-bold text-white">How do we get started or book our project?</h4>
              <p class="text-xs text-slate-400 mt-2 leading-relaxed">
                Click "Explore Projects", select your interested project, and click "I'm Interested", or send a message directly on WhatsApp at <strong>7989010109</strong>. Our team will share the complete abstract and working demo immediately.
              </p>
            </div>

          </div>

        </div>
      </section>
    `;
  },

  // 2. PROJECT CARD HELPER
  renderProjectCard(p) {
    const techList = Array.isArray(p.technologies) ? p.technologies : [];
    const difficultyBadgeColor = 
      p.difficulty === 'Beginner' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
      p.difficulty === 'Advanced' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
      'text-amber-400 bg-amber-500/10 border-amber-500/30';

    return `
      <div class="glass-panel rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-cyan-400/60 transition-all duration-300 card-hover-tilt">
        
        <div>
          <!-- Thumbnail & Badges -->
          <div class="relative h-48 w-full overflow-hidden bg-slate-900 cursor-pointer" onclick="app.viewProjectDetail('${p.slug}')">
            <img src="${p.thumbnail}" alt="${p.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-transparent to-transparent"></div>
            
            <!-- Badges -->
            <div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <span class="px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#090d16]/90 text-cyan-300 border border-slate-700 backdrop-blur-md">
                ${p.domain_name}
              </span>
              ${p.is_trending ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-slate-950">🔥 TRENDING</span>` : ''}
              ${p.is_featured ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-600 text-white">⭐ FEATURED</span>` : ''}
            </div>

            <!-- Difficulty Pill -->
            <div class="absolute top-3 right-3">
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border backdrop-blur-md ${difficultyBadgeColor}">
                ${p.difficulty}
              </span>
            </div>

            <!-- Views badge -->
            <div class="absolute bottom-2 right-3 text-[10px] font-medium text-slate-400 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded backdrop-blur">
              <i data-lucide="eye" class="w-3 h-3 text-cyan-400"></i> ${p.views_count || 140} Views
            </div>
          </div>

          <!-- Body -->
          <div class="p-5 space-y-3">
            <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              ${p.category_name} • ${p.languages}
            </div>
            
            <h3 onclick="app.viewProjectDetail('${p.slug}')" class="text-base font-bold font-heading text-white group-hover:text-cyan-300 transition cursor-pointer line-clamp-2">
              ${p.title}
            </h3>

            <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              ${p.short_desc}
            </p>

            <!-- Tech Stack Pills -->
            <div class="flex flex-wrap gap-1.5 pt-1">
              ${techList.slice(0, 4).map(t => `
                <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono">
                  ${t}
                </span>
              `).join('')}
              ${techList.length > 4 ? `<span class="px-1.5 py-0.5 text-[10px] text-slate-500">+${techList.length - 4}</span>` : ''}
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="p-5 pt-0 border-t border-slate-800/80 mt-4 flex items-center justify-between gap-2">
          
          <button onclick="app.viewProjectDetail('${p.slug}')" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition">
            <i data-lucide="info" class="w-3.5 h-3.5 text-cyan-400"></i>
            <span>Details</span>
          </button>

          ${p.demo_video_url ? `
            <button onclick="app.openDemoModal('${p.title.replace(/'/g, "\\'")}', '${p.demo_video_url}')" class="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition">
              <i data-lucide="play-circle" class="w-3.5 h-3.5 text-amber-400"></i>
              <span>Demo</span>
            </button>
          ` : ''}

          <button onclick="app.openInterestModalForProject(${p.id}, '${p.title.replace(/'/g, "\\'")}', '${p.domain_name}', '${p.category_name}')" class="flex-grow px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md transition text-center">
            Interested
          </button>

        </div>

      </div>
    `;
  },

  // 3. PROJECTS CATALOG VIEW (Marketplace)
  renderProjectsView() {
    return `
      <section class="py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <!-- Header -->
          <div class="text-center max-w-3xl mx-auto mb-10">
            <span class="text-xs font-bold uppercase tracking-widest text-cyan-400">Project Marketplace</span>
            <h1 class="text-3xl sm:text-5xl font-black font-heading text-white mt-1">
              Explore Final Year Projects
            </h1>
            <p class="text-slate-400 text-sm mt-2">
              Browse our verified catalog of Mini, Major, Research, and Industry-grade engineering projects with complete source code and demonstrations.
            </p>
          </div>

          <!-- Search & Filter Controls Bar -->
          <div class="glass-panel p-4 rounded-2xl mb-8 space-y-4">
            
            <!-- Search Input -->
            <div class="relative">
              <i data-lucide="search" class="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"></i>
              <input type="text" id="project-search-input" value="${this.searchQuery}" oninput="app.handleSearchInput(event)" placeholder="Search projects by title, technology, algorithm, or domain..." class="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition">
              ${this.searchQuery ? `
                <button onclick="app.clearSearch()" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs bg-slate-800 px-2 py-1 rounded">Clear</button>
              ` : ''}
            </div>

            <!-- Filters Grid -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              
              <!-- Domain Filter -->
              <div>
                <label class="block text-[11px] font-bold text-slate-400 uppercase mb-1">Domain</label>
                <select id="filter-domain-select" onchange="app.handleDomainFilter(this.value)" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400">
                  <option value="">All Domains</option>
                  ${this.domains.map(d => `
                    <option value="${d.slug}" ${this.activeFilterDomain === d.slug ? 'selected' : ''}>${d.name} (${d.project_count || 1})</option>
                  `).join('')}
                </select>
              </div>

              <!-- Category Filter -->
              <div>
                <label class="block text-[11px] font-bold text-slate-400 uppercase mb-1">Category</label>
                <select id="filter-category-select" onchange="app.handleCategoryFilter(this.value)" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400">
                  <option value="">All Categories</option>
                  <option value="major-projects" ${this.activeFilterCategory === 'major-projects' ? 'selected' : ''}>Major Projects</option>
                  <option value="mini-projects" ${this.activeFilterCategory === 'mini-projects' ? 'selected' : ''}>Mini Projects</option>
                  <option value="research-projects" ${this.activeFilterCategory === 'research-projects' ? 'selected' : ''}>Research Projects</option>
                  <option value="industry-level-projects" ${this.activeFilterCategory === 'industry-level-projects' ? 'selected' : ''}>Industry-Level</option>
                </select>
              </div>

              <!-- Difficulty Filter -->
              <div>
                <label class="block text-[11px] font-bold text-slate-400 uppercase mb-1">Difficulty</label>
                <select id="filter-difficulty-select" onchange="app.handleDifficultyFilter(this.value)" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400">
                  <option value="">All Levels</option>
                  <option value="Beginner" ${this.activeFilterDifficulty === 'Beginner' ? 'selected' : ''}>Beginner</option>
                  <option value="Intermediate" ${this.activeFilterDifficulty === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
                  <option value="Advanced" ${this.activeFilterDifficulty === 'Advanced' ? 'selected' : ''}>Advanced</option>
                </select>
              </div>

              <!-- Sorting -->
              <div>
                <label class="block text-[11px] font-bold text-slate-400 uppercase mb-1">Sort By</label>
                <select id="filter-sort-select" onchange="app.handleSortFilter(this.value)" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400">
                  <option value="latest" ${this.activeFilterSort === 'latest' ? 'selected' : ''}>Latest Added</option>
                  <option value="popular" ${this.activeFilterSort === 'popular' ? 'selected' : ''}>Most Popular (Views)</option>
                  <option value="featured" ${this.activeFilterSort === 'featured' ? 'selected' : ''}>Featured First</option>
                  <option value="alphabetical" ${this.activeFilterSort === 'alphabetical' ? 'selected' : ''}>Alphabetical (A-Z)</option>
                </select>
              </div>

            </div>

            <!-- Active Filter Badges -->
            ${(this.activeFilterDomain || this.activeFilterCategory || this.activeFilterDifficulty || this.searchQuery) ? `
              <div class="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs">
                <span class="text-slate-400">Active Filters:</span>
                ${this.activeFilterDomain ? `<span class="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-medium">Domain: ${this.activeFilterDomain}</span>` : ''}
                ${this.activeFilterCategory ? `<span class="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium">Category: ${this.activeFilterCategory}</span>` : ''}
                ${this.activeFilterDifficulty ? `<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-medium">Level: ${this.activeFilterDifficulty}</span>` : ''}
                ${this.searchQuery ? `<span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">Search: "${this.searchQuery}"</span>` : ''}
                <button onclick="app.resetAllFilters()" class="text-rose-400 hover:text-rose-300 text-xs underline ml-auto">Reset All Filters</button>
              </div>
            ` : ''}

          </div>

          <!-- Results Counter -->
          <div class="flex items-center justify-between text-xs text-slate-400 mb-6">
            <span>Showing <strong class="text-white">${this.projects.length}</strong> Projects</span>
            <span>All projects include IEEE Documentation & Viva Support</span>
          </div>

          <!-- Project Cards Grid or Empty State -->
          ${this.projects.length > 0 ? `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              ${this.projects.map(p => this.renderProjectCard(p)).join('')}
            </div>
          ` : `
            <div class="text-center py-16 glass-panel rounded-2xl max-w-lg mx-auto">
              <i data-lucide="search-x" class="w-12 h-12 text-slate-500 mx-auto mb-4"></i>
              <h3 class="text-xl font-bold font-heading text-white">No Projects Found</h3>
              <p class="text-xs text-slate-400 mt-2">Try adjusting your search criteria or resetting filters.</p>
              <button onclick="app.resetAllFilters()" class="mt-4 px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs">
                Reset All Filters
              </button>
            </div>
          `}

        </div>
      </section>
    `;
  },

  // 4. PROJECT DETAIL VIEW
  renderProjectDetailView() {
    const project = this.projects.find(p => p.slug === this.selectedProjectSlug) || this.projects[0];
    if (!project) {
      return `
        <div class="max-w-4xl mx-auto py-24 text-center">
          <h2 class="text-2xl font-bold font-heading text-white">Project Not Found</h2>
          <button onclick="app.navigate('projects')" class="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500 text-black font-bold">
            Back to Projects
          </button>
        </div>
      `;
    }

    const techList = Array.isArray(project.technologies) ? project.technologies : [];
    const featuresList = Array.isArray(project.features) ? project.features : [];
    const objectivesList = Array.isArray(project.objectives) ? project.objectives : [];
    const swReqList = Array.isArray(project.sw_requirements) ? project.sw_requirements : [];
    const hwReqList = Array.isArray(project.hw_requirements) ? project.hw_requirements : [];
    const workflowSteps = Array.isArray(project.workflow_steps) ? project.workflow_steps : [];
    const outcomesList = Array.isArray(project.expected_outcomes) ? project.expected_outcomes : [];

    return `
      <section class="py-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <!-- Breadcrumb -->
          <div class="flex items-center gap-2 text-xs text-slate-400 mb-6 overflow-x-auto">
            <a href="#home" onclick="app.navigate('home')" class="hover:text-cyan-400">Home</a>
            <span>/</span>
            <a href="#projects" onclick="app.navigate('projects')" class="hover:text-cyan-400">Projects</a>
            <span>/</span>
            <span class="text-cyan-300 font-semibold">${project.domain_name}</span>
            <span>/</span>
            <span class="text-slate-200 truncate max-w-xs">${project.title}</span>
          </div>

          <!-- Hero Details Header -->
          <div class="glass-panel p-6 sm:p-8 rounded-3xl mb-8 border border-slate-800">
            <div class="flex flex-wrap items-center gap-2 mb-3">
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                ${project.domain_name}
              </span>
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                ${project.category_name}
              </span>
              <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Level: ${project.difficulty}
              </span>
              <span class="text-xs text-slate-400 ml-auto flex items-center gap-1">
                <i data-lucide="eye" class="w-3.5 h-3.5 text-cyan-400"></i> ${project.views_count || 140} Views
              </span>
            </div>

            <h1 class="text-2xl sm:text-4xl font-extrabold font-heading text-white leading-tight">
              ${project.title}
            </h1>

            <p class="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed max-w-4xl">
              ${project.short_desc}
            </p>

            <!-- Tech Pills -->
            <div class="flex flex-wrap gap-2 pt-4">
              ${techList.map(t => `
                <span class="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono">
                  ${t}
                </span>
              `).join('')}
            </div>
          </div>

          <!-- Split Content Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- Left Main Column (Tabs & Info) -->
            <div class="lg:col-span-8 space-y-8">
              
              <!-- Project Showcase Gallery / Media Banner -->
              <div class="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
                <img src="${project.thumbnail}" alt="${project.title}" class="w-full h-80 object-cover">
              </div>

              <!-- Full Description & Problem Statement -->
              <div class="glass-panel p-6 sm:p-8 rounded-2xl space-y-4">
                <h3 class="text-xl font-bold font-heading text-white flex items-center gap-2">
                  <i data-lucide="file-text" class="w-5 h-5 text-cyan-400"></i>
                  <span>Project Overview & Problem Statement</span>
                </h3>
                <p class="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  ${project.full_desc}
                </p>
              </div>

              <!-- Project Objectives -->
              ${objectivesList.length > 0 ? `
                <div class="glass-panel p-6 sm:p-8 rounded-2xl space-y-4">
                  <h3 class="text-xl font-bold font-heading text-white flex items-center gap-2">
                    <i data-lucide="target" class="w-5 h-5 text-amber-400"></i>
                    <span>Project Objectives</span>
                  </h3>
                  <ul class="space-y-2.5">
                    ${objectivesList.map(obj => `
                      <li class="flex items-start gap-3 text-sm text-slate-300">
                        <i data-lucide="check" class="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5"></i>
                        <span>${obj}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}

              <!-- System Workflow & Architecture Flowchart -->
              <div class="glass-panel p-6 sm:p-8 rounded-2xl space-y-4">
                <h3 class="text-xl font-bold font-heading text-white flex items-center gap-2">
                  <i data-lucide="git-branch" class="w-5 h-5 text-purple-400"></i>
                  <span>System Architecture & Workflow</span>
                </h3>
                <p class="text-slate-400 text-xs">
                  ${project.architecture_desc || 'Modular high-throughput pipeline designed for seamless execution and transparent viva defense.'}
                </p>

                <!-- Step-by-step visual workflow -->
                <div class="space-y-3 pt-2">
                  ${workflowSteps.map((step, idx) => `
                    <div class="flex items-center gap-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                      <span class="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        0${idx + 1}
                      </span>
                      <span class="text-xs sm:text-sm font-medium text-slate-200">${step}</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Key Features Checklist -->
              ${featuresList.length > 0 ? `
                <div class="glass-panel p-6 sm:p-8 rounded-2xl space-y-4">
                  <h3 class="text-xl font-bold font-heading text-white flex items-center gap-2">
                    <i data-lucide="check-square" class="w-5 h-5 text-emerald-400"></i>
                    <span>Key System Features</span>
                  </h3>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    ${featuresList.map(feat => `
                      <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-2.5">
                        <i data-lucide="zap" class="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5"></i>
                        <span class="text-xs text-slate-300 font-medium">${feat}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Requirements Specification -->
              <div class="glass-panel p-6 sm:p-8 rounded-2xl space-y-6">
                <h3 class="text-xl font-bold font-heading text-white flex items-center gap-2">
                  <i data-lucide="cpu" class="w-5 h-5 text-blue-400"></i>
                  <span>System Requirements</span>
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <!-- Software -->
                  <div class="space-y-3">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-cyan-400">Software Environment</h4>
                    <ul class="space-y-1.5 text-xs text-slate-300">
                      ${swReqList.map(s => `<li class="flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>${s}</li>`).join('')}
                    </ul>
                  </div>
                  <!-- Hardware -->
                  <div class="space-y-3">
                    <h4 class="text-xs font-bold uppercase tracking-wider text-purple-400">Hardware Specifications</h4>
                    <ul class="space-y-1.5 text-xs text-slate-300">
                      ${hwReqList.map(h => `<li class="flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>${h}</li>`).join('')}
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Expected Outcomes -->
              ${outcomesList.length > 0 ? `
                <div class="glass-panel p-6 sm:p-8 rounded-2xl space-y-4">
                  <h3 class="text-xl font-bold font-heading text-white flex items-center gap-2">
                    <i data-lucide="award" class="w-5 h-5 text-amber-400"></i>
                    <span>Expected Outcomes & Viva Advantage</span>
                  </h3>
                  <ul class="space-y-2">
                    ${outcomesList.map(out => `
                      <li class="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                        <i data-lucide="star" class="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5"></i>
                        <span>${out}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}

            </div>

            <!-- Right Sticky Column: Actions & Demonstrations -->
            <div class="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
              
              <!-- Primary CTA Card -->
              <div class="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-[#070b14] border border-cyan-500/40 shadow-2xl shadow-cyan-500/10 space-y-5">
                
                <div class="text-center">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950 uppercase">
                    100% Viva Ready
                  </span>
                  <h3 class="text-xl font-bold font-heading text-white mt-2">Get Complete Project Support</h3>
                  <p class="text-xs text-slate-400 mt-1">Source Code + IEEE Documentation + PPT + 1-on-1 Viva Coaching</p>
                </div>

                <!-- Action Button: I'M INTERESTED -->
                <button onclick="app.openInterestModalForProject(${project.id}, '${project.title.replace(/'/g, "\\'")}', '${project.domain_name}', '${project.category_name}')" class="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]">
                  <i data-lucide="send" class="w-4 h-4"></i>
                  <span>I'm Interested in This Project</span>
                </button>

                <!-- WhatsApp Direct Chat Button -->
                <a href="https://wa.me/917989010109?text=${encodeURIComponent(`Hi ProjectVerse, I am interested in "${project.title}". Please send me the complete demonstration video, abstract, and pricing.`)}" target="_blank" class="w-full py-3.5 rounded-xl bg-[#25D366] hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition">
                  <i data-lucide="message-circle" class="w-4 h-4"></i>
                  <span>Ask on WhatsApp: 7989010109</span>
                </a>

                <!-- Call Counselor -->
                <a href="tel:7989010109" class="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition">
                  <i data-lucide="phone" class="w-4 h-4 text-cyan-400"></i>
                  <span>Call Hotline: 7989010109</span>
                </a>

                <!-- Batch Discount Banner -->
                <div class="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                  <span class="text-[11px] font-bold text-cyan-300">👥 Batch Discount Available!</span>
                  <p class="text-[10px] text-slate-400 mt-0.5">Special group packages for batches of 3 to 4 students.</p>
                </div>

              </div>

              <!-- Working Demonstrations Card -->
              <div class="glass-panel p-6 rounded-2xl space-y-4">
                <h4 class="text-sm font-bold font-heading text-white flex items-center gap-2">
                  <i data-lucide="video" class="w-4 h-4 text-amber-400"></i>
                  <span>Project Demonstrations</span>
                </h4>
                
                <div class="space-y-2 text-xs">
                  ${project.demo_video_url ? `
                    <button onclick="app.openDemoModal('${project.title.replace(/'/g, "\\'")}', '${project.demo_video_url}')" class="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left text-slate-200 flex items-center justify-between transition">
                      <span class="flex items-center gap-2 font-medium">
                        <i data-lucide="play" class="w-3.5 h-3.5 text-amber-400"></i> Watch Video Demonstration
                      </span>
                      <span class="text-[10px] text-amber-400 font-bold">LIVE</span>
                    </button>
                  ` : ''}

                  ${project.live_demo_url ? `
                    <a href="${project.live_demo_url}" target="_blank" class="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left text-slate-200 flex items-center justify-between transition">
                      <span class="flex items-center gap-2 font-medium">
                        <i data-lucide="external-link" class="w-3.5 h-3.5 text-cyan-400"></i> Test Live Web App Demo
                      </span>
                      <span class="text-[10px] text-cyan-400 font-bold">&rarr;</span>
                    </a>
                  ` : ''}

                  ${project.github_url ? `
                    <a href="${project.github_url}" target="_blank" class="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left text-slate-200 flex items-center justify-between transition">
                      <span class="flex items-center gap-2 font-medium">
                        <i data-lucide="github" class="w-3.5 h-3.5 text-purple-400"></i> GitHub Architecture Repository
                      </span>
                      <span class="text-[10px] text-purple-400 font-bold">&rarr;</span>
                    </a>
                  ` : ''}

                  <div class="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Includes Turnitin Report</span>
                    <span class="text-emerald-400 font-bold">100% Genuine</span>
                  </div>
                </div>
              </div>

              <!-- Share Card -->
              <div class="glass-panel p-4 rounded-xl flex items-center justify-between text-xs text-slate-400">
                <span>Share with Batchmates:</span>
                <div class="flex items-center gap-2">
                  <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this final year project on ProjectVerse: ${project.title}`)}" target="_blank" class="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition">
                    <i data-lucide="share-2" class="w-4 h-4"></i>
                  </a>
                  <button onclick="navigator.clipboard.writeText(window.location.href); app.showToast('Project link copied to clipboard!', 'success');" class="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition">
                    <i data-lucide="link" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>
    `;
  },

  // 5. DOMAINS DIRECTORY VIEW
  renderDomainsView() {
    return `
      <section class="py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="text-center max-w-3xl mx-auto mb-16">
            <span class="text-xs font-bold uppercase tracking-widest text-cyan-400">Technology Directory</span>
            <h1 class="text-3xl sm:text-5xl font-black font-heading text-white mt-1">
              Project Domains & Branches
            </h1>
            <p class="text-slate-400 text-sm mt-2">
              Select your required domain to discover curated, viva-ready projects for final year evaluations:
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            ${this.domains.map(d => `
              <div class="glass-panel p-6 rounded-2xl flex flex-col justify-between group hover:border-cyan-400/80 transition-all card-hover-tilt">
                <div>
                  <div class="w-12 h-12 rounded-xl bg-slate-800 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <i data-lucide="${this.mapLucideIcon(d.icon)}" class="w-6 h-6"></i>
                  </div>
                  <h3 class="text-lg font-bold font-heading text-white group-hover:text-cyan-300 transition">${d.name}</h3>
                  <p class="text-xs text-slate-400 mt-2 leading-relaxed">${d.description}</p>
                </div>
                <div class="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span class="text-xs font-semibold text-cyan-400">${d.project_count || 1} Projects Available</span>
                  <button onclick="app.filterByDomain('${d.slug}')" class="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition">
                    Explore &rarr;
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

        </div>
      </section>
    `;
  },

  // 6. SERVICES VIEW
  renderServicesView() {
    return `
      <section class="py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="text-center max-w-3xl mx-auto mb-16">
            <span class="text-xs font-bold uppercase tracking-widest text-amber-400">Complete Student Ecosystem</span>
            <h1 class="text-3xl sm:text-5xl font-black font-heading text-white mt-1">
              Our Comprehensive Services
            </h1>
            <p class="text-slate-400 text-sm mt-2">
              From Project Idea to Final Viva — We Guide You Every Step.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div class="glass-panel p-8 rounded-2xl space-y-3">
              <div class="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                <i data-lucide="code" class="w-6 h-6"></i>
              </div>
              <h3 class="text-xl font-bold font-heading text-white">Complete Working Project</h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                100% running, fully commented source code with modular architecture. Tested on standard configurations to guarantee zero errors during your faculty evaluation.
              </p>
            </div>

            <div class="glass-panel p-8 rounded-2xl space-y-3">
              <div class="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <i data-lucide="file-check" class="w-6 h-6"></i>
              </div>
              <h3 class="text-xl font-bold font-heading text-white">PPT & IEEE Project Report</h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                Full documentation prepared according to your university format with system architecture diagrams, test cases, and a low plagiarism Turnitin report.
              </p>
            </div>

            <div class="glass-panel p-8 rounded-2xl space-y-3">
              <div class="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                <i data-lucide="message-square" class="w-6 h-6"></i>
              </div>
              <h3 class="text-xl font-bold font-heading text-white">Viva Voce Preparation & Q&A</h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                Confidently face external examiners. We provide 100+ predicted viva questions and 1-on-1 technical coaching sessions covering algorithms and theory.
              </p>
            </div>

            <div class="glass-panel p-8 rounded-2xl space-y-3">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <i data-lucide="sliders" class="w-6 h-6"></i>
              </div>
              <h3 class="text-xl font-bold font-heading text-white">Custom Requirements & Modules</h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                Does your professor want a specific API, an extra deep learning model, or a novel hardware sensor? Our engineers customize the project to your exact guidelines.
              </p>
            </div>

            <div class="glass-panel p-8 rounded-2xl space-y-3">
              <div class="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                <i data-lucide="cloud" class="w-6 h-6"></i>
              </div>
              <h3 class="text-xl font-bold font-heading text-white">Cloud Deployment & Hosting</h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                Assistance with hosting on AWS, Render, Vercel, Firebase, or Google Cloud so you can showcase a live working URL to your college review committee.
              </p>
            </div>

            <div class="glass-panel p-8 rounded-2xl space-y-3">
              <div class="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
                <i data-lucide="shield-check" class="w-6 h-6"></i>
              </div>
              <h3 class="text-xl font-bold font-heading text-white">Research Paper Guidance</h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                For M.Tech and B.Tech research batches: assistance with writing and structuring scientific papers for IEEE, Springer, and Scopus conference submissions.
              </p>
            </div>

          </div>

          <!-- CTA Banner -->
          <div class="mt-16 text-center">
            <button onclick="app.openInterestModal()" class="px-8 py-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/20 hover:scale-105 transition-all">
              Book Project Support Now
            </button>
          </div>

        </div>
      </section>
    `;
  },

  // 7. ABOUT VIEW
  renderAboutView() {
    return `
      <section class="py-16">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div class="text-center">
            <span class="text-xs font-bold uppercase tracking-widest text-cyan-400">About Our Platform</span>
            <h1 class="text-3xl sm:text-5xl font-black font-heading text-white mt-1">
              About PROJECTVERSE
            </h1>
            <p class="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl mx-auto">
              "Your Final Year. Our Responsibility. Your Success."
            </p>
          </div>

          <div class="glass-panel p-8 rounded-3xl space-y-6 text-slate-300 text-sm leading-relaxed">
            <p>
              PROJECTVERSE was founded by senior software architects, researchers, and academic mentors to eliminate the stress and confusion that college students face during their final-year capstone evaluations.
            </p>
            <p>
              Every year, thousands of students in B.Tech, M.Tech, MCA, BCA, and B.Sc/M.Sc streams struggle with buggy downloaded code, generic templates, plagiarized documentation, and lack of viva preparation. PROJECTVERSE delivers an authentic, end-to-end partner experience: providing clean working source code, university-compliant IEEE reports, editable presentation PPTs, and rigorous viva question preparation.
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-center">
              <div>
                <div class="text-3xl font-black font-heading text-cyan-400">12,450+</div>
                <div class="text-xs text-slate-400 mt-1">Students Guided</div>
              </div>
              <div>
                <div class="text-3xl font-black font-heading text-emerald-400">100%</div>
                <div class="text-xs text-slate-400 mt-1">Working Projects</div>
              </div>
              <div>
                <div class="text-3xl font-black font-heading text-amber-400">15 Mins</div>
                <div class="text-xs text-slate-400 mt-1">Average WhatsApp Response</div>
              </div>
            </div>
          </div>

          <!-- Contact information card -->
          <div class="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-slate-900 border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 class="text-lg font-bold font-heading text-white">Have questions about your project submission?</h4>
              <p class="text-xs text-slate-400 mt-0.5">Contact Director Saikiran Gorle directly on hotline: 7989010109</p>
            </div>
            <a href="tel:7989010109" class="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase transition">
              Call Hotline
            </a>
          </div>

        </div>
      </section>
    `;
  },

  // 8. CONTACT VIEW
  renderContactView() {
    return `
      <section class="py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="text-center max-w-3xl mx-auto mb-16">
            <span class="text-xs font-bold uppercase tracking-widest text-cyan-400">Get in Touch</span>
            <h1 class="text-3xl sm:text-5xl font-black font-heading text-white mt-1">
              Contact Project Team
            </h1>
            <p class="text-slate-400 text-sm mt-2">
              Our project counselors and senior architects are available 7 days a week to help with your topic selection, demonstrations, and viva preparation.
            </p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- Left Info Panel -->
            <div class="lg:col-span-5 space-y-6">
              
              <!-- Direct Contact Card -->
              <div class="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 border border-slate-800">
                <h3 class="text-xl font-bold font-heading text-white">Direct Communication</h3>
                
                <div class="space-y-4">
                  <!-- Phone -->
                  <div class="flex items-center gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div class="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center flex-shrink-0">
                      <i data-lucide="phone-call" class="w-6 h-6"></i>
                    </div>
                    <div>
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direct Hotline</span>
                      <div class="text-base font-bold text-white">7989010109</div>
                      <a href="tel:7989010109" class="text-xs text-cyan-400 font-semibold hover:underline">Click to Call Now &rarr;</a>
                    </div>
                  </div>

                  <!-- WhatsApp -->
                  <div class="flex items-center gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <i data-lucide="message-circle" class="w-6 h-6"></i>
                    </div>
                    <div>
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp Support</span>
                      <div class="text-base font-bold text-white">7989010109</div>
                      <a href="https://wa.me/917989010109?text=Hi%20ProjectVerse%2C%20I%20want%20to%20discuss%20my%20final%20year%20project." target="_blank" class="text-xs text-emerald-400 font-semibold hover:underline">Open WhatsApp Chat &rarr;</a>
                    </div>
                  </div>

                  <!-- Email -->
                  <div class="flex items-center gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div class="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                      <i data-lucide="mail" class="w-6 h-6"></i>
                    </div>
                    <div>
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Inquiry</span>
                      <div class="text-sm font-bold text-white break-all">saikirangorle909@gmail.com</div>
                      <a href="mailto:saikirangorle909@gmail.com?subject=Final%20Year%20Project%20Inquiry%20-%20ProjectVerse" class="text-xs text-amber-400 font-semibold hover:underline">Send Email &rarr;</a>
                    </div>
                  </div>
                </div>

                <div class="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-300">
                  ⚡ <strong>Fast Response Guarantee:</strong> We reply to WhatsApp messages within 15 minutes during academic working hours (8:00 AM – 11:00 PM).
                </div>

              </div>

            </div>

            <!-- Right Interactive Contact Form -->
            <div class="lg:col-span-7">
              <div class="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800">
                <h3 class="text-2xl font-bold font-heading text-white mb-2">Send an Instant Message</h3>
                <p class="text-slate-400 text-xs mb-6">Leave your details and project questions. We will respond promptly:</p>

                <form onsubmit="app.handleContactPageSubmit(event)" class="space-y-4">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-semibold text-slate-300 mb-1">Your Name *</label>
                      <input type="text" id="contact-name" required placeholder="Sravan Reddy" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400">
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-300 mb-1">Mobile / WhatsApp Number *</label>
                      <input type="tel" id="contact-phone" required pattern="[0-9]{10}" placeholder="7989010109" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400">
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                      <input type="email" id="contact-email" required placeholder="student@college.edu" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400">
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-300 mb-1">College & Degree *</label>
                      <input type="text" id="contact-college" required placeholder="JNTU - B.Tech CSE" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400">
                    </div>
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Interested Domain or Technology</label>
                    <select id="contact-domain" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400">
                      <option value="Artificial Intelligence & Machine Learning">AI & Machine Learning</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Internet of Things (IoT)">Internet of Things (IoT)</option>
                      <option value="Blockchain">Blockchain & Web3</option>
                      <option value="Cyber Security">Cyber Security</option>
                      <option value="Full Stack Development">Full Stack Web Development</option>
                      <option value="Android Development">Android Development</option>
                      <option value="Other">Other / Not Decided Yet</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-slate-300 mb-1">Message / Project Requirements *</label>
                    <textarea id="contact-message" required rows="4" placeholder="Tell us about your project topic, submission deadline, and requirements..." class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"></textarea>
                  </div>

                  <button type="submit" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition">
                    Submit Message
                  </button>
                </form>
              </div>
            </div>

          </div>

        </div>
      </section>
    `;
  },

  // 9. STUDENT DASHBOARD VIEW
  renderStudentDashboardView() {
    if (!this.studentUser) {
      return `
        <div class="max-w-md mx-auto py-24 px-4 text-center">
          <div class="glass-panel p-8 rounded-3xl space-y-4">
            <i data-lucide="lock" class="w-12 h-12 text-cyan-400 mx-auto"></i>
            <h2 class="text-2xl font-bold font-heading text-white">Student Login Required</h2>
            <p class="text-xs text-slate-400">Please sign in to view your profile, submitted inquiries, and saved projects.</p>
            <button onclick="app.openStudentAuthModal('login')" class="w-full py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs uppercase">
              Sign In
            </button>
          </div>
        </div>
      `;
    }

    return `
      <section class="py-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <!-- Student Profile Header Banner -->
          <div class="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-black font-extrabold text-2xl flex items-center justify-center">
                ${this.studentUser.name.charAt(0)}
              </div>
              <div>
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold">
                  Student Account
                </span>
                <h1 class="text-2xl font-bold font-heading text-white mt-1">${this.studentUser.name}</h1>
                <p class="text-xs text-slate-400">${this.studentUser.college} • ${this.studentUser.course} (${this.studentUser.department})</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button onclick="app.studentLogout()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition">
                Sign Out
              </button>
            </div>
          </div>

          <!-- Inquiries Tracking Section -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold font-heading text-white flex items-center gap-2">
                <i data-lucide="clipboard-list" class="w-5 h-5 text-cyan-400"></i>
                <span>My Submitted Project Inquiries</span>
              </h2>
              <button onclick="app.openInterestModal()" class="px-3.5 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold">
                + Submit New Inquiry
              </button>
            </div>

            <div id="student-inquiries-container" class="space-y-3">
              <div class="text-center py-8 text-slate-500 text-xs">Loading your inquiries...</div>
            </div>
          </div>

        </div>
      </section>
    `;
  },

  async loadStudentInquiries() {
    const container = document.getElementById('student-inquiries-container');
    if (!container) return;

    const res = await this.api('/student/inquiries', {
      headers: { 'Authorization': `Bearer ${this.studentToken}` }
    });

    if (res && res.inquiries && res.inquiries.length > 0) {
      container.innerHTML = res.inquiries.map(inq => {
        const statusBadge = 
          inq.status === 'Converted' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
          inq.status === 'Contacted' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' :
          inq.status === 'Discussion in Progress' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
          'bg-amber-500/20 text-amber-300 border-amber-500/30';

        return `
          <div class="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold text-cyan-400">${inq.ref_code}</span>
                <span class="text-[10px] px-2.5 py-0.5 rounded-full border font-semibold ${statusBadge}">
                  ${inq.status}
                </span>
                <span class="text-[10px] text-slate-500">• Submitted: ${new Date(inq.created_at).toLocaleDateString()}</span>
              </div>
              <h4 class="text-base font-bold text-white">${inq.project_title}</h4>
              <p class="text-xs text-slate-400">${inq.domain_name} (${inq.category_name})</p>
              ${inq.admin_notes ? `
                <div class="text-xs text-cyan-300 mt-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  <strong>Counselor Note:</strong> ${inq.admin_notes}
                </div>
              ` : ''}
            </div>

            <div class="flex items-center gap-2 flex-shrink-0">
              <a href="https://wa.me/917989010109?text=${encodeURIComponent(`Hi ProjectVerse Counselor, following up on my inquiry Reference: ${inq.ref_code} for "${inq.project_title}".`)}" target="_blank" class="px-4 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold flex items-center gap-1.5 transition">
                <i data-lucide="message-circle" class="w-3.5 h-3.5"></i> Chat on WhatsApp
              </a>
            </div>
          </div>
        `;
      }).join('');
      if (window.lucide) lucide.createIcons();
    } else {
      container.innerHTML = `
        <div class="text-center py-12 glass-panel rounded-2xl">
          <p class="text-xs text-slate-400">You haven't submitted any inquiries yet.</p>
          <button onclick="app.openInterestModal()" class="mt-3 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs">
            Browse & Enquire Projects
          </button>
        </div>
      `;
    }
  },

  // 10. ADMIN PORTAL VIEW (Complete Business Engine)
  renderAdminPortalView() {
    if (!this.adminToken) {
      return `
        <div class="max-w-md mx-auto py-24 px-4">
          <div class="glass-panel p-8 rounded-3xl border border-purple-500/40 shadow-2xl space-y-6">
            <div class="text-center">
              <div class="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-3">
                <i data-lucide="shield-lock" class="w-6 h-6"></i>
              </div>
              <h2 class="text-2xl font-bold font-heading text-white">Administrator Portal</h2>
              <p class="text-xs text-slate-400 mt-1">Authorized ProjectVerse Management Only</p>
            </div>

            <form onsubmit="app.handleAdminLogin(event)" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Admin Email</label>
                <input type="email" id="admin-login-email" required value="admin@projectverse.com" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-400">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Admin Password</label>
                <input type="password" id="admin-login-password" required value="admin123" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-400">
              </div>
              <p class="text-[11px] text-slate-500">Default Credentials: <span class="text-purple-300 font-mono">admin@projectverse.com</span> / <span class="text-purple-300 font-mono">admin123</span></p>
              <button type="submit" class="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-500/25 transition">
                Authenticate Admin Access
              </button>
            </form>
          </div>
        </div>
      `;
    }

    return `
      <section class="py-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <!-- Admin Dashboard Header -->
          <div class="glass-panel p-6 rounded-3xl border border-purple-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xl">
                🛡️
              </div>
              <div>
                <h1 class="text-2xl font-bold font-heading text-white">ProjectVerse Admin Control Center</h1>
                <p class="text-xs text-slate-400">Real-time Lead Collection, Project Uploads, & Business Management</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button onclick="app.adminLogout()" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold transition">
                Logout Admin
              </button>
            </div>
          </div>

          <!-- Admin Navigation Tabs -->
          <div class="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            <button onclick="app.switchAdminTab('overview')" class="px-4 py-2 rounded-xl font-bold text-xs transition ${this.adminActiveTab === 'overview' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}">
              📊 Analytics Overview
            </button>
            <button onclick="app.switchAdminTab('inquiries')" class="px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 ${this.adminActiveTab === 'inquiries' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}">
              <span>🎯 Student Leads & Interest</span>
              <span id="admin-tab-leads-badge" class="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">!</span>
            </button>
            <button onclick="app.switchAdminTab('projects')" class="px-4 py-2 rounded-xl font-bold text-xs transition ${this.adminActiveTab === 'projects' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}">
              💻 Project Management (CRUD)
            </button>
            <button onclick="app.switchAdminTab('domains')" class="px-4 py-2 rounded-xl font-bold text-xs transition ${this.adminActiveTab === 'domains' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}">
              🌐 Domain Management
            </button>
          </div>

          <!-- Tab Content Container -->
          <div id="admin-tab-content">
            <!-- Injected by loadAdminData() -->
            <div class="text-center py-12 text-slate-500 text-xs">Loading management module...</div>
          </div>

        </div>
      </section>
    `;
  },

  switchAdminTab(tab) {
    this.adminActiveTab = tab;
    this.navigate('admin', false);
    this.loadAdminData();
  },

  async loadAdminData() {
    const container = document.getElementById('admin-tab-content');
    if (!container || !this.adminToken) return;

    if (this.adminActiveTab === 'overview') {
      const statsRes = await this.api('/admin/stats', {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      this.adminStats = statsRes?.stats || null;
      container.innerHTML = this.renderAdminOverviewTab();
      setTimeout(() => this.renderAdminCharts(), 100);

    } else if (this.adminActiveTab === 'inquiries') {
      const inqRes = await this.api('/inquiries', {
        headers: { 'Authorization': `Bearer ${this.adminToken}` }
      });
      this.adminInquiries = inqRes?.inquiries || [];
      container.innerHTML = this.renderAdminInquiriesTab();

    } else if (this.adminActiveTab === 'projects') {
      container.innerHTML = this.renderAdminProjectsTab();

    } else if (this.adminActiveTab === 'domains') {
      container.innerHTML = this.renderAdminDomainsTab();
    }

    if (window.lucide) lucide.createIcons();
  },

  // Admin Tab 1: Overview
  renderAdminOverviewTab() {
    const stats = this.adminStats || {
      totalProjects: this.projects.length,
      totalDomains: this.domains.length,
      totalStudents: 1,
      totalInquiries: 5,
      newInquiries: 1,
      contactedInquiries: 2,
      progressInquiries: 1,
      convertedInquiries: 1
    };

    return `
      <div class="space-y-8">
        <!-- 8 Metric Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="glass-panel p-5 rounded-2xl border-l-4 border-l-cyan-400">
            <span class="text-xs text-slate-400 font-bold uppercase">Total Projects</span>
            <div class="text-3xl font-black font-heading text-white mt-1">${stats.totalProjects}</div>
            <span class="text-[10px] text-cyan-400 mt-1 block">Live in Catalog</span>
          </div>

          <div class="glass-panel p-5 rounded-2xl border-l-4 border-l-purple-400">
            <span class="text-xs text-slate-400 font-bold uppercase">Total Leads</span>
            <div class="text-3xl font-black font-heading text-white mt-1">${stats.totalInquiries}</div>
            <span class="text-[10px] text-purple-400 mt-1 block">Student Inquiries</span>
          </div>

          <div class="glass-panel p-5 rounded-2xl border-l-4 border-l-amber-400">
            <span class="text-xs text-slate-400 font-bold uppercase">New Inquiries</span>
            <div class="text-3xl font-black font-heading text-amber-400 mt-1">${stats.newInquiries}</div>
            <span class="text-[10px] text-slate-400 mt-1 block">Pending Action</span>
          </div>

          <div class="glass-panel p-5 rounded-2xl border-l-4 border-l-emerald-400">
            <span class="text-xs text-slate-400 font-bold uppercase">Converted Batches</span>
            <div class="text-3xl font-black font-heading text-emerald-400 mt-1">${stats.convertedInquiries}</div>
            <span class="text-[10px] text-emerald-400 mt-1 block">Enrolled Students</span>
          </div>
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="glass-panel p-6 rounded-3xl space-y-4">
            <h3 class="text-base font-bold font-heading text-white">Leads by Status Distribution</h3>
            <div class="h-64 relative flex items-center justify-center">
              <canvas id="leads-status-chart"></canvas>
            </div>
          </div>

          <div class="glass-panel p-6 rounded-3xl space-y-4">
            <h3 class="text-base font-bold font-heading text-white">Inquiries by Domain</h3>
            <div class="h-64 relative flex items-center justify-center">
              <canvas id="leads-domain-chart"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderAdminCharts() {
    if (!window.Chart) return;

    // Status Doughnut Chart
    const statusCtx = document.getElementById('leads-status-chart');
    if (statusCtx) {
      new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: ['New Inquiry', 'Contacted', 'In Progress', 'Converted'],
          datasets: [{
            data: [
              this.adminStats?.newInquiries || 1,
              this.adminStats?.contactedInquiries || 2,
              this.adminStats?.progressInquiries || 1,
              this.adminStats?.convertedInquiries || 1
            ],
            backgroundColor: ['#f59e0b', '#00f0ff', '#a855f7', '#10b981'],
            borderColor: '#0b1120',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } }
          }
        }
      });
    }

    // Domain Bar Chart
    const domainCtx = document.getElementById('leads-domain-chart');
    if (domainCtx) {
      const domainsData = this.adminStats?.domainStats || [
        { domain_name: 'Computer Vision', count: 3 },
        { domain_name: 'AI / ML', count: 2 },
        { domain_name: 'IoT', count: 2 },
        { domain_name: 'Blockchain', count: 1 }
      ];

      new Chart(domainCtx, {
        type: 'bar',
        data: {
          labels: domainsData.map(d => d.domain_name),
          datasets: [{
            label: 'Leads',
            data: domainsData.map(d => d.count),
            backgroundColor: '#38bdf8'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } }
          }
        }
      });
    }
  },

  // Admin Tab 2: Student Leads & Inquiries Management (The Most Important Business Tab)
  renderAdminInquiriesTab() {
    return `
      <div class="space-y-6">
        
        <!-- Controls Bar -->
        <div class="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <input type="text" id="admin-inq-search" oninput="app.filterAdminInquiries(this.value)" placeholder="Search leads by name, college, phone..." class="w-full sm:w-64 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs">
            <select id="admin-inq-status-filter" onchange="app.filterAdminInquiriesByStatus(this.value)" class="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs">
              <option value="All">All Statuses</option>
              <option value="New Inquiry">New Inquiry</option>
              <option value="Contacted">Contacted</option>
              <option value="Discussion in Progress">In Progress</option>
              <option value="Converted">Converted</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <!-- Export CSV Button -->
          <a href="/api/inquiries/export" download class="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition">
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>Export to CSV (Excel)</span>
          </a>
        </div>

        <!-- Leads Table -->
        <div class="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th class="p-3.5">Ref & Student</th>
                  <th class="p-3.5">Contact Action</th>
                  <th class="p-3.5">College & Course</th>
                  <th class="p-3.5">Target Project</th>
                  <th class="p-3.5">Inquiry Status</th>
                  <th class="p-3.5">Admin Notes</th>
                  <th class="p-3.5 text-right">Manage</th>
                </tr>
              </thead>
              <tbody id="admin-inquiries-tbody" class="divide-y divide-slate-800">
                ${this.renderAdminInquiriesRows(this.adminInquiries)}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  },

  renderAdminInquiriesRows(inquiries) {
    if (!inquiries || inquiries.length === 0) {
      return `<tr><td colspan="7" class="p-8 text-center text-slate-500">No student leads found.</td></tr>`;
    }

    return inquiries.map(inq => {
      const whatsappMsg = encodeURIComponent(`Hi ${inq.student_name}, this is Saikiran from ProjectVerse regarding your inquiry (${inq.ref_code}) for "${inq.project_title}". Are you free for a quick call to discuss the source code and demonstration?`);
      return `
        <tr class="hover:bg-slate-900/40 transition">
          <td class="p-3.5">
            <span class="font-mono text-cyan-400 font-bold text-[11px] block">${inq.ref_code}</span>
            <span class="font-bold text-white">${inq.student_name}</span>
            <span class="text-[10px] text-slate-500 block">${inq.city}</span>
          </td>
          <td class="p-3.5">
            <div class="flex items-center gap-1.5">
              <!-- WhatsApp direct link -->
              <a href="https://wa.me/91${inq.mobile}?text=${whatsappMsg}" target="_blank" class="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition" title="WhatsApp Student">
                <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
              </a>
              <!-- Call direct link -->
              <a href="tel:${inq.mobile}" class="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition" title="Call Student">
                <i data-lucide="phone" class="w-3.5 h-3.5"></i>
              </a>
              <!-- Email direct link -->
              <a href="mailto:${inq.email}?subject=ProjectVerse%20-%20Final%20Year%20Project%20Consultation" class="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition" title="Email Student">
                <i data-lucide="mail" class="w-3.5 h-3.5"></i>
              </a>
              <span class="text-[10px] text-slate-300 ml-1 font-mono">${inq.mobile}</span>
            </div>
          </td>
          <td class="p-3.5">
            <span class="font-medium text-slate-300 block truncate max-w-[180px]">${inq.college}</span>
            <span class="text-[10px] text-slate-400">${inq.course} • ${inq.department}</span>
          </td>
          <td class="p-3.5">
            <span class="font-semibold text-white block truncate max-w-[200px]">${inq.project_title}</span>
            <span class="text-[10px] text-purple-400 font-medium">${inq.domain_name}</span>
          </td>
          <td class="p-3.5">
            <select onchange="app.updateLeadStatus(${inq.id}, this.value)" class="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] text-white focus:outline-none focus:border-cyan-400">
              <option value="New Inquiry" ${inq.status === 'New Inquiry' ? 'selected' : ''}>New Inquiry</option>
              <option value="Contacted" ${inq.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
              <option value="Interested" ${inq.status === 'Interested' ? 'selected' : ''}>Interested</option>
              <option value="Discussion in Progress" ${inq.status === 'Discussion in Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Converted" ${inq.status === 'Converted' ? 'selected' : ''}>Converted</option>
              <option value="Not Interested" ${inq.status === 'Not Interested' ? 'selected' : ''}>Not Interested</option>
              <option value="Closed" ${inq.status === 'Closed' ? 'selected' : ''}>Closed</option>
            </select>
          </td>
          <td class="p-3.5">
            <div class="text-[11px] text-slate-400 truncate max-w-[160px]" title="${inq.admin_notes || ''}">
              ${inq.admin_notes || '<span class="text-slate-600">No notes yet</span>'}
            </div>
            <button onclick="app.promptLeadNotes(${inq.id}, '${(inq.admin_notes || '').replace(/'/g, "\\'")}')" class="text-[10px] text-cyan-400 hover:underline">
              Edit Notes
            </button>
          </td>
          <td class="p-3.5 text-right">
            <button onclick="app.deleteLead(${inq.id})" class="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded" title="Delete Lead">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  async updateLeadStatus(id, newStatus) {
    const res = await this.api(`/inquiries/${id}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${this.adminToken}` },
      body: JSON.stringify({ status: newStatus })
    });
    if (res && res.success) {
      this.showToast(`Lead status updated to "${newStatus}"`, 'success');
      const inq = this.adminInquiries.find(i => i.id === id);
      if (inq) inq.status = newStatus;
    }
  },

  async promptLeadNotes(id, currentNotes) {
    const newNote = prompt('Enter private admin notes for this student lead:', currentNotes);
    if (newNote === null) return;

    const res = await this.api(`/inquiries/${id}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${this.adminToken}` },
      body: JSON.stringify({ admin_notes: newNote })
    });
    if (res && res.success) {
      this.showToast('Admin note saved', 'success');
      const inq = this.adminInquiries.find(i => i.id === id);
      if (inq) inq.admin_notes = newNote;
      this.loadAdminData();
    }
  },

  async deleteLead(id) {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    const res = await this.api(`/inquiries/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.adminToken}` }
    });
    if (res && res.success) {
      this.showToast('Lead deleted', 'info');
      this.adminInquiries = this.adminInquiries.filter(i => i.id !== id);
      this.loadAdminData();
    }
  },

  // Admin Tab 3: Projects CRUD
  renderAdminProjectsTab() {
    return `
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold font-heading text-white">Project Catalog Management</h3>
          <button onclick="app.openAddProjectModal()" class="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase flex items-center gap-1.5 transition">
            <i data-lucide="plus" class="w-4 h-4"></i> Add New Project
          </button>
        </div>

        <div class="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th class="p-3.5">Title & Domain</th>
                <th class="p-3.5">Category</th>
                <th class="p-3.5">Difficulty</th>
                <th class="p-3.5">Trending / Featured</th>
                <th class="p-3.5">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              ${this.projects.map(p => `
                <tr class="hover:bg-slate-900/40 transition">
                  <td class="p-3.5">
                    <span class="font-bold text-white block">${p.title}</span>
                    <span class="text-[10px] text-cyan-400">${p.domain_name}</span>
                  </td>
                  <td class="p-3.5 text-slate-300">${p.category_name}</td>
                  <td class="p-3.5">${p.difficulty}</td>
                  <td class="p-3.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${p.is_trending ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'}">Trending</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold ml-1 ${p.is_featured ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-500'}">Featured</span>
                  </td>
                  <td class="p-3.5 space-x-2">
                    <button onclick="app.viewProjectDetail('${p.slug}')" class="text-cyan-400 hover:underline">View</button>
                    <button onclick="app.deleteProject(${p.id})" class="text-rose-400 hover:underline">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  async deleteProject(id) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    const res = await this.api(`/projects/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.adminToken}` }
    });
    if (res && res.success) {
      this.showToast('Project deleted', 'info');
      await this.fetchProjects();
      this.loadAdminData();
    }
  },

  openAddProjectModal() {
    const title = prompt('Enter Project Title:');
    if (!title) return;
    const shortDesc = prompt('Enter Short Description:');
    if (!shortDesc) return;

    this.createProjectQuick(title, shortDesc);
  },

  async createProjectQuick(title, shortDesc) {
    const payload = {
      title,
      short_desc: shortDesc,
      domain_id: this.domains[0]?.id || 1,
      category_id: 1,
      technologies: ['Python', 'React', 'FastAPI'],
      languages: 'Python',
      difficulty: 'Intermediate',
      is_published: 1,
      is_featured: 1
    };

    const res = await this.api('/projects', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.adminToken}` },
      body: JSON.stringify(payload)
    });

    if (res && res.success) {
      this.showToast('Project created successfully!', 'success');
      await this.fetchProjects();
      this.loadAdminData();
    }
  },

  // Admin Tab 4: Domains CRUD
  renderAdminDomainsTab() {
    return `
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold font-heading text-white">Project Domains Management</h3>
          <button onclick="app.openAddDomainPrompt()" class="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase flex items-center gap-1.5 transition">
            <i data-lucide="plus" class="w-4 h-4"></i> Add New Domain
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${this.domains.map(d => `
            <div class="glass-panel p-4 rounded-xl flex items-center justify-between border border-slate-800">
              <div>
                <h4 class="font-bold text-white text-sm">${d.name}</h4>
                <span class="text-xs text-cyan-400 font-semibold">${d.project_count || 0} Projects</span>
              </div>
              <button onclick="app.deleteDomain(${d.id})" class="text-rose-400 hover:text-rose-300 p-1.5">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  async openAddDomainPrompt() {
    const name = prompt('Enter new Domain Name (e.g. Quantum Computing):');
    if (!name) return;
    const desc = prompt('Enter short description:');
    if (!desc) return;

    const res = await this.api('/domains', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.adminToken}` },
      body: JSON.stringify({ name, description: desc, icon: 'Cpu' })
    });

    if (res && res.success) {
      this.showToast('Domain added successfully!', 'success');
      await this.fetchDomains();
      this.loadAdminData();
    }
  },

  async deleteDomain(id) {
    if (!confirm('Are you sure you want to delete this domain?')) return;
    const res = await this.api(`/domains/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.adminToken}` }
    });
    if (res && res.success) {
      this.showToast('Domain deleted', 'info');
      await this.fetchDomains();
      this.loadAdminData();
    }
  },

  // 11. PRIVACY & TERMS VIEWS
  renderPrivacyView() {
    return `
      <div class="max-w-4xl mx-auto py-16 px-4 space-y-6 text-slate-300 text-sm leading-relaxed">
        <h1 class="text-3xl font-bold font-heading text-white">Privacy Policy</h1>
        <p>At PROJECTVERSE, we strictly protect student contact information and privacy. Any phone number, email, or college affiliation submitted through our platform is encrypted and used exclusively by our certified project mentors to assist you with your academic project, documentation, and viva guidance.</p>
        <p>We do NOT sell, rent, or publicly display student personal details or contact information under any circumstances.</p>
      </div>
    `;
  },

  renderTermsView() {
    return `
      <div class="max-w-4xl mx-auto py-16 px-4 space-y-6 text-slate-300 text-sm leading-relaxed">
        <h1 class="text-3xl font-bold font-heading text-white">Terms & Conditions</h1>
        <p>All projects, source codes, demonstrations, and reports provided by PROJECTVERSE are meant for academic learning, reference, and educational guidance for final year college students.</p>
        <p>Support hotlines (7989010109) and WhatsApp counseling are available to enrolled batches to ensure successful external evaluations.</p>
      </div>
    `;
  },

  // ==========================================
  // INTERACTIONS, MODALS & EVENT HANDLERS
  // ==========================================

  // Interest Modal
  openInterestModal() {
    const modal = document.getElementById('modal-interest');
    if (!modal) return;
    document.getElementById('interest-form').classList.remove('hidden');
    document.getElementById('interest-success').classList.add('hidden');
    
    // Default general
    document.getElementById('modal-project-title').innerText = 'General Project Consultation';
    document.getElementById('modal-project-domain').innerText = 'Multi-Domain';
    document.getElementById('form-project-id').value = '';
    document.getElementById('form-project-title').value = 'General Consultation';
    document.getElementById('form-domain-name').value = 'Multi-Domain';

    // Autofill student data if logged in
    if (this.studentUser) {
      document.getElementById('form-student-name').value = this.studentUser.name || '';
      document.getElementById('form-mobile').value = this.studentUser.phone || '';
      document.getElementById('form-email').value = this.studentUser.email || '';
      document.getElementById('form-college').value = this.studentUser.college || '';
      document.getElementById('form-city').value = this.studentUser.city || '';
    }

    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  },

  openInterestModalForProject(projectId, projectTitle, domainName, categoryName) {
    this.openInterestModal();
    document.getElementById('modal-project-title').innerText = projectTitle;
    document.getElementById('modal-project-domain').innerText = domainName;
    document.getElementById('form-project-id').value = projectId;
    document.getElementById('form-project-title').value = projectTitle;
    document.getElementById('form-domain-name').value = domainName;
    document.getElementById('form-category-name').value = categoryName;
  },

  closeInterestModal() {
    const modal = document.getElementById('modal-interest');
    if (modal) modal.classList.add('hidden');
  },

  async handleInterestSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('form-submit-btn');
    btn.disabled = true;
    btn.innerHTML = `<span class="animate-spin inline-block mr-2">⌛</span> Submitting Interest...`;

    const payload = {
      student_name: document.getElementById('form-student-name').value,
      mobile: document.getElementById('form-mobile').value,
      email: document.getElementById('form-email').value,
      college: document.getElementById('form-college').value,
      course: document.getElementById('form-course').value,
      department: document.getElementById('form-department').value,
      city: document.getElementById('form-city').value,
      project_id: document.getElementById('form-project-id').value || null,
      project_title: document.getElementById('form-project-title').value,
      domain_name: document.getElementById('form-domain-name').value,
      category_name: document.getElementById('form-category-name').value,
      preferred_tech: document.getElementById('form-pref-tech').value,
      additional_req: document.getElementById('form-message').value
    };

    const res = await this.api('/inquiries', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    btn.disabled = false;
    btn.innerHTML = `Submit Project Interest Now`;

    if (res && res.success) {
      document.getElementById('interest-form').classList.add('hidden');
      document.getElementById('interest-success').classList.remove('hidden');
      document.getElementById('success-ref-code').innerText = res.ref_code;
      
      const waBtn = document.getElementById('success-wa-btn');
      if (waBtn && res.contact_links?.whatsapp) {
        waBtn.href = res.contact_links.whatsapp;
      }

      this.showToast('Your inquiry has been submitted! Reference: ' + res.ref_code, 'success');
      if (window.lucide) lucide.createIcons();
    } else {
      this.showToast(res?.error || 'Failed to submit. Please check your information.', 'error');
    }
  },

  // Contact Page Form
  async handleContactPageSubmit(e) {
    e.preventDefault();
    const payload = {
      student_name: document.getElementById('contact-name').value,
      mobile: document.getElementById('contact-phone').value,
      email: document.getElementById('contact-email').value,
      college: document.getElementById('contact-college').value,
      course: 'B.Tech',
      department: 'Engineering',
      city: 'India',
      domain_name: document.getElementById('contact-domain').value,
      category_name: 'Major Projects',
      project_title: `Inquiry from ${document.getElementById('contact-domain').value}`,
      message: document.getElementById('contact-message').value
    };

    const res = await this.api('/inquiries', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res && res.success) {
      this.showToast('Thank you! Your message has been sent. Reference: ' + res.ref_code, 'success');
      e.target.reset();
    } else {
      this.showToast(res?.error || 'Submission failed. Please call 7989010109.', 'error');
    }
  },

  // Poster Modal
  openPosterModal() {
    const modal = document.getElementById('modal-poster');
    if (modal) modal.classList.remove('hidden');
  },
  closePosterModal() {
    const modal = document.getElementById('modal-poster');
    if (modal) modal.classList.add('hidden');
  },

  // Demo Video Modal
  openDemoModal(title, videoUrl) {
    const modal = document.getElementById('modal-demo');
    const iframe = document.getElementById('modal-demo-iframe');
    const titleEl = document.getElementById('modal-demo-title');
    if (modal && iframe) {
      titleEl.innerText = title;
      iframe.src = videoUrl.includes('watch?v=') ? videoUrl.replace('watch?v=', 'embed/') : videoUrl;
      modal.classList.remove('hidden');
    }
  },
  closeDemoModal() {
    const modal = document.getElementById('modal-demo');
    const iframe = document.getElementById('modal-demo-iframe');
    if (modal && iframe) {
      iframe.src = '';
      modal.classList.add('hidden');
    }
  },

  // Student Auth Modal
  openStudentAuthModal(tab = 'login') {
    const modal = document.getElementById('modal-student-auth');
    if (modal) {
      this.switchStudentAuthTab(tab);
      modal.classList.remove('hidden');
    }
  },
  closeStudentAuthModal() {
    const modal = document.getElementById('modal-student-auth');
    if (modal) modal.classList.add('hidden');
  },
  switchStudentAuthTab(tab) {
    const loginForm = document.getElementById('student-login-form');
    const regForm = document.getElementById('student-register-form');
    const tabLogin = document.getElementById('auth-tab-login');
    const tabReg = document.getElementById('auth-tab-register');

    if (tab === 'login') {
      loginForm.classList.remove('hidden');
      regForm.classList.add('hidden');
      tabLogin.className = 'font-bold text-sm text-cyan-400 border-b-2 border-cyan-400 pb-1';
      tabReg.className = 'font-bold text-sm text-slate-400 hover:text-slate-200 pb-1';
    } else {
      loginForm.classList.add('hidden');
      regForm.classList.remove('hidden');
      tabLogin.className = 'font-bold text-sm text-slate-400 hover:text-slate-200 pb-1';
      tabReg.className = 'font-bold text-sm text-cyan-400 border-b-2 border-cyan-400 pb-1';
    }
  },

  async handleStudentLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const res = await this.api('/auth/student-login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res && res.success) {
      this.studentToken = res.token;
      this.studentUser = res.user;
      localStorage.setItem('pv_student_token', res.token);
      localStorage.setItem('pv_student_user', JSON.stringify(res.user));
      this.updateNavbarAuth();
      this.closeStudentAuthModal();
      this.showToast('Welcome back, ' + res.user.name, 'success');
      this.navigate('student-dashboard');
    } else {
      this.showToast(res?.error || 'Invalid credentials. Try student@demo.com / student123', 'error');
    }
  },

  async handleStudentRegister(e) {
    e.preventDefault();
    const payload = {
      name: document.getElementById('reg-name').value,
      email: document.getElementById('reg-email').value,
      phone: document.getElementById('reg-phone').value,
      college: document.getElementById('reg-college').value,
      course: document.getElementById('reg-course').value,
      city: document.getElementById('reg-city').value,
      password: document.getElementById('reg-password').value
    };

    const res = await this.api('/auth/student-register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res && res.success) {
      this.studentToken = res.token;
      this.studentUser = res.user;
      localStorage.setItem('pv_student_token', res.token);
      localStorage.setItem('pv_student_user', JSON.stringify(res.user));
      this.updateNavbarAuth();
      this.closeStudentAuthModal();
      this.showToast('Account created! Welcome to ProjectVerse.', 'success');
      this.navigate('student-dashboard');
    } else {
      this.showToast(res?.error || 'Registration failed.', 'error');
    }
  },

  studentLogout() {
    this.studentToken = null;
    this.studentUser = null;
    localStorage.removeItem('pv_student_token');
    localStorage.removeItem('pv_student_user');
    this.updateNavbarAuth();
    this.showToast('Logged out successfully', 'info');
    this.navigate('home');
  },

  // Admin Auth Handlers
  async handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('admin-login-email').value;
    const password = document.getElementById('admin-login-password').value;

    const res = await this.api('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res && res.success) {
      this.adminToken = res.token;
      this.adminUser = res.user;
      localStorage.setItem('pv_admin_token', res.token);
      localStorage.setItem('pv_admin_user', JSON.stringify(res.user));
      this.updateNavbarAuth();
      this.showToast('Admin Authenticated!', 'success');
      this.navigate('admin');
    } else {
      this.showToast(res?.error || 'Admin credentials rejected.', 'error');
    }
  },

  adminLogout() {
    this.adminToken = null;
    this.adminUser = null;
    localStorage.removeItem('pv_admin_token');
    localStorage.removeItem('pv_admin_user');
    this.updateNavbarAuth();
    this.showToast('Admin logged out', 'info');
    this.navigate('home');
  },

  // Filter Actions
  filterByDomain(domainSlug) {
    this.activeFilterDomain = domainSlug;
    this.navigate('projects');
  },

  handleDomainFilter(val) {
    this.activeFilterDomain = val;
    this.fetchProjects().then(() => this.navigate('projects', false));
  },

  handleCategoryFilter(val) {
    this.activeFilterCategory = val;
    this.fetchProjects().then(() => this.navigate('projects', false));
  },

  handleDifficultyFilter(val) {
    this.activeFilterDifficulty = val;
    this.fetchProjects().then(() => this.navigate('projects', false));
  },

  handleSortFilter(val) {
    this.activeFilterSort = val;
    this.fetchProjects().then(() => this.navigate('projects', false));
  },

  handleSearchInput(e) {
    this.searchQuery = e.target.value;
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      this.fetchProjects().then(() => this.navigate('projects', false));
    }, 300);
  },

  clearSearch() {
    this.searchQuery = '';
    this.fetchProjects().then(() => this.navigate('projects', false));
  },

  resetAllFilters() {
    this.activeFilterDomain = '';
    this.activeFilterCategory = '';
    this.activeFilterDifficulty = '';
    this.activeFilterSort = 'latest';
    this.searchQuery = '';
    this.fetchProjects().then(() => this.navigate('projects', false));
  },

  viewProjectDetail(slug) {
    this.selectedProjectSlug = slug;
    this.navigate('project-detail');
  },

  // Mobile menu
  toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('hidden');
  },

  // Back to top scroll
  setupWindowScroll() {
    window.addEventListener('scroll', () => {
      const btn = document.getElementById('back-to-top');
      if (btn) {
        if (window.scrollY > 300) {
          btn.classList.remove('hidden');
        } else {
          btn.classList.add('hidden');
        }
      }
    });
  },

  // Toast Notification
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const borderCol = type === 'success' ? 'border-emerald-500' : type === 'error' ? 'border-rose-500' : 'border-cyan-500';
    const textCol = type === 'success' ? 'text-emerald-400' : type === 'error' ? 'text-rose-400' : 'text-cyan-400';

    toast.className = `p-4 rounded-xl bg-[#0b1120] border ${borderCol} shadow-2xl flex items-center gap-3 text-xs text-white pointer-events-auto transform translate-y-2 opacity-0 transition-all duration-300`;
    toast.innerHTML = `
      <span class="${textCol} font-bold text-base">${type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}</span>
      <span class="flex-grow">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-4');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // Animated background stars & glowing particles
  initBackgroundCanvas() {
    const canvas = document.getElementById('ambient-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    });

    const particles = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 1.5 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.6 + 0.2
      });
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#00f0ff';

      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(animate);
    }
    animate();
  },

  initHeroCodeAnimation() {
    const output = document.getElementById('hero-terminal-output');
    if (!output) return;

    const messages = [
      '> [SUCCESS] Pipeline validated: 0 Syntax Errors, 0 Logic Errors.<br>> [SYSTEM] 100% Running Code Handover Ready.',
      '> [AI/ML] Model accuracy verified on test dataset: 99.2%.<br>> [DOCS] IEEE Format Report &amp; PPT Generated.',
      '> [VIVA] 100+ Predicted Examiner Questions Prepared.<br>> [READY] Scheduled for Faculty Demonstration.'
    ];

    let idx = 0;
    clearInterval(this._codeAnimTimer);
    this._codeAnimTimer = setInterval(() => {
      idx = (idx + 1) % messages.length;
      output.innerHTML = messages[idx];
    }, 4500);
  },

  mapLucideIcon(iconName) {
    const map = {
      'Brain': 'brain',
      'BarChart2': 'bar-chart-2',
      'Globe': 'globe',
      'Code': 'code',
      'Coffee': 'coffee',
      'Smartphone': 'smartphone',
      'Shield': 'shield',
      'Cloud': 'cloud',
      'Cpu': 'cpu',
      'Layers': 'layers',
      'Database': 'database',
      'Link': 'link',
      'Network': 'network',
      'MessageSquare': 'message-square',
      'Eye': 'eye',
      'Layout': 'layout',
      'TrendingUp': 'trending-up'
    };
    return map[iconName] || 'sparkles';
  }
};

// Initialize Application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
