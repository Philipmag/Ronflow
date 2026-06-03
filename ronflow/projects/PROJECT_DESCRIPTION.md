# Ronflow AI Engine: Solution & System Description
## Enterprise-Grade Standard Operating Procedure (SOP) Document Engine

This document provides a technical overview and architectural description of the **Ronflow AI Engine** solution. 

---

## 1. Project Vision & Solution Scope

Modern organizations lose thousands of operational hours due to stale, missing, or confusing software guides. **Ronflow** bridges the gap between active employee software interactions and formal corporate documentation. 

By capturing element characteristics (HTML tags, CSS boundaries, coordinates, and labels) inside an interactive simulation sandbox and leveraging **Google Gemini (AI Models)**, Ronflow generates professional, compliance-validated Standard Operating Procedures step-by-step.

```
       [Interactive Simulation sandbox]
                      │
                      ▼ (element details, screenshots)
         [Express Backend Storage Controller]
                      │
                      ▼
         [Google Gemini Model Services]
       ┌──────────────┼──────────────┐
       ▼              ▼              ▼
 [SOP Narrative] [Gap Auditor] [Training Quiz]
```

---

## 2. Core Technological Stack

The system is constructed with a modern full-stack web architecture:

1.  **Frontend Interface (Single Page Application)**:
    *   **React 19 & TypeScript**: Structured with components for layout modularity and robust type safety.
    *   **Tailwind CSS**: Strict Neobrutalist aesthetic focusing on high contrast, strong card borders (`border-[3px] border-slate-900`), and typography hierarchies.
    *   **Framer Motion**: Smooth entry, sliding panels, and state-change transitions.
    *   **Lucide Icons**: Uniform vector iconography for navigation headers, stats grids, and buttons.
2.  **Backend Server**:
    *   **Node.js & Express**: Secure routing servers handling metadata requests and routing API key interactions securely.
    *   **Data Controller**: In-memory database array seeded with enterprise templates (Workday, Git, AWS EC2) with complete CRUD lifecycle interfaces.
    *   **tsx**: Direct server entry executions during local development.
    *   **esbuild**: Production-optimized bundler compiling server files into self-contained CommonJS artifacts (`dist/server.cjs`).
3.  **Artificial Intelligence Middleware**:
    *   `@google/genai` (v2.4.0): Safe server-side API integration communicating with Gemini Models to generate narratives, identify checklist gaps, and generate quizzes based on SOP metadata.

---

## 3. Server-Side API Handlers (`server.ts`)

The backend exposes several critical REST operations:

*   `GET /api/docs` - Retrieve all SOP documents with complete tag hierarchies and step sequences.
*   `POST /api/docs` - Bootstrap a blank document draft.
*   `PATCH /api/docs/:id` - Perform incremental updates to specific SOP documents.
*   `DELETE /api/docs/:id` - Safely delete documents from the organization-wide directory.
*   `POST /api/docs/:id/review` - Reset compliance review timestamps.
*   `POST /api/ai/narrate-step` - Feed raw HTML details into Gemini to synthesize step instructions custom-tailored to operator instructions.
*   `POST /api/ai/suggest-missing-steps` - Audits step sequences, discovering workflow vulnerabilities (e.g. missing backup verification, forgotten MFA).
*   `POST /api/ai/generate-quiz` - Dynamically compiles training curriculum quizzes with multi-choice checks.

---

## 4. Key Interactive Components

### A. The Simulation Engine (`RecordingSimulator.tsx`)
Rather than relying on intrusive browser extensions, Ronflow runs a mock runtime environment inside the SPA:
*   Includes sandbox scenario contexts simulating modern dashboards (Workday, GitHub, AWS).
*   Logs click coordinates, ARIA references, text titles, and paths.
*   Generates a mock screenshot output frame illustrating exactly where the operator needs to navigate next.

### B. High-Precision Target Adjuster
Allows administrators to manually modify target bounding box parameters. Coordinates can be updated via range sliders, and checked using **High-Precision Crosshairs** to project guide axes across the preview panel.

### C. Visual Progress Meter
Visualizes standard documentation preparation progress on every SOP card and editor banner, measuring active step description percentages and completed flags to identify unfinished user instructions.

---

## 5. Security & Isolation Guidelines

*   **API Key Protection**: The Gemini API Key is contained purely server-side (`process.env.GEMINI_API_KEY`) and is never sent to or visible inside client-side browser context files or DevTool bundles.
*   **Encrypted Assets**: Coordinates and screenshot paths map strictly over safe mock asset namespaces.

---
*Technical Documentation | Confidential Organization Resource | Powered by Ronflow*
