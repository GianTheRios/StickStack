import { useState, useEffect } from 'react';
import type { Task, TaskPriority, TaskStatus, ClaudeModel } from '../types';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMoveToInProgress: (id: string) => Promise<void>;
}

const priorityOptions: { value: TaskPriority; label: string; dot: string }[] = [
  { value: 'low', label: 'Low', dot: 'bg-emerald-400' },
  { value: 'medium', label: 'Normal', dot: 'bg-amber-400' },
  { value: 'high', label: 'Urgent', dot: 'bg-red-400' },
];

const statusLabels: Record<TaskStatus, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' },
  todo: { label: 'To Do', color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' },
  in_progress: { label: 'In Progress', color: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300' },
  done: { label: 'Done', color: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' },
};

const modelOptions: { value: ClaudeModel; label: string; description: string }[] = [
  { value: 'opus', label: 'Opus 4.5', description: 'Most capable, best for complex tasks' },
  { value: 'sonnet', label: 'Sonnet 4', description: 'Fast and capable, good balance' },
  { value: 'haiku', label: 'Haiku 3.5', description: 'Fastest, good for simple tasks' },
];

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onMoveToInProgress,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [claudeModel, setClaudeModel] = useState<ClaudeModel>('opus');
  const [ralphEnabled, setRalphEnabled] = useState(false);
  const [ralphMaxIterations, setRalphMaxIterations] = useState(10);
  const [ralphCompletionPromise, setRalphCompletionPromise] = useState('TASK_COMPLETE');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync local state with task prop
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setClaudeModel(task.claude_model || 'opus');
      setRalphEnabled(!!task.ralph_enabled);
      setRalphMaxIterations(task.ralph_max_iterations || 10);
      setRalphCompletionPromise(task.ralph_completion_promise || 'TASK_COMPLETE');
      setShowDeleteConfirm(false);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const hasChanges =
    title !== task.title ||
    description !== (task.description || '') ||
    priority !== task.priority ||
    claudeModel !== (task.claude_model || 'opus') ||
    ralphEnabled !== !!task.ralph_enabled ||
    ralphMaxIterations !== (task.ralph_max_iterations || 10) ||
    ralphCompletionPromise !== (task.ralph_completion_promise || 'TASK_COMPLETE');

  const handleSave = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      await onUpdate(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        claude_model: claudeModel,
        ralph_enabled: ralphEnabled ? 1 : 0,
        ralph_max_iterations: ralphMaxIterations,
        ralph_completion_promise: ralphCompletionPromise.trim() || 'TASK_COMPLETE',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(task.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRunWithClaude = async () => {
    await onMoveToInProgress(task.id);
    onClose();
  };

  const statusInfo = statusLabels[task.status];
  const isWorking = task.status === 'in_progress';
  const canRunClaude = task.status === 'backlog' || task.status === 'todo';

  return (
    <div
      className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border-2 border-gray-900 dark:border-gray-600 shadow-3d w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {isWorking && (
              <span className="flex items-center gap-1 sm:gap-1.5 text-orange-500 dark:text-orange-400">
                <span className="claude-working text-xs sm:text-sm">✏️</span>
                <span className="text-[10px] sm:text-xs font-semibold">Claude is working</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Title */}
          <div className="mb-3 sm:mb-4">
            <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 sm:mb-1.5 uppercase tracking-wide">
              Task
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg px-2.5 sm:px-3 py-2 sm:py-2.5
                text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:border-gray-900 dark:focus:border-gray-500 focus:shadow-3d-sm
                transition-all"
              placeholder="Task title"
            />
          </div>

          {/* Description */}
          <div className="mb-4 sm:mb-5">
            <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 sm:mb-1.5 uppercase tracking-wide">
              Description / Instructions for Claude
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg px-2.5 sm:px-3 py-2 sm:py-2.5
                text-xs sm:text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:border-gray-900 dark:focus:border-gray-500 focus:shadow-3d-sm
                transition-all resize-none"
              placeholder="Add context, requirements, or instructions for Claude..."
              rows={4}
            />
          </div>

          {/* Priority */}
          <div className="mb-5 sm:mb-6">
            <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 sm:mb-2 uppercase tracking-wide">
              Priority
            </label>
            <div className="flex gap-1.5 sm:gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  className={`
                    flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg
                    text-xs sm:text-sm font-medium
                    transition-all duration-150
                    border-2
                    ${priority === option.value
                      ? 'border-gray-900 dark:border-gray-500 shadow-3d-sm bg-gray-50 dark:bg-gray-800'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <div className={`${option.dot} w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full`} />
                    <span className={priority === option.value ? 'text-gray-900 dark:text-gray-100' : ''}>
                      {option.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Claude Model */}
          <div className="mb-5 sm:mb-6">
            <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 sm:mb-2 uppercase tracking-wide">
              Claude Model
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2">
              {modelOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setClaudeModel(option.value)}
                  className={`
                    py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-lg text-left
                    transition-all duration-150
                    border-2
                    ${claudeModel === option.value
                      ? 'border-gray-900 dark:border-gray-500 shadow-3d-sm bg-gray-50 dark:bg-gray-800'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <div className={`text-xs sm:text-sm font-medium ${claudeModel === option.value ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    {option.label}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Ralph Loop Configuration */}
          <div className="mb-5 sm:mb-6 p-3 sm:p-4 bg-sky-50 dark:bg-sky-950/30 rounded-lg sm:rounded-xl border-2 border-sky-200 dark:border-sky-800">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg">🔄</span>
                <label className="text-xs sm:text-sm font-semibold text-sky-700 dark:text-sky-300">
                  Ralph Loop
                </label>
              </div>
              <button
                type="button"
                onClick={() => setRalphEnabled(!ralphEnabled)}
                className={`
                  relative w-10 sm:w-12 h-6 sm:h-7 rounded-full transition-colors flex items-center
                  ${ralphEnabled
                    ? 'bg-sky-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                  }
                `}
              >
                <span
                  className={`
                    absolute w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-white shadow-sm transition-all duration-200
                    ${ralphEnabled ? 'left-5 sm:left-6' : 'left-1'}
                  `}
                />
              </button>
            </div>
            <p className="text-[10px] sm:text-xs text-sky-600 dark:text-sky-400 mb-2 sm:mb-3">
              Claude will iterate on this task until a completion promise is detected.
            </p>

            <div
              className="grid transition-all duration-300 ease-out"
              style={{
                gridTemplateRows: ralphEnabled ? '1fr' : '0fr',
                opacity: ralphEnabled ? 1 : 0,
              }}
            >
              <div className="overflow-hidden">
                <div className="space-y-2 sm:space-y-3 pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-sky-200 dark:border-sky-700">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <label className="text-[10px] sm:text-xs font-medium text-sky-700 dark:text-sky-300 sm:w-28">
                      Max Iterations
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={ralphMaxIterations}
                      onChange={(e) => setRalphMaxIterations(Math.max(1, Math.min(50, parseInt(e.target.value) || 10)))}
                      className="flex-1 bg-white dark:bg-gray-800 border-2 border-sky-200 dark:border-sky-700 rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5
                        text-xs sm:text-sm text-gray-900 dark:text-gray-100
                        focus:outline-none focus:border-sky-500 dark:focus:border-sky-400
                        transition-all"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <label className="text-[10px] sm:text-xs font-medium text-sky-700 dark:text-sky-300 sm:w-28">
                      Promise Text
                    </label>
                    <input
                      type="text"
                      value={ralphCompletionPromise}
                      onChange={(e) => setRalphCompletionPromise(e.target.value)}
                      placeholder="TASK_COMPLETE"
                      className="flex-1 bg-white dark:bg-gray-800 border-2 border-sky-200 dark:border-sky-700 rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5
                        text-xs sm:text-sm text-gray-900 dark:text-gray-100 font-mono
                        focus:outline-none focus:border-sky-500 dark:focus:border-sky-400
                        transition-all"
                    />
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-sky-500 dark:text-sky-400 break-all">
                    Claude should output <code className="bg-sky-100 dark:bg-sky-900 px-1 rounded">&lt;promise&gt;{ralphCompletionPromise || 'TASK_COMPLETE'}&lt;/promise&gt;</code> when done.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Claude Output */}
          {task.claude_output && (
            <div className="mb-5 sm:mb-6">
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 sm:mb-2 uppercase tracking-wide">
                Claude's Output
              </label>
              <div className="bg-gray-900 dark:bg-gray-950 rounded-lg sm:rounded-xl p-3 sm:p-4 max-h-48 sm:max-h-64 overflow-y-auto border dark:border-gray-700">
                <pre className="text-xs sm:text-sm text-gray-100 font-mono whitespace-pre-wrap">
                  {task.claude_output}
                </pre>
              </div>
            </div>
          )}

          {/* Run with Claude button */}
          {canRunClaude && (
            <button
              onClick={handleRunWithClaude}
              className="w-full py-2.5 sm:py-3 bg-orange-500 text-white rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base
                border-2 border-orange-600 shadow-3d-sm
                hover:bg-orange-400 hover:-translate-x-0.5 hover:-translate-y-0.5
                transition-all flex items-center justify-center gap-2"
            >
              <span className="text-base sm:text-lg">✏️</span>
              Run with Claude
            </button>
          )}

          {isWorking && (
            <div className="bg-orange-50 dark:bg-orange-950 border-2 border-orange-200 dark:border-orange-800 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
              <span className="claude-working text-xl sm:text-2xl inline-block mb-2">✏️</span>
              <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-300 font-medium">
                Claude is currently working on this task...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs sm:text-sm text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                Delete task
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-red-500 dark:text-red-400">Delete?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-2 sm:px-3 py-1 bg-red-500 text-white text-xs sm:text-sm rounded-lg hover:bg-red-600 transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Yes'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {hasChanges ? 'Discard' : 'Close'}
            </button>
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={isSaving || !title.trim()}
                className="px-4 sm:px-5 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-xs sm:text-sm font-semibold
                  border-2 border-gray-900 dark:border-gray-100
                  hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed
                  transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
