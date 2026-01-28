import { useState, useEffect } from 'react';
import type { Task, TaskPriority, TaskStatus } from '../types';

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
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync local state with task prop
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setShowDeleteConfirm(false);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const hasChanges =
    title !== task.title ||
    description !== (task.description || '') ||
    priority !== task.priority;

  const handleSave = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      await onUpdate(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
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
      className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-900 dark:border-gray-600 shadow-3d w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {isWorking && (
              <span className="flex items-center gap-1.5 text-orange-500 dark:text-orange-400">
                <span className="claude-working text-sm">✏️</span>
                <span className="text-xs font-semibold">Claude is working</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Title */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Task
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5
                text-lg font-semibold text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:border-gray-900 dark:focus:border-gray-500 focus:shadow-3d-sm
                transition-all"
              placeholder="Task title"
            />
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Description / Instructions for Claude
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5
                text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:border-gray-900 dark:focus:border-gray-500 focus:shadow-3d-sm
                transition-all resize-none"
              placeholder="Add context, requirements, or instructions for Claude..."
              rows={4}
            />
          </div>

          {/* Priority */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Priority
            </label>
            <div className="flex gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  className={`
                    flex-1 py-2.5 px-3 rounded-lg
                    text-sm font-medium
                    transition-all duration-150
                    border-2
                    ${priority === option.value
                      ? 'border-gray-900 dark:border-gray-500 shadow-3d-sm bg-gray-50 dark:bg-gray-800'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className={`${option.dot} w-2 h-2 rounded-full`} />
                    <span className={priority === option.value ? 'text-gray-900 dark:text-gray-100' : ''}>
                      {option.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Claude Output */}
          {task.claude_output && (
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Claude's Output
              </label>
              <div className="bg-gray-900 dark:bg-gray-950 rounded-xl p-4 max-h-64 overflow-y-auto border dark:border-gray-700">
                <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap">
                  {task.claude_output}
                </pre>
              </div>
            </div>
          )}

          {/* Run with Claude button */}
          {canRunClaude && (
            <button
              onClick={handleRunWithClaude}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold
                border-2 border-orange-600 shadow-3d-sm
                hover:bg-orange-400 hover:-translate-x-0.5 hover:-translate-y-0.5
                transition-all flex items-center justify-center gap-2"
            >
              <span className="text-lg">✏️</span>
              Run with Claude
            </button>
          )}

          {isWorking && (
            <div className="bg-orange-50 dark:bg-orange-950 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-4 text-center">
              <span className="claude-working text-2xl inline-block mb-2">✏️</span>
              <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                Claude is currently working on this task...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-sm text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                Delete task
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-500 dark:text-red-400">Delete?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Yes'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {hasChanges ? 'Discard' : 'Close'}
            </button>
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={isSaving || !title.trim()}
                className="px-5 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-sm font-semibold
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
