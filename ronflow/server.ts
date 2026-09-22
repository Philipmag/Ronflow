import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini SDK with custom User-Agent
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY) {
  ai = new GoogleGenAI({
    apiKey: API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("⚠️ GEMINI_API_KEY is not defined in environment variables. Running in mock AI mode.");
}

// In-memory persistence database for MVP
interface Step {
  id: string;
  order: number;
  title: string;
  description: string;
  actionType: string;
  elementDetails: {
    tag: string;
    text: string;
    ariaLabel: string;
    placeholder: string;
    value?: string;
  };
  pageTitle: string;
  url: string;
  notes?: string;
  annotation: {
    x: number; // percentage width
    y: number; // percentage height
    width: number;
    height: number;
  };
  screenshotState: string; // ID or markup/CSS of simulator state
}

interface Document {
  id: string;
  title: string;
  summary: string;
  prerequisites: string[];
  estimatedTime: string;
  status: "Draft" | "Published" | "Needs review";
  reviewIntervalDays: number;
  lastReviewedAt: string;
  tags: string[];
  steps: Step[];
  createdAt: string;
  updatedAt: string;
  scenariosUsed: string;
}

// Seed mock data for immediate spectacular onboarding
let loadedDocuments: Document[] = [
  {
    id: "doc-vacation-request",
    title: "How to Submit Leave Requests in Workday",
    summary: "A streamlined guide for team members to submit annual vacation or sick leave requests through the corporate HR interface. Ensure you submit requests at least two weeks before your departure date.",
    prerequisites: [
      "Access to Workday Portal credentials",
      "Line manager's name for approval routing",
      "Active employee profile in HR directory"
    ],
    estimatedTime: "3.5 minutes",
    status: "Published",
    reviewIntervalDays: 90,
    lastReviewedAt: new Date().toISOString(),
    tags: ["HR", "Workday", "Leave", "Onboarding"],
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    scenariosUsed: "Workday HR Portal",
    steps: [
      {
        id: "step-1",
        order: 1,
        title: "Access Time & Off Page",
        description: "From the Workday home page center grid, click on the 'Time Off' icon to open your personal balance page.",
        actionType: "click",
        elementDetails: {
          tag: "BUTTON",
          text: "Time Off Quick Action",
          ariaLabel: "Access time off request options",
          placeholder: ""
        },
        pageTitle: "Workday Dashboard",
        url: "https://workday.company.internal/dashboard",
        notes: "Make sure you don't confuse this with the Scheduling app on the sidebar.",
        annotation: { x: 42, y: 35, width: 90, height: 40 },
        screenshotState: "dashboard_timeoff"
      },
      {
        id: "step-2",
        order: 2,
        title: "Initiate Request",
        description: "Click on the primary 'Request Time Off' menu item on the left panel under direct actions.",
        actionType: "click",
        elementDetails: {
          tag: "A",
          text: "Request Time Off",
          ariaLabel: "Request Time Off Link",
          placeholder: ""
        },
        pageTitle: "Time Off Balance Tracker",
        url: "https://workday.company.internal/timeoff/tracker",
        notes: "Checking your vacation balance first is a good rule of thumb.",
        annotation: { x: 18, y: 55, width: 140, height: 35 },
        screenshotState: "tracker_request"
      },
      {
        id: "step-3",
        order: 3,
        title: "Select Leave Dates",
        description: "Choose your start and end dates from the interactive calendar. Use the month arrows to flip between dates.",
        actionType: "select",
        elementDetails: {
          tag: "INPUT",
          text: "Jan 15 - Jan 22",
          ariaLabel: "Select leave dates range input",
          placeholder: "Choose range"
        },
        pageTitle: "New Leave Request Page",
        url: "https://workday.company.internal/timeoff/new",
        notes: "Always double check public holidays which do not deduct from your bucket.",
        annotation: { x: 50, y: 48, width: 280, height: 200 },
        screenshotState: "newoff_calendar"
      },
      {
        id: "step-4",
        order: 4,
        title: "Submit Leave Application",
        description: "Click the green 'Submit Request' button at the bottom-right of the form to send it to your direct line manager.",
        actionType: "click",
        elementDetails: {
          tag: "BUTTON",
          text: "Submit Leave Form",
          ariaLabel: "Submit leave request form to manager",
          placeholder: ""
        },
        pageTitle: "New Leave Request Page",
        url: "https://workday.company.internal/timeoff/new",
        notes: "Approval status typically replies within 48 business hours.",
        annotation: { x: 80, y: 88, width: 120, height: 40 },
        screenshotState: "newoff_submitted"
      }
    ]
  },
  {
    id: "doc-github-repo",
    title: "Creating a Private GitHub Repository",
    summary: "Step-by-step guideline to set up a clean, private GitHub code repository under your corporate organization, configured with standard LICENSE and README, ready for onboarding teams.",
    prerequisites: [
      "Active GitHub account mapped to corporate SSO",
      "Organization creation permissions"
    ],
    estimatedTime: "2 minutes",
    status: "Published",
    reviewIntervalDays: 90,
    lastReviewedAt: new Date().toISOString(),
    tags: ["GIT", "GitHub", "Engineering", "SOP"],
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    scenariosUsed: "GitHub Repo Creator",
    steps: [
      {
        id: "step-git-1",
        order: 1,
        title: "Initiate Repository Creation",
        description: "On the top-right header, click the '+' icon drop-down and choose 'New repository'.",
        actionType: "click",
        elementDetails: {
          tag: "BUTTON",
          text: "+ Create Menu",
          ariaLabel: "Create new menu options",
          placeholder: ""
        },
        pageTitle: "GitHub Home",
        url: "https://github.com/dashboard",
        annotation: { x: 88, y: 4, width: 35, height: 35 },
        screenshotState: "github_home"
      },
      {
        id: "step-git-2",
        order: 2,
        title: "Enter Repo Title",
        description: "Enter a descriptive, lowercase repository name inside the 'Repository name' text field.",
        actionType: "type",
        elementDetails: {
          tag: "INPUT",
          text: "ronflow-core",
          ariaLabel: "Repository Name",
          placeholder: "repository-name"
        },
        pageTitle: "Create a New Repository",
        url: "https://github.com/new",
        annotation: { x: 38, y: 32, width: 220, height: 35 },
        screenshotState: "github_new_name"
      },
      {
        id: "step-git-3",
        order: 3,
        title: "Enforce Private Privacy Settings",
        description: "Ensure the privacy option is toggle-clicked to 'Private' to restrict file reads to authorized org members.",
        actionType: "click",
        elementDetails: {
          tag: "RADIO",
          text: "Private Settings",
          ariaLabel: "Make this repository private",
          placeholder: ""
        },
        pageTitle: "Create a New Repository",
        url: "https://github.com/new",
        annotation: { x: 18, y: 55, width: 120, height: 30 },
        screenshotState: "github_new_private"
      }
    ]
  }
];

// Document List
app.get("/api/docs", (req, res) => {
  res.json(loadedDocuments);
});

// Create blank or specific SOP
app.post("/api/docs", (req, res) => {
  const newDoc: Document = {
    id: `doc-${Date.now()}`,
    title: req.body.title || "Untitled Procedure",
    summary: req.body.summary || "Draft summary describing this step-by-step procedure.",
    prerequisites: req.body.prerequisites || ["Active user credentials for the platform"],
    estimatedTime: req.body.estimatedTime || "5 minutes",
    status: "Draft",
    reviewIntervalDays: req.body.reviewIntervalDays || 90,
    lastReviewedAt: new Date().toISOString(),
    tags: req.body.tags || ["Internal"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    scenariosUsed: req.body.scenariosUsed || "Manual / Custom Capture",
    steps: req.body.steps || []
  };

  loadedDocuments.unshift(newDoc);
  res.status(201).json(newDoc);
});

// Get single Doc
app.get("/api/docs/:id", (req, res) => {
  const doc = loadedDocuments.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.json(doc);
});

// Update Doc
app.patch("/api/docs/:id", (req, res) => {
  const index = loadedDocuments.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Document not found" });

  const currentDoc = loadedDocuments[index];
  const updatedDoc: Document = {
    ...currentDoc,
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  loadedDocuments[index] = updatedDoc;
  res.json(updatedDoc);
});

// Delete Doc
app.delete("/api/docs/:id", (req, res) => {
  const index = loadedDocuments.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Document not found" });

  loadedDocuments.splice(index, 1);
  res.json({ success: true });
});

// Reset review date (staleness clock)
app.post("/api/docs/:id/review", (req, res) => {
  const index = loadedDocuments.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Document not found" });

  loadedDocuments[index].lastReviewedAt = new Date().toISOString();
  loadedDocuments[index].status = "Published";
  res.json(loadedDocuments[index]);
});

// -------------------------------------------------------------
// AI PIPELINE ENDPOINTS CALLING GEMINI SERVER-SIDE ONLY
// -------------------------------------------------------------

// Process incoming workflow events to generate high-fidelity SOP
app.post("/api/generate-flow", async (req, res) => {
  const { events, scenarioName } = req.body;
  if (!events || !Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: "No workflow events provided" });
  }

  // Fallback default mock logic if Gemini key is missing
  if (!ai) {
    console.log("Mock AI mode fallback triggered for generate-flow");
    const docId = `doc-${Date.now()}`;
    const mockSteps: Step[] = events.map((ev, i) => {
      const stepTitle = ev.title || `${ev.actionType.toUpperCase()} on ${ev.elementDetails?.text || 'Element'}`;
      const stepDesc = `Navigate carefully and ${ev.actionType} the target option labeled "${ev.elementDetails?.text || 'Element'}" inside the current window of ${ev.pageTitle}. Ensure elements are correctly focused.`;
      return {
        id: `step-${Date.now()}-${i}`,
        order: i + 1,
        title: stepTitle,
        description: stepDesc,
        actionType: ev.actionType,
        elementDetails: ev.elementDetails,
        pageTitle: ev.pageTitle,
        url: ev.url,
        notes: "Auto-generated step notes.",
        annotation: ev.annotation || { x: 50, y: 50, width: 80, height: 40 },
        screenshotState: ev.screenshotState
      };
    });

    const mockDoc: Document = {
      id: docId,
      title: `How to complete standard procedure for ${scenarioName || "Custom Scenario"}`,
      summary: `A complete procedure to complete routine activities inside ${scenarioName}. Generated instantly by Ronflow on behalf of the operations manager.`,
      prerequisites: [
        "Logged in profile credentials",
        "Active team authorization settings"
      ],
      estimatedTime: `${Math.max(2, Math.round(events.length * 0.5))} minutes`,
      status: "Draft",
      reviewIntervalDays: 90,
      lastReviewedAt: new Date().toISOString(),
      tags: ["AI-Generated", "Operations"],
      steps: mockSteps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scenariosUsed: scenarioName || "Custom Sandbox"
    };

    loadedDocuments.unshift(mockDoc);
    return res.json(mockDoc);
  }

  try {
    // 1. Process Event Steps in Parallel with Gemini Text Generation
    const stepsPromises = events.map(async (ev, i) => {
      const prevStepSummary = i > 0 
        ? `${events[i - 1].actionType} performed on "${events[i - 1].elementDetails?.text || 'element'}"` 
        : "None (this is the first step of the SOP).";

      const stepPrompt = `
      Action type: ${ev.actionType}
      Element details: Tag: ${ev.elementDetails.tag}, text="${ev.elementDetails.text}", aria-label="${ev.elementDetails.ariaLabel}", placeholder="${ev.elementDetails.placeholder}"
      Page title: ${ev.pageTitle}
      URL: ${ev.url}
      Previous step summary: ${prevStepSummary}
      `;

      try {
        const response = await ai!.models.generateContent({
          model: "gemini-3.5-flash",
          contents: stepPrompt,
          config: {
            systemInstruction: `You are an expert technical writer producing employee training documentation. 
Generate a clear, concise step description in SECOND PERSON (e.g., "Click...", "Select...", "Enter...").
Write 1-2 sentences only. Be specific about what the user clicks and what happens next.
Never reference HTML, CSS, class names, or database technical implementation details.
Never add introductory phrases like "In this step" or "Now you will".
Explain the intent behind the action if you can deduce it from the surrounding labels.
Output only the step description, nothing else.`
          }
        });

        const textOutput = response.text || `Click on the ${ev.elementDetails?.text || 'option'} to proceed.`;
        
        // Let's create an action step title from the details
        let inferredTitle = ev.title;
        if (!inferredTitle) {
          if (ev.actionType === "click") inferredTitle = `Click ${ev.elementDetails.text || "Element"}`;
          else if (ev.actionType === "type") inferredTitle = `Enter ${ev.elementDetails.text || "Values"}`;
          else inferredTitle = `Navigate to ${ev.pageTitle}`;
        }

        return {
          id: `step-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          order: i + 1,
          title: inferredTitle,
          description: textOutput.trim(),
          actionType: ev.actionType,
          elementDetails: ev.elementDetails,
          pageTitle: ev.pageTitle,
          url: ev.url,
          annotation: ev.annotation || { x: 50, y: 50, width: 80, height: 40 },
          screenshotState: ev.screenshotState,
          notes: ""
        };
      } catch (err) {
        console.error("Single step generation failure, falling back: ", err);
        return {
          id: `step-fail-${Date.now()}-${i}`,
          order: i + 1,
          title: ev.title || `Perform action ${ev.actionType}`,
          description: `Click or interact with the labeled: "${ev.elementDetails?.text || 'interactive layout'}" on the portal page.`,
          actionType: ev.actionType,
          elementDetails: ev.elementDetails,
          pageTitle: ev.pageTitle,
          url: ev.url,
          annotation: ev.annotation || { x: 50, y: 50, width: 80, height: 40 },
          screenshotState: ev.screenshotState,
          notes: ""
        };
      }
    });

    const solvedSteps = await Promise.all(stepsPromises);

    // 2. Generate Document Title, Summary and Prerequisites based on the generated steps
    const docPrompt = `
    Based strictly on these sequential SOP steps, generate a JSON object with:
    1. "title": A clear, action-oriented corporate training title (e.g. "How to Submit a Request in Workday")
    2. "summary": One paragraph (2-3 sentences) describing what this SOP is about, who it is for, and when it is used.
    3. "prerequisites": A list of 2-4 items needed before commencing.
    4. "tags": 3 or 4 relevant labels like "HR", "Engineering", "Billing" etc.
    
    Steps:
    ${JSON.stringify(solvedSteps.map(s => ({ order: s.order, title: s.title, desc: s.description, url: s.url })))}
    `;

    let docTitle = `How to complete standard procedure for ${scenarioName || "Custom Procedure"}`;
    let docSummary = "This guide details the sequential steps to perform operations accurately.";
    let docPrereqs = ["Active system credentials", "Intranet dashboard alignment"];
    let docTags = ["Operations", "AI-Generated"];

    try {
      const docResponse = await ai!.models.generateContent({
        model: "gemini-3.5-flash",
        contents: docPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              prerequisites: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["title", "summary", "prerequisites"]
          }
        }
      });

      if (docResponse.text) {
        const jsonContent = JSON.parse(docResponse.text);
        if (jsonContent.title) docTitle = jsonContent.title;
        if (jsonContent.summary) docSummary = jsonContent.summary;
        if (jsonContent.prerequisites) docPrereqs = jsonContent.prerequisites;
        if (jsonContent.tags) docTags = jsonContent.tags;
      }
    } catch (docErr) {
      console.error("Document-level metadata extraction failed, defaults used", docErr);
    }

    const compiledDoc: Document = {
      id: `doc-${Date.now()}`,
      title: docTitle,
      summary: docSummary,
      prerequisites: docPrereqs,
      estimatedTime: `${Math.max(2, Math.round(solvedSteps.length * 0.5))} minutes`,
      status: "Draft",
      reviewIntervalDays: 90,
      lastReviewedAt: new Date().toISOString(),
      tags: docTags,
      steps: solvedSteps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scenariosUsed: scenarioName || "Custom Sandbox"
    };

    loadedDocuments.unshift(compiledDoc);
    res.status(201).json(compiledDoc);

  } catch (globalErr: any) {
    console.error("Global flow processing failure:", globalErr);
    res.status(500).json({ error: globalErr?.message || "Failed to process workflow events" });
  }
});

// Single-step re-narration AI endpoint
app.post("/api/ai/narrate-step", async (req, res) => {
  if (!ai) {
    return res.json({ 
      description: "Click or interact with the labeled widget to proceed manually. (API Key missing - Mock Mode)" 
    });
  }

  const { stepDetails, customInstructions } = req.body;
  const prompt = `
  Narrate this documentation step.
  Action: ${stepDetails.actionType}
  Element details: Tag: ${stepDetails.elementDetails?.tag}, text: "${stepDetails.elementDetails?.text}", Label: "${stepDetails.elementDetails?.ariaLabel}"
  Page title: ${stepDetails.pageTitle}
  URL: ${stepDetails.url}
  
  Additional User Request guidance: "${customInstructions || 'None'}"
  `;

  try {
    const response = await ai!.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a senior technical writer. Generate a concise, plain-English instruction for this tool step in second person. Write 1 or 2 sentences Max. Be natural and clear. Output only the narrated sentence."
      }
    });

    res.json({ description: response.text?.trim() || "Complete the annotated action shown in the image." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Check gaps/suggest missing steps AI endpoint
app.post("/api/ai/suggest-missing-steps", async (req, res) => {
  const { steps } = req.body;
  if (!steps || !Array.isArray(steps)) {
    return res.status(400).json({ error: "Steps are required" });
  }

  if (!ai) {
    // Return standard mock missing steps to allow client testing
    return res.json({
      suggestions: [
        {
          insertAfterStepIndex: -1,
          suggestedTitle: "Corporate Single Sign On Login",
          suggestedDescription: "Ensure you are securely logged into your corporate identity tenant with multi-factor authentication before loading the main URL.",
          confidence: "high"
        },
        {
          insertAfterStepIndex: steps.length - 1,
          suggestedTitle: "Verify Submission Confirmation Message",
          suggestedDescription: "Wait momentarily for the green alert box declaring success. Capture the reference ID for audit trails.",
          confidence: "medium"
        }
      ]
    });
  }

  const prompt = `
  Analyze this sequence of SOP steps and detect any gaps (e.g. login beforehand, save buttons, confirmations, etc.)
  Steps:
  ${JSON.stringify(steps.map((s, idx) => ({ index: idx, title: s.title, desc: s.description, url: s.url })))}
  `;

  try {
    const response = await ai!.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `You are a strict procedure compliance reviewer checking a training SOP sequence for gaps.
Analyze the flow and return a JSON payload which is an object containing one property "suggestions" containing a list of objects.
Each object has:
- "insertAfterStepIndex": number (index of existing step after which to insert, -1 = insert right at start of SOP before step index 0)
- "suggestedTitle": string
- "suggestedDescription": string
- "confidence": "high" | "medium"
Return an empty array for "suggestions" if the SOP is perfect and has no logical gaps. Output JSON ONLY.`,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  insertAfterStepIndex: { type: Type.INTEGER },
                  suggestedTitle: { type: Type.STRING },
                  suggestedDescription: { type: Type.STRING },
                  confidence: { type: Type.STRING }
                },
                required: ["insertAfterStepIndex", "suggestedTitle", "suggestedDescription", "confidence"]
              }
            }
          },
          required: ["suggestions"]
        }
      }
    });

    res.json(JSON.parse(response.text || '{"suggestions":[]}'));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Generate SOP Quiz Endpoint
app.post("/api/ai/generate-quiz", async (req, res) => {
  const { title, steps } = req.body;

  if (!ai) {
    return res.json({
      quiz: [
        {
          question: `What is the primary objective of the "${title}" procedure?`,
          options: [
            "To test web developer settings on your computer.",
            "To successfully perform all sequential tasks detailed in this SOP guidelines.",
            "To download manual Excel templates for offline calculation."
          ],
          correctIdx: 1,
          explanation: "This SOP establishes standard team operations alignment to maintain high service compliance."
        },
        {
          question: "Which pre-requirement is listed as mandatory before starting?",
          options: [
            "Access to correct dashboard authorizations and valid login profile.",
            "Creating a backup file on external flash disk storage.",
            "Consulting human resources manager phone contact details."
          ],
          correctIdx: 0,
          explanation: "Prerequisites ensure employees can successfully access the relevant systems without stalling."
        }
      ]
    });
  }

  const prompt = `
  Generate a matching 3-question multiple choice quiz for testing an operator's comprehension of this procedures documentation.
  SOP Title: ${title}
  SOP Steps:
  ${JSON.stringify(steps.map(s => ({ title: s.title, description: s.description })))}
  `;

  try {
    const response = await ai!.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `Analyze the SOP context and output a JSON array of 3 multiple-choice question objects.
Each object must have properties:
- "question": string
- "options": array of 3 or 4 elements
- "correctIdx": number (0-indexed integer of correct option)
- "explanation": string (explaining why correct, with references to SOP steps if applicable)
Do not include any markdowns or headers. Return pure JSON array.`,
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctIdx: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctIdx", "explanation"]
          }
        }
      }
    });

    res.json({ quiz: JSON.parse(response.text || "[]") });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// -------------------------------------------------------------
// SESSION CAPTURE ENDPOINTS (from Chrome Extension)
// -------------------------------------------------------------

// Create recording session from extension
app.post("/api/sessions", async (req, res) => {
  const { sessionId, startedAt, stoppedAt, events, tabUrl, tabTitle } = req.body;
  
  if (!events || !Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: "No workflow events provided" });
  }
  
  console.log(`📹 Received session ${sessionId} with ${events.length} events`);
  
  // Transform extension events to internal format
  const transformedEvents = events.map((ev) => ({
    id: ev.id,
    actionType: ev.actionType,
    timestamp: ev.timestamp,
    sequenceNumber: ev.sequenceNumber,
    pageTitle: ev.pageTitle,
    url: ev.url,
    elementDetails: ev.elementDetails,
    annotation: ev.annotation,
    screenshotState: ev.screenshot?.dataUrl ? `data:${ev.screenshot.format};base64,${ev.screenshot.dataUrl.split(',')[1]}` : null,
    isSensitive: ev.isSensitive || false
  }));
  
  // Generate document using existing AI pipeline
  try {
    const response = await fetch(`http://localhost:${PORT}/api/generate-flow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: transformedEvents,
        scenarioName: tabTitle || 'Custom Workflow'
      })
    });
    
    if (response.ok) {
      const doc = await response.json();
      console.log(`✅ Document generated: ${doc.id}`);
      
      res.json({
        success: true,
        sessionId,
        documentId: doc.id,
        stepCount: doc.steps.length
      });
    } else {
      throw new Error('AI processing failed');
    }
  } catch (err) {
    console.error('Session processing error:', err);
    res.status(500).json({ error: 'Failed to process session' });
  }
});

// Get session status
app.get("/api/sessions/:id/status", (req, res) => {
  // For now, just return mock status
  res.json({
    sessionId: req.params.id,
    status: 'completed',
    processedAt: new Date().toISOString()
  });
});


// -------------------------------------------------------------
// VITE DEV / PRODUCTION INGRESS MIDDLEWARE
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Ronflow backend operational at http://localhost:${PORT}`);
    if (API_KEY) {
      console.log("✅ Server-side Google GenAI (Gemini) SDK client initialized!");
    }
  });
}

startServer();
