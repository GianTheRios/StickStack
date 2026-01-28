import { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { StickyNote } from './StickyNote';
import type { Task, TaskStatus } from '../types';

interface ColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onDeleteTask: (id: string) => void;
  onTaskClick?: (task: Task) => void;
}

const columnConfig: Record<TaskStatus, { icon: string }> = {
  backlog: { icon: '📋' },
  todo: { icon: '📝' },
  in_progress: { icon: '✏️' },
  done: { icon: '✓' },
};

const COLLAPSE_THRESHOLD = 10;
const VISIBLE_WHEN_COLLAPSED = 3;

export function Column({ id, title, tasks, onDeleteTask, onTaskClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const config = columnConfig[id];
  const isClaudeColumn = id === 'in_progress';

  const shouldOfferCollapse = tasks.length >= COLLAPSE_THRESHOLD;
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset expanded state when tasks drop below threshold
  useEffect(() => {
    if (!shouldOfferCollapse) {
      setIsExpanded(false);
    }
  }, [shouldOfferCollapse]);

  const showCollapsed = shouldOfferCollapse && !isExpanded;
  const visibleTasks = showCollapsed ? tasks.slice(0, VISIBLE_WHEN_COLLAPSED) : tasks;
  const hiddenCount = Math.max(0, tasks.length - VISIBLE_WHEN_COLLAPSED);

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-1 min-w-[280px]
        bg-white dark:bg-gray-900 rounded-2xl
        border-2 border-gray-900 dark:border-gray-600
        shadow-3d
        ${isOver ? 'shadow-3d-hover -translate-x-px -translate-y-px' : ''}
        transition-all duration-150
      `}
    >
      {/* Column header */}
      <div className="px-4 py-3 border-b-2 border-gray-900 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-base ${id === 'done' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}>
              {config.icon}
            </span>
            <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {title}
            </h2>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium tabular-nums">
            {tasks.length}
          </span>
        </div>
        {isClaudeColumn && (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
            Drop here to start Claude
          </p>
        )}
      </div>

      {/* Tasks area */}
      <div className="p-3 min-h-[200px] max-h-[calc(100vh-220px)] overflow-y-auto scrollbar-thin">
        <div className="flex flex-col gap-3 items-center">
          {visibleTasks.map((task) => (
            <StickyNote
              key={task.id}
              task={task}
              onDelete={onDeleteTask}
              onClick={() => onTaskClick?.(task)}
            />
          ))}
        </div>

        {/* Collapsed stack indicator */}
        {showCollapsed && hiddenCount > 0 && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsExpanded(true);
            }}
            className="w-full mt-3 relative"
            type="button"
          >
            {/* Stacked card visual */}
            <div className="relative h-16">
              <div className="absolute inset-x-2 top-2 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg border-2 border-gray-300 dark:border-gray-600 opacity-60" />
              <div className="absolute inset-x-1 top-1 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 opacity-80" />
              <div className="absolute inset-x-0 top-0 h-10 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-900 dark:border-gray-600 shadow-3d-sm
                flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">+{hiddenCount} more</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </button>
        )}

        {/* Collapse button when expanded and many tasks */}
        {isExpanded && shouldOfferCollapse && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsExpanded(false);
            }}
            type="button"
            className="w-full mt-3 py-2 text-xs text-gray-400 hover:text-gray-300 dark:hover:text-gray-300
              flex items-center justify-center gap-1 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            Collapse
          </button>
        )}

        {tasks.length === 0 && (
          <div className={`
            flex flex-col items-center justify-center
            py-12 px-4 h-[180px]
            border-2 border-dashed rounded-xl
            ${isOver ? 'border-orange-400 bg-orange-50 dark:bg-orange-950' : 'border-gray-200 dark:border-gray-700'}
            transition-colors duration-150
          `}>
            <span className={`text-2xl mb-2 ${isOver ? 'opacity-100' : 'opacity-30'}`}>
              {config.icon}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {isClaudeColumn ? 'Drop to assign to Claude' : 'Drop tasks here'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
