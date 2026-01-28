import { useState, useEffect } from 'react';

interface ProjectSettingsProps {
  projectDirectory: string;
  allowShellCommands: boolean;
  onSettingsChange: (settings: { projectDirectory: string; allowShellCommands: boolean }) => void;
}

const STORAGE_KEY = 'stickstack_project_settings';

export function useProjectSettings() {
  const [projectDirectory, setProjectDirectory] = useState('');
  const [allowShellCommands, setAllowShellCommands] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProjectDirectory(parsed.projectDirectory || '');
        setAllowShellCommands(parsed.allowShellCommands || false);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save to localStorage when settings change
  const updateSettings = (settings: { projectDirectory: string; allowShellCommands: boolean }) => {
    setProjectDirectory(settings.projectDirectory);
    setAllowShellCommands(settings.allowShellCommands);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  };

  return {
    projectDirectory,
    allowShellCommands,
    updateSettings,
    isConfigured: !!projectDirectory,
  };
}

export function ProjectSettings({ projectDirectory, allowShellCommands, onSettingsChange }: ProjectSettingsProps) {
  const [isEditing, setIsEditing] = useState(!projectDirectory);
  const [localDir, setLocalDir] = useState(projectDirectory);
  const [localShell, setLocalShell] = useState(allowShellCommands);

  useEffect(() => {
    setLocalDir(projectDirectory);
    setLocalShell(allowShellCommands);
  }, [projectDirectory, allowShellCommands]);

  const handleSave = () => {
    onSettingsChange({ projectDirectory: localDir.trim(), allowShellCommands: localShell });
    setIsEditing(false);
  };

  if (!isEditing && projectDirectory) {
    return (
      <div className="bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-600 rounded-xl shadow-3d-sm px-4 py-3 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">📁</span>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Project</p>
              <p className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate max-w-md">
                {projectDirectory}
              </p>
            </div>
            {allowShellCommands && (
              <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                ⚡ Shell Enabled
              </span>
            )}
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-600 rounded-xl shadow-3d-sm p-4 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📁</span>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Project Settings</h3>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Set your project directory so Claude can read and edit your code.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            Project Directory
          </label>
          <input
            type="text"
            value={localDir}
            onChange={(e) => setLocalDir(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5
              text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 font-mono
              focus:outline-none focus:border-gray-900 dark:focus:border-gray-500 focus:shadow-3d-sm
              transition-all"
            placeholder="/Users/you/your-project"
          />
        </div>

        {localDir && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚡</span>
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Allow shell commands
                  </span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Let Claude run npm, git, and other commands to fully build your project.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLocalShell(!localShell)}
                className={`
                  relative w-12 h-7 rounded-full transition-colors flex items-center ml-3
                  ${localShell
                    ? 'bg-amber-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                  }
                `}
              >
                <span
                  className={`
                    absolute w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200
                    ${localShell ? 'left-6' : 'left-1'}
                  `}
                />
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!localDir.trim()}
            className="flex-1 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-sm font-semibold
              border-2 border-gray-900 dark:border-gray-100
              hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors"
          >
            Save Settings
          </button>
          {projectDirectory && (
            <button
              onClick={() => {
                setLocalDir(projectDirectory);
                setLocalShell(allowShellCommands);
                setIsEditing(false);
              }}
              className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
