import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Search,
  FileText,
  Settings,
  Layers,
  Trash2,
  Play,
  Check,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Share2,
  BookOpen,
  Edit3,
  ExternalLink,
  Shield,
  Activity,
  User,
  Users,
  RefreshCw,
  FileDown,
  ChevronRight,
  Eye,
  HelpCircle,
  Zap,
  BookCheck,
  PlusCircle,
  ChevronLeft,
  Target
} from "lucide-react";
import { Document, Step } from "./types";
import RecordingSimulator from "./components/RecordingSimulator";

export default function App() {
  // Navigation states
  const [activeTab, setActiveTab] = useState<"workspace" | "integrations" | "analytics" | "settings">("workspace");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  
  // Searching & status filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Draft" | "Published" | "Needs review">("All");

  // Mode: "library" | "editor" | "preview"
  const [viewMode, setViewMode] = useState<"library" | "editor" | "preview">("library");
  
  // Simulator modal visibility
  const [showSimulator, setShowSimulator] = useState(false);

  // Selected Step index inside the editor
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);

  // Loading/saving status states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Advanced feature interaction modals
  const [quizData, setQuizData] = useState<any[] | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [quizExplanation, setQuizExplanation] = useState<{ [key: number]: string }>({});
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);

  // Step suggestions from AI gap logic
  const [aiSuggestions, setAiSuggestions] = useState<any[] | null>(null);
  const [isAnalysingGaps, setIsAnalysingGaps] = useState(false);
  const [showGapsModal, setShowGapsModal] = useState(false);

  // Custom step narration inputs
  const [customNarrationGuide, setCustomNarrationGuide] = useState("");
  const [isRenarrating, setIsRenarrating] = useState(false);

  // Toggle switch state for visual crosshairs on step overlay
  const [showCrosshairs, setShowCrosshairs] = useState(false);

  // Fetch initial documents listing from back-end
  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/docs");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      console.error("Failed to load documents", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const selectedDoc = documents.find((doc) => doc.id === selectedDocId) || null;

  // Add a blank document template
  const handleAddNewDoc = async () => {
    try {
      setIsSaving(true);
      const payload = {
        title: "New Procedure SOP",
        summary: "Enter a brief summary overview detailing who performs this workflow procedure.",
        prerequisites: ["Corporate portal credentials", "Verified email SSO login"],
        estimatedTime: "3 minutes",
        tags: ["Operations"],
        steps: [
          {
            id: `step-demo-${Date.now()}`,
            order: 1,
            title: "Access Main Portal Dashboard",
            description: "Navigate to the workspace browser and locate the system configuration dashboard.",
            actionType: "click",
            elementDetails: {
              tag: "BUTTON",
              text: "Launch Workspace Console",
              ariaLabel: "Launch center core Console",
              placeholder: ""
            },
            pageTitle: "Landing Console Home",
            url: "https://workspace.internal/home",
            notes: "Make sure you use Google Chrome browser context.",
            annotation: { x: 50, y: 50, width: 100, height: 40 },
            screenshotState: "dashboard_timeoff"
          }
        ]
      };

      const res = await fetch("/api/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setDocuments(prev => [data, ...prev]);
        setSelectedDocId(data.id);
        setSelectedStepIndex(0);
        setViewMode("editor");
      }
    } catch (e) {
      console.error("Error creating document", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Perform permanent backend-sync update with debouncing or immediate trigger
  const syncDocToBackend = async (updatedDoc: Document) => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/docs/${updatedDoc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDoc)
      });
      if (res.ok) {
        const saved = await res.json();
        setDocuments((prev) =>
          prev.map((doc) => (doc.id === saved.id ? saved : doc))
        );
      }
    } catch (e) {
      console.error("Error syncing document changes", e);
    } finally {
      setIsSaving(false);
    }
  };

  // Update specific fields of the active document
  const handleUpdateDocField = (field: keyof Document, value: any) => {
    if (!selectedDoc) return;
    const updated = { ...selectedDoc, [field]: value };
    // Optimistic UI state
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === selectedDoc.id ? updated : doc))
    );
    syncDocToBackend(updated);
  };

  // Save changes to current step inside active doc
  const handleUpdateStep = (stepId: string, stepField: keyof Step, value: any) => {
    if (!selectedDoc) return;
    const updatedSteps = selectedDoc.steps.map((st) => {
      if (st.id === stepId) {
        return { ...st, [stepField]: value };
      }
      return st;
    });

    const updatedDoc = { ...selectedDoc, steps: updatedSteps };
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === selectedDoc.id ? updatedDoc : doc))
    );
    syncDocToBackend(updatedDoc);
  };

  // Delete active selected step
  const handleDeleteStep = (stepId: string) => {
    if (!selectedDoc) return;
    const remainingSteps = selectedDoc.steps.filter((st) => st.id !== stepId);
    // Reorder step order integer sequence
    const recalibratedSteps = remainingSteps.map((st, i) => ({
      ...st,
      order: i + 1
    }));

    const updatedDoc = { ...selectedDoc, steps: recalibratedSteps };
    
    // Choose selected step safe boundaries
    if (selectedStepIndex >= recalibratedSteps.length) {
      setSelectedStepIndex(Math.max(0, recalibratedSteps.length - 1));
    }

    setDocuments((prev) =>
      prev.map((doc) => (doc.id === selectedDoc.id ? updatedDoc : doc))
    );
    syncDocToBackend(updatedDoc);
  };

  // Add a manual custom step in the editor
  const handleAddManualStep = () => {
    if (!selectedDoc) return;
    const nextOrder = selectedDoc.steps.length + 1;
    const newStep: Step = {
      id: `step-manual-${Date.now()}`,
      order: nextOrder,
      title: "New Manual Action Step",
      description: "Define instructions detailing the interaction requirement for the operator here.",
      actionType: "click",
      elementDetails: {
        tag: "BUTTON",
        text: "Submit Form Widget",
        ariaLabel: "Submit main form parameters",
        placeholder: ""
      },
      pageTitle: "System Interactive Portal",
      url: "https://workspace.internal/portal",
      notes: "Enter additional helpful tips for operators.",
      annotation: { x: 50, y: 50, width: 120, height: 40 },
      screenshotState: "dashboard_timeoff"
    };

    const updatedSteps = [...selectedDoc.steps, newStep];
    const updatedDoc = { ...selectedDoc, steps: updatedSteps };

    setDocuments((prev) =>
      prev.map((doc) => (doc.id === selectedDoc.id ? updatedDoc : doc))
    );
    setSelectedStepIndex(updatedSteps.length - 1);
    syncDocToBackend(updatedDoc);
  };

  // Re-order step position drag simulator buttons
  const moveStepOrder = (index: number, direction: "up" | "down") => {
    if (!selectedDoc) return;
    const steps = [...selectedDoc.steps];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    
    if (targetIdx < 0 || targetIdx >= steps.length) return;

    // Swap elements
    const temp = steps[index];
    steps[index] = steps[targetIdx];
    steps[targetIdx] = temp;

    // Reset correct order attributes
    const reordered = steps.map((s, idx) => ({ ...s, order: idx + 1 }));
    const updatedDoc = { ...selectedDoc, steps: reordered };

    setDocuments((prev) =>
      prev.map((doc) => (doc.id === selectedDoc.id ? updatedDoc : doc))
    );
    setSelectedStepIndex(targetIdx);
    syncDocToBackend(updatedDoc);
  };

  // Reset the review status timestamp for legal compliance
  const handleMarkAsReviewed = async () => {
    if (!selectedDoc) return;
    try {
      const res = await fetch(`/api/docs/${selectedDoc.id}/review`, {
        method: "POST"
      });
      if (res.ok) {
        const saved = await res.json();
        setDocuments((prev) =>
          prev.map((doc) => (doc.id === saved.id ? saved : doc))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete total document from dashboard
  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this SOP guide from your organization library?")) return;
    try {
      const res = await fetch(`/api/docs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        if (selectedDocId === id) {
          setSelectedDocId(null);
          setViewMode("library");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Call Gemini API to re-narrate a selective step based on custom guidelines
  const triggerStepReNarration = async () => {
    if (!selectedDoc || selectedDoc.steps.length === 0) return;
    const currentStep = selectedDoc.steps[selectedStepIndex];
    
    setIsRenarrating(true);
    try {
      const res = await fetch("/api/ai/narrate-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepDetails: currentStep,
          customInstructions: customNarrationGuide
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.description) {
          handleUpdateStep(currentStep.id, "description", data.description);
          setCustomNarrationGuide("");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRenarrating(false);
    }
  };

  // Call Gemini API to check gaps and compliance checklist in current procedure
  const runSopGapCheckMultiplier = async () => {
    if (!selectedDoc) return;
    setIsAnalysingGaps(true);
    setAiSuggestions(null);
    setShowGapsModal(true);
    
    try {
      const res = await fetch("/api/ai/suggest-missing-steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: selectedDoc.steps })
      });

      if (res.ok) {
        const data = await res.json();
        setAiSuggestions(data.suggestions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalysingGaps(false);
    }
  };

  // Add suggested step into current document
  const handleInjectSuggestedStep = (suggestion: any) => {
    if (!selectedDoc) return;
    
    const indexToInsert = suggestion.insertAfterStepIndex; // -1 or index
    const newStepObj: Step = {
      id: `step-suggested-${Date.now()}`,
      order: 0, // will be reset
      title: suggestion.suggestedTitle,
      description: suggestion.suggestedDescription,
      actionType: "manual",
      elementDetails: {
        tag: "NAV",
        text: "Recommended Step",
        ariaLabel: "Compliance verification checkpoint",
        placeholder: ""
      },
      pageTitle: selectedDoc.steps[0]?.pageTitle || "Target Portal Access",
      url: selectedDoc.steps[0]?.url || "https://company.internal",
      notes: "Created by AI Compliance analysis suggestions.",
      annotation: { x: 50, y: 30, width: 100, height: 40 },
      screenshotState: "dashboard_timeoff"
    };

    let updatedSteps = [...selectedDoc.steps];
    if (indexToInsert === -1) {
      updatedSteps.unshift(newStepObj);
    } else {
      updatedSteps.splice(indexToInsert + 1, 0, newStepObj);
    }

    // Refactor indices
    const normalized = updatedSteps.map((st, i) => ({ ...st, order: i + 1 }));
    const updatedDoc = { ...selectedDoc, steps: normalized };

    setDocuments((prev) =>
      prev.map((doc) => (doc.id === selectedDoc.id ? updatedDoc : doc))
    );
    setSelectedStepIndex(indexToInsert === -1 ? 0 : indexToInsert + 1);
    syncDocToBackend(updatedDoc);
    setShowGapsModal(false);
  };

  // Call Gemini API to produce full SOP Quiz
  const handleGenerateStepQuiz = async () => {
    if (!selectedDoc) return;
    setIsGeneratingQuiz(true);
    setSelectedAnswers({});
    setQuizExplanation({});
    setShowQuizModal(true);

    try {
      const res = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedDoc.title,
          steps: selectedDoc.steps
        })
      });

      if (res.ok) {
        const data = await res.json();
        setQuizData(data.quiz || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Submit Answer to quiz option
  const answerQuizOption = (qIdx: number, optIdx: number) => {
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
    // Populate explanation
    if (quizData && quizData[qIdx]) {
      setQuizExplanation(prev => ({ ...prev, [qIdx]: quizData[qIdx].explanation }));
    }
  };

  // Handle workflow simulation callback
  const onSimulatorFinish = (craftedDoc: any) => {
    setDocuments((prev) => [craftedDoc, ...prev]);
    setSelectedDocId(craftedDoc.id);
    setSelectedStepIndex(0);
    setViewMode("editor");
    setShowSimulator(false);
  };

  // Document exports mock feedback message
  const triggerMockDownload = (format: "pdf" | "docx") => {
    alert(`Successfully generated employer-ready raw ${format.toUpperCase()} export template binary array.\nDownloaded: ${selectedDoc?.title || 'SOP'}.${format}`);
  };

  // Filtering document listing algorithm
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "All" || doc.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate completion percentage based on step attributes or 'completed' flag
  const getDocProgress = (doc: Document | null) => {
    if (!doc || !doc.steps || doc.steps.length === 0) {
      return { percent: 0, completedCount: 0, totalCount: 0 };
    }
    const totalCount = doc.steps.length;
    let completedCount = 0;
    doc.steps.forEach((st) => {
      const isPlaceholder = !st.title || 
                            st.title.trim() === "" || 
                            st.title === "New Manual Action Step" ||
                            !st.description || 
                            st.description.trim() === "" || 
                            st.description.startsWith("Define instructions");
      if (st.completed === true || !isPlaceholder) {
        completedCount++;
      }
    });
    const percent = Math.round((completedCount / totalCount) * 100);
    return { percent, completedCount, totalCount };
  };

  const progress = getDocProgress(selectedDoc);

  return (
    <div className="w-full min-h-screen bg-[#fdfdfd] text-slate-900 font-sans flex flex-col selection:bg-amber-300 selection:text-slate-900">
      
      {/* Heavy Bento Header Section */}
      <header className="border-b-4 border-slate-900 bg-white p-6 sticky top-0 z-30">
        <div id="header-bento-layout" className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <div className="w-5 h-5 bg-amber-400 rounded-full border border-slate-900"></div>
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 flex items-center gap-1.5">
                RONFLOW <span className="text-xs bg-amber-400 px-2.5 py-0.5 rounded-full border border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] font-sans tracking-normal lowercase text-slate-800">ai engine</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Procedural Capture & SOP Hub</p>
            </div>
          </div>

          {/* Navigation Bar Pills */}
          <nav className="flex flex-wrap items-center gap-3 md:gap-5">
            <button
              onClick={() => { setActiveTab("workspace"); setViewMode("library"); }}
              className={`px-4 py-2 border-2 text-xs font-bold uppercase tracking-wider rounded-xl transition ${
                activeTab === "workspace"
                  ? "bg-indigo-600 text-white border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-900"
              }`}
            >
              🏢 Workspaces
            </button>
            <button
              onClick={() => setActiveTab("integrations")}
              className={`px-4 py-2 border-2 text-xs font-bold uppercase tracking-wider rounded-xl transition ${
                activeTab === "integrations"
                  ? "bg-slate-900 text-white border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-900"
              }`}
            >
              🔗 Integrations
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 border-2 text-xs font-bold uppercase tracking-wider rounded-xl transition ${
                activeTab === "analytics"
                  ? "bg-slate-900 text-white border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-900"
              }`}
            >
              📊 Live Logs
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 border-2 text-xs font-bold uppercase tracking-wider rounded-xl transition ${
                activeTab === "settings"
                  ? "bg-slate-900 text-white border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-900"
              }`}
            >
              ⚙️ Settings
            </button>
          </nav>

          {/* User badge metadata */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="hidden lg:block text-right">
              <span className="block text-xs font-bold text-slate-700">philipsmagok@gmail.com</span>
              <span className="text-[9px] uppercase font-bold text-indigo-600">Enterprise workspace admin</span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-amber-300 flex items-center justify-center font-bold text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              PM
            </div>
          </div>

        </div>
      </header>

      {/* Main Workspace Frame container */}
      <main className="flex-grow p-4 md:p-8 max-w-[1400px] w-full mx-auto">
        
        {/* TAB WORKSPACE */}
        {activeTab === "workspace" && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Conditional simulator viewport container row */}
            {showSimulator && (
              <div className="bg-white border-4 border-slate-900 rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] space-y-4">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                      <span className="w-3 h-3 bg-rose-500 rounded-full animate-ping"></span>
                      Interactive Process Recorder Simulator
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Perform standard corporate workflow steps inside the sandbox to capture screenshot overlays & trigger server-side Gemini SOP generation.</p>
                  </div>
                  <button
                    onClick={() => setShowSimulator(false)}
                    className="px-3 py-1 text-xs border-2 border-slate-950 font-bold bg-slate-100 hover:bg-slate-200 rounded-lg shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                  >
                    × Close Window
                  </button>
                </div>
                
                <RecordingSimulator
                  onWorkflowProcessed={onSimulatorFinish}
                  onCancel={() => setShowSimulator(false)}
                />
              </div>
            )}

            {/* VIEW MODE: 1. LIBRARY PAGE */}
            {viewMode === "library" && (
              <div className="space-y-6">
                
                {/* Dashboard Bento Header Widgets layout panel */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Big Hero Pitch Grid Block */}
                  <div className="md:col-span-8 bg-amber-400 border-4 border-slate-900 rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-indigo-900" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-800 bg-white/40 px-2.5 py-0.5 rounded-full border border-slate-900">Zero-Friction SOP Pipeline</span>
                      </div>
                      <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-950 leading-tight">
                        STOP WRITING PROCEDURES MANUALLY. <br />LET AI DO THE REST.
                      </h2>
                      <p className="text-xs text-slate-800 font-medium mt-3 max-w-2xl leading-relaxed">
                        Ronflow auto-documents screen clicks, mouse navigations, and target element tags into gorgeous annotated procedural booklets. Connect screens via simulator capturing and enjoy instantaneous formatted SOP publications.
                      </p>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-4">
                      <button
                        onClick={() => setShowSimulator(true)}
                        className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-2"
                      >
                        <Play className="w-4 h-4 fill-white" /> Start Guided SOP Simulation
                      </button>
                      <button
                        onClick={handleAddNewDoc}
                        className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-900 font-black text-xs uppercase tracking-wider rounded-xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" /> Create Empty Guide Draft
                      </button>
                    </div>
                  </div>

                  {/* Right Side Stats Panel 1 */}
                  <div className="md:col-span-4 bg-white border-4 border-slate-900 rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
                    <div>
                      <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest">Active Workforce Docs</h3>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-6xl font-black tracking-tighter text-slate-900">{documents.length}</span>
                        <span className="text-xs font-bold text-emerald-600 uppercase">Publish Ready</span>
                      </div>
                    </div>
                    
                    <div className="mt-5 border-t border-slate-100 pt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-500">Auto-generated steps</span>
                        <span className="font-bold text-slate-800">{documents.reduce((acc, d) => acc + d.steps.length, 0)} Steps</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-500">Staleness Checks</span>
                        <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[10px]">90d Interval Enforced</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Filters & SOP Guides Core Search layout */}
                <div className="bg-white border-4 border-slate-900 rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
                  
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-slate-900 pb-5 mb-6">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">
                        SOP DOCUMENT DIRECTORY
                      </h3>
                      <span className="bg-indigo-100 text-indigo-700 font-black text-[10px] px-2.5 py-1 rounded-full border border-indigo-300 uppercase">
                        Enterprise Repository
                      </span>
                    </div>

                    {/* Filter Segment controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      {["All", "Draft", "Published", "Needs review"].map((st) => (
                        <button
                          key={st}
                          onClick={() => setStatusFilter(st as any)}
                          className={`px-3 py-1.5 border-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition ${
                            statusFilter === st
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-500 border-slate-200 hover:border-slate-800"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search Query Field */}
                  <div className="mb-6 max-w-md relative">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search procedures by title, tags or manual summary..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  {/* Documents Grid */}
                  {isLoading ? (
                    <div className="py-20 text-center font-mono text-xs text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Retrieving procedure directory database...
                    </div>
                  ) : filteredDocuments.length === 0 ? (
                    <div className="py-20 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                      <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <h4 className="font-bold text-slate-700 text-sm">No Document Guides Found</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Try clearing your search filters or start a guided SOP capture to compile your first workflow guide.</p>
                      <button onClick={() => setShowSimulator(true)} className="mt-4 bg-indigo-600 border border-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg">
                        Launch Simulation Now
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredDocuments.map((doc) => (
                        <div
                          id={`doc-card-${doc.id}`}
                          key={doc.id}
                          className="bg-white border-2 border-slate-900 rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
                        >
                          <div className="p-5 border-b border-slate-100">
                            <div className="flex justify-between items-start gap-2 mb-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                doc.status === "Published"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : doc.status === "Needs review"
                                  ? "bg-rose-50 text-rose-700 border-rose-300"
                                  : "bg-amber-50 text-amber-700 border-amber-300"
                              }`}>
                                {doc.status}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> {doc.estimatedTime}
                              </span>
                            </div>

                            <h4 className="font-extrabold text-slate-900 text-sm leading-tight hover:text-indigo-600 cursor-pointer" onClick={() => { setSelectedDocId(doc.id); setViewMode("editor"); setSelectedStepIndex(0); }}>
                              {doc.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                              {doc.summary}
                            </p>
                          </div>

                          <div className="bg-slate-550/30 p-4 bg-slate-50/50 flex flex-wrap gap-1 border-t border-slate-100">
                            {doc.tags.map((tg, idx) => (
                              <span key={idx} className="bg-white border border-slate-300 px-2 py-0.5 rounded text-[9px] text-slate-600 font-medium">
                                #{tg}
                              </span>
                            ))}
                          </div>

                          <div className="p-4 bg-slate-50 border-t-2 border-slate-900 flex items-center justify-between gap-3 bg-slate-100/40">
                            <button
                              id={`edit-btn-${doc.id}`}
                              onClick={() => { setSelectedDocId(doc.id); setViewMode("editor"); setSelectedStepIndex(0); }}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 transition text-white text-[10px] font-black uppercase tracking-wider rounded-lg border border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                            >
                              ✍️ Edit Steps
                            </button>
                            <div className="flex gap-2">
                              <button
                                onClick={() => { setSelectedDocId(doc.id); setViewMode("preview"); }}
                                className="p-1.5 hover:bg-slate-200 text-slate-600 rounded transition border border-slate-305"
                                title="Preview Read SOP"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteDoc(doc.id)}
                                className="p-1.5 hover:bg-rose-100 text-rose-600 rounded transition border border-transparent"
                                title="Delete SOP"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

              </div>
            )}

            {/* VIEW MODE: 2. INTERACTIVE EDITOR PAGE */}
            {viewMode === "editor" && selectedDoc && (
              <div className="space-y-6">
                
                {/* Back button Bar */}
                <div className="flex flex-col gap-4 bg-white border-4 border-slate-900 rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setViewMode("library")}
                        className="p-2 border-2 border-slate-900 hover:bg-slate-100 rounded-xl transition shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase">SOP Editor Terminal</span>
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {selectedDoc.id}</span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 truncate uppercase tracking-tight max-w-md md:max-w-xl">
                          {selectedDoc.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewMode("preview")}
                        className="px-4 py-2 border-2 border-slate-900 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl text-xs font-extrabold uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5"
                      >
                        <Eye className="w-4 h-4" /> View Presentation
                      </button>
                      <button
                        onClick={() => triggerMockDownload("pdf")}
                        className="px-3.5 py-2 border-2 border-slate-200 hover:border-slate-900 bg-white text-slate-700 rounded-xl text-xs font-bold"
                      >
                        PDF
                      </button>
                      <button
                        onClick={() => triggerMockDownload("docx")}
                        className="px-3.5 py-2 border-2 border-slate-200 hover:border-slate-900 bg-white text-slate-700 rounded-xl text-xs font-bold"
                      >
                        Word
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar Row */}
                  <div className="border-t-2 border-dashed border-slate-200 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-grow max-w-2xl">
                      <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                        <span className="text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-indigo-600" />
                          Overall SOP Step Completion Progress
                        </span>
                        <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded-md font-mono text-[10px]">
                          {progress.percent}% ({progress.completedCount}/{progress.totalCount} steps)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] overflow-hidden relative">
                        <div
                          className="bg-emerald-500 h-full border-r border-slate-950 transition-all duration-300"
                          style={{ width: `${progress.percent}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Content Ready: <strong className="text-slate-800">{progress.completedCount}</strong></span>
                      <span className="text-slate-300">|</span>
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span>Incomplete: <strong className="text-slate-800">{progress.totalCount - progress.completedCount}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Triple Panel Editor Layout */}
                <div id="triple-editor-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Panel A: Steps index timeline sidebar */}
                  <div className="lg:col-span-3 bg-white border-4 border-slate-900 rounded-3xl p-5 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between min-h-[500px]">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                          Procedure Steps ({selectedDoc.steps.length})
                        </span>
                        <button
                          onClick={handleAddManualStep}
                          className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[11px] font-black uppercase"
                          title="Append Manual SOP Step"
                        >
                          <PlusCircle className="w-4 h-4" /> Add
                        </button>
                      </div>

                      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                        {selectedDoc.steps.length === 0 ? (
                          <div className="text-center py-10 text-slate-400 text-xs">
                            No steps inside this SOP. Add manual custom step above to initialize content.
                          </div>
                        ) : (
                          selectedDoc.steps.map((st, idx) => {
                            const isSelected = selectedStepIndex === idx;
                            return (
                              <div
                                key={st.id}
                                onClick={() => setSelectedStepIndex(idx)}
                                className={`p-3 rounded-xl border-2 text-left cursor-pointer transition-all duration-150 flex items-start gap-2 ${
                                  isSelected
                                    ? "bg-indigo-50 border-indigo-400 shadow-sm"
                                    : "bg-slate-50 border-transparent hover:border-slate-200"
                                }`}
                              >
                                <span className={`flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full font-bold text-[10px] ${
                                  isSelected ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
                                }`}>
                                  {idx + 1}
                                </span>
                                <div className="min-w-0 flex-grow">
                                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                                    <div className="font-extrabold text-xs text-slate-800 truncate">
                                      {st.title || "Untitled Step"}
                                    </div>
                                    {st.completed === true || !(
                                      !st.title || 
                                      st.title.trim() === "" || 
                                      st.title === "New Manual Action Step" ||
                                      !st.description || 
                                      st.description.trim() === "" || 
                                      st.description.startsWith("Define instructions")
                                    ) ? (
                                      <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" title="Complete" />
                                    ) : (
                                      <span className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0" title="Incomplete Content" />
                                    )}
                                  </div>
                                  <div className="text-[9px] text-slate-400 font-mono truncate">
                                    {st.actionType.toUpperCase()} • {st.pageTitle}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="mt-6 border-t border-slate-100 pt-4 space-y-2">
                      <button
                        onClick={runSopGapCheckMultiplier}
                        className="w-full bg-slate-900 text-white font-extrabold text-xs uppercase py-2.5 px-3 rounded-xl border border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:bg-slate-800 flex items-center justify-center gap-1.5 transition"
                      >
                        <Shield className="w-3.5 h-3.5 text-amber-400" /> Diagnose SOP Gaps
                      </button>
                      <button
                        onClick={handleGenerateStepQuiz}
                        className="w-full bg-white border-2 border-slate-900 text-slate-900 font-extrabold text-xs uppercase py-2.5 px-3 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:bg-slate-50 flex items-center justify-center gap-1.5 transition"
                      >
                        <BookCheck className="w-3.5 h-3.5 text-indigo-600" /> Generate Quiz
                      </button>
                    </div>
                  </div>

                  {/* Panel B: Step detail editor */}
                  <div className="lg:col-span-6 bg-white border-4 border-slate-900 rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] space-y-6">
                    {selectedDoc.steps[selectedStepIndex] ? (
                      (() => {
                        const step = selectedDoc.steps[selectedStepIndex];
                        return (
                          <div className="space-y-6">
                            
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <span className="font-bold text-xs uppercase bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded border border-indigo-200">
                                Step {selectedStepIndex + 1} of {selectedDoc.steps.length}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  disabled={selectedStepIndex === 0}
                                  onClick={() => moveStepOrder(selectedStepIndex, "up")}
                                  className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold rounded border"
                                >
                                  ▲ Move Up
                                </button>
                                <button
                                  disabled={selectedStepIndex === selectedDoc.steps.length - 1}
                                  onClick={() => moveStepOrder(selectedStepIndex, "down")}
                                  className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-xs font-bold rounded border"
                                >
                                  ▼ Move Down
                                </button>
                                <button
                                  onClick={() => handleDeleteStep(step.id)}
                                  className="p-1 px-2 hover:bg-rose-50 text-rose-600 rounded border border-rose-200 text-xs"
                                  title="Remove Step"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            {/* Step Status Toggle */}
                            <div className="flex items-center justify-between bg-zinc-50 border border-slate-200 rounded-2xl p-3.5">
                              <div className="flex items-center gap-2.5">
                                <span className={`w-3 h-3 rounded-full ${step.completed ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
                                <div>
                                  <span className="text-xs font-black uppercase text-slate-700 block">Step Completion Status</span>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {step.completed ? 'Marked as completed' : 'Autodetects based on content presence'}
                                  </span>
                                </div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={!!step.completed}
                                  onChange={(e) => handleUpdateStep(step.id, "completed", e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                              </label>
                            </div>

                            {/* Step Title Input */}
                            <div className="space-y-1">
                              <label className="text-[11px] font-black uppercase text-slate-400">Step Title</label>
                              <input
                                type="text"
                                value={step.title}
                                onChange={(e) => handleUpdateStep(step.id, "title", e.target.value)}
                                className="w-full text-sm font-extrabold bg-slate-50 border-2 border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-slate-900"
                              />
                            </div>

                            {/* Step Description Rich-text Area */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-black uppercase text-slate-400">Step Plain-English Narrative</label>
                                <span className="text-[9px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                                  ● AI synthesized
                                </span>
                              </div>
                              <textarea
                                rows={4}
                                value={step.description}
                                onChange={(e) => handleUpdateStep(step.id, "description", e.target.value)}
                                className="w-full text-xs font-medium bg-slate-50 border-2 border-slate-200 rounded-lg p-2.5 leading-relaxed focus:outline-none focus:border-slate-900"
                              />
                            </div>

                            {/* Step Notes for operators */}
                            <div className="space-y-1">
                              <label className="text-[11px] font-black uppercase text-slate-400">Compliance Warning / Tip</label>
                              <input
                                type="text"
                                value={step.notes || ""}
                                onChange={(e) => handleUpdateStep(step.id, "notes", e.target.value)}
                                placeholder="E.g., Approval typically takes 48 hours. Ensure you don't use safari browser."
                                className="w-full text-xs bg-slate-50 border-2 border-slate-200 rounded-lg p-2 focus:outline-none focus:border-slate-900"
                              />
                            </div>

                            {/* Refractor Description with customized constraints */}
                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3.5">
                              <div>
                                <h5 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 uppercase">
                                  <Sparkles className="w-4 h-4 text-indigo-600" />
                                  Re-narrate Step Description
                                </h5>
                                <p className="text-[10px] text-slate-500 mt-0.5">Customize technical instructions with custom adjectives (e.g. "make it highly professional", "write for non-technical employees") using Gemini.</p>
                              </div>
                              
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={customNarrationGuide}
                                  onChange={(e) => setCustomNarrationGuide(e.target.value)}
                                  placeholder="E.g. Explain that users must write reason in comments field"
                                  className="flex-grow text-xs bg-white border border-slate-300 rounded-lg px-3 focus:outline-none"
                                />
                                <button
                                  onClick={triggerStepReNarration}
                                  disabled={isRenarrating}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center gap-2"
                                >
                                  {isRenarrating ? "Regenerating..." : "Apply AI"}
                                </button>
                              </div>
                            </div>

                            {/* Captured Metadata list */}
                            <div className="border-t border-slate-100 pt-4">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Captured Interaction Metadata Log</span>
                              <div className="bg-slate-100 p-3 rounded-lg border text-[10px] font-mono text-slate-600 mt-2 space-y-1 break-all">
                                <div><strong className="text-slate-800">Event Action:</strong> {step.actionType.toUpperCase()}</div>
                                {step.elementDetails && (
                                  <>
                                    <div><strong className="text-slate-800">HTML Tag:</strong> &lt;{step.elementDetails.tag.toLowerCase()}&gt;</div>
                                    <div><strong className="text-slate-800">Element Text:</strong> "{step.elementDetails.text}"</div>
                                    <div><strong className="text-slate-800">Aria Label:</strong> "{step.elementDetails.ariaLabel}"</div>
                                  </>
                                )}
                                <div><strong className="text-slate-800">Source URL:</strong> {step.url}</div>
                              </div>
                            </div>

                          </div>
                        );
                      })()
                    ) : (
                      <div className="py-20 text-center font-mono text-xs text-slate-400">
                        Pick a step element on the left panel to update.
                      </div>
                    )}
                  </div>

                  {/* Panel C: Screenshot preview editor */}
                  <div className="lg:col-span-3 space-y-6">
                    
                    {/* Visual simulator representation card */}
                    <div className="bg-white border-4 border-slate-900 rounded-3xl p-5 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
                        SOP Visual Graphic
                      </h4>
                      
                      {selectedDoc.steps[selectedStepIndex] ? (
                        (() => {
                          const step = selectedDoc.steps[selectedStepIndex];
                          return (
                            <div className="space-y-4">
                              
                              {/* Overlay mockup representation of the target field screenshot */}
                              <div className="border border-slate-300 rounded-xl relative overflow-hidden bg-slate-900 aspect-video flex flex-col justify-center items-center p-4">
                                <span className="absolute top-2 left-2 bg-indigo-600 text-white font-mono font-bold px-2 py-0.5 rounded text-[9px]">
                                  Step {selectedStepIndex + 1}
                                </span>

                                <span className="absolute top-2 right-2 bg-slate-800 text-slate-300 font-mono text-[9px] px-1.5 py-0.5 rounded max-w-[140px] truncate">
                                  {step.screenshotState}.svg
                                </span>

                                <div className="text-center p-3 text-white">
                                  <span className="text-emerald-400 text-xs font-mono font-bold block mb-1">
                                    [Screenshot Context]
                                  </span>
                                  <span className="text-[10px] text-slate-300 block line-clamp-1">
                                    {step.pageTitle}
                                  </span>
                                  <span className="text-[9px] text-slate-400 group block truncate opacity-70">
                                    {step.url}
                                  </span>
                                </div>

                                {/* Custom Bounding Highlight overlay box */}
                                {step.annotation && (
                                  <div
                                    className="absolute border-2 border-rose-500 bg-rose-500/20 rounded shadow-[0_0_8px_rgba(239,68,68,0.5)] flex items-center justify-center z-20"
                                    style={{
                                      left: `${step.annotation.x}%`,
                                      top: `${step.annotation.y}%`,
                                      width: `${step.annotation.width || 80}px`,
                                      height: `${step.annotation.height || 40}px`,
                                      transform: "translate(-50%, -50%)"
                                    }}
                                  >
                                    <span className="absolute -top-3.5 -left-3.5 w-6 h-6 rounded-full bg-rose-600 border border-white text-white font-black text-[10px] flex items-center justify-center shadow">
                                      {selectedStepIndex + 1}
                                    </span>
                                  </div>
                                )}

                                {/* Horizontal crosshair line */}
                                {showCrosshairs && step.annotation && (
                                  <div
                                    className="absolute left-0 right-0 border-t border-dashed border-rose-450 border-rose-500/50 pointer-events-none z-10"
                                    style={{ top: `${step.annotation.y}%` }}
                                  />
                                )}

                                {/* Vertical crosshair line */}
                                {showCrosshairs && step.annotation && (
                                  <div
                                    className="absolute top-0 bottom-0 border-l border-dashed border-rose-450 border-rose-500/50 pointer-events-none z-10"
                                    style={{ left: `${step.annotation.x}%` }}
                                  />
                                )}
                              </div>

                              {/* Reposition widget coords simulation coordinates */}
                              <div className="bg-slate-50 p-3 rounded-lg border">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Adjust visual bounding target (X, Y %)</span>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <label className="text-[10px] text-slate-500 block">X Coordinate (%)</label>
                                    <input
                                      type="number"
                                      min={5}
                                      max={95}
                                      value={step.annotation?.x || 50}
                                      onChange={(e) => handleUpdateStep(step.id, "annotation", { ...step.annotation, x: Number(e.target.value) })}
                                      className="w-full text-xs font-mono bg-white border rounded p-1.5"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-500 block">Y Coordinate (%)</label>
                                    <input
                                      type="number"
                                      min={5}
                                      max={95}
                                      value={step.annotation?.y || 50}
                                      onChange={(e) => handleUpdateStep(step.id, "annotation", { ...step.annotation, y: Number(e.target.value) })}
                                      className="w-full text-xs font-mono bg-white border rounded p-1.5"
                                    />
                                  </div>
                                </div>

                                {/* Precision Crosshairs toggle switch */}
                                <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 mt-2.5">
                                  <span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1.5">
                                    <Target className="w-3.5 h-3.5 text-rose-500" />
                                    Visual Crosshairs
                                  </span>
                                  <label className="relative inline-flex items-center cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      id="crosshair-toggle"
                                      className="sr-only peer"
                                      checked={showCrosshairs}
                                      onChange={(e) => setShowCrosshairs(e.target.checked)}
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-550 peer-checked:bg-rose-500"></div>
                                  </label>
                                </div>
                              </div>

                            </div>
                          );
                        })()
                      ) : null}
                    </div>

                    {/* SOP overall parameters card */}
                    <div className="bg-white border-4 border-slate-900 rounded-3xl p-5 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                        Procedure Parameters
                      </h4>

                      {/* Estimated time text */}
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500">Estimated Duration</label>
                        <input
                          type="text"
                          value={selectedDoc.estimatedTime}
                          onChange={(e) => handleUpdateDocField("estimatedTime", e.target.value)}
                          className="w-full text-xs bg-slate-50 border rounded-lg p-2.5 mt-1 focus:outline-none"
                        />
                      </div>

                      {/* Status */}
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500">Document Status State</label>
                        <select
                          value={selectedDoc.status}
                          onChange={(e) => handleUpdateDocField("status", e.target.value)}
                          className="w-full text-xs bg-slate-50 border rounded-lg p-2.5 mt-1 focus:outline-none font-semibold text-slate-700"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Published">Published</option>
                          <option value="Needs review">Needs review</option>
                        </select>
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 mt-2 block">Enterprise tags</label>
                        <input
                          type="text"
                          value={selectedDoc.tags.join(", ")}
                          onChange={(e) => handleUpdateDocField("tags", e.target.value.split(",").map(t => t.trim()))}
                          className="w-full text-xs bg-slate-50 border rounded-lg p-2.5 mt-1 focus:outline-none font-mono"
                        />
                        <span className="text-[9px] text-slate-400 mt-1 block">Comma separated tags.</span>
                      </div>

                      {/* Stale clock metrics */}
                      <div className="bg-slate-50 border rounded-lg p-3 text-[11px] leading-relaxed">
                        <span className="font-bold text-slate-700 block mb-1">📋 Legal Staleness Checks</span>
                        <div className="text-slate-500">
                          Last formally reviewed at: <br />
                          <strong className="text-slate-700">{new Date(selectedDoc.lastReviewedAt).toLocaleDateString()}</strong>
                        </div>
                        <button
                          onClick={handleMarkAsReviewed}
                          className="w-full mt-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 rounded text-[10px] uppercase"
                        >
                          Mark Reviewed & Reset Clock
                        </button>
                      </div>

                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* VIEW MODE: 3. SOP PRESENTATION PREVIEW */}
            {viewMode === "preview" && selectedDoc && (
              <div className="space-y-6 max-w-4xl mx-auto">
                
                {/* Visual action return bar */}
                <div className="flex bg-white border-4 border-slate-900 rounded-3xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] items-center justify-between">
                  <button
                    onClick={() => setViewMode("editor")}
                    className="px-4 py-2 border-2 border-slate-900 hover:bg-slate-50 text-xs font-black uppercase text-slate-700 rounded-xl"
                  >
                    ← Back to Step Editor
                  </button>
                  <div className="text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employer Ready Preview</span>
                    <h4 className="text-sm font-bold text-slate-800 uppercase">{selectedDoc.title}</h4>
                  </div>
                  <button
                    onClick={() => triggerMockDownload("pdf")}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 border-2 border-slate-900 text-white rounded-xl text-xs font-extrabold uppercase shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                  >
                    Print SOP (PDF)
                  </button>
                </div>

                {/* SOP Booklet Document */}
                <div id="sop-rendered-booklet" className="bg-white border-4 border-slate-900 rounded-3xl p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] space-y-10">
                  
                  {/* Title block Cover */}
                  <div className="border-b-4 border-slate-900 pb-8 text-center md:text-left space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono font-bold uppercase text-slate-400">
                      <span>Standard Operating Procedure (SOP)</span>
                      <span>Estimated: {selectedDoc.estimatedTime}</span>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-slate-950">
                      {selectedDoc.title}
                    </h2>

                    <div className="bg-slate-50 border rounded-xl p-4 text-xs font-medium text-slate-600 leading-relaxed max-w-3xl">
                      <strong className="text-slate-800 uppercase text-[10px] block mb-1">📋 Summary Intent</strong>
                      {selectedDoc.summary}
                    </div>

                    {/* Prerequisites */}
                    {selectedDoc.prerequisites && selectedDoc.prerequisites.length > 0 && (
                      <div className="pt-3">
                        <strong className="text-[11px] font-black uppercase tracking-wider text-slate-900 block mb-2">Prerequisites Checklist:</strong>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700 font-medium">
                          {selectedDoc.prerequisites.map((prereq, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-[9px]">
                                ✓
                              </span>
                              {prereq}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Flow Steps List rendered elegantly */}
                  <div className="space-y-12">
                    {selectedDoc.steps.map((step, index) => (
                      <div key={step.id} className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start border-b border-slate-200 pb-10 last:border-0 last:pb-0">
                        
                        {/* Step Description details (Left Column) */}
                        <div className="md:col-span-6 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-sm flex items-center justify-center">
                              {index + 1}
                            </span>
                            <h3 className="text-base font-extrabold text-slate-950 uppercase tracking-tight">
                              {step.title}
                            </h3>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 font-medium text-xs text-slate-700 leading-relaxed shadow-inner">
                            {step.description}
                          </div>

                          {step.notes && (
                            <div className="bg-amber-50 rounded-lg p-3 text-[11px] text-amber-900 border border-amber-100 flex gap-1.5 items-start">
                              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                              <span>{step.notes}</span>
                            </div>
                          )}

                          <div className="pt-2">
                            <span className="text-[9px] uppercase font-bold text-slate-400">Interaction Target</span>
                            <div className="border bg-slate-50 rounded p-2 text-[10px] font-mono text-slate-500 mt-1">
                              <strong>URL Action:</strong> {step.url} <br />
                              <strong>Target Node:</strong> &lt;{step.elementDetails?.tag.toLowerCase()}&gt; labeled "{step.elementDetails?.text}"
                            </div>
                          </div>
                        </div>

                        {/* Step Screenshot Visual (Right Column) */}
                        <div className="md:col-span-6">
                          <div className="border-2 border-slate-900 rounded-2xl relative overflow-hidden bg-slate-900 aspect-video shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center">
                            
                            {/* Simulator title tag */}
                            <span className="absolute top-2 left-2 bg-indigo-600 border border-slate-900 text-white font-mono font-bold px-2 py-0.5 rounded text-[8px] tracking-wide uppercase">
                              STEP {index + 1} UI OVERLAY
                            </span>

                            <div className="text-center p-3 text-white">
                              <span className="text-amber-400 text-xs font-mono block mb-0.5">
                                [Annotated Snapshot Screenshot]
                              </span>
                              <span className="text-[10px] text-slate-300 block">
                                {step.pageTitle}
                              </span>
                            </div>

                            {/* Relative Highlight Annotation */}
                            {step.annotation && (
                              <div
                                className="absolute border-2 border-rose-500 bg-rose-500/25 rounded"
                                style={{
                                  left: `${step.annotation.x}%`,
                                  top: `${step.annotation.y}%`,
                                  width: `${step.annotation.width || 80}px`,
                                  height: `${step.annotation.height || 40}px`,
                                  transform: "translate(-50%, -50%)"
                                }}
                              >
                                <span className="absolute -top-3.5 -left-3.5 w-6 h-6 rounded-full bg-rose-600 border border-white text-white font-black text-[9px] flex items-center justify-center shadow">
                                  {index + 1}
                                </span>
                              </div>
                            )}

                          </div>
                        </div>

                      </div>
                    ))}
                  </div>

                  {/* SOP Checklist compliance stamp */}
                  <div className="border-t-4 border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono font-bold text-slate-400">
                    <div>
                      <span>GUIDE GENERATED ON: 2026-06-03</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      <span className="text-slate-800 uppercase">Ronflow Compliance certified</span>
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB INTEGRATIONS */}
        {activeTab === "integrations" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white border-4 border-slate-900 rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                🧩 Corporate Workspace Connectors
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Synchronize and push generated SOP procedures catalogs to company intranets instantly.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                
                {/* Confluence */}
                <div className="border-2 border-slate-900 rounded-2xl p-5 bg-slate-50 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">Documentation</span>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-1 uppercase">Atlassian Confluence</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Publish compiled Ronflow steps directly to specific Confluence spaces as standard, styled intranet pages.
                    </p>
                  </div>
                  <button className="mt-5 w-full bg-slate-900 text-white font-bold text-xs py-2 rounded-lg border border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    Activate Sync
                  </button>
                </div>

                {/* Notion */}
                <div className="border-2 border-slate-900 rounded-2xl p-5 bg-slate-50 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">Workspace</span>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-1 uppercase">Notion Database</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Sync guides repository with your team's live Notion wiki. Auto updates upon resetting the Review date.
                    </p>
                  </div>
                  <button className="mt-5 w-full bg-slate-900 text-white font-bold text-xs py-2 rounded-lg border border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    Activate Sync
                  </button>
                </div>

                {/* Slack */}
                <div className="border-2 border-slate-900 rounded-2xl p-5 bg-slate-50 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 font-mono">Notifications</span>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-1 uppercase">Slack Broadcast Channels</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Alert team channels when a document staleness check fails or during new SOP edits submissions.
                    </p>
                  </div>
                  <button className="mt-5 w-full bg-slate-900 text-white font-bold text-xs py-2 rounded-lg border border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    Activate Sync
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB ANALYTICS/LOGS */}
        {activeTab === "analytics" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white border-4 border-slate-900 rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                📑 System Operations Live Telemetry
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Audit and log details recording every workflow action session initiated, processed, or re-narrated.
              </p>

              <div className="mt-6 border-2 border-slate-900 rounded-2xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-xs">
                
                {/* Table Header */}
                <div className="bg-slate-900 text-white p-3.5 grid grid-cols-12 font-bold uppercase tracking-wider text-[10px]">
                  <span className="col-span-3">Timestamp / Epoch</span>
                  <span className="col-span-3">Event Trigger Initiator</span>
                  <span className="col-span-4">Operation Scope / Target URL</span>
                  <span className="col-span-2 text-right">Security Code</span>
                </div>

                {/* Simulated Audit Feed Rows */}
                <div className="divide-y-2 divide-slate-900 bg-white">
                  <div className="p-3.5 grid grid-cols-12 font-mono text-[11px] items-center text-slate-700">
                    <span className="col-span-3 font-semibold text-slate-900">2026-06-03 16:21:40</span>
                    <div className="col-span-3 flex items-center gap-1.5 font-sans font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      SYSTEM_HANDSHAKE
                    </div>
                    <span className="col-span-4 truncate">Vite server listening on external virtual Port 3000</span>
                    <span className="col-span-2 text-right font-bold text-indigo-600 bg-indigo-50 border px-2 py-0.5 rounded self-end">SEC-9021</span>
                  </div>

                  <div className="p-3.5 grid grid-cols-12 font-mono text-[11px] items-center text-slate-700">
                    <span className="col-span-3 font-semibold text-slate-900">2026-06-03 16:21:44</span>
                    <div className="col-span-3 flex items-center gap-1.5 font-sans font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      AI_NARRATION_REQUEST
                    </div>
                    <span className="col-span-4 truncate">POST /api/ai/narrate-step - Model gemini-3.5-flash requested</span>
                    <span className="col-span-2 text-right font-bold text-indigo-600 bg-indigo-50 border px-2 py-0.5 rounded self-end">SEC-1429</span>
                  </div>

                  <div className="p-3.5 grid grid-cols-12 font-mono text-[11px] items-center text-slate-700">
                    <span className="col-span-3 font-semibold text-slate-900">2026-06-03 16:21:52</span>
                    <div className="col-span-3 flex items-center gap-1.5 font-sans font-bold text-rose-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      SOP_DELETE_LOG
                    </div>
                    <span className="col-span-4 truncate">User 'philipsmagok@gmail.com' removed old test manual database guide</span>
                    <span className="col-span-2 text-right font-bold text-rose-600 bg-rose-50 border px-2 py-0.5 rounded self-end">SOP-6294</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white border-4 border-slate-900 rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                ⚙️ Workspace Configuration Parameters
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Customize authentication rules, credential keys, and compliance review routines.
              </p>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Section API Credentials */}
                <div className="space-y-4 border-2 border-slate-900 p-6 rounded-2xl bg-slate-50 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <h4 className="text-sm font-extrabold uppercase text-slate-800">
                    🔐 Server API credentials
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block">Workspace Gemini Secret Token</label>
                    <input
                      type="password"
                      value="•••••••••••••••••••••••••••••"
                      disabled
                      className="w-full text-xs font-mono bg-white border border-slate-300 rounded p-2.5 opacity-70"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block">To modify your secrets, use the main Settings credentials pane on the AI Studio interface.</span>
                  </div>
                </div>

                {/* Section Review cycles */}
                <div className="space-y-4 border-2 border-slate-900 p-6 rounded-2xl bg-slate-50 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <h4 className="text-sm font-extrabold uppercase text-slate-800">
                    🛡️ Global Compliance Policies
                  </h4>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block">Document Review Interval (Days)</label>
                    <input
                      type="number"
                      value={90}
                      disabled
                      className="w-full text-xs bg-white border border-slate-300 rounded p-2.5"
                    />
                    <span className="text-[9px] text-slate-400 mt-1 block">Procedure manuals are automatically flagged "Needs review" when the interval elapsed since last Reviewed state exceeds 90 days.</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </main>

      {/* -------------------------------------------------------------
          MODALS / ADVANCED DIALOG VIEWS
          ------------------------------------------------------------- */}

      {/* MODAL 1: SOP GAP DIAGNOSIS DETAILS */}
      {showGapsModal && (
        <div id="sop-gap-modal" className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-4 border-slate-950 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] space-y-6 animate-scaleIn">
            
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black uppercase text-slate-900">AI Procedures Compliance Gap check</h3>
              </div>
              <button
                onClick={() => setShowGapsModal(false)}
                className="w-7 h-7 flex items-center justify-center border-2 border-slate-950 rounded bg-slate-100 hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            {isAnalysingGaps ? (
              <div className="py-12 text-center text-xs font-mono text-slate-500 space-y-2">
                <RefreshCw className="w-7 h-7 mx-auto animate-spin text-indigo-600" />
                <span>Gemini compliance auditor analyzing step sequences...</span>
              </div>
            ) : aiSuggestions === null ? (
              <p className="text-xs text-slate-500 text-center">Auditor has not been initiated.</p>
            ) : aiSuggestions.length === 0 ? (
              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-300 text-xs text-center">
                🎉 No gaps or compliance failures were detected in your sequence arrangement! All essential authorization steps and confirmation pages are correctly compiled.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs text-slate-600 leading-relaxed">
                  We've analyzed your workflow steps model. To prevent employee onboarding hurdles, we recommend injecting any of the missing steps detailed down below:
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {aiSuggestions.map((s, idx) => (
                    <div key={idx} className="border-2 border-slate-900 rounded-xl p-3 bg-slate-50 space-y-2.5">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[9px] font-black uppercase bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                          Confidence: {s.confidence.toUpperCase()}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">
                          Insert positioning index: {s.insertAfterStepIndex === -1 ? "Start" : `After Step ${s.insertAfterStepIndex + 1}`}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 uppercase">{s.suggestedTitle}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{s.suggestedDescription}</p>
                      </div>

                      <button
                        onClick={() => handleInjectSuggestedStep(s)}
                        className="w-full bg-white hover:bg-slate-50 border border-slate-900 text-[10px] font-black uppercase text-indigo-600 py-1.5 rounded-lg active:scale-95 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]"
                      >
                        + Inject into SOP sequence
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowGapsModal(false)}
                className="px-4 py-2 border-2 border-slate-900 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-lg"
              >
                Close Compliance Report
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: COMPREHENSION SOP QUIZ POPUP */}
      {showQuizModal && (
        <div id="sop-quiz-modal" className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-4 border-slate-950 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] space-y-6 animate-scaleIn">
            
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <BookCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black uppercase text-slate-900">SOP operator comprehension test</h3>
              </div>
              <button
                onClick={() => setShowQuizModal(false)}
                className="w-7 h-7 flex items-center justify-center border-2 border-slate-950 rounded bg-slate-100 hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            {isGeneratingQuiz ? (
              <div className="py-12 text-center text-xs font-mono text-slate-500 space-y-2">
                <RefreshCw className="w-7 h-7 mx-auto animate-spin text-indigo-600" />
                <span>Gemini generator compiling instant quizzes array from SOP steps context...</span>
              </div>
            ) : quizData === null ? (
              <p className="text-xs text-slate-500 text-center">Quiz has not been compiled.</p>
            ) : (
              <div className="space-y-4">
                <div className="text-xs text-slate-500 uppercase font-bold text-center tracking-widest">
                  Test your comprehension of the active procedures
                </div>

                <div className="space-y-5 max-h-[340px] overflow-y-auto pr-1">
                  {quizData.map((q, qIdx) => (
                    <div key={qIdx} className="border-2 border-slate-900 p-4 rounded-xl space-y-3 bg-slate-50">
                      <div className="font-extrabold text-xs text-slate-900">
                        Q{qIdx + 1}: {q.question}
                      </div>

                      <div className="space-y-2">
                        {q.options.map((opt: string, oIdx: number) => {
                          const isPicked = selectedAnswers[qIdx] === oIdx;
                          const isCorrect = q.correctIdx === oIdx;
                          
                          let btnClass = "bg-white border border-slate-300 hover:border-slate-800 text-slate-700";
                          if (isPicked) {
                            btnClass = isCorrect
                              ? "bg-emerald-50 text-emerald-800 border-emerald-400 font-semibold"
                              : "bg-rose-50 text-rose-800 border-rose-400 font-semibold";
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => answerQuizOption(qIdx, oIdx)}
                              className={`w-full text-left p-2.5 rounded-lg text-xs leading-relaxed transition ${btnClass}`}
                            >
                              <div className="flex justify-between items-center gap-2">
                                <span>{opt}</span>
                                {isPicked && (
                                  <span className="text-[10px] font-black uppercase">
                                    {isCorrect ? "✓ Correct" : "× Incorrect"}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {selectedAnswers[qIdx] !== undefined && quizExplanation[qIdx] && (
                        <div className="bg-indigo-50/50 p-2.5 rounded border border-indigo-200 text-[11px] text-slate-600 leading-relaxed">
                          <strong className="text-indigo-800">Explanation:</strong> {quizExplanation[qIdx]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowQuizModal(false)}
                className="px-4 py-2 border-2 border-slate-900 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-lg"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Sticky footer status bar */}
      <footer className="border-t-4 border-slate-900 bg-white p-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-auto">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4 text-center md:text-left">
            <span>Session Code: philipsmagok_4921</span>
            <span>Cloud Service: US-East-1</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded bg-emerald-500 inline-block animate-pulse"></span>
            <span className="text-slate-800">Ronflow Engine v2.4.0 is operational</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
