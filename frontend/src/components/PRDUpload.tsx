import { useState, useCallback, useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';

const STORAGE_KEY = 'stickstack_project_settings';

interface PRDUploadProps {
  onPRDParsed: (prd: ParsedPRD) => void;
}

export interface ParsedTask {
  title: string;
  description?: string;
  completed: boolean;
}

export interface ParsedPRD {
  title: string;
  overview: string;
  techStack: { category: string; technology: string }[];
  phases: {
    name: string;
    description?: string;
    tasks: ParsedTask[];
  }[];
  rawMarkdown: string;
}

// Simple markdown parser for PRDs
function parsePRDMarkdown(markdown: string): ParsedPRD {
  const lines = markdown.split('\n');

  let title = '';
  let overview = '';
  const techStack: { category: string; technology: string }[] = [];
  const phases: ParsedPRD['phases'] = [];

  let currentSection = '';
  let currentPhase: ParsedPRD['phases'][0] | null = null;
  let overviewLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Main title
    if (trimmed.startsWith('# ') && !title) {
      title = trimmed.replace('# ', '');
      continue;
    }

    // Section headers
    if (trimmed.startsWith('## ')) {
      const sectionName = trimmed.replace('## ', '').toLowerCase();

      if (sectionName.includes('overview') || sectionName.includes('about')) {
        currentSection = 'overview';
      } else if (sectionName.includes('tech') || sectionName.includes('stack')) {
        currentSection = 'techStack';
      } else if (sectionName.includes('feature') || sectionName.includes('phase') || sectionName.includes('milestone')) {
        currentSection = 'phases';
      }
      continue;
    }

    // Phase headers (### )
    if (trimmed.startsWith('### ') && currentSection === 'phases') {
      if (currentPhase) {
        phases.push(currentPhase);
      }
      currentPhase = {
        name: trimmed.replace('### ', '').replace(/^Phase \d+:\s*/i, ''),
        tasks: [],
      };
      continue;
    }

    // Content based on section
    if (currentSection === 'overview' && trimmed) {
      overviewLines.push(trimmed);
    }

    if (currentSection === 'techStack' && trimmed.startsWith('- ')) {
      const item = trimmed.replace('- ', '');
      const [category, technology] = item.split(':').map(s => s.trim());
      if (category && technology) {
        techStack.push({ category, technology });
      } else {
        techStack.push({ category: 'Other', technology: item });
      }
    }

    if (currentSection === 'phases' && currentPhase && trimmed.startsWith('- ')) {
      // Check if task is marked as completed [x] or [X]
      const isCompleted = /^- \[[xX]\]/.test(trimmed);
      const taskText = trimmed.replace(/^- \[[ xX]\]\s*/i, '').replace(/^- /, '');
      currentPhase.tasks.push({ title: taskText, completed: isCompleted });
    }
  }

  // Don't forget the last phase
  if (currentPhase) {
    phases.push(currentPhase);
  }

  overview = overviewLines.join(' ').slice(0, 500);

  // If no phases found, create a default one
  if (phases.length === 0) {
    phases.push({
      name: 'Tasks',
      tasks: [{ title: 'Review and break down PRD', completed: false }],
    });
  }

  return {
    title: title || 'Untitled Project',
    overview: overview || 'No overview provided.',
    techStack,
    phases,
    rawMarkdown: markdown,
  };
}

