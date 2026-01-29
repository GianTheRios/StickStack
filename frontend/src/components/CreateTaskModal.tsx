import { useState } from 'react';
import type { TaskPriority } from '../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, description?: string, priority?: TaskPriority) => Promise<void>;
}

const priorityOptions = [
  { value: 'low' as const, label: 'Low', bg: 'note-mint', dot: 'bg-emerald-400' },
  { value: 'medium' as const, label: 'Normal', bg: 'note-yellow', dot: 'bg-amber-400' },
  { value: 'high' as const, label: 'Urgent', bg: 'note-coral', dot: 'bg-red-400' },
];

export function CreateTaskModal({ isOpen, onClose, onCreate }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreate(title.trim(), description.trim() || undefined, priority);
      setTitle('');
      setDescription('');
      setPriority('medium');
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOption = priorityOptions.find(p => p.value === priority)!;

  return (
    <div
      className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl border-2 border-gray-900 dark:border-gray-600 shadow-3d w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header with color preview */}
        <div className={`${selectedOption.bg} px-4 sm:px-5 py-3 sm:py-4 rounded-t-[10px] sm:rounded-t-[14px] border-b-2 border-gray-900 dark:border-gray-600 transition-colors duration-200`}>
          <h2 className="font-hand text-xl sm:text-2xl font-bold text-gray-900">
            New Task
          </h2>
        </div>

        <div className="p-4 sm:p-5">
          <form onSubmit={handleSubmit}>
            <div className="mb-3 sm:mb-4">
              <label htmlFor="title" className="block text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 sm:mb-1.5 uppercase tracking-wide">
                Task
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-600 rounded-lg px-2.5 sm:px-3 py-2 sm:py-2.5
                  text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:shadow-3d-sm
                  transition-shadow"
                placeholder="What needs to be done?"
                autoFocus
              />
            </div>

            <div className="mb-4 sm:mb-5">
              <label htmlFor="description" className="block text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 sm:mb-1.5 uppercase tracking-wide">
                Details for Claude
                <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(optional)</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-600 rounded-lg px-2.5 sm:px-3 py-2 sm:py-2.5
                  text-xs sm:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:shadow-3d-sm
                  transition-shadow resize-none"
                placeholder="Add context or instructions..."
                rows={3}
              />
            </div>

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
                        ? `${option.bg} border-gray-900 dark:border-gray-600 shadow-3d-sm`
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                      <div className={`${option.dot} w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full`} />
                      <span className={priority === option.value ? 'text-gray-900' : ''}>
                        {option.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="px-4 sm:px-5 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-xs sm:text-sm font-semibold
                  border-2 border-gray-900 dark:border-gray-100
                  hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed
                  transition-colors"
              >
                {isSubmitting ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
