import { useState } from 'react';
import type { ParsedPRD } from './PRDUpload';
import { ThemeToggle } from './ThemeToggle';

interface PRDViewerProps {
  prd: ParsedPRD;
  onStartProject: () => void;
  onBack: () => void;
  isLoading?: boolean;
  isAnalyzing?: boolean;
  projectDirectory?: string;
}

const API_URL = '';

export function PRDViewer({ prd, onStartProject, onBack, isLoading, isAnalyzing, projectDirectory }: PRDViewerProps) {
  const totalTasks = prd.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
  const [showClaudeMd, setShowClaudeMd] = useState(false);
  const [claudeMdContent, setClaudeMdContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateClaudeMd = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${API_URL}/api/prd/generate-claude-md`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prd }),
      });

      if (!response.ok) throw new Error('Failed to generate');

      const data = await response.json();
      setClaudeMdContent(data.content);
      setShowClaudeMd(true);
    } catch (error) {
      console.error('Failed to generate CLAUDE.md:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyClaudeMd = async () => {
    await navigator.clipboard.writeText(claudeMdContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadClaudeMd = () => {
    const blob = new Blob([claudeMdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CLAUDE.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 transition-colors">
      {/* Theme toggle in corner */}
      <div className="fixed top-3 sm:top-4 right-3 sm:right-4 z-40">
        <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="mb-4 sm:mb-6 flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs sm:text-sm font-medium">Upload different PRD</span>
        </button>

        {/* Header card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border-2 border-gray-900 dark:border-gray-600 shadow-3d p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">{prd.title}</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">{prd.overview}</p>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 sm:gap-6 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-base sm:text-xl">📋</span>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{prd.phases.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Phases</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-base sm:text-xl">📝</span>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{totalTasks}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tasks</p>
              </div>
            </div>
            {prd.techStack.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-base sm:text-xl">🛠️</span>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{prd.techStack.length}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Technologies</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tech Stack */}
        {prd.techStack.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border-2 border-gray-900 dark:border-gray-600 shadow-3d p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 flex items-center gap-2">
              <span>Tech Stack</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {prd.techStack.map((item, index) => (
                <div
                  key={index}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide block">
                    {item.category}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{item.technology}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CLAUDE.md Generator */}
        <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border-2 border-gray-900 dark:border-gray-600 shadow-3d p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">CLAUDE.md</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Generate a context file for Claude Code to understand your project
              </p>
            </div>
            <button
              onClick={handleGenerateClaudeMd}
              disabled={isGenerating}
              className="px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-xs sm:text-sm font-medium
                text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50 w-full sm:w-auto"
            >
              {isGenerating ? 'Generating...' : 'Preview'}
            </button>
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          {prd.phases.map((phase, phaseIndex) => (
            <div
              key={phaseIndex}
              className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border-2 border-gray-900 dark:border-gray-600 shadow-3d overflow-hidden"
            >
              {/* Phase header */}
              <div className="note-yellow px-4 sm:px-6 py-3 sm:py-4 border-b-2 border-gray-900 dark:border-gray-600">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-hand text-lg sm:text-xl font-bold text-gray-900">
                    Phase {phaseIndex + 1}: {phase.name}
                  </h3>
                  <span className="text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">
                    {phase.tasks.length} task{phase.tasks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {phase.description && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">{phase.description}</p>
                )}
              </div>

              {/* Tasks list */}
              <div className="p-3 sm:p-4">
                <div className="grid gap-2">
                  {phase.tasks.map((task, taskIndex) => (
                    <div
                      key={taskIndex}
                      className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
                        hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</p>
                        {task.description && (
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">{task.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Start button */}
        <div className="sticky bottom-4 sm:bottom-6">
          {/* Analysis info banner */}
          {projectDirectory && !isLoading && !isAnalyzing && (
            <div className="mb-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg sm:rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <span className="text-blue-500 text-sm sm:text-base">🔍</span>
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                  Will analyze <span className="font-mono font-medium break-all">{projectDirectory}</span> to detect completed tasks
                </p>
              </div>
            </div>
          )}

          {/* Analyzing spinner with sticky note animation */}
          {isAnalyzing && (
            <div className="mb-3 px-3 sm:px-4 py-3 sm:py-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg sm:rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                  <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-md">
                    {/* Shadow under the note */}
                    <ellipse cx="20" cy="39" rx="12" ry="2" fill="rgba(0,0,0,0.15)" style={{ animation: 'shadow-pulse 1.5s infinite ease-in-out' }} />
                    {/* Main sticky note body */}
                    <path d="M4 4 H36 V28 L28 36 H4 Z" fill="#FFEB3B" />
                    {/* Corner fold with flash animation */}
                    <path d="M28 28 L36 28 L28 36 Z" fill="#FDD835" style={{ animation: 'corner-flash 1.5s infinite ease-in-out' }} />
                    {/* Lines on the note */}
                    <g opacity="0.25" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round">
                      <line x1="8" y1="12" x2="26" y2="12" />
                      <line x1="8" y1="18" x2="22" y2="18" />
                      <line x1="8" y1="24" x2="18" y2="24" />
                    </g>
                  </svg>
                  <style>{`
                    @keyframes corner-flash {
                      0%, 100% {
                        fill: #FDD835;
                      }
                      50% {
                        fill: #FFEE58;
                      }
                    }
                    @keyframes shadow-pulse {
                      0%, 100% {
                        opacity: 0.15;
                      }
                      50% {
                        opacity: 0.25;
                      }
                    }
                  `}</style>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 font-medium">
                    Analyzing your codebase...
                  </p>
                  <p className="text-[10px] sm:text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                    Detecting completed tasks
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onStartProject}
            disabled={isLoading || isAnalyzing}
            className="w-full py-3 sm:py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg
              border-2 border-gray-900 dark:border-gray-100 shadow-3d
              hover:bg-gray-700 dark:hover:bg-gray-300 hover:-translate-x-0.5 hover:-translate-y-0.5
              disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0
              transition-all"
          >
            {isAnalyzing ? 'Analyzing codebase...' : isLoading ? 'Creating tasks...' : 'Start Building with Claude'}
          </button>
        </div>
      </div>

      {/* CLAUDE.md Modal */}
      {showClaudeMd && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setShowClaudeMd(false)}
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border-2 border-gray-900 dark:border-gray-600 shadow-3d w-full max-w-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b-2 border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">CLAUDE.md Preview</h2>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={handleCopyClaudeMd}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-xs sm:text-sm font-medium
                    text-gray-700 dark:text-gray-300 transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownloadClaudeMd}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-700 dark:hover:bg-gray-300 rounded-lg text-xs sm:text-sm font-medium
                    text-white dark:text-gray-900 transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={() => setShowClaudeMd(false)}
                  className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 sm:p-6">
              <pre className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap">{claudeMdContent}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
