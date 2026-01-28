import type { ClaudeProgress, Task } from '../types';

interface StatusPanelProps {
  progress: ClaudeProgress | null;
  isConnected: boolean;
  tasks: Task[];
}

export function StatusPanel({ progress, isConnected, tasks }: StatusPanelProps) {
  const inProgressTask = tasks.find((t) => t.id === progress?.taskId);
  const isWorking = !!progress;

  return (
    <div className="bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-600 rounded-2xl shadow-3d overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b-2 border-gray-900 dark:border-gray-600 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`text-lg ${isWorking ? 'claude-working' : ''}`}>
            {isWorking ? '✏️' : '💼'}
          </span>
          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            Claude
          </span>
          {isWorking && (
            <span className="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              Working
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-400'}`} />
          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {isWorking ? (
          <div>
            {inProgressTask && (
              <div className="mb-2.5">
                <span className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Working on</span>
                <p className="font-hand text-lg text-gray-900 dark:text-gray-100 font-medium leading-tight mt-0.5">
                  {inProgressTask.title}
                </p>
              </div>
            )}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 max-h-24 overflow-y-auto custom-scrollbar border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed font-mono">
                {progress.message}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-1">
            <span className="text-xl opacity-50">☕</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Ready to work</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Drag a task to "In Progress" to get started
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
