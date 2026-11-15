// PROJECTVERSE Database Module
// Built with native node:sqlite for zero-dependency high performance
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const DB_PATH = path.join(__dirname, 'data', 'projectverse.db');

// Ensure directory exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// Helper for hashing passwords
function hashPassword(password) {
  const salt = 'projectverse_salt_2026';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

function initDatabase() {
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');

  // 1. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      college TEXT,
      course TEXT,
      department TEXT,
      year_sem TEXT,
      city TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // 2. Domains Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT NOT NULL,
      description TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT 'blue',
      display_order INTEGER DEFAULT 0
    );
  `);

  // 3. Categories Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      badge_color TEXT NOT NULL DEFAULT 'cyan'
    );
  `);

  // 4. Projects Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      short_desc TEXT NOT NULL,
      full_desc TEXT NOT NULL,
      domain_id INTEGER NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      technologies TEXT NOT NULL,
      languages TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'Intermediate',
      thumbnail TEXT NOT NULL,
      gallery TEXT,
      demo_video_url TEXT,
      live_demo_url TEXT,
      github_url TEXT,
      report_url TEXT,
      ppt_url TEXT,
      features TEXT,
      objectives TEXT,
      sw_requirements TEXT,
      hw_requirements TEXT,
      architecture_desc TEXT,
      workflow_steps TEXT,
      expected_outcomes TEXT,
      is_featured INTEGER DEFAULT 0,
      is_trending INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      views_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 5. Inquiries (Leads) Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ref_code TEXT UNIQUE NOT NULL,
      student_name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT NOT NULL,
      college TEXT NOT NULL,
      course TEXT NOT NULL,
      department TEXT NOT NULL,
      city TEXT NOT NULL,
      project_id INTEGER,
      project_title TEXT NOT NULL,
      domain_name TEXT NOT NULL,
      category_name TEXT NOT NULL,
      preferred_tech TEXT,
      additional_req TEXT,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'New Inquiry',
      admin_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // 6. Inquiry Activity Log
  db.exec(`
    CREATE TABLE IF NOT EXISTS inquiry_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inquiry_id INTEGER NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      note TEXT,
      performed_by TEXT DEFAULT 'Admin',
      created_at TEXT NOT NULL
    );
  `);

  // 7. Favorites Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, project_id)
    );
  `);

  // 8. Testimonials Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      college TEXT NOT NULL,
      course TEXT NOT NULL,
      project_name TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      review TEXT NOT NULL,
      avatar TEXT,
      is_approved INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  const now = new Date().toISOString();

  // 1. Seed & Update Director Admin (saikirangorle909@gmail.com / Sai@12345)
  const primaryAdminEmail = 'saikirangorle909@gmail.com';
  const primaryAdminHash = hashPassword('Sai@12345');
  const existingPrimary = db.prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?)").get(primaryAdminEmail);
  if (!existingPrimary) {
    db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, college, course, department, year_sem, city, created_at)
      VALUES (?, ?, ?, ?, 'admin', 'ProjectVerse Management', 'Administration', 'Director', 'Director', 'Hyderabad', ?)
    `).run(
      'Saikiran Gorle (Director & Admin)',
      primaryAdminEmail,
      '7989010109',
      primaryAdminHash,
      now
    );
  } else {
    db.prepare("UPDATE users SET password_hash = ?, role = 'admin' WHERE id = ?").run(primaryAdminHash, existingPrimary.id);
  }

  // Backup administrator
  const adminCheck = db.prepare("SELECT id FROM users WHERE LOWER(email) = 'admin@projectverse.com'").get();
  if (!adminCheck) {
    db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, college, course, department, year_sem, city, created_at)
      VALUES (?, ?, ?, ?, 'admin', 'ProjectVerse HQ', 'SaaS Management', 'Engineering & Research', 'Director', 'Hyderabad', ?)
    `).run(
      'ProjectVerse Administrator',
      'admin@projectverse.com',
      '7989010109',
      primaryAdminHash,
      now
    );
  } else {
    db.prepare("UPDATE users SET password_hash = ?, role = 'admin' WHERE id = ?").run(primaryAdminHash, adminCheck.id);
  }

  // Seed Demo Student
  const studentCheck = db.prepare("SELECT id FROM users WHERE LOWER(email) = 'student@demo.com'").get();
  if (!studentCheck) {
    db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, role, college, course, department, year_sem, city, created_at)
      VALUES (?, ?, ?, ?, 'student', 'JNTU Hyderabad', 'B.Tech', 'Computer Science & Engineering', '4th Year / 2nd Sem', 'Hyderabad', ?)
    `).run(
      'Kiran Kumar',
      'student@demo.com',
      '9876543210',
      hashPassword('student123'),
      now
    );
  }

  // 2. Seed Domains (All domains from Requirement 5)
  const domainCount = db.prepare('SELECT COUNT(*) as count FROM domains').get().count;
  if (domainCount === 0) {
    const domainsData = [
      { name: 'Artificial Intelligence & Machine Learning', slug: 'ai-ml', icon: 'Brain', color: 'purple', description: 'Deep neural networks, predictive models, reinforcement learning, and intelligent cognitive systems.' },
      { name: 'Data Science', slug: 'data-science', icon: 'BarChart2', color: 'blue', description: 'Data analytics, predictive forecasting, EDA pipelines, business intelligence, and big datasets.' },
      { name: 'Web Development', slug: 'web-development', icon: 'Globe', color: 'cyan', description: 'Next-gen responsive web applications, modern JAMstack, SaaS portals, and microservices.' },
      { name: 'Python Projects', slug: 'python-projects', icon: 'Code', color: 'emerald', description: 'Automation scripts, backend Django/FastAPI platforms, machine learning pipelines, and GUI tools.' },
      { name: 'Java Projects', slug: 'java-projects', icon: 'Coffee', color: 'amber', description: 'Spring Boot enterprise web services, microservice architectures, and robust multi-tier solutions.' },
      { name: 'Android Development', slug: 'android-development', icon: 'Smartphone', color: 'green', description: 'Native Kotlin & Flutter multiplatform mobile applications with offline-first local cache.' },
      { name: 'Cyber Security', slug: 'cyber-security', icon: 'Shield', color: 'rose', description: 'Intrusion detection systems, vulnerability analysis, encryption algorithms, and secure auth.' },
      { name: 'Cloud Computing – AWS, Azure & GCP', slug: 'cloud-computing', icon: 'Cloud', color: 'sky', description: 'Serverless functions, container orchestration, microservices, and hybrid cloud architectures.' },
      { name: 'Internet of Things (IoT)', slug: 'iot', icon: 'Cpu', color: 'indigo', description: 'Sensor telemetry, ESP32/Arduino automation, MQTT gateways, and smart home/industrial prototypes.' },
      { name: 'Embedded Systems', slug: 'embedded-systems', icon: 'Layers', color: 'teal', description: 'Microcontroller firmware, RTOS scheduling, robotics control, and peripheral interfacing.' },
      { name: 'Database Management', slug: 'database-management', icon: 'Database', color: 'blue', description: 'High-throughput relational SQL, document NoSQL, sharding architectures, and query optimizers.' },
      { name: 'Blockchain', slug: 'blockchain', icon: 'Link', color: 'yellow', description: 'Decentralized smart contracts, Web3 dApps, Ethereum tokenomics, and verifiable ledgers.' },
      { name: 'Deep Learning', slug: 'deep-learning', icon: 'Network', color: 'violet', description: 'Convolutional neural networks, transformer architectures, GANs, and generative models.' },
      { name: 'Natural Language Processing (NLP)', slug: 'nlp', icon: 'MessageSquare', color: 'fuchsia', description: 'LLMs, semantic transformers, sentiment engines, conversational agents, and text summarization.' },
      { name: 'Computer Vision', slug: 'computer-vision', icon: 'Eye', color: 'pink', description: 'Real-time object detection (YOLOv8), biometric facial recognition, and video surveillance analytics.' },
      { name: 'Full Stack Development', slug: 'full-stack', icon: 'Layout', color: 'cyan', description: 'End-to-end full stack platforms featuring modern frontends, robust backends, and databases.' },
      { name: 'Big Data Analytics', slug: 'big-data', icon: 'TrendingUp', color: 'orange', description: 'Apache Spark pipelines, distributed Hadoop clusters, real-time streaming, and data lakes.' }
    ];

    const insertDomain = db.prepare(`
      INSERT INTO domains (name, slug, icon, description, color, display_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    domainsData.forEach((d, idx) => {
      insertDomain.run(d.name, d.slug, d.icon, d.description, d.color, idx + 1);
    });
  }

  // 3. Seed Categories (Requirement 6)
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (catCount === 0) {
    const categoriesData = [
      { name: 'Mini Projects', slug: 'mini-projects', description: 'Quick-to-deploy, high-impact prototypes ideal for 2nd and 3rd year semesters and quick evaluations.', badge_color: 'emerald' },
      { name: 'Major Projects', slug: 'major-projects', description: 'Comprehensive, end-to-end systems with complete documentation, testing, and viva defense ready for final year.', badge_color: 'blue' },
      { name: 'Research Projects', slug: 'research-projects', description: 'Novel algorithmic contributions, paper publication support (IEEE/Scopus), and rigorous mathematical benchmarks.', badge_color: 'purple' },
      { name: 'Industry-Level Projects', slug: 'industry-level-projects', description: 'Production-grade enterprise architectures with CI/CD, Docker containerization, security audits, and cloud deployment.', badge_color: 'amber' }
    ];

    const insertCat = db.prepare(`
      INSERT INTO categories (name, slug, description, badge_color)
      VALUES (?, ?, ?, ?)
    `);

    categoriesData.forEach(c => {
      insertCat.run(c.name, c.slug, c.description, c.badge_color);
    });
  }

  // 4. Seed Rich Projects
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
  if (projectCount === 0) {
    // Lookup domain and category IDs
    const getDomainId = (slug) => db.prepare('SELECT id FROM domains WHERE slug = ?').get(slug).id;
    const getCatId = (slug) => db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug).id;

    const sampleProjects = [
      {
        title: 'DeepGuard: Autonomous Real-Time Deepfake Detection System',
        slug: 'deepguard-autonomous-deepfake-detection',
        domain_slug: 'computer-vision',
        cat_slug: 'major-projects',
        languages: 'Python, JavaScript',
        technologies: JSON.stringify(['PyTorch', 'YOLOv8', 'Flask', 'OpenCV', 'React', 'Tailwind CSS']),
        difficulty: 'Advanced',
        short_desc: 'Deep learning-powered video analysis framework that detects facial manipulation, frame warping, and synthetic voice artifact anomalies with 99.2% accuracy.',
        full_desc: 'DeepGuard addresses the urgent national and corporate challenge of synthetic identity theft and deepfake disinformation. By combining spatiotemporal convolutional networks with vision transformer backbones, the platform processes live video streams or uploaded clips to pinpoint frame-by-frame blending boundaries, unnatural blinking frequencies, and audio-visual lip desynchronization. Comes with complete IEEE-format report, PPT, and test datasets.',
        thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
        gallery: JSON.stringify([
          'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80'
        ]),
        demo_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        live_demo_url: 'https://demo.projectverse.dev/deepguard',
        github_url: 'https://github.com/projectverse/deepguard-deepfake-detector',
        report_url: '/uploads/docs/deepguard-ieee-report.pdf',
        ppt_url: '/uploads/docs/deepguard-presentation.pptx',
        features: JSON.stringify([
          'Real-time frame ingestion and 3D facial landmark alignment',
          'Dual-branch CNN + ViT architecture for temporal coherence analysis',
          'Confidence heatmaps visualizing suspect artifact regions',
          'One-click forensic report generator with timestamped evidence breakdown',
          'Fully Dockerized REST API backend for enterprise integration'
        ]),
        objectives: JSON.stringify([
          'Develop a high-throughput deep learning model for real-time video verification',
          'Benchmark accuracy against FaceForensics++ and Celeb-DF public datasets',
          'Deliver an intuitive student and examiner dashboard for project demonstration'
        ]),
        sw_requirements: JSON.stringify(['Python 3.10+', 'PyTorch 2.2', 'OpenCV 4.8', 'Node.js 20+', 'CUDA 12.1 (optional)']),
        hw_requirements: JSON.stringify(['Intel Core i5 / AMD Ryzen 5 or higher', '8GB RAM (16GB recommended)', 'NVIDIA GPU (GTX 1650 or higher optional)']),
        architecture_desc: 'Microservices architecture with FastAPI video ingest pipeline, asynchronous PyTorch worker queue via Redis, and React frontend presenting forensic spectrograms.',
        workflow_steps: JSON.stringify([
          'Step 1: Video File Upload or Webcam Stream Ingestion',
          'Step 2: MTCNN Face Extraction & Bounding Box Normalization',
          'Step 3: Temporal Feature Extraction through 3D ResNet',
          'Step 4: Classification Layer Output & Anomaly Confidence Score',
          'Step 5: Interactive Visual Report & Downloadable Certificate'
        ]),
        expected_outcomes: JSON.stringify([
          'Achieves >98.5% precision on unseen deepfake generation algorithms',
          'Sub-second latency per second of processed video',
          'Comprehensive viva questions and answers sheet provided'
        ]),
        is_featured: 1,
        is_trending: 1
      },
      {
        title: 'MediPredict: Multi-Disease Predictive Healthcare Diagnostic Suite',
        slug: 'medipredict-multi-disease-healthcare-ai',
        domain_slug: 'ai-ml',
        cat_slug: 'major-projects',
        languages: 'Python, TypeScript',
        technologies: JSON.stringify(['Python', 'Scikit-Learn', 'XGBoost', 'Django REST', 'React', 'Chart.js']),
        difficulty: 'Intermediate',
        short_desc: 'Comprehensive clinical predictive analytics platform diagnosing diabetes, cardiac abnormalities, kidney conditions, and liver pathologies using validated ensemble ML algorithms.',
        full_desc: 'MediPredict is an intelligent clinical decision support system that allows patients and doctors to input laboratory test parameters to calculate precise pathology risk scores. It incorporates SHAP (SHapley Additive exPlanations) values to explain why specific predictions were made, solving the "black-box" dilemma in medical AI. Includes comprehensive medical validation benchmarks and ready-to-present viva defense documentation.',
        thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
        gallery: JSON.stringify([
          'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80'
        ]),
        demo_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        live_demo_url: 'https://demo.projectverse.dev/medipredict',
        github_url: 'https://github.com/projectverse/medipredict-ai',
        report_url: '/uploads/docs/medipredict-report.pdf',
        ppt_url: '/uploads/docs/medipredict-presentation.pptx',
        features: JSON.stringify([
          'Simultaneous 4-organ clinical risk assessment from single panel data',
          'Explainable AI module powered by SHAP & LIME charts',
          'Automated PDF health prescription & diagnostic report generation',
          'Doctor appointment scheduling integration and medication reminders',
          'Encrypted HIPAA-compliant patient profile storage'
        ]),
        objectives: JSON.stringify([
          'Train ensemble gradient boosting classifiers on UCI Machine Learning repository datasets',
          'Provide transparent feature importance visualizations to medical examiners',
          'Demonstrate zero-downtime deployment on AWS EC2'
        ]),
        sw_requirements: JSON.stringify(['Python 3.9+', 'Django 4.2', 'XGBoost', 'Pandas', 'NumPy', 'Bootstrap 5 / Tailwind']),
        hw_requirements: JSON.stringify(['Standard PC or Laptop with 4GB+ RAM']),
        architecture_desc: '3-tier architecture with React SPA, Django REST API service layer, and SQLite/PostgreSQL relational database with cached model weights.',
        workflow_steps: JSON.stringify([
          'Patient parameters entry via intuitive step wizard',
          'Data cleaning, imputation, and MinMax scaling',
          'Parallel inference through trained specialized ML models',
          'SHAP explanation generation for highest-risk biomarkers',
          'Interactive dashboard view and downloadable diagnostic PDF'
        ]),
        expected_outcomes: JSON.stringify([
          '96.4% sensitivity on cardiovascular disease prediction test splits',
          'Zero medical domain experience needed for student viva presentation',
          'Includes 100+ viva questions with expert answers'
        ]),
        is_featured: 1,
        is_trending: 1
      },
      {
        title: 'SmartGrid IoT: Autonomous Energy Monitoring & Theft Detection Grid',
        slug: 'smartgrid-iot-energy-monitoring-theft-detection',
        domain_slug: 'iot',
        cat_slug: 'major-projects',
        languages: 'C++, Python, JavaScript',
        technologies: JSON.stringify(['ESP32', 'Arduino IDE', 'MQTT', 'Python', 'InfluxDB', 'Grafana', 'Node.js']),
        difficulty: 'Advanced',
        short_desc: 'Next-gen IoT telemetry grid monitoring current load, phase anomalies, and unauthorized line tapping with automated SMS alerts and live cloud telemetry.',
        full_desc: 'This project bridges hardware and cloud computing by deploying ESP32 microcontrollers with non-invasive ACS712 and PZEM-004T current transformers. The nodes stream high-frequency voltage and current data over MQTT to an edge broker. An anomaly detection algorithm identifies disparities between substation distribution logs and consumer metering, flagging power theft in real time. Full circuit schematics, bill of materials, and code included.',
        thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        gallery: JSON.stringify([
          'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
        ]),
        demo_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        live_demo_url: 'https://demo.projectverse.dev/smartgrid',
        github_url: 'https://github.com/projectverse/smartgrid-iot',
        report_url: '/uploads/docs/smartgrid-iot-report.pdf',
        ppt_url: '/uploads/docs/smartgrid-iot-presentation.pptx',
        features: JSON.stringify([
          'Bilinear current comparison between line transformer and consumer meter',
          'Instant tamper alert dispatch via Twilio SMS and WhatsApp Webhook',
          'Cloud dashboard showing live kilowatt-hour consumption and tariff breakdown',
          'Relay control for remote over-the-air load shedding and line disconnection',
          'Offline caching in ESP32 SPIFFS memory during WiFi outages'
        ]),
        objectives: JSON.stringify([
          'Construct a working dual-node hardware prototype simulating legal and illegal taps',
          'Establish low-latency bi-directional MQTT telemetry with HiveMQ cloud',
          'Prepare comprehensive hardware viva defense and schematic documentation'
        ]),
        sw_requirements: JSON.stringify(['Arduino IDE 2.0', 'Mosquitto / HiveMQ', 'Python 3.10', 'Node.js']),
        hw_requirements: JSON.stringify(['ESP32 DevKit V1', 'PZEM-004T / ACS712 sensors', 'Relay Module', 'OLED Display 0.96"', 'Breadboard & Jumper wires']),
        architecture_desc: 'Distributed IoT topology with Edge Sensing nodes publishing to MQTT Broker, ingestion microservice storing in time-series database, and web dashboard.',
        workflow_steps: JSON.stringify([
          'Continuous analog sampling of voltage and AC current',
          'Edge computation of RMS Power, Frequency, and Power Factor',
          'JSON payload dispatch over secure WPA2 WiFi via MQTT',
          'Anomaly inference engine triggers alerts if delta > threshold',
          'Web dashboard real-time graph updates via WebSockets'
        ]),
        expected_outcomes: JSON.stringify([
          '100% detection rate on simulated power bypass within 1.2 seconds',
          'Working hardware model ready to showcase before college external examiners'
        ]),
        is_featured: 1,
        is_trending: 0
      },
      {
        title: 'CertiChain: Tamper-Proof Academic Credential Verification on Ethereum',
        slug: 'certichain-academic-credential-verification-blockchain',
        domain_slug: 'blockchain',
        cat_slug: 'research-projects',
        languages: 'Solidity, JavaScript',
        technologies: JSON.stringify(['Solidity', 'Ethereum', 'IPFS', 'Hardhat', 'Ethers.js', 'React']),
        difficulty: 'Advanced',
        short_desc: 'Decentralized academic degree and certificate issuance protocol eliminating counterfeit CVs via cryptographic hashing on Ethereum and IPFS.',
        full_desc: 'Academic certificate fraud is a global multi-million dollar dilemma. CertiChain allows universities to mint soulbound, non-transferable ERC-721 credential tokens linked to decentralized IPFS metadata. Employers, government recruiters, and foreign embassies can verify the authenticity of any uploaded PDF degree certificate in 100 milliseconds via SHA-256 hash lookup against the blockchain without contacting university registrar offices.',
        thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80',
        gallery: JSON.stringify([
          'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80'
        ]),
        demo_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        live_demo_url: 'https://demo.projectverse.dev/certichain',
        github_url: 'https://github.com/projectverse/certichain-web3',
        report_url: '/uploads/docs/certichain-research-paper.pdf',
        ppt_url: '/uploads/docs/certichain-presentation.pptx',
        features: JSON.stringify([
          'Zero-knowledge proof certificate verification for candidate privacy',
          'Soulbound ERC-721 token implementation preventing resale or transfer',
          'Decentralized IPFS Pinata file storage with SHA-256 tamper detection',
          'Batch certificate issuance portal for University Examination Branch',
          'Metamask wallet authentication and multi-sig admin approvals'
        ]),
        objectives: JSON.stringify([
          'Implement gas-optimized Solidity smart contracts verified on Sepolia Testnet',
          'Develop one-click drag-and-drop verification interface for recruiters',
          'Provide IEEE research paper draft ready for conference submission'
        ]),
        sw_requirements: JSON.stringify(['Solidity 0.8.20', 'Hardhat', 'Node.js 20+', 'Metamask Extension', 'Pinata IPFS API']),
        hw_requirements: JSON.stringify(['Any modern laptop with internet connection']),
        architecture_desc: 'Web3 decentralized architecture with React front-end communicating with Ethereum smart contracts through RPC node and IPFS gateway.',
        workflow_steps: JSON.stringify([
          'University Admin signs in with authorized Ethereum wallet',
          'Batch upload student gradesheets & degrees; PDF hashed with SHA-256',
          'Files pinned to IPFS; hash & metadata committed to Smart Contract',
          'Public recruiter visits verification portal and uploads candidate PDF',
          'Instant green checkmark if cryptographic on-chain hash matches'
        ]),
        expected_outcomes: JSON.stringify([
          'Zero chance of forged diploma acceptance',
          'Complete gas optimization analysis and contract test coverage suite (>95%)'
        ]),
        is_featured: 1,
        is_trending: 1
      },
      {
        title: 'CyberSentry: AI-Driven Network Intrusion Detection & Honeypot System',
        slug: 'cybersentry-network-intrusion-detection-honeypot',
        domain_slug: 'cyber-security',
        cat_slug: 'industry-level-projects',
        languages: 'Python, Bash',
        technologies: JSON.stringify(['Python', 'Scapy', 'Snort', 'Elasticsearch', 'Kibana', 'FastAPI']),
        difficulty: 'Advanced',
        short_desc: 'Enterprise security appliance combining signature-based Snort packet filtering with unsupervised isolation forest ML for zero-day threat containment.',
        full_desc: 'CyberSentry captures live network traffic on promiscous interfaces, runs deep packet inspection against CVE database signatures, and trains an isolation forest model on flow metrics to identify reconnaissance scans, DDoS floods, and command-and-control beacons. Includes an automated decoy SSH honeypot that traps attackers and logs terminal commands for forensic analysis.',
        thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
        gallery: JSON.stringify([
          'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80'
        ]),
        demo_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        live_demo_url: 'https://demo.projectverse.dev/cybersentry',
        github_url: 'https://github.com/projectverse/cybersentry-ids',
        report_url: '/uploads/docs/cybersentry-report.pdf',
        ppt_url: '/uploads/docs/cybersentry-presentation.pptx',
        features: JSON.stringify([
          'Live PCAP packet sniffing and flow feature extraction via Scapy',
          'Machine learning classifier detecting NSL-KDD benchmark cyber attacks',
          'Interactive ELK stack security operations dashboard with IP geolocation',
          'Automated IP blacklisting via IPTables firewall rules',
          'Simulated Cowrie-style decoy SSH honeypot with keystroke logger'
        ]),
        objectives: JSON.stringify([
          'Detect Port Scans, SYN Floods, and Brute Force attacks in under 50ms',
          'Deliver an industry-grade cybersecurity project defense package'
        ]),
        sw_requirements: JSON.stringify(['Python 3.10', 'Scapy', 'Wireshark / TShark', 'FastAPI', 'Ubuntu Linux or WSL2']),
        hw_requirements: JSON.stringify(['PC with 8GB RAM and virtualization support (VT-x)']),
        architecture_desc: 'Kernel packet hook with Python Scapy analyzer, streaming events to an in-memory alert queue and reactive security dashboard.',
        workflow_steps: JSON.stringify([
          'Packet capture from network interface card in raw mode',
          'Feature calculation: packet length, SYN/ACK ratio, inter-arrival time',
          'Classification through trained Random Forest & Isolation Forest',
          'Triggering dynamic firewall block on attacker IP address',
          'Audit trail recording and threat report compilation'
        ]),
        expected_outcomes: JSON.stringify([
          '99.4% detection rate on modern exploit payloads',
          'Prepared viva defense on OWASP Top 10 and network protocols'
        ]),
        is_featured: 0,
        is_trending: 1
      },
      {
        title: 'NexusCloud: Serverless Microservices E-Commerce with AWS Lambda & Terraform',
        slug: 'nexuscloud-serverless-microservices-aws-terraform',
        domain_slug: 'cloud-computing',
        cat_slug: 'industry-level-projects',
        languages: 'TypeScript, HCL',
        technologies: JSON.stringify(['AWS Lambda', 'DynamoDB', 'API Gateway', 'Terraform', 'Cognito', 'Next.js']),
        difficulty: 'Advanced',
        short_desc: 'Full-fledged cloud-native infrastructure-as-code deployment of an auto-scaling retail platform with payment gateways and event-driven SQS/SNS.',
        full_desc: 'NexusCloud demonstrates modern cloud engineering by provisioning an entire enterprise retail infrastructure via declarative Terraform scripts. Features asynchronous event-driven order processing with Amazon SQS and EventBridge, user authentication via AWS Cognito with JWT tokens, and ultra-fast DynamoDB single-table design with sub-10ms read latencies.',
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        gallery: JSON.stringify([
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80'
        ]),
        demo_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        live_demo_url: 'https://demo.projectverse.dev/nexuscloud',
        github_url: 'https://github.com/projectverse/nexuscloud-serverless',
        report_url: '/uploads/docs/nexuscloud-cloud-report.pdf',
        ppt_url: '/uploads/docs/nexuscloud-presentation.pptx',
        features: JSON.stringify([
          '100% Serverless architecture with zero idle compute costs',
          'Complete Infrastructure-as-Code (IaC) written in HashiCorp Terraform',
          'Stripe and Razorpay webhook handlers with idempotent transaction logs',
          'Amazon EventBridge bus triggering background invoice emails and analytics',
          'Multi-region high availability and CDN distribution with CloudFront'
        ]),
        objectives: JSON.stringify([
          'Demonstrate zero-server provisioning using AWS free-tier services',
          'Build CI/CD GitHub Actions pipeline deploying infrastructure on git push'
        ]),
        sw_requirements: JSON.stringify(['Node.js 20', 'AWS CLI', 'Terraform 1.7+', 'Docker']),
        hw_requirements: JSON.stringify(['Standard laptop with internet access']),
        architecture_desc: 'Event-driven serverless mesh with API Gateway, NodeJS Lambda microservices, DynamoDB Global Tables, and CloudWatch distributed tracing.',
        workflow_steps: JSON.stringify([
          'User authentication and token generation via AWS Cognito',
          'Cart checkout initiates payment intent via Lambda handler',
          'Asynchronous order created in DynamoDB; event emitted to SQS',
          'Worker Lambda consumes order queue and sends customer notifications',
          'CloudWatch dashboard aggregates metric alarms and latencies'
        ]),
        expected_outcomes: JSON.stringify([
          'Can scale to 10,000 concurrent requests with zero manual intervention',
          'Clear cost-optimization presentation and viva architecture diagrams'
        ]),
        is_featured: 1,
        is_trending: 0
      },
      {
        title: 'EduQuery: Multimodal RAG Assistant for Academic Curriculum & Exam Prep',
        slug: 'eduquery-multimodal-rag-academic-assistant',
        domain_slug: 'nlp',
        cat_slug: 'major-projects',
        languages: 'Python, TypeScript',
        technologies: JSON.stringify(['LangChain', 'OpenAI / Llama-3', 'ChromaDB', 'FastAPI', 'React', 'Tailwind']),
        difficulty: 'Intermediate',
        short_desc: 'Retrieval-Augmented Generation (RAG) platform indexing textbook PDFs, past university question papers, and lecture slides with verified citations.',
        full_desc: 'EduQuery solves the problem of AI hallucinations in educational contexts. Students upload entire semester syllabus textbooks and faculty notes; EduQuery performs semantic chunking, embeds text with all-MiniLM-L6-v2, and uses vector search in ChromaDB. When a student asks a complex engineering problem, EduQuery generates step-by-step answers citing exact page numbers and mathematical formulas.',
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
        gallery: JSON.stringify([
          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80'
        ]),
        demo_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        live_demo_url: 'https://demo.projectverse.dev/eduquery',
        github_url: 'https://github.com/projectverse/eduquery-rag',
        report_url: '/uploads/docs/eduquery-rag-report.pdf',
        ppt_url: '/uploads/docs/eduquery-presentation.pptx',
        features: JSON.stringify([
          'Multi-document semantic search with hybrid BM25 + dense vector ranking',
          'Contextual page citations with direct PDF snippet highlighting',
          'Interactive quiz generator creating mock university viva questions',
          'LaTeX formula and algorithmic pseudo-code formatting',
          'Voice query input and spoken technical explanations'
        ]),
        objectives: JSON.stringify([
          'Implement a local, low-cost RAG architecture with open-source embeddings',
          'Produce reproducible benchmarks against vanilla GPT-4 baselines'
        ]),
        sw_requirements: JSON.stringify(['Python 3.10', 'LangChain', 'ChromaDB', 'PyPDF', 'FastAPI']),
        hw_requirements: JSON.stringify(['PC with 8GB RAM']),
        architecture_desc: 'RAG pipeline with recursive character text chunking, local vector embeddings, similarity reranking, and streamed markdown response output.',
        workflow_steps: JSON.stringify([
          'PDF upload and text extraction with OCR for scanned diagrams',
          'Chunking into 500-token windows with 50-token semantic overlap',
          'Vectorization and persistent indexing into ChromaDB',
          'User query embedding and cosine similarity nearest-neighbor lookup',
          'Prompt augmentation sent to LLM for cited, factual generation'
        ]),
        expected_outcomes: JSON.stringify([
          'Zero fabricated answers on university syllabus questions',
          'Includes viva questions on Transformers, Vector Embeddings, and Prompt Engineering'
        ]),
        is_featured: 1,
        is_trending: 1
      },
      {
        title: 'AgroSense: AI Plant Disease Diagnosis & Smart Irrigation Controller',
        slug: 'agrosense-ai-plant-disease-smart-irrigation',
        domain_slug: 'data-science',
        cat_slug: 'major-projects',
        languages: 'Python, C++',
        technologies: JSON.stringify(['TensorFlow Lite', 'ESP32', 'Flask', 'Soil Moisture Sensors', 'Flutter']),
        difficulty: 'Intermediate',
        short_desc: 'Smart agriculture platform diagnosing 38 crop leaf diseases from photos while regulating automated drip irrigation based on soil moisture and weather forecast.',
        full_desc: 'AgroSense pairs a MobileNetV2 computer vision model trained on the PlantVillage dataset with IoT field soil telemetry. Farmers can take a photograph of an infected tomato or potato leaf to receive an immediate diagnosis, treatment pesticide recommendations, and fertilizer dosage instructions. Simultaneously, an ESP32 node regulates water pump solenoids based on predictive rainfall data.',
        thumbnail: 'https://images.unsplash.com/photo-1592417817098-8f3d69109853?auto=format&fit=crop&w=1200&q=80',
        gallery: JSON.stringify([
          'https://images.unsplash.com/photo-1592417817098-8f3d69109853?auto=format&fit=crop&w=1200&q=80'
        ]),
        demo_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        live_demo_url: 'https://demo.projectverse.dev/agrosense',
        github_url: 'https://github.com/projectverse/agrosense-ai',
        report_url: '/uploads/docs/agrosense-report.pdf',
        ppt_url: '/uploads/docs/agrosense-presentation.pptx',
        features: JSON.stringify([
          '38-class leaf disease classifier with 97.8% validation accuracy',
          'Bilingual audio advice in English and regional languages',
          'Automated soil moisture valve actuation with weather API integration',
          'Chemical fertilizer vs organic pesticide alternative recommendations',
          'Comprehensive farmer telemetry log and harvest yield calculator'
        ]),
        objectives: JSON.stringify([
          'Deploy a lightweight quantized model capable of running offline on edge devices',
          'Build an end-to-end working demonstration for engineering examiners'
        ]),
        sw_requirements: JSON.stringify(['Python 3.9', 'TensorFlow / Keras', 'Flask', 'OpenWeatherMap API']),
        hw_requirements: JSON.stringify(['ESP32 Microcontroller', 'Capacitive Soil Moisture Sensor', '5V Relay Module', 'Submersible 5V Water Pump']),
        architecture_desc: 'Hybrid edge-cloud architecture with MobileNet classification service and IoT telemetry gateway.',
        workflow_steps: JSON.stringify([
          'Capture leaf photo with mobile phone camera',
          'Preprocess: resize to 224x224, normalize RGB channels',
          'Pass through trained MobileNetV2 convolutional layers',
          'Fetch disease metadata, prognosis, and treatment protocol',
          'Sync irrigation thresholds based on soil moisture sensor feedback'
        ]),
        expected_outcomes: JSON.stringify([
          'Instant leaf diagnosis in under 300ms',
          'High marks assurance with fully functional hardware demonstration'
        ]),
        is_featured: 0,
        is_trending: 1
      },
      {
        title: 'SafeFleet: Driver Drowsiness, Yawn & Distraction Detection System',
        slug: 'safefleet-driver-drowsiness-detection',
        domain_slug: 'computer-vision',
        cat_slug: 'mini-projects',
        languages: 'Python',
        technologies: JSON.stringify(['Python', 'OpenCV', 'Dlib', 'Pygame', 'Tkinter / Streamlit']),
        difficulty: 'Beginner',
        short_desc: 'Real-time eye-aspect-ratio (EAR) and mouth-aspect-ratio (MAR) tracking triggering an audio alarm when fatigue or head distraction is detected.',
        full_desc: 'SafeFleet is a high-demand project ideal for mini-project evaluations or 3rd year submissions. Using standard webcams, the algorithm maps 68 facial landmarks. It computes the Eye Aspect Ratio (EAR) across consecutive frames; if eye closure exceeds 20 frames or yawning persists, an acoustic siren sounds immediately. Fully working, quick to set up, and accompanied by full documentation.',
        thumbnail: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80',
        gallery: JSON.stringify([
          'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80'
        ]),
        demo_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        live_demo_url: 'https://demo.projectverse.dev/safefleet',
        github_url: 'https://github.com/projectverse/safefleet-drowsiness',
        report_url: '/uploads/docs/safefleet-mini-report.pdf',
        ppt_url: '/uploads/docs/safefleet-presentation.pptx',
        features: JSON.stringify([
          'Euclidean distance Eye Aspect Ratio (EAR) metric calculation',
          'Mouth Aspect Ratio (MAR) yawning tracker',
          'Instant audio buzzer alarm playback',
          'Head tilt / driver distraction bounding box warnings',
          'Runs smoothly on any standard laptop without external GPU'
        ]),
        objectives: JSON.stringify([
          'Create a 100% reliable real-time vision demo that never crashes during live viva',
          'Explain facial landmark geometry clearly to examiners'
        ]),
        sw_requirements: JSON.stringify(['Python 3.8-3.11', 'OpenCV', 'dlib or mediapipe', 'scipy', 'pygame']),
        hw_requirements: JSON.stringify(['Standard Laptop with integrated webcam']),
        architecture_desc: 'Single-pipeline frame buffer processor with Euclidean distance calculator and multi-threaded audio trigger.',
        workflow_steps: JSON.stringify([
          'Acquire video frame from webcam',
          'Detect face bounding box using Haar Cascades or Mediapipe',
          'Calculate EAR formula for left and right eye contours',
          'If EAR < 0.25 for 1.5 seconds, trigger siren alarm',
          'Overlay real-time fatigue telemetry on display feed'
        ]),
        expected_outcomes: JSON.stringify([
          'Zero error execution in front of project review committee',
          'Complete mini-project report with circuit and algorithm diagrams'
        ]),
        is_featured: 1,
        is_trending: 0
      },
      {
        title: 'SpringVault: Enterprise Microservices Banking Platform with OAuth2',
        slug: 'springvault-enterprise-microservices-banking',
        domain_slug: 'java-projects',
        cat_slug: 'industry-level-projects',
        languages: 'Java, SQL',
        technologies: JSON.stringify(['Spring Boot 3', 'Spring Cloud', 'Netflix Eureka', 'Docker', 'PostgreSQL', 'Kafka']),
        difficulty: 'Advanced',
        short_desc: 'Production-ready financial core banking backend with Eureka discovery, API Gateway routing, distributed transaction handling, and Apache Kafka audit streaming.',
        full_desc: 'Designed for computer science students targeting high-paying MNC software engineering roles. SpringVault simulates a real commercial bank backend with independent microservices: Account Service, Fund Transfer Service, Fraud Detection Service, and Notification Service. Implements Saga pattern for distributed transactions and Spring Security OAuth2 with JWT for role-based authorization.',
        thumbnail: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
        gallery: JSON.stringify([
          'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80'
        ]),
        demo_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        live_demo_url: 'https://demo.projectverse.dev/springvault',
        github_url: 'https://github.com/projectverse/springvault-banking',
        report_url: '/uploads/docs/springvault-report.pdf',
        ppt_url: '/uploads/docs/springvault-presentation.pptx',
        features: JSON.stringify([
          'Service registry and auto-discovery with Spring Cloud Eureka',
          'Resilience4j Circuit Breaker preventing cascading microservice failures',
          'Asynchronous transaction ledger logging via Apache Kafka topics',
          'Two-factor SMS OTP authentication and debit/credit ledger reconciliation',
          'Swagger / OpenAPI 3 interactive documentation for all endpoints'
        ]),
        objectives: JSON.stringify([
          'Showcase advanced enterprise Java patterns that impress external viva evaluators',
          'Provide ready-to-run Docker Compose script orchestrating all containers'
        ]),
        sw_requirements: JSON.stringify(['Java JDK 17 or 21', 'Maven 3.8+', 'Docker Desktop', 'PostgreSQL']),
        hw_requirements: JSON.stringify(['Laptop with 8GB or 16GB RAM']),
        architecture_desc: 'Microservices mesh behind Spring Cloud API Gateway with JWT verification, Eureka registry, and Kafka event streaming.',
        workflow_steps: JSON.stringify([
          'Client submits transfer request through API Gateway with Bearer JWT',
          'Transfer service initiates Saga orchestrator',
          'Debit user account and emit Kafka transaction event',
          'Credit beneficiary account; rollback on failure with compensating transaction',
          'Dispatch email receipt and store immutable audit trail in PostgreSQL'
        ]),
        expected_outcomes: JSON.stringify([
          '100% compliant ACID transaction guarantees across microservices',
          'Deep architectural defense guide answering top Java viva questions'
        ]),
        is_featured: 1,
        is_trending: 1
      },
      {
        title: 'KwikMed: On-Demand Pharmacy & Prescription Delivery Android App',
        slug: 'kwikmed-pharmacy-prescription-delivery-android',
        domain_slug: 'android-development',
        cat_slug: 'major-projects',
        languages: 'Kotlin, Java',
        technologies: JSON.stringify(['Android SDK', 'Kotlin', 'Jetpack Compose', 'Firebase', 'Google Maps API', 'Razorpay']),
        difficulty: 'Intermediate',
        short_desc: 'Modern Android smartphone application featuring prescription OCR camera upload, live delivery rider GPS tracking, and cash/online payments.',
        full_desc: 'KwikMed is a clean, modern Android mobile app developed with Kotlin and Jetpack Compose. Patients can snap a picture of a handwritten doctor prescription, which uses Google ML Kit OCR to automatically extract medicine names into their shopping cart. Features real-time GPS navigation using Google Maps Directions API to show the delivery rider arriving at the door.',
        thumbnail: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80',
        gallery: JSON.stringify([
          'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1200&q=80'
        ]),
        demo_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        live_demo_url: 'https://demo.projectverse.dev/kwikmed',
        github_url: 'https://github.com/projectverse/kwikmed-android',
        report_url: '/uploads/docs/kwikmed-android-report.pdf',
        ppt_url: '/uploads/docs/kwikmed-presentation.pptx',
        features: JSON.stringify([
          'Modern declarative UI built 100% with Jetpack Compose & Material 3',
          'On-device prescription OCR text extraction using Google ML Kit',
          'Real-time delivery boy geolocation tracking on Google Maps',
          'Firebase Cloud Messaging push notifications for order status changes',
          'Room DB local cache enabling offline order browsing'
        ]),
        objectives: JSON.stringify([
          'Deliver an APK file that runs flawlessly on the examiner’s Android phone',
          'Provide complete Android Studio project structure with clean MVVM architecture'
        ]),
        sw_requirements: JSON.stringify(['Android Studio Iguana / Hedgehog', 'Kotlin 1.9+', 'JDK 17', 'Firebase Account']),
        hw_requirements: JSON.stringify(['Android Device running Android 8.0+ or Android Emulator']),
        architecture_desc: 'MVVM Clean Architecture with Repository pattern, Kotlin Coroutines, StateFlow, and Retrofit HTTP client.',
        workflow_steps: JSON.stringify([
          'Student installs APK on mobile phone',
          'Camera scan parses medicine names from prescription paper',
          'Pharmacy catalog lookup matches inventory and calculates discount',
          'Razorpay payment sandbox checkout',
          'Live map shows animated vehicle moving along Google polyline'
        ]),
        expected_outcomes: JSON.stringify([
          'Super-responsive UI with smooth 60fps animations',
          'Includes complete viva guide covering Android Lifecycle, Room, and Coroutines'
        ]),
        is_featured: 0,
        is_trending: 1
      },
      {
        title: 'DevPulse: Automated AI Code Reviewer & Security Vulnerability Scanner',
        slug: 'devpulse-automated-ai-code-reviewer',
        domain_slug: 'full-stack',
        cat_slug: 'major-projects',
        languages: 'TypeScript, Python',
        technologies: JSON.stringify(['React', 'Node.js', 'Python AST', 'ESLint', 'Docker', 'Ollama']),
        difficulty: 'Intermediate',
        short_desc: 'Developer productivity SaaS auditing code repositories for SQL injections, buffer vulnerabilities, memory leaks, and style improvements using LLMs.',
        full_desc: 'DevPulse connects to GitHub or takes raw source files in Python, Java, JavaScript, and C++. It constructs an Abstract Syntax Tree (AST) to detect dangerous function calls (such as eval, raw SQL strings, and hardcoded API keys), then feeds the snippets to a specialized code-analysis LLM to produce formatted refactoring recommendations and pull request comments.',
        thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
        gallery: JSON.stringify([
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80'
        ]),
        demo_video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        live_demo_url: 'https://demo.projectverse.dev/devpulse',
        github_url: 'https://github.com/projectverse/devpulse-code-auditor',
        report_url: '/uploads/docs/devpulse-report.pdf',
        ppt_url: '/uploads/docs/devpulse-presentation.pptx',
        features: JSON.stringify([
          'Static AST vulnerability pattern matching for OWASP Top 10 vulnerabilities',
          'Side-by-side diff view of proposed code refactoring',
          'Automated cyclomatic complexity and maintainability index scores',
          'Downloadable security compliance audit report in PDF format',
          'One-click GitHub webhook pull-request bot integration'
        ]),
        objectives: JSON.stringify([
          'Demonstrate modern full-stack SaaS engineering principles to college faculty',
          'Ensure easy local setup with single terminal startup'
        ]),
        sw_requirements: JSON.stringify(['Node.js 20+', 'Python 3.10', 'Express / FastAPI', 'React']),
        hw_requirements: JSON.stringify(['PC with 8GB RAM']),
        architecture_desc: 'Full-stack client-server architecture with syntax parser service and local AI inference wrapper.',
        workflow_steps: JSON.stringify([
          'Student pastes code or uploads source zip file',
          'AST generator parses code tokens and syntax hierarchy',
          'Security rules engine flags unsafe queries and unescaped inputs',
          'LLM generates optimized replacement code with performance commentary',
          'Interactive web portal renders colorized diffs and metrics'
        ]),
        expected_outcomes: JSON.stringify([
          'Captures 100% of standard benchmark security flaws in test suites',
          'Highly rated by university examiners for commercial viability'
        ]),
        is_featured: 1,
        is_trending: 0
      }
    ];

    const insertProject = db.prepare(`
      INSERT INTO projects (
        title, slug, short_desc, full_desc, domain_id, category_id,
        technologies, languages, difficulty, thumbnail, gallery,
        demo_video_url, live_demo_url, github_url, report_url, ppt_url,
        features, objectives, sw_requirements, hw_requirements,
        architecture_desc, workflow_steps, expected_outcomes,
        is_featured, is_trending, is_published, views_count,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?
      )
    `);

    sampleProjects.forEach(p => {
      const dId = getDomainId(p.domain_slug);
      const cId = getCatId(p.cat_slug);
      insertProject.run(
        p.title, p.slug, p.short_desc, p.full_desc, dId, cId,
        p.technologies, p.languages, p.difficulty, p.thumbnail, p.gallery,
        p.demo_video_url, p.live_demo_url, p.github_url, p.report_url, p.ppt_url,
        p.features, p.objectives, p.sw_requirements, p.hw_requirements,
        p.architecture_desc, p.workflow_steps, p.expected_outcomes,
        p.is_featured, p.is_trending, 1, Math.floor(Math.random() * 300) + 120,
        now, now
      );
    });
  }

  // 5. Seed Initial Inquiries (Leads) for Admin Dashboard Demonstration
  const inqCount = db.prepare('SELECT COUNT(*) as count FROM inquiries').get().count;
  if (inqCount === 0) {
    const sampleInquiries = [
      {
        ref_code: 'PV-2026-1001',
        student_name: 'Rahul Sharma',
        mobile: '9848022338',
        email: 'rahul.sharma@gmail.com',
        college: 'CBIT Hyderabad',
        course: 'B.Tech',
        department: 'Computer Science & Engineering',
        city: 'Hyderabad',
        project_id: 1,
        project_title: 'DeepGuard: Autonomous Real-Time Deepfake Detection System',
        domain_name: 'Computer Vision',
        category_name: 'Major Projects',
        preferred_tech: 'PyTorch, Python',
        additional_req: 'Need help presenting in final semester viva in April 2026. Also need PPT.',
        message: 'Hello, our batch of 4 students wants to take this Deepfake Detection project. Please guide us on pricing and code handover.',
        status: 'New Inquiry',
        admin_notes: 'Urgent final year batch from CBIT. Scheduled initial WhatsApp outreach.',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        ref_code: 'PV-2026-1002',
        student_name: 'Ananya Reddy',
        mobile: '7981234567',
        email: 'ananya.reddy@vitstudent.ac.in',
        college: 'VIT Vellore',
        course: 'B.Tech',
        department: 'Artificial Intelligence & Data Science',
        city: 'Vellore',
        project_id: 2,
        project_title: 'MediPredict: Multi-Disease Predictive Healthcare Diagnostic Suite',
        domain_name: 'Artificial Intelligence & Machine Learning',
        category_name: 'Major Projects',
        preferred_tech: 'Python, XGBoost, React',
        additional_req: 'Can we add an extra cancer prediction module for our research paper publication?',
        message: 'Looking for complete documentation, IEEE format paper draft, and working demo.',
        status: 'Contacted',
        admin_notes: 'Called student on Nov 14. Sent WhatsApp syllabus confirmation and IEEE template sample.',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        ref_code: 'PV-2026-1003',
        student_name: 'Vikram Patel',
        mobile: '9123456789',
        email: 'vikram.p@srmist.edu.in',
        college: 'SRM Institute of Science and Technology',
        course: 'M.Tech',
        department: 'Information Technology',
        city: 'Chennai',
        project_id: 4,
        project_title: 'CertiChain: Tamper-Proof Academic Credential Verification on Ethereum',
        domain_name: 'Blockchain',
        category_name: 'Research Projects',
        preferred_tech: 'Solidity, Ethereum, IPFS',
        additional_req: 'Need full assistance deploying smart contract on Sepolia testnet with Metamask demo.',
        message: 'Hi ProjectVerse team, my guide insisted on a blockchain project with Scopus publication scope. Let me know when we can discuss.',
        status: 'Discussion in Progress',
        admin_notes: 'Guide requires custom smart contract events. Quotation shared on WhatsApp.',
        created_at: new Date(Date.now() - 3600000 * 48).toISOString()
      },
      {
        ref_code: 'PV-2026-1004',
        student_name: 'Suresh Kumar',
        mobile: '8877665544',
        email: 'suresh.k@jntuh.ac.in',
        college: 'JNTUH College of Engineering',
        course: 'B.Tech',
        department: 'Electronics & Communication Engineering',
        city: 'Hyderabad',
        project_id: 3,
        project_title: 'SmartGrid IoT: Autonomous Energy Monitoring & Theft Detection Grid',
        domain_name: 'Internet of Things (IoT)',
        category_name: 'Major Projects',
        preferred_tech: 'ESP32, Arduino, Python',
        additional_req: 'We need the hardware prototype components list and circuit connections diagram.',
        message: 'ECE batch needing working hardware project. Ready to enroll.',
        status: 'Converted',
        admin_notes: 'Batch enrolled! Delivered source code, schematics, and conducted 1-on-1 viva coaching session.',
        created_at: new Date(Date.now() - 3600000 * 72).toISOString()
      }
    ];

    const insertInq = db.prepare(`
      INSERT INTO inquiries (
        ref_code, student_name, mobile, email, college, course, department, city,
        project_id, project_title, domain_name, category_name, preferred_tech,
        additional_req, message, status, admin_notes, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
    `);

    sampleInquiries.forEach(inq => {
      insertInq.run(
        inq.ref_code, inq.student_name, inq.mobile, inq.email, inq.college,
        inq.course, inq.department, inq.city, inq.project_id, inq.project_title,
        inq.domain_name, inq.category_name, inq.preferred_tech, inq.additional_req,
        inq.message, inq.status, inq.admin_notes, inq.created_at, inq.created_at
      );
    });
  }

  // 6. Seed Testimonials
  const testCount = db.prepare('SELECT COUNT(*) as count FROM testimonials').get().count;
  if (testCount === 0) {
    const sampleTestimonials = [
      {
        student_name: 'Sravan Reddy',
        college: 'JNTU Hyderabad (CSE)',
        course: 'B.Tech 2025 Batch',
        project_name: 'DeepGuard Deepfake Detection',
        rating: 5,
        review: 'ProjectVerse was a lifesaver for our final year! Our external examiner grilled us on neural network weights and temporal models, but thanks to the step-by-step viva prep and pristine documentation, we scored an A+ grade! 100% genuine code with zero errors.',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      },
      {
        student_name: 'Pooja Iyer',
        college: 'SRM Institute of Science and Technology',
        course: 'B.Tech AI & Data Science',
        project_name: 'MediPredict Healthcare AI',
        rating: 5,
        review: 'Best project partner in India! We received the working code, complete IEEE paper draft, and a 45-slide PPT that was visually stunning. When our faculty requested a custom feature change, the ProjectVerse team guided us immediately on WhatsApp.',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80'
      },
      {
        student_name: 'Karthik Varma',
        college: 'Osmania University College of Engineering',
        course: 'B.Tech ECE',
        project_name: 'SmartGrid IoT Energy Metering',
        rating: 5,
        review: 'Finding reliable hardware projects for ECE is very stressful. ProjectVerse supplied the complete circuit schematics, bill of materials, and ESP32 code. The live hardware demonstration went flawlessly in our department lab.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
      },
      {
        student_name: 'Sneha Kulkarni',
        college: 'Vellore Institute of Technology (VIT)',
        course: 'MCA 2024 Batch',
        project_name: 'CertiChain Academic Verification',
        rating: 5,
        review: 'From idea to viva, they supported every single phase! The smart contract was deployed cleanly on Sepolia testnet, and the explanation videos made it super easy for me to master the blockchain concepts. Got placed in an MNC as well!',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
      }
    ];

    const insertTestimonial = db.prepare(`
      INSERT INTO testimonials (student_name, college, course, project_name, rating, review, avatar, is_approved, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    sampleTestimonials.forEach(t => {
      insertTestimonial.run(t.student_name, t.college, t.course, t.project_name, t.rating, t.review, t.avatar, 1, now);
    });
  }
}

// Database helper functions
module.exports = {
  db,
  initDatabase,
  hashPassword
};
