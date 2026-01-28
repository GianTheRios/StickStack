import { useState } from 'react';
import type { Task, TaskStatus } from '../types';

interface ProgressTrackerProps {
  tasks: Task[];
  onToggleTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;
}

export function ProgressTracker({ tasks, onToggleTask }: ProgressTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if no tasks
  if (tasks.length === 0) {
    return null;
  }

  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const totalCount = tasks.length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  const isComplete = percentage === 100;

  // Check if tasks have phases
  const hasPhases = tasks.some((t) => t.phase);

  // Group tasks by phase
  const getTasksByPhase = () => {
    const phases = new Map<string, Task[]>();
    tasks.forEach((task) => {
      const phase = task.phase || 'Unassigned';
      if (!phases.has(phase)) {
        phases.set(phase, []);
      }
      phases.get(phase)!.push(task);
    });
    return Array.from(phases.entries()).map(([name, phaseTasks]) => ({
      name,
      tasks: phaseTasks,
      completedCount: phaseTasks.filter((t) => t.status === 'done').length,
      totalCount: phaseTasks.length,
    }));
  };

  const handleToggle = async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    await onToggleTask(task.id, newStatus);
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-2 border-gray-900 dark:border-gray-600 rounded-2xl shadow-3d overflow-hidden mb-5">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          <span className="text-lg">{isComplete ? '🎉' : '📊'}</span>
          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            Progress
          </span>
          <div className="flex-1 max-w-[200px] mx-3">
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {completedCount}/{totalCount} ({percentage}%)
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expandable section */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-3 pt-1 border-t border-gray-100 dark:border-gray-700 max-h-[300px] overflow-y-auto custom-scrollbar">
            {hasPhases ? (
              <div className="space-y-4">
                {getTasksByPhase().map((phase) => (
                  <div key={phase.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {phase.name}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {phase.completedCount}/{phase.totalCount}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {phase.tasks.map((task) => (
                        <TaskCheckbox
                          key={task.id}
                          task={task}
                          onToggle={handleToggle}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1 pt-1">
                {tasks.map((task) => (
                  <TaskCheckbox
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TaskCheckboxProps {
  task: Task;
  onToggle: (task: Task) => void;
}

function TaskCheckbox({ task, onToggle }: TaskCheckboxProps) {
  const isDone = task.status === 'done';

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle(task);
      }}
      className="w-full flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left group"
    >
      <div
        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
          isDone
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400 dark:group-hover:border-gray-500'
        }`}
      >
        {isDone && (
          <svg
            className="w-2.5 h-2.5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
      <span
        className={`text-sm flex-1 transition-colors ${
          isDone
            ? 'text-gray-400 dark:text-gray-500 line-through'
            : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {task.title}
      </span>
      {task.priority && (
        <span
          className={`w-2 h-2 rounded-full ${
            task.priority === 'high'
              ? 'bg-red-400'
              : task.priority === 'medium'
              ? 'bg-amber-400'
              : 'bg-blue-400'
          }`}
        />
      )}
    </button>
  );
}
