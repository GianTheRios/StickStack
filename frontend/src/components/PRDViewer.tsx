import { useState } from 'react';
import type { ParsedPRD } from './PRDUpload';

interface PRDViewerProps {
  prd: ParsedPRD;
  onStartProject: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const API_URL = 'http://localhost:3001';

export function PRDViewer({ prd, onStartProject, onBack, isLoading }: PRDViewerProps) {
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Upload different PRD</span>
        </button>

        {/* Header card */}
        <div className="bg-white rounded-2xl border-2 border-gray-900 shadow-3d p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{prd.title}</h1>
          <p className="text-gray-600 text-lg leading-relaxed">{prd.overview}</p>

          {/* Stats */}
          <div className="flex gap-6 mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{prd.phases.length}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Phases</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📝</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Tasks</p>
              </div>
            </div>
            {prd.techStack.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🛠️</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{prd.techStack.length}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Technologies</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tech Stack */}
        {prd.techStack.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-gray-900 shadow-3d p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>Tech Stack</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {prd.techStack.map((item, index) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-gray-100 rounded-lg border border-gray-200"
                >
                  <span className="text-xs text-gray-500 uppercase tracking-wide block">
                    {item.category}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{item.technology}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CLAUDE.md Generator */}
        <div className="bg-white rounded-2xl border-2 border-gray-900 shadow-3d p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">CLAUDE.md</h2>
              <p className="text-sm text-gray-500">
                Generate a context file for Claude Code to understand your project
              </p>
            </div>
            <button
              onClick={handleGenerateClaudeMd}
              disabled={isGenerating}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium
                text-gray-700 transition-colors disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Preview'}
            </button>
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-4 mb-8">
          {prd.phases.map((phase, phaseIndex) => (
            <div
              key={phaseIndex}
              className="bg-white rounded-2xl border-2 border-gray-900 shadow-3d overflow-hidden"
            >
              {/* Phase header */}
              <div className="note-yellow px-6 py-4 border-b-2 border-gray-900">
                <div className="flex items-center justify-between">
                  <h3 className="font-hand text-xl font-bold text-gray-900">
                    Phase {phaseIndex + 1}: {phase.name}
                  </h3>
                  <span className="text-sm text-gray-600 font-medium">
                    {phase.tasks.length} task{phase.tasks.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {phase.description && (
                  <p className="text-sm text-gray-600 mt-1">{phase.description}</p>
                )}
              </div>

              {/* Tasks list */}
              <div className="p-4">
                <div className="grid gap-2">
                  {phase.tasks.map((task, taskIndex) => (
                    <div
                      key={taskIndex}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200
                        hover:border-gray-300 transition-colors"
                    >
                      <div className="mt-0.5">
                        <div className="w-5 h-5 rounded border-2 border-gray-300 bg-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-gray-500 mt-1">{task.description}</p>
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
        <div className="sticky bottom-6">
          <button
            onClick={onStartProject}
            disabled={isLoading}
            className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg
              border-2 border-gray-900 shadow-3d
              hover:bg-gray-700 hover:-translate-x-0.5 hover:-translate-y-0.5
              disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0
              transition-all"
          >
            {isLoading ? 'Creating tasks...' : 'Start Building with Claude'}
          </button>
        </div>
      </div>

      {/* CLAUDE.md Modal */}
      {showClaudeMd && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowClaudeMd(false)}
        >
          <div className="bg-white rounded-2xl border-2 border-gray-900 shadow-3d w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b-2 border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">CLAUDE.md Preview</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyClaudeMd}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium
                    text-gray-700 transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownloadClaudeMd}
                  className="px-3 py-1.5 bg-gray-900 hover:bg-gray-700 rounded-lg text-sm font-medium
                    text-white transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={() => setShowClaudeMd(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <pre className="text-sm text-gray-700 font-mono whitespace-pre-wrap">{claudeMdContent}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
