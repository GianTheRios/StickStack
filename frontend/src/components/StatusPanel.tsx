import type { ClaudeProgress, RalphProgress, Task } from '../types';

interface StatusPanelProps {
  progress: ClaudeProgress | null;
  ralphProgress: RalphProgress | null;
  isConnected: boolean;
  tasks: Task[];
}

export function StatusPanel({ progress, ralphProgress, isConnected, tasks }: StatusPanelProps) {
  const inProgressTask = tasks.find((t) => t.id === progress?.taskId || t.id === ralphProgress?.taskId);
  const isWorking = !!progress || !!ralphProgress;
  const isRalphActive = !!ralphProgress;

  return (
    <div className="bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-600 rounded-xl sm:rounded-2xl shadow-3d overflow-hidden">
      {/* Header */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b-2 border-gray-900 dark:border-gray-600 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <span className={`text-base sm:text-lg ${isWorking ? 'claude-working' : ''}`}>
            {isRalphActive ? '🔄' : isWorking ? '✏️' : '💼'}
          </span>
          <span className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100">
            {isRalphActive ? 'Ralph Loop' : 'Claude'}
          </span>
          {isRalphActive && (
            <span className="bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full">
              {ralphProgress.status === 'iterating'
                ? `${ralphProgress.iteration}/${ralphProgress.maxIterations}`
                : ralphProgress.status === 'completed'
                  ? 'Complete!'
                  : ralphProgress.status === 'max_reached'
                    ? 'Max Reached'
                    : 'Cancelled'}
            </span>
          )}
          {isWorking && !isRalphActive && (
            <span className="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full">
              Working
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-400'}`} />
          <span className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 font-medium hidden xs:inline">
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 sm:px-4 py-2.5 sm:py-3">
        {isWorking ? (
          <div>
            {inProgressTask && (
              <div className="mb-2 sm:mb-2.5">
                <span className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Working on</span>
                <p className="font-hand text-base sm:text-lg text-gray-900 dark:text-gray-100 font-medium leading-tight mt-0.5 line-clamp-2">
                  {inProgressTask.title}
                </p>
              </div>
            )}
            {/* Ralph Progress Bar */}
            {isRalphActive && (
              <div className="mb-2 sm:mb-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] sm:text-[11px] text-sky-600 dark:text-sky-400 font-semibold uppercase tracking-wide">
                    Iteration Progress
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-sky-600 dark:text-sky-400 font-medium">
                    {ralphProgress.iteration}/{ralphProgress.maxIterations}
                  </span>
                </div>
                <div className="h-1.5 sm:h-2 bg-sky-100 dark:bg-sky-900/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 dark:bg-sky-400 transition-all duration-300"
                    style={{
                      width: `${(ralphProgress.iteration / ralphProgress.maxIterations) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-[9px] sm:text-[10px] text-sky-500 dark:text-sky-400 mt-1">
                  {ralphProgress.status === 'iterating'
                    ? 'Waiting for completion promise...'
                    : ralphProgress.status === 'completed'
                      ? 'Promise detected! Task complete.'
                      : ralphProgress.status === 'max_reached'
                        ? 'Max iterations reached without promise.'
                        : 'Loop cancelled.'}
                </p>
              </div>
            )}
            {progress && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 sm:p-3 max-h-20 sm:max-h-24 overflow-y-auto custom-scrollbar border border-gray-100 dark:border-gray-700">
                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed font-mono">
                  {progress.message}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3 py-0.5 sm:py-1">
            <span className="text-lg sm:text-xl opacity-50">☕</span>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Ready to work</p>
              <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
                Drag a task to "In Progress" to get started
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
