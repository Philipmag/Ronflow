# Ronflow AI Engine: Corporate Procedural Capture & SOP Hub
## Official User Manual & Operations Guide

Welcome to the **Ronflow AI Engine** user manual. This document provides complete step-by-step operating procedures for capturing, auditing, editing, and publishing enterprise-ready Standard Operating Procedures (SOPs).

---

## Table of Contents
1. [System Overview & Architecture](#1-system-overview--architecture)
2. [Core Features & Workspace Layout](#2-core-features--workspace-layout)
3. [Step-by-Step Operations Guide](#3-step-by-step-operations-guide)
   - [A. Creating an SOP via Interactive Simulation](#a-creating-an-sop-via-interactive-simulation)
   - [B. Managing the SOP Document Directory](#b-managing-the-sop-document-directory)
   - [C. Editing & Customizing SOP Steps](#c-editing--customizing-sop-steps)
   - [D. Precision Visual Alignment with Crosshairs](#d-precision-visual-alignment-with-crosshairs)
   - [E. Progress Tracking & Integrity Metres](#e-progress-tracking--integrity-metres)
4. [Advanced AI Features (Gemini-Powered)](#4-advanced-ai-features-gemini-powered)
   - [A. Plain-English Step Re-Narration](#a-plain-english-step-re-narration)
   - [B. Gap Analysis & Compliance Spot-Checks](#b-gap-analysis--compliance-spot-checks)
   - [C. Automatic Workforce Training Quizzes](#c-automatic-workforce-training-quizzes)
5. [Document Exporting & Formats](#5-document-exporting--formats)
6. [Local Deployment & GitHub Sync Guideline](#6-local-deployment--github-sync-guideline)

---

## 1. System Overview & Architecture

**Ronflow** is a next-generation interactive procedural documentation assistant. It solves the costly problem of manually mapping out complex software workflows by letting users simulate procedures inside live-monitored sandboxes. 

Behind the scenes, Ronflow logs browser actions, records element properties (HTML tags, text values, ARIA labels, path coordinates), and feeds metadata logs into **Gemini models** to generate polished, enterprise-ready SOP handbooks with plain-English narratives, compliance warnings, and visual bounding annotations.

---

## 2. Core Features & Workspace Layout

The application has a high-contrast, responsive **Neobrutalist interface** with sturdy borders and vibrant accents:

*   **🏢 Workspaces Tab**: Browse existing SOP directories, search, filter by status, start a sandbox simulator session, or create blank drafts.
*   **🔗 Integrations Tab**: Monitor linked platforms (GitHub, Workday HR, AWS Cloud Services) facilitating automated procedural ingest.
*   **📊 Live Logs Tab**: Access low-level database operations, diagnostic logs, and platform telemetry.
*   **⚙️ Settings Tab**: Configure enterprise parameters, staleness review cycles, and team access credentials.
*   **✍️ SOP Interactive Editor**: A robust triple-panel terminal:
    *   *Panel A (Timeline Panel)*: Quick navigation of steps and access to AI diagnostic tools.
    *   *Panel B (Details Editor)*: Title adjustments, text narrative editors, custom AI instruction inputs, and HTML object logs.
    *   *Panel C (Visual Presenter & Overlay HUD)*: An interactive screenshot canvas with adjustable highlight bounding boxes, coordinate sliders, and a high-precision target crosshair toggle.

---

## 3. Step-by-Step Operations Guide

### A. Creating an SOP via Interactive Simulation
1. Navigate to the **Workspaces** tab.
2. Click the shiny violet button: **"Start Guided SOP Simulation"**.
3. Select an corporate operational scenario from the dropdown list:
   *   *Workday HR Dashboard (Requesting Time Off)*
   *   *GitHub Administrator (New Repository Setup)*
   *   *AWS EC2 Cloud Console (Deploying Virtual Server Nodes)*
4. Run the simulation by interacting with the highlighted click targets inside the browser sandbox:
   *   Click buttons, check input fields, select items, and submit forms.
   *   Each action records a screenshot frame and logs HTML metadata.
5. Once completed, your actions will instantly process through Gemini. Click **"Process Capture"** to auto-compile the workflow into an editable SOP script.

### B. Managing the SOP Document Directory
*   **Searching**: Use the search bar in the directory to find SOPs instantly. Ronflow queries titles, keywords, labels, summaries, and custom tags immediately.
*   **Filter States**: Toggle between the status filters: `All`, `Draft` (active editing), `Published` (approved and active), and `Needs review` (stale content or missing critical validation checklist).
*   **Deletion**: Clean up your directory library by clicking the red Trashcan icon (`Delete SOP`) on any document card. Permanent deletions require security confirmation.

### C. Editing & Customizing SOP Steps
1. Locate your document in the directory and click **"Edit Steps"**.
2. Select any sequence number in **Panel A** (Left Sidebar) to render the details container.
3. Edit the following attributes:
   *   **Step Title**: Name the action uniquely (e.g. "Identify & Access Leave Panel Request").
   *   **Step Plain-English Narrative**: Clear instructions describing the *why* and *how* of the operation.
   *   **Compliance Warning / Tip**: Important side comments (e.g., "Make sure you use Google Chrome browser context only").
4. **Step Reordering**: Use the **▲ Move Up** and **▼ Move Down** buttons next to individual steps to swap workflow sequences.

### D. Precision Visual Alignment with Crosshairs
When aligning highlight bounds over screenshot interfaces:
1. Make sure you are in the **SOP Interactive Editor**.
2. Toggle the **"Visual Crosshairs"** switch under the coordinate adjustment panel.
3. Once active, horizontal and vertical pink dashed coordinates project across the preview surface.
4. Drag the **X-Coordinate** and **Y-Coordinate** coordinate sliders. This centers the target precisely on critical elements without layout overlapping or blind spots.

### E. Progress Tracking & Integrity Metres
At the very top of your Editor frame, look at the **Overall SOP Step Completion Progress** tracker:
*   **Progress Percentage**: Calibrated systematically based on completed check-marks and whether fields are filled with actual text instead of raw placeholder templates (like "New Manual Action Step").
*   **Mini-indicators**: Steps in the sidebar display a green bullet if completion integrity is satisfied, and a yellow warning indicator if the content remains generic or incomplete.

---

## 4. Advanced AI Features (Gemini-Powered)

### A. Plain-English Step Re-Narration
Need to write guidelines for a non-technical worker or refine formatting for corporate auditing?
1. Choose a step in the editor.
2. Scroll to **"Re-narrate Step Description"** in Panel B.
3. Write your desired stylistic instructions (e.g., *"Make it sound highly technical"* or *"Draft a safe guideline warned against potential banking double-charges"*).
4. Click **"Apply AI"**. Gemini re-synthesizes the paragraph dynamically.

### B. Gap Analysis & Compliance Spot-Checks
To ensure safety checks aren't missed:
1. Open the SOP Editor.
2. Under the Left step-index list, click **"Diagnose SOP Gaps"**.
3. Ronflow triggers an LLM checklist scan identifying process blind spots, forgotten security logins, or unlogged notifications.
4. If Ronflow identifies a missing gap (e.g., "Verify Email confirmation standard"), review the suggestion list and click **"Inject Missing Step"** to place the recommendation automatically into your procedure list.

### C. Automatic Workforce Training Quizzes
Generate evaluation quizzes to train and verify personnel eligibility:
1. In the Editor sidebar, click **"Generate Quiz"**.
2. Gemini consumes the entire step layout sequence and renders a training questionnaire modal.
3. Operators can check multiple-choice answers and receive instantaneous compliance grading with explanatory answers.

---

## 5. Document Exporting & Formats

*   **Viewer Mode**: Click **"View Presentation"** to inspect the guide in a full-bleed slide presentation mode. Perfect for display inside operational command terminals.
*   **Export Formats**: Select **"PDF"** or **"Word"** templates to fetch employer-ready raw document distributions instantly.

---

## 6. Local Deployment & GitHub Sync Guideline

To push this system codebase onto your personal cloud or back up changes to your GitHub workspace:

### Automatic Export
1. Head to the **Settings** cog menu in the top right menu block of the Ronflow AI Studio workspace.
2. Select **Settings** -> **Export to ZIP** or **Link to GitHub**.

### Desktop Terminal Sync (Personal Access Token Authorized)
Since server execution prevents raw command-line standard SSH authentication, you can run the following standard git command sequence on your developer machine using your Personal Access Token (`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`):

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
*Manual Version: 1.4.2 Enterprise Release | © Ronflow Corporation. Powered by Google AI Gemini-Flash.*
