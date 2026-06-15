import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  BarChart3,
  Bug,
  GitBranch,
  BookOpen,
  Database,
  Settings,
  FileCode,
  AlertCircle,
  Send,
  Search,
  ChevronRight,
  Activity,
} from "lucide-react";
import Navbar from "../components/Navbar";
import LogsPanel from "../components/LogsPanel";
import DependencyGraph from "../components/DependencyGraph";

// API helpers
import { queryCodebase, getArchitecture, ingestRepo, getDependencies, getFileTree, submitFeedback, getSettings } from "../api";

const sidebarItems = [
  { icon: BarChart3, label: "Project Analysis", id: "analysis" },
  { icon: Bug, label: "Debug Errors", id: "debug" },
  { icon: GitBranch, label: "Dependency Map", id: "dependencies" },
  { icon: Activity, label: "Activity Logs", id: "logs" },
  { icon: BookOpen, label: "Onboarding Guide", id: "onboarding" },
  { icon: Database, label: "Knowledge Base", id: "knowledge" },
  { icon: Settings, label: "Settings", id: "settings" },
];

const mockMessages = [
  { role: "assistant", content: "Hello! I'm DevSense AI. How can I help you understand your codebase?" },
];

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("analysis");
  const [messages, setMessages] = useState(mockMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [expandedFolders, setExpandedFolders] = useState(new Set(["src/"]));
  const [isQueryLoading, setIsQueryLoading] = useState(false);

  // ingestion form
  const [repoUrl, setRepoUrl] = useState("");
  const [projectName, setProjectName] = useState("");
  const [ingestStatus, setIngestStatus] = useState(null);
  const [ingestProgress, setIngestProgress] = useState("");

  // Debug section
  const [errorInput, setErrorInput] = useState("");
  const [errorAnalysis, setErrorAnalysis] = useState(null);
  const [isAnalyzingError, setIsAnalyzingError] = useState(false);

  // Knowledge base section
  const [knowledgeSearch, setKnowledgeSearch] = useState("");
  const [knowledgeResults, setKnowledgeResults] = useState(null);
  const [isSearchingKnowledge, setIsSearchingKnowledge] = useState(false);

  // Dependencies section
  const [dependencies, setDependencies] = useState(null);
  const [isLoadingDeps, setIsLoadingDeps] = useState(false);

  // File tree
  const [fileTree, setFileTree] = useState([]);
  const [isLoadingFileTree, setIsLoadingFileTree] = useState(false);

  // Feedback section
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackCategory, setFeedbackCategory] = useState("general");
  const [feedbackStatus, setFeedbackStatus] = useState(null);

  // Settings section
  const [settings, setSettings] = useState(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  // Error history
  const [errorHistory, setErrorHistory] = useState([]);

  // session for queries
  const [sessionId] = useState(() => {
    return window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : Math.random().toString(36).substring(2);
  });

  const [architecture, setArchitecture] = useState("");
  const [isArchLoading, setIsArchLoading] = useState(false);

  const toggleFolder = (folderName) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderName)) {
        newSet.delete(folderName);
      } else {
        newSet.add(folderName);
      }
      return newSet;
    });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isQueryLoading) return;
    const userText = inputMessage.trim();
    setMessages((prev) => [...prev, { role: "user", content: userText }] );
    setInputMessage("");
    setIsQueryLoading(true);

    // Add loading message
    const loadingId = Date.now();
    setMessages((prev) => [...prev, { role: "assistant", content: "Thinking...", id: loadingId, isLoading: true }] );

    try {
      const result = await queryCodebase({
        project_name: projectName || "default",
        session_id: sessionId,
        query: userText,
      });
      const responseText = result?.response || "(no response)";
      
      // Remove loading message and add real response
      setMessages((prev) => prev.filter(m => m.id !== loadingId));
      setMessages((prev) => [...prev, { role: "assistant", content: responseText }] );
    } catch (err) {
      // Remove loading message and add error
      setMessages((prev) => prev.filter(m => m.id !== loadingId));
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.message}` }] );
    } finally {
      setIsQueryLoading(false);
    }
  };

  const handleIngest = async () => {
    if (!repoUrl.trim() || !projectName.trim()) {
      setIngestStatus({ type: "error", message: "Please provide both repo URL and project name" });
      return;
    }
    
    try {
      setIngestStatus({ type: "loading", message: "Cloning repository..." });
      setIngestProgress("Step 1/4: Cloning repository...");
      
      const result = await ingestRepo({ repo_url: repoUrl, project_name: projectName });
      
      setIngestProgress("Step 4/4: Complete!");
      setIngestStatus({ 
        type: "success", 
        message: `Successfully ingested ${result.chunk_count || 0} code chunks from: ${projectName}` 
      });
      
      // Don't clear inputs - let user see what they ingested
      // reload architecture
      setTimeout(() => {
        setIngestProgress("");
        loadArch();
      }, 2000);
    } catch (err) {
      setIngestProgress("");
      setIngestStatus({ type: "error", message: `Failed: ${err.message}` });
    }
  };

  const loadArch = async () => {
    setIsArchLoading(true);
    try {
      const res = await getArchitecture({ project_name: projectName || "default" });
      setArchitecture(res.architecture_overview || "");
    } catch (e) {
      console.error("failed to load architecture", e);
      setArchitecture("Failed to load architecture. Please ingest a project first.");
    } finally {
      setIsArchLoading(false);
    }
  };

  // Error analysis handler
  const analyzeError = async () => {
    if (!errorInput.trim()) {
      setErrorAnalysis({ type: "error", message: "Please enter an error message" });
      return;
    }

    if (!projectName) {
      setErrorAnalysis({ type: "error", message: "Please ingest a project first" });
      return;
    }

    setIsAnalyzingError(true);
    setErrorAnalysis({ type: "loading", message: "Analyzing error..." });

    try {
      const result = await queryCodebase({
        project_name: projectName,
        session_id: sessionId,
        query: `Analyze this error and provide a solution based on the codebase:\n\n${errorInput}`,
      });
      
      const analysis = { 
        type: "success", 
        message: result?.response || "No analysis available",
        timestamp: new Date().toLocaleTimeString()
      };
      
      setErrorAnalysis(analysis);
      
      // Add to error history
      setErrorHistory(prev => [{
        error: errorInput,
        analysis: result?.response || "No analysis available",
        timestamp: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 5)); // Keep last 5
      
    } catch (err) {
      setErrorAnalysis({ 
        type: "error", 
        message: `Analysis failed: ${err.message}` 
      });
    } finally {
      setIsAnalyzingError(false);
    }
  };

  // Knowledge base search handler
  const searchKnowledge = async () => {
    if (!knowledgeSearch.trim()) return;
    
    if (!projectName) {
      setKnowledgeResults({ type: "error", message: "Please ingest a project first" });
      return;
    }

    setIsSearchingKnowledge(true);
    setKnowledgeResults({ type: "loading", message: "Searching..." });

    try {
      const result = await queryCodebase({
        project_name: projectName,
        session_id: sessionId,
        query: knowledgeSearch,
      });
      
      setKnowledgeResults({ 
        type: "success", 
        message: result?.response || "No results found",
        query: knowledgeSearch
      });
    } catch (err) {
      setKnowledgeResults({ 
        type: "error", 
        message: `Search failed: ${err.message}` 
      });
    } finally {
      setIsSearchingKnowledge(false);
    }
  };

  // Onboarding guide handler
  const startGuide = async (guideType) => {
    if (!projectName) {
      alert("Please ingest a project first");
      return;
    }

    const guideQueries = {
      overview: "Provide a comprehensive overview of this project's structure, main components, and architecture.",
      setup: "Explain how to set up the development environment for this project, including dependencies and configuration.",
      contribution: "Guide me through making my first contribution to this project, including coding standards and workflow."
    };

    try {
      const result = await queryCodebase({
        project_name: projectName,
        session_id: sessionId,
        query: guideQueries[guideType],
      });
      
      alert(`${guideType.toUpperCase()} GUIDE:\n\n${result?.response || "No guide available"}`);
    } catch (err) {
      alert(`Failed to load guide: ${err.message}`);
    }
  };

  // Load dependencies
  const loadDependencies = async () => {
    if (!projectName) return;
    
    setIsLoadingDeps(true);
    try {
      const result = await getDependencies({ project_name: projectName });
      setDependencies(result);
    } catch (err) {
      console.error("Failed to load dependencies:", err);
      setDependencies({ total: 0, direct: 0, transitive: 0, packages: [] });
    } finally {
      setIsLoadingDeps(false);
    }
  };

  // Load file tree
  const loadFileTree = async () => {
    if (!projectName) return;
    
    setIsLoadingFileTree(true);
    try {
      const result = await getFileTree({ project_name: projectName });
      setFileTree(result.tree || []);
    } catch (err) {
      console.error("Failed to load file tree:", err);
      setFileTree([]);
    } finally {
      setIsLoadingFileTree(false);
    }
  };

  // Submit feedback
  const handleSubmitFeedback = async () => {
    if (!feedbackRating || !feedbackText.trim()) {
      setFeedbackStatus({ type: "error", message: "Please provide a rating and feedback text" });
      return;
    }

    try {
      await submitFeedback({
        project_name: projectName || "general",
        rating: feedbackRating,
        feedback_text: feedbackText,
        category: feedbackCategory
      });
      
      setFeedbackStatus({ type: "success", message: "Thank you for your feedback!" });
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFeedbackRating(0);
        setFeedbackText("");
        setFeedbackCategory("general");
        setFeedbackStatus(null);
        setShowFeedback(false);
      }, 2000);
    } catch (err) {
      setFeedbackStatus({ type: "error", message: `Failed to submit: ${err.message}` });
    }
  };

  // Load settings
  const loadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const result = await getSettings();
      setSettings(result);
    } catch (err) {
      console.error("Failed to load settings:", err);
      setSettings({ status: "error" });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  useEffect(() => {
    loadArch();
    loadSettings();
  }, []);

  useEffect(() => {
    if (projectName) {
      loadFileTree();
      if (activeSection === "dependencies") {
        loadDependencies();
      }
    }
  }, [projectName, activeSection]);

  return (
    <main className="flex h-screen bg-black overflow-hidden">
      {/* Navbar - Always visible */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      {/* Sidebar - Always visible on desktop */}
      <motion.aside
        className={`fixed md:relative z-40 w-64 h-screen bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col overflow-y-auto transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ marginTop: '64px' }} // Account for navbar height
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white">
              D
            </div>
            <span className="hidden md:block font-bold text-white">DevSense</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {sidebarItems.map(({ icon: Icon, label, id }) => (
            <motion.button
              key={id}
              onClick={() => {
                setActiveSection(id);
                // Only close sidebar on mobile
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeSection === id
                  ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white border border-blue-500/50"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              whileHover={{ x: 4 }}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </motion.button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30">
            <p className="text-xs text-gray-300">Upgrade to Pro for advanced features</p>
            <button className="mt-2 w-full px-2 py-1 bg-blue-600 text-white text-xs rounded font-medium hover:bg-blue-700 transition">
              Upgrade
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Overlay - Only on mobile */}
      {sidebarOpen && (
        <motion.div
          className="fixed md:hidden inset-0 z-30 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSidebarOpen(false)}
          style={{ marginTop: '64px' }}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ marginTop: '64px' }}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 border-b border-white/10 bg-white/5 backdrop-blur-xl px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white capitalize flex-1 md:flex-none">
            {sidebarItems.find((item) => item.id === activeSection)?.label}
          </h1>
          <div className="hidden md:flex items-center gap-4">
            {projectName && (
              <div className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-medium">
                📦 {projectName}
              </div>
            )}
            <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium">
              ● Connected
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-auto">
          {activeSection === "analysis" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 auto-rows-max">
              {/* Project Analysis Content */}
              {/* Ingestion Panel */}
            <motion.div
              className="p-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 overflow-hidden col-span-full md:col-span-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                <Database className="w-5 h-5 text-purple-400" />
                <h2 className="font-semibold text-white">Ingest Repository</h2>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Repository URL (e.g., https://github.com/user/repo)"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  disabled={ingestStatus?.type === "loading"}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                />
                <input
                  type="text"
                  placeholder="Project Name (e.g., my-project)"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={ingestStatus?.type === "loading"}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                />
                <button
                  onClick={handleIngest}
                  disabled={ingestStatus?.type === "loading"}
                  className="w-full px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg text-white font-medium hover:shadow-glow-purple transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {ingestStatus?.type === "loading" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Ingesting...
                    </>
                  ) : (
                    "Ingest Repository"
                  )}
                </button>
                {ingestProgress && (
                  <div className="text-xs text-blue-400 animate-pulse">
                    {ingestProgress}
                  </div>
                )}
                {ingestStatus && (
                  <div className={`p-3 rounded-lg text-xs ${
                    ingestStatus.type === "success" 
                      ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                      : ingestStatus.type === "error"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}>
                    <div className="flex items-start gap-2">
                      {ingestStatus.type === "success" && <span>✓</span>}
                      {ingestStatus.type === "error" && <span>✗</span>}
                      {ingestStatus.type === "loading" && <span>⟳</span>}
                      <span>{ingestStatus.message}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
            {/* Architecture Panel */}
            {(architecture || isArchLoading) && (
              <motion.div
                className="p-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 overflow-hidden col-span-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                  <Database className="w-5 h-5 text-blue-400" />
                  <h2 className="font-semibold text-white">Architecture Overview</h2>
                  {isArchLoading && (
                    <div className="ml-auto">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                {isArchLoading ? (
                  <div className="text-sm text-gray-400 animate-pulse">
                    Analyzing project architecture...
                  </div>
                ) : (
                  <pre className="text-sm text-gray-200 whitespace-pre-wrap max-h-96 overflow-y-auto">{architecture}</pre>
                )}
              </motion.div>
            )}

            {/* File Tree Panel */}
            <motion.div
              className="p-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                <FileCode className="w-5 h-5 text-blue-400" />
                <h2 className="font-semibold text-white">Codebase Overview</h2>
                {isLoadingFileTree && (
                  <div className="ml-auto">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {fileTree.length === 0 && !isLoadingFileTree && (
                  <div className="text-sm text-gray-400 text-center py-4">
                    {projectName ? "No files found" : "Ingest a project to see files"}
                  </div>
                )}
                {fileTree.map((item, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-center gap-2 py-1 px-2 hover:bg-white/5 rounded transition-colors text-sm cursor-pointer"
                    whileHover={{ x: 4 }}
                  >
                    <span style={{ marginLeft: `${item.depth * 16}px` }}>
                      {item.type === "folder" ? (
                        <button
                          onClick={() => toggleFolder(item.name)}
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                        >
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${
                              expandedFolders.has(item.name) ? "rotate-90" : ""
                            }`}
                          />
                          📁 {item.name}
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400">
                          📄 {item.name}
                        </span>
                      )}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Chat Panel */}
            <motion.div
              className="p-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 flex flex-col overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full" />
                <h2 className="font-semibold text-white">AI Assistant</h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-48">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                          : msg.isLoading
                          ? "bg-white/10 text-gray-200 animate-pulse"
                          : "bg-white/10 text-gray-200"
                      }`}
                    >
                      {msg.isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask DevSense about your code..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !isQueryLoading && sendMessage()}
                  disabled={isQueryLoading}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
                <motion.button
                  onClick={sendMessage}
                  disabled={isQueryLoading || !inputMessage.trim()}
                  className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:shadow-glow-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: isQueryLoading ? 1 : 1.05 }}
                  whileTap={{ scale: isQueryLoading ? 1 : 0.95 }}
                >
                  {isQueryLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
          )}

          {/* Debug Errors Section */}
          {activeSection === "debug" && (
            <div className="p-6 space-y-6">
              <motion.div
                className="p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Bug className="w-8 h-8 text-red-400" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">Error Debugger</h2>
                    <p className="text-gray-400 text-sm">AI-powered error analysis and solutions</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">Paste your error message or stack trace:</label>
                    <textarea
                      value={errorInput}
                      onChange={(e) => setErrorInput(e.target.value)}
                      placeholder="Error: Cannot read property 'map' of undefined&#10;  at Component.render (App.jsx:42:15)&#10;  at ..."
                      className="w-full h-40 px-4 py-3 bg-black/30 border border-red-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 font-mono text-sm"
                    />
                  </div>
                  <button 
                    onClick={analyzeError}
                    disabled={isAnalyzingError || !projectName}
                    className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isAnalyzingError ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Analyzing...
                      </>
                    ) : (
                      "Analyze Error"
                    )}
                  </button>
                  {!projectName && (
                    <p className="text-xs text-yellow-400">⚠️ Please ingest a project first to analyze errors</p>
                  )}
                  {errorAnalysis && (
                    <div className={`p-4 rounded-lg text-sm ${
                      errorAnalysis.type === "success" 
                        ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                        : errorAnalysis.type === "error"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}>
                      <div className="font-semibold mb-2">Analysis Result:</div>
                      <div className="whitespace-pre-wrap">{errorAnalysis.message}</div>
                    </div>
                  )}
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  className="p-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    Error History
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {errorHistory.length === 0 ? (
                      <div className="text-sm text-gray-400 text-center py-8">
                        No errors analyzed yet
                      </div>
                    ) : (
                      errorHistory.map((item, idx) => (
                        <div key={idx} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <div className="text-xs text-red-400 font-mono mb-1">{item.timestamp}</div>
                          <div className="text-sm text-white font-semibold mb-2">Error:</div>
                          <div className="text-xs text-gray-300 mb-2 font-mono">{item.error.substring(0, 100)}...</div>
                          <div className="text-sm text-white font-semibold mb-1">Solution:</div>
                          <div className="text-xs text-gray-300">{item.analysis.substring(0, 150)}...</div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>

                <motion.div
                  className="p-6 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                    Quick Tips
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="text-sm font-semibold text-white mb-1">💡 Tip 1</div>
                      <div className="text-xs text-gray-300">Always include the full stack trace for better analysis</div>
                    </div>
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="text-sm font-semibold text-white mb-1">💡 Tip 2</div>
                      <div className="text-xs text-gray-300">Mention the file and line number where the error occurs</div>
                    </div>
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="text-sm font-semibold text-white mb-1">💡 Tip 3</div>
                      <div className="text-xs text-gray-300">Include any recent changes you made before the error appeared</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}

          {/* Dependency Map Section */}
          {activeSection === "dependencies" && (
            <div className="p-6 space-y-6">
              <motion.div
                className="p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <GitBranch className="w-8 h-8 text-cyan-400" />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">Dependency Mapper</h2>
                    <p className="text-gray-400 text-sm">Visualize and analyze project dependencies</p>
                  </div>
                  {isLoadingDeps && (
                    <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>

                {!projectName ? (
                  <div className="text-center py-12">
                    <GitBranch className="w-16 h-16 mx-auto mb-4 opacity-50 text-gray-400" />
                    <p className="text-gray-400">Please ingest a project first to see dependencies</p>
                  </div>
                ) : dependencies ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                        <div className="text-3xl font-bold text-cyan-400">{dependencies.total}</div>
                        <div className="text-sm text-gray-400">Total Dependencies</div>
                      </div>
                      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="text-3xl font-bold text-blue-400">{dependencies.direct}</div>
                        <div className="text-sm text-gray-400">Direct Dependencies</div>
                      </div>
                      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <div className="text-3xl font-bold text-purple-400">{dependencies.transitive}</div>
                        <div className="text-sm text-gray-400">Transitive Dependencies</div>
                      </div>
                    </div>

                    {/* Interactive Dependency Graph */}
                    {dependencies.packages && dependencies.packages.length > 0 && (
                      <div className="mb-6">
                        <DependencyGraph dependencies={dependencies} />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
                        <h3 className="font-semibold text-white mb-4">Production Dependencies</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {dependencies.packages.length === 0 ? (
                            <div className="text-sm text-gray-400 text-center py-4">No dependencies found</div>
                          ) : (
                            dependencies.packages.map((pkg, idx) => (
                              <div key={idx} className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-white">{pkg.name}</span>
                                  <span className="text-xs text-cyan-400">{pkg.version}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
                        <h3 className="font-semibold text-white mb-4">Development Dependencies</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {dependencies.dev_packages.length === 0 ? (
                            <div className="text-sm text-gray-400 text-center py-4">No dev dependencies found</div>
                          ) : (
                            dependencies.dev_packages.map((pkg, idx) => (
                              <div key={idx} className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-white">{pkg.name}</span>
                                  <span className="text-xs text-blue-400">{pkg.version}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading dependencies...</p>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Activity Logs Section */}
          {activeSection === "logs" && (
            <div className="p-6 space-y-6">
              <motion.div
                className="p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="w-8 h-8 text-purple-400" />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">Activity Logs</h2>
                    <p className="text-gray-400 text-sm">Track all project activities in real-time</p>
                  </div>
                </div>

                {!projectName ? (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 mx-auto mb-4 opacity-50 text-gray-400" />
                    <p className="text-gray-400">Please ingest a project first to see activity logs</p>
                  </div>
                ) : (
                  <LogsPanel projectName={projectName} />
                )}
              </motion.div>
            </div>
          )}

          {/* Onboarding Guide Section */}
          {activeSection === "onboarding" && (
            <div className="p-6 space-y-6">
              <motion.div
                className="p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <BookOpen className="w-8 h-8 text-green-400" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">Developer Onboarding</h2>
                    <p className="text-gray-400 text-sm">Interactive guides for new team members</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold">1</div>
                        <h3 className="font-semibold text-white">Project Overview</h3>
                      </div>
                      <p className="text-sm text-gray-400">Understand the project structure, architecture, and key components</p>
                      <button 
                        onClick={() => startGuide('overview')}
                        disabled={!projectName}
                        className="mt-3 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {projectName ? "Start Guide" : "Ingest Project First"}
                      </button>
                    </div>

                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold">2</div>
                        <h3 className="font-semibold text-white">Setup Environment</h3>
                      </div>
                      <p className="text-sm text-gray-400">Step-by-step guide to set up your development environment</p>
                      <button 
                        onClick={() => startGuide('setup')}
                        disabled={!projectName}
                        className="mt-3 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {projectName ? "Start Guide" : "Ingest Project First"}
                      </button>
                    </div>

                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold">3</div>
                        <h3 className="font-semibold text-white">First Contribution</h3>
                      </div>
                      <p className="text-sm text-gray-400">Learn how to make your first code contribution</p>
                      <button 
                        onClick={() => startGuide('contribution')}
                        disabled={!projectName}
                        className="mt-3 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {projectName ? "Start Guide" : "Ingest Project First"}
                      </button>
                    </div>
                  </div>

                  <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
                    <h3 className="font-semibold text-white mb-4">Quick Links</h3>
                    <div className="space-y-3">
                      <a href="#" className="block p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
                        <div className="text-sm font-medium text-white">📚 Documentation</div>
                        <div className="text-xs text-gray-400">Read the full documentation</div>
                      </a>
                      <a href="#" className="block p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
                        <div className="text-sm font-medium text-white">🎥 Video Tutorials</div>
                        <div className="text-xs text-gray-400">Watch walkthrough videos</div>
                      </a>
                      <a href="#" className="block p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
                        <div className="text-sm font-medium text-white">💬 Team Chat</div>
                        <div className="text-xs text-gray-400">Join the team discussion</div>
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Knowledge Base Section */}
          {activeSection === "knowledge" && (
            <div className="p-6 space-y-6">
              <motion.div
                className="p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Database className="w-8 h-8 text-purple-400" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">Knowledge Base</h2>
                    <p className="text-gray-400 text-sm">Searchable repository of project knowledge</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={knowledgeSearch}
                      onChange={(e) => setKnowledgeSearch(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && searchKnowledge()}
                      placeholder="Search knowledge base..."
                      disabled={isSearchingKnowledge}
                      className="w-full pl-12 pr-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                    />
                  </div>
                  {!projectName && (
                    <p className="text-xs text-yellow-400 mt-2">⚠️ Please ingest a project first to search</p>
                  )}
                </div>

                {knowledgeResults && (
                  <motion.div
                    className={`p-6 rounded-lg mb-6 ${
                      knowledgeResults.type === "success" 
                        ? "bg-green-500/10 border border-green-500/20" 
                        : knowledgeResults.type === "error"
                        ? "bg-red-500/10 border border-red-500/20"
                        : "bg-blue-500/10 border border-blue-500/20"
                    }`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {knowledgeResults.type === "loading" ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-blue-400">{knowledgeResults.message}</span>
                      </div>
                    ) : (
                      <>
                        <div className="font-semibold text-white mb-2 flex items-center gap-2">
                          {knowledgeResults.type === "success" && <span>✓</span>}
                          {knowledgeResults.type === "error" && <span>✗</span>}
                          Search Results {knowledgeResults.query && `for "${knowledgeResults.query}"`}
                        </div>
                        <div className="text-sm text-gray-200 whitespace-pre-wrap">{knowledgeResults.message}</div>
                      </>
                    )}
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-all cursor-pointer">
                    <div className="text-2xl mb-2">📖</div>
                    <h3 className="font-semibold text-white mb-2">Documentation</h3>
                    <p className="text-sm text-gray-400">Search project docs</p>
                  </div>
                  <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-lg hover:bg-pink-500/20 transition-all cursor-pointer">
                    <div className="text-2xl mb-2">💡</div>
                    <h3 className="font-semibold text-white mb-2">Best Practices</h3>
                    <p className="text-sm text-gray-400">Learn coding standards</p>
                  </div>
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-all cursor-pointer">
                    <div className="text-2xl mb-2">🔧</div>
                    <h3 className="font-semibold text-white mb-2">Troubleshooting</h3>
                    <p className="text-sm text-gray-400">Find solutions</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-semibold text-white mb-4">Quick Searches</h3>
                  <div className="space-y-3">
                    {["How to set up the development environment", "Understanding the authentication flow", "Debugging common errors"].map((query, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setKnowledgeSearch(query);
                          searchKnowledge();
                        }}
                        disabled={!projectName || isSearchingKnowledge}
                        className="w-full p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="text-sm font-medium text-white">{query}</div>
                        <div className="text-xs text-gray-400 mt-1">Click to search</div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Settings Section */}
          {activeSection === "settings" && (
            <div className="p-6 space-y-6">
              <motion.div
                className="p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-gray-500/10 to-slate-500/10 border border-gray-500/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Settings className="w-8 h-8 text-gray-400" />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">Settings</h2>
                    <p className="text-gray-400 text-sm">Configure your DevSense experience</p>
                  </div>
                  {isLoadingSettings && (
                    <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
                    <h3 className="font-semibold text-white mb-4">Backend Configuration</h3>
                    {settings ? (
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                          <span className="text-gray-400">AWS Bedrock</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            settings.use_bedrock 
                              ? "bg-green-500/20 text-green-400" 
                              : "bg-gray-500/20 text-gray-400"
                          }`}>
                            {settings.use_bedrock ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                          <span className="text-gray-400">Max Chunks</span>
                          <span className="text-white font-medium">{settings.max_chunks}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                          <span className="text-gray-400">Max File Size</span>
                          <span className="text-white font-medium">{settings.max_file_size_kb} KB</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                          <span className="text-gray-400">Backend Version</span>
                          <span className="text-white font-medium">{settings.backend_version}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-400">Loading settings...</div>
                    )}
                  </div>

                  <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
                    <h3 className="font-semibold text-white mb-4">API Configuration</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">Backend URL</label>
                        <input
                          type="text"
                          value="http://localhost:8000"
                          readOnly
                          className="w-full px-4 py-2 bg-black/30 border border-gray-500/30 rounded-lg text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">API Timeout (seconds)</label>
                        <input
                          type="number"
                          value="30"
                          readOnly
                          className="w-full px-4 py-2 bg-black/30 border border-gray-500/30 rounded-lg text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-white/5 border border-white/10 rounded-lg">
                    <h3 className="font-semibold text-white mb-4">System Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between p-3 bg-black/30 rounded-lg">
                        <span className="text-gray-400">Frontend Version</span>
                        <span className="text-white">1.0.0</span>
                      </div>
                      <div className="flex justify-between p-3 bg-black/30 rounded-lg">
                        <span className="text-gray-400">Build Date</span>
                        <span className="text-white">2026.02.28</span>
                      </div>
                      <div className="flex justify-between p-3 bg-black/30 rounded-lg">
                        <span className="text-gray-400">Connection Status</span>
                        <span className="text-green-400 flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                          Connected
                        </span>
                      </div>
                      {projectName && (
                        <div className="flex justify-between p-3 bg-black/30 rounded-lg">
                          <span className="text-gray-400">Active Project</span>
                          <span className="text-purple-400">{projectName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Feedback Button */}
      <motion.button
        onClick={() => setShowFeedback(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-glow-purple flex items-center justify-center text-white z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <span className="text-2xl">💬</span>
      </motion.button>

      {/* Feedback Modal */}
      {showFeedback && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowFeedback(false)}
        >
          <motion.div
            className="bg-gradient-to-br from-gray-900 to-black border border-purple-500/30 rounded-2xl p-8 max-w-md w-full mx-4"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Send Feedback</h2>
              <button
                onClick={() => setShowFeedback(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 mb-2 block">How would you rate your experience?</label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      className={`text-3xl transition-all ${
                        star <= feedbackRating ? "text-yellow-400 scale-110" : "text-gray-600 hover:text-yellow-400"
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">Category</label>
                <select
                  value={feedbackCategory}
                  onChange={(e) => setFeedbackCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-black/30 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="general">General Feedback</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="ui">UI/UX Feedback</option>
                  <option value="performance">Performance Issue</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-300 mb-2 block">Your Feedback</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us what you think..."
                  className="w-full h-32 px-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {feedbackStatus && (
                <div className={`p-3 rounded-lg text-sm ${
                  feedbackStatus.type === "success" 
                    ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                  {feedbackStatus.message}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowFeedback(false)}
                  className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={!feedbackRating || !feedbackText.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}
