# PROJECTVERSE – Complete Student Project Management & Lead Generation Platform

> **"Your Final Year. Our Responsibility. Your Success."**  
> *"From Project Idea to Final Viva – We Guide You Every Step."*

![PROJECTVERSE Banner](/uploads/poster.jpg)

PROJECTVERSE is a futuristic, full-stack student project discovery, documentation, and lead-generation SaaS platform. Designed specifically for final-year engineering and computer science students (**B.Tech, M.Tech, MCA, BCA, B.Sc, M.Sc**), it bridges the gap between academic requirements and production-grade software delivery.

---

## 📞 Official Contact & Hotline
- **Director / Technical Lead**: Saikiran Gorle
- **Phone**: [`7989010109`](tel:7989010109)
- **WhatsApp**: [`7989010109`](https://wa.me/917989010109)
- **Email**: [`saikirangorle909@gmail.com`](mailto:saikirangorle909@gmail.com)

---

## 🚀 Key Features

### 1. Student Experience & Marketplace
- **Hero & Problem Solver**: Direct visual mapping of common student dilemmas vs ProjectVerse solutions.
- **5-Step Proven Methodology**: `PLAN → DEVELOP → TEST → DOCUMENT → SUBMIT`.
- **The 5 Deliverables**:
  1. Complete Working Project (100% Running & Error-Free)
  2. PPT + Report (Well-Designed, IEEE Compliant & Plagiarism-Free)
  3. Viva Q&A (100+ predicted examiner questions)
  4. Step-by-Step Explanation (1-on-1 code walkthrough)
  5. Full Guidance & Support (Direct WhatsApp coaching till submission)
- **17 Project Domains**: AI/ML, Data Science, Web Dev, Python, Java Spring Boot, Android Kotlin, Cyber Security, Cloud (AWS/GCP), IoT (ESP32/Arduino), Embedded, Blockchain, Deep Learning, NLP, Computer Vision, Full Stack, and Big Data.
- **4 Project Categories**: Mini Projects, Major Projects, Research Projects, Industry-Level Projects.
- **Project Details Showcase**: High-res screenshots, system architecture diagrams, software/hardware requirements, working video demo embed, live demo links, and GitHub repositories.
- **Instant Lead Collection**: Quick "I'm Interested" lead form with anti-spam rate limiting, duplicate submission prevention, and instant WhatsApp referral routing.

### 2. Powerful Admin Dashboard
- **Authentication**: Secure admin login with password hashing and JWT token authorization.
- **Analytics Overview**: Real-time counter metrics, Lead Status distribution (Doughnut Chart), and Inquiries by Domain (Bar Chart).
- **Student Interest & Leads (Core CRM)**:
  - Search leads by student name, phone, college, or project.
  - Filter by inquiry status (`New Inquiry`, `Contacted`, `Interested`, `In Progress`, `Converted`, `Not Interested`, `Closed`).
  - One-click **WhatsApp Follow-up** with pre-filled message template.
  - One-click **Call Student** and **Send Email**.
  - Private internal admin notes and interaction history.
  - **Export to CSV**: Instant Excel-compatible lead export.
- **Project Catalog Management (CRUD)**: Create, Read, Update, Delete projects; toggle Trending/Featured status.
- **Domain Management**: Add new technology domains that reflect immediately on the public website.

---

## 🔐 Default Credentials

| Portal | Role | Email | Password |
|---|---|---|---|
| `/admin` | Administrator | `admin@projectverse.com` | `admin123` |
| `/login` | Demo Student | `student@demo.com` | `student123` |

---

## 💻 Tech Stack & Architecture

- **Backend**: Native Node.js HTTP REST API engine (zero external runtime dependencies).
- **Database**: SQLite with relational schema (`projects`, `domains`, `categories`, `inquiries`, `users`, `testimonials`, `logs`).
- **Frontend**: Single Page Application (SPA) with responsive Tailwind CSS, custom futuristic glassmorphism styles, Lucide Icons, and Chart.js.
- **Security**: SHA-256 HMAC tokens, rate limiting per IP, SQL parameter binding, sanitized file uploads.

---

## ⚡ How to Run Locally

### Option 1: Double-Click Launcher (Windows)
Double-click `start.bat` in the project folder. It will launch the backend server and automatically open `http://localhost:3000` in your default browser.

### Option 2: PowerShell
```powershell
.\start.ps1
```

### Option 3: Terminal Command
```bash
set ELECTRON_RUN_AS_NODE=1
node server.js
```

---

## 🧪 Verified Workflow Testing
1. **Admin Login**: Go to `http://localhost:3000/#admin` and log in with `admin@projectverse.com` / `admin123`.
2. **Explore Leads**: View the Leads table with active students, click the WhatsApp button, or export leads to CSV.
3. **Add Project**: Add a new final-year project under any domain; it appears in the public explorer immediately.
4. **Student Lead Submission**: Visit any project page, click "I'm Interested", fill the form, and get your instant `PV-2026-XXXX` Reference ID.
5. **Real-Time Sync**: View the newly captured lead in the Admin Dashboard with status `New Inquiry`.
