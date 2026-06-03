import React, { useState, useEffect } from "react";
import { Play, Pause, Square, ArrowRight, Monitor, Globe, ChevronRight, CheckCircle2, RotateCcw, AlertCircle } from "lucide-react";
import { SimulatedScenario, Step } from "../types";
import { SIMULATED_SCENARIOS } from "../scenarios";

interface RecordingSimulatorProps {
  onWorkflowProcessed: (newDoc: any) => void;
  onCancel: () => void;
}

export default function RecordingSimulator({ onWorkflowProcessed, onCancel }: RecordingSimulatorProps) {
  const [selectedScenario, setSelectedScenario] = useState<SimulatedScenario>(SIMULATED_SCENARIOS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStateKey, setCurrentStateKey] = useState("dashboard_timeoff");
  
  // Recorded events state
  const [sessionEvents, setSessionEvents] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [processingError, setProcessingError] = useState("");

  // Input states inside form inputs
  const [userInputs, setUserInputs] = useState<{ [key: string]: string }>({});

  // Guide message based on state key
  const [guideText, setGuideText] = useState("");

  // Update guide advice based on state changes
  useEffect(() => {
    switch (currentStateKey) {
      case "dashboard_timeoff":
        setGuideText("Step 1: Locate and click the 'Time Off Balance & Request Page' quick action node.");
        break;
      case "tracker_request":
        setGuideText("Step 2: Hit the 'Request Time Off' primary button on the workspace to begin your leave request.");
        break;
      case "newoff_calendar":
        setGuideText("Step 3: Click the Leave Calendar grid, then click the 'Submit Leave Form for Approval' button.");
        break;
      case "newoff_submitted":
        setGuideText("🎉 You've reached the success screen! Click 'Assemble AI Procedure Guide' below.");
        break;
      case "github_home":
        setGuideText("Step 1: Click the '+ New Repository' button at the top-right header.");
        break;
      case "github_new_name":
        setGuideText("Step 2: Enter 'ronflow-core' by clicking the Name input field.");
        break;
      case "github_new_private":
        setGuideText("Step 3: Tick 'Private' settings, then click 'Create Repository' button.");
        break;
      case "github_created":
        setGuideText("🎉 Repository generated! Click 'Assemble AI Procedure Guide' below.");
        break;
      case "aws_home":
        setGuideText("Step 1: Hit 'Launch Instance (New Server)' on the EC2 services card.");
        break;
      case "aws_choose_ami":
        setGuideText("Step 2: Select 'Ubuntu Server LTS (64-bit AMD)' as your boot image.");
        break;
      case "aws_configure_security":
        setGuideText("Step 3: Enable 'HTTP traffic from internet' checkbox, then hit 'Launch Server Instance'.");
        break;
      case "aws_launched":
        setGuideText("🎉 EC2 instance is building! Click 'Assemble AI Procedure Guide' below.");
        break;
      default:
        setGuideText("Click the highlighted widgets to execute actions.");
    }
  }, [currentStateKey]);

  // Set default state when scenario changes
  const handleScenarioChange = (scenario: SimulatedScenario) => {
    setSelectedScenario(scenario);
    setSessionEvents([]);
    setIsRecording(false);
    setIsPaused(false);
    setUserInputs({});
    
    // Set starting state
    const startingKey = Object.keys(scenario.states)[0];
    setCurrentStateKey(startingKey);
  };

  const startRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    setSessionEvents([]);
    
    const startingState = Object.keys(selectedScenario.states)[0];
    setCurrentStateKey(startingState);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleFieldInteraction = (field: any) => {
    if (!isRecording || isPaused) return;

    // Record this action event
    const currentStateDetails = selectedScenario.states[currentStateKey];
    
    const newEvent = {
      title: field.type === "input" ? `Fill "${field.label}" input` : field.type === "calendar_cell" ? "Select Leave Dates" : `Click "${field.label}"`,
      actionType: field.type === "input" ? "type" : field.type === "checkbox" ? "check" : field.type === "radio" ? "radio" : "click",
      elementDetails: {
        tag: field.type === "input" ? "INPUT" : field.type === "select" ? "SELECT" : "BUTTON",
        text: field.text,
        ariaLabel: field.ariaLabel,
        placeholder: field.placeholder || ""
      },
      pageTitle: currentStateDetails.pageTitle,
      url: currentStateDetails.url,
      annotation: {
        x: field.x,
        y: field.y,
        width: field.w,
        height: field.h
      },
      screenshotState: currentStateKey // ties current view context
    };

    setSessionEvents((prev) => [...prev, newEvent]);

    // Handle form inputs simulations
    if (field.type === "input") {
      setUserInputs(prev => ({ ...prev, [field.id]: field.label }));
    }

    // Move to next layout screen state
    if (field.nextState) {
      setCurrentStateKey(field.nextState);
    }
  };

  const stopAndProcessEvents = async () => {
    if (sessionEvents.length === 0) return;
    
    setIsProcessing(true);
    setProcessingError("");
    setProcessingStatus("Assembling captured workflow events...");

    try {
      // Step 1 status
      setTimeout(() => setProcessingStatus("Synthesizing plain English narration with Gemini AI..."), 1200);
      // Step 2 status
      setTimeout(() => setProcessingStatus("Annotating screenshot steps and drawing highlight overlays..."), 2500);

      const resp = await fetch("/api/generate-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          events: sessionEvents,
          scenarioName: selectedScenario.name
        })
      });

      if (!resp.ok) {
        throw new Error("API call returned error status during AI compilation.");
      }

      const parsedDoc = await resp.json();
      
      // Delay slightly for spectacular effect
      setTimeout(() => {
        setIsProcessing(false);
        onWorkflowProcessed(parsedDoc);
      }, 3500);

    } catch (e: any) {
      console.error(e);
      setProcessingError(e.message || "Something went wrong talking to the server.");
      setIsProcessing(false);
    }
  };

  const resetSimulator = () => {
    setSessionEvents([]);
    setIsRecording(false);
    setIsPaused(false);
    setUserInputs({});
    setCurrentStateKey(Object.keys(selectedScenario.states)[0]);
  };

  const currentLayout = selectedScenario.states[currentStateKey];

  return (
    <div id="recording-simulator-root" className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
      
      {/* Sidebar: Scenario configurations */}
      <div id="sim-sidebar" className="lg:col-span-1 space-y-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 text-sm tracking-wide uppercase mb-3 text-center">
            workflow SCENARIOS
          </h3>
          <p className="text-xs text-slate-500 mb-4 text-center">
            Select an enterprise application to capture high-fidelity automated SOP documentations
          </p>
          
          <div className="space-y-2">
            {SIMULATED_SCENARIOS.map((sc) => {
              const isSelected = selectedScenario.id === sc.id;
              return (
                <button
                  id={`scenario-opt-${sc.id}`}
                  key={sc.id}
                  disabled={isRecording}
                  onClick={() => handleScenarioChange(sc)}
                  className={`w-full text-left p-3.5 rounded-lg border text-xs font-medium transition-all duration-200 flex items-center justify-between ${
                    isSelected
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Monitor className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-slate-400"}`} />
                    <span>{sc.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              );
            })}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">SOP Capture Guide</h4>
            <div className="bg-amber-50 rounded-lg p-3 text-amber-900 border border-amber-100 flex gap-2 items-start text-[11px] leading-relaxed animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{guideText}</span>
            </div>
          </div>
        </div>

        {/* Action events timeline */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
            <span className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
              CAPTURED TIMELINE ({sessionEvents.length})
            </span>
            {sessionEvents.length > 0 && !isProcessing && (
              <button onClick={resetSimulator} className="text-rose-500 hover:text-rose-700 flex items-center gap-1.5 font-medium">
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {sessionEvents.length === 0 ? (
              <div className="text-center py-6 text-slate-400 font-mono text-[11px]">
                [Waiting for recordings to begin]
              </div>
            ) : (
              sessionEvents.map((step, idx) => (
                <div key={idx} className="flex gap-2.5 items-start p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-700 truncate">{step.title}</div>
                    <div className="text-[10px] text-indigo-600 font-mono select-all truncate">
                      {step.url}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {sessionEvents.length > 0 && !isProcessing && (
            <button
              id="assemble- SOP-cta"
              onClick={stopAndProcessEvents}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition shadow"
            >
              <ArrowRight className="w-4 h-4 animate-bounce" />
              Assemble AI Procedure Guide
            </button>
          )}
        </div>
      </div>

      {/* Main Sandbox Browser Display */}
      <div id="sim-display" className="lg:col-span-3 space-y-4">
        
        {/* Browser Mock Window Frame */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden flex flex-col h-[520px]">
          
          {/* Browser header tabs address-bar */}
          <div className="bg-slate-100 border-b border-slate-200 p-3.5 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
            </div>
            
            {/* Address bar input */}
            <div className="flex-grow max-w-xl bg-white border border-slate-200 rounded-lg py-1 px-3.5 text-xs text-slate-600 select-all font-mono shadow-inner flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{currentLayout ? currentLayout.url : selectedScenario.startUrl}</span>
            </div>

            <div className="flex items-center gap-2">
              <span id="badge-title" className="text-[10px] font-mono tracking-tight font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded">
                SIMULATOR
              </span>
            </div>
          </div>

          {/* Simulated portal viewport viewport Canvas context */}
          <div className="flex-grow p-8 bg-slate-50 relative overflow-hidden select-none flex flex-col justify-center items-center">
            
            {/* Background screen shadow block */}
            <div className="w-full max-w-2xl bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 relative flex flex-col min-h-[320px]">
              
              {/* Header */}
              <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    {currentLayout?.headline}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{currentLayout?.subtext}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {selectedScenario.portalName}
                </span>
              </div>

              {/* Sub-Layout Renderings */}
              <div className="flex-grow flex flex-col justify-center min-h-[140px]">
                
                {/* 1. Dashboard Layout Widgets */}
                {currentLayout?.layoutType === "dashboard" && (
                  <div className="grid grid-cols-3 gap-4 py-4 w-full">
                    {currentLayout.fields.map((f: any) => (
                      <button
                        key={f.id}
                        disabled={!isRecording || isPaused}
                        onClick={() => handleFieldInteraction(f)}
                        style={{ outline: "none" }}
                        className={`p-4 border-2 rounded-xl text-center cursor-pointer transition-all ${
                          isRecording && !isPaused
                            ? "bg-indigo-50/40 border-indigo-200 hover:border-indigo-500 hover:bg-slate-50 active:scale-95"
                            : "bg-slate-100/50 border-slate-200 opacity-60 pointer-events-none"
                        }`}
                      >
                        <div className="font-bold text-slate-800 text-xs mb-1 truncate">{f.label}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{f.text}</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. Sidebar Panel Layout */}
                {currentLayout?.layoutType === "sidebar_panel" && (
                  <div className="flex gap-4 items-stretch py-4 w-full">
                    <div className="w-1/3 bg-slate-50 p-3 rounded-lg border border-slate-200/50 text-[11px] space-y-1 text-slate-600">
                      <div className="font-bold text-slate-700 border-b pb-1 mb-2">Quick Commands</div>
                      <div className="hover:bg-indigo-50 p-1.5 rounded text-indigo-700 font-medium cursor-pointer">📂 Balance Sheets</div>
                      <div className="hover:bg-indigo-50 p-1.5 rounded text-indigo-700 font-medium cursor-pointer">📄 Compensation Plans</div>
                      <div className="hover:bg-indigo-50 p-1.5 rounded text-indigo-700 font-medium cursor-pointer">👥 Team Directory</div>
                    </div>
                    <div className="w-2/3 bg-white p-4 rounded-lg border border-slate-200/50 flex flex-col justify-center items-center">
                      <p className="text-xs text-slate-500 text-center mb-4">Click the action below to create a request template:</p>
                      {currentLayout.fields.map((f: any) => (
                        <button
                          key={f.id}
                          disabled={!isRecording || isPaused}
                          onClick={() => handleFieldInteraction(f)}
                          className={`px-5 py-2.5 rounded-lg font-bold text-xs shadow-sm transition-all text-white ${
                            isRecording && !isPaused
                              ? "bg-indigo-600 hover:bg-indigo-700 active:scale-95 cursor-pointer"
                              : "bg-slate-300 pointer-events-none"
                          }`}
                        >
                          {f.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Fields / Form Layout */}
                {currentLayout?.layoutType === "form" && (
                  <div className="space-y-4 py-2 w-full max-w-md mx-auto">
                    {currentLayout.fields.some((f: any) => f.type === "input") && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Repository Title:</label>
                        {currentLayout.fields.filter((f: any) => f.type === "input").map((f: any) => (
                          <div
                            key={f.id}
                            onClick={() => handleFieldInteraction(f)}
                            className={`border border-slate-300 rounded-lg p-2.5 text-xs focus-within:ring-2 focus-within:ring-indigo-500 cursor-pointer min-h-[38px] ${
                              userInputs[f.id] ? "bg-indigo-50/50 border-indigo-400 font-medium" : "bg-white"
                            }`}
                          >
                            {userInputs[f.id] ? userInputs[f.id] : <span className="text-slate-400">{f.placeholder} (Click to auto-populate)</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {currentLayout.fields.some((f: any) => f.type === "calendar_cell") && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700">Interactive Vacation Date:</label>
                        {currentLayout.fields.filter((f: any) => f.type === "calendar_cell").map((f: any) => (
                          <div
                            key={f.id}
                            onClick={() => handleFieldInteraction(f)}
                            className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition"
                          >
                            <span className="text-xs font-bold text-slate-800">🗓️ Leave: Jan 15 - Jan 22</span>
                            <span className="text-[10px] text-slate-400 mt-1">(Click calendar cell block to lock dates)</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {currentLayout.fields.some((f: any) => f.type === "radio") && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <label className="text-xs font-semibold text-slate-700">Privacy Align:</label>
                        {currentLayout.fields.filter((f: any) => f.type === "radio").map((f: any) => (
                          <div
                            key={f.id}
                            onClick={() => handleFieldInteraction(f)}
                            className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-white rounded"
                          >
                            <span className="w-4 h-4 rounded-full border border-indigo-600 block flex-shrink-0 relative">
                              <span className="absolute inset-1 rounded-full bg-indigo-600 block"></span>
                            </span>
                            <span className="text-xs font-medium text-slate-700">{f.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {currentLayout.fields.some((f: any) => f.type === "checkbox") && (
                      <div className="p-3 rounded-lg border border-slate-200">
                        {currentLayout.fields.filter((f: any) => f.type === "checkbox").map((f: any) => (
                          <div key={f.id} onClick={() => handleFieldInteraction(f)} className="flex items-start gap-2.5 cursor-pointer">
                            <input type="checkbox" checked={true} readOnly className="mt-0.5 rounded border-indigo-600 text-indigo-600 focus:ring-indigo-500" />
                            <div className="text-xs">
                              <div className="font-semibold text-slate-700">{f.label}</div>
                              <p className="text-[10px] text-slate-500 mt-0.5">{f.placeholder || "Allow routing networks from web domain clients"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {currentLayout.fields.some((f: any) => f.type === "button") && (
                      <div className="flex justify-end gap-2 pt-2">
                        {currentLayout.fields.filter((f: any) => f.type === "button").map((f: any) => (
                          <button
                            key={f.id}
                            disabled={!isRecording || isPaused}
                            onClick={() => handleFieldInteraction(f)}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm"
                          >
                            {f.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Success Alert / Outcome Layout */}
                {currentLayout?.layoutType === "success_alert" && (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2 animate-bounce" />
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                      Session Finished
                    </span>
                    <p className="text-xs text-slate-600 font-medium px-4 mt-1.5 leading-relaxed">
                      All routine interactions were monitored and captured successfully into transient storage.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Glowing Click indicator overlays when simulator is active */}
            {isRecording && !isPaused && currentLayout?.fields.map((f: any) => (
              <span
                key={f.id}
                className="absolute w-6 h-6 rounded-full border border-rose-500 bg-rose-500/25 animate-ping pointer-events-none"
                style={{
                  left: `calc(${f.x}% + 18px)`,
                  top: `calc(${f.y}% + 24px)`
                }}
              />
            ))}

            {/* AI Generator Pending Full Screen Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm flex flex-col justify-center items-center text-white p-6 z-40 text-center">
                <div className="space-y-4 max-w-sm">
                  <div className="relative inline-block">
                    <span className="w-14 h-14 rounded-full border-4 border-indigo-400 border-t-white animate-spin block"></span>
                    <span id="ai-glowing-inner" className="absolute inset-1 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold">AI</span>
                  </div>
                  
                  <h3 className="font-bold text-lg text-indigo-300">Assemble Process SOP</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">{processingStatus}</p>
                </div>
              </div>
            )}
          </div>

          {/* Browser Bottom Action toolbar */}
          <div className="bg-slate-100 border-t border-slate-200 p-4 shrink-0 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <button
                  id="start-rec-btn"
                  onClick={startRecording}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-2 transition hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-white" /> Start SOP Capture
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePause}
                    className={`font-semibold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 transition ${
                      isPaused 
                        ? "bg-amber-100 ring-2 ring-amber-400 text-amber-800" 
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-3.5 h-3.5 fill-amber-700 text-amber-700" /> Resume Capture
                      </>
                    ) : (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-slate-700 text-slate-700" /> Pause
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={resetSimulator}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-semibold text-xs py-2 px-3 rounded-lg flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Start Over
                  </button>
                </div>
              )}
            </div>

            {/* Recording session visual parameters */}
            <div className="flex items-center gap-3">
              {isRecording && (
                <div id="float-recording-state" className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg py-1.5 px-3 shadow-sm">
                  <span className={`w-2.5 h-2.5 rounded-full inline-block ${isPaused ? "bg-amber-500" : "bg-rose-500 animate-pulse"}`}></span>
                  <span className="font-mono text-[11px] font-bold text-slate-600">
                    {isPaused ? "PAUSED" : "RECORDING"} • {sessionEvents.length} STEPS CAPTURED
                  </span>
                </div>
              )}

              <button
                onClick={onCancel}
                disabled={isProcessing}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs py-2 px-4 rounded-lg flex items-center justify-center transition"
              >
                Close Simulator
              </button>
            </div>
          </div>
        </div>

        {/* Informational checklist below */}
        {processingError && (
          <div className="bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-200 flex gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <div>
              <span className="font-bold">Workflow Compilation Failed:</span> {processingError}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