export function PRDUpload({ onPRDParsed }: PRDUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const [error, setError] = useState('');
  const [projectDirectory, setProjectDirectory] = useState('');

  // Load project directory from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setProjectDirectory(parsed.projectDirectory || '');
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save project directory to localStorage when it changes
  const handleProjectDirectoryChange = (value: string) => {
    setProjectDirectory(value);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const existing = saved ? JSON.parse(saved) : {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...existing,
        projectDirectory: value,
      }));
    } catch {
      // Ignore errors
    }
  };

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith('.md') && file.type !== 'text/markdown' && file.type !== 'text/plain') {
      setError('Please upload a markdown (.md) file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setMarkdown(content);
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleParse = () => {
    if (!markdown.trim()) {
      setError('Please upload or paste your PRD');
      return;
    }

    try {
      const parsed = parsePRDMarkdown(markdown);
      onPRDParsed(parsed);
    } catch (err) {
      setError('Failed to parse PRD. Please check the format.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4 sm:p-6 transition-colors">
      {/* Theme toggle in corner */}
      <div className="fixed top-3 sm:top-4 right-3 sm:right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-2xl">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">StickStack</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Upload your PRD to get started</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border-2 border-gray-900 dark:border-gray-600 shadow-3d p-4 sm:p-6">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-lg sm:rounded-xl p-6 sm:p-8 text-center
              transition-colors duration-150 mb-4
              ${isDragging
                ? 'border-orange-400 bg-orange-50 dark:bg-orange-950'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }
            `}
          >
            <div className="mb-3 flex justify-center">
              <svg viewBox="0 0 40 40" className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-md">
                {/* Main sticky note body */}
                <path d="M4 4 H36 V28 L28 36 H4 Z" fill="#FFEB3B" />
                {/* Corner fold */}
                <path d="M28 28 L36 28 L28 36 Z" fill="#FDD835" />
                {/* Lines on the note */}
                <g opacity="0.25" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="8" y1="12" x2="26" y2="12" />
                  <line x1="8" y1="18" x2="22" y2="18" />
                  <line x1="8" y1="24" x2="18" y2="24" />
                </g>
              </svg>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-2">
              Drag & drop your <span className="font-semibold">PRD.md</span> file here
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4">or</p>
            <label className="inline-block">
              <input
                type="file"
                accept=".md,.markdown,.txt"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
              <span className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer transition-colors">
                Browse files
              </span>
            </label>
          </div>

          {/* Or paste */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white dark:bg-gray-900 text-sm text-gray-400 dark:text-gray-500">or paste markdown</span>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            value={markdown}
            onChange={(e) => {
              setMarkdown(e.target.value);
              setError('');
            }}
            placeholder={`# My Project

## Overview
A brief description of your project...

## Tech Stack
- Frontend: React + TypeScript
- Backend: Node.js

## Features

### Phase 1: Foundation
- [ ] Project setup
- [ ] Database schema
- [ ] Basic auth

### Phase 2: Core Features
- [ ] Main feature 1
- [ ] Main feature 2`}
            className="w-full h-40 sm:h-48 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3
              text-xs sm:text-sm text-gray-700 dark:text-gray-200 font-mono placeholder-gray-400 dark:placeholder-gray-500
              focus:outline-none focus:border-gray-900 dark:focus:border-gray-500 focus:shadow-3d-sm
              transition-all resize-none"
          />

          {/* Project directory input */}
          <div className="mt-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm sm:text-base">📁</span>
              <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                Project Directory
              </label>
              <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">(optional)</span>
            </div>
            <input
              type="text"
              value={projectDirectory}
              onChange={(e) => handleProjectDirectoryChange(e.target.value)}
              placeholder="/Users/you/your-project"
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 sm:px-3 py-2
                text-xs sm:text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 font-mono
                focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
            />
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2">
              Where's your code? Point this to your project folder and we'll:
            </p>
            <ul className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1 space-y-0.5 ml-3">
              <li>• Scan your code to find tasks you've already finished</li>
              <li>• Let Claude read and edit files when you start a task</li>
            </ul>
          </div>

          {error && (
            <p className="text-red-500 dark:text-red-400 text-xs sm:text-sm mt-3">{error}</p>
          )}

          {/* Parse button */}
          <button
            onClick={handleParse}
            disabled={!markdown.trim()}
            className="w-full mt-4 py-2.5 sm:py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base
              border-2 border-gray-900 dark:border-gray-100
              hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors"
          >
            Parse PRD
          </button>
        </div>

        <p className="text-center text-gray-400 dark:text-gray-500 text-xs sm:text-sm mt-4 sm:mt-6 px-4">
          Your PRD stays local — nothing is sent to our servers
        </p>
      </div>
    </div>
  );
}
