# Ronflow AI Engine (SOP Generator & Corporate Capture Terminal)

Welcome to **Ronflow**, a next-generation interactive procedural documentation assistant. It solves the costly problem of manually mapping out complex software workflows by letting users simulate procedures inside live-monitored sandboxes. 

Ronflow logs browser actions, records element properties (HTML tags, text values, ARIA labels, path coordinates), and feeds metadata logs into **Google Gemini** to generate polished, enterprise-ready SOP handbooks with plain-English narratives, compliance warnings, and visual bounding annotations.

---

## 🚀 Quick Start Core Features

1.  **🏢 Simulation Engine**: Capture complete software procedures in real-time inside sandboxed Workday, GitHub, or AWS EC2 screens.
2.  **📋 Dynamic Progress Tracker**: View cumulative completion progress metrics in the header, tracking placeholder step omissions.
3.  **🎯 Precision Target Crosshairs**: Toggle visual target lines on screens for pixel-accurate highlight adjustments.
4.  **📑 Checklist Diagnosis**: Audit procedure sequences via Gemini for gaps or missed compliance approvals.
5.  **🎓 Multi-Choice Quizzes**: Auto-generate interactive training curriculum quizzes for personnel certification.
6.  **✍️ Custom Re-Narration**: Re-phrase individual step narratives based on custom adjectives (e.g. "make it simple", "sound formal").

---

## 🛠️ Step-by-Step Operations Manual

### 1. Dynamic Simulation SOP Creation
*   Navigate to the **Workspaces** tab.
*   Click **"Start Guided SOP Simulation"** (violet button).
*   Select one of the pre-configured platforms (Workday HR, GitHub Admin, or AWS Cloud Console).
*   Carry out the workflow by clicking the highlighted interactive zones.
*   Click **"Process Capture"** to auto-generate steps and details.

### 2. Manual Customization & Precision
*   Click **"Edit Steps"** on any SOP card.
*   Use Panel B's narrative fields, titles, and tips inputs to customize step details.
*   Toggle the **Visual Crosshairs** check under coordinate sliders to reveal laser guidance lines over images for exact pointer centering.
*   Click **"Diagnose SOP Gaps"** or **"Generate Quiz"** in the sidebar to run Gemini operations.

---

## 📦 Local Deployment & Environment Setup

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and **npm** installed.

### 2. Configuration
Create a `.env` file at the project root matching `.env.example`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Installation & Local Development
```bash
# Install dependencies
npm install

# Start development full-stack server (runs Vite & Express on Port 3000)
npm run dev
```

### 4. Production Build & Execution
```bash
# Compile client app and package the server CJS bundle
npm run build

# Boot local production build
npm run start
```

---

## 🌐 Git Push & Repository Backup Guideline
To push this system codebase onto your personal cloud or backup changes to your GitHub workspace, use your Personal Access Token (`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`):

```bash
# 1. Initialize local folder directory
git init

# 2. Add files
git add .
git commit -m "Initialize Ronflow Enterprise SOP Engine - Workspace Capture"

# 3. Create a remote GitHub repository hook using access token
git remote add origin https://Philipmag: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@github.com/Philipmag/ronflow-ai-engine.git

# 4. Rename default branch
git branch -M main

# 5. Safe Force push to update workspace repository
git push -u origin main
```

---
*Developed by Philipmag.*
