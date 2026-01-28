import { useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Task } from '../types';

interface StickyNoteProps {
  task: Task;
  onDelete: (id: string) => void;
  onClick?: () => void;
}

const priorityStyles = {
  high: { bg: 'note-coral', dot: 'bg-red-400' },
  medium: { bg: 'note-yellow', dot: 'bg-amber-400' },
  low: { bg: 'note-mint', dot: 'bg-emerald-400' },
};

export function StickyNote({ task, onDelete, onClick }: StickyNoteProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  // Track if we're dragging to distinguish from clicks
  const didDrag = useRef(false);

  // Reset on pointer down
  const handlePointerDown = (e: React.PointerEvent) => {
    didDrag.current = false;
    listeners?.onPointerDown?.(e);
  };

  // Set flag when drag actually starts (transform changes)
  if (transform && !didDrag.current) {
    didDrag.current = true;
  }

  // Handle click only if we didn't drag
  const handleClick = () => {
    if (!didDrag.current && onClick) {
      onClick();
    }
  };

  // Subtle rotation based on task id
  const rotationDeg = ((task.id.charCodeAt(0) + task.id.charCodeAt(1)) % 5) - 2;
  const isWorking = task.status === 'in_progress';
  const styles = priorityStyles[task.priority];

  const baseTransform = `rotate(${rotationDeg}deg)`;
  const dragTransform = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(3deg)`
    : baseTransform;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: dragTransform,
        zIndex: isDragging ? 100 : 'auto',
        aspectRatio: '1 / 1',
        touchAction: 'none',
      }}
      {...attributes}
      onPointerDown={handlePointerDown}
      onKeyDown={listeners?.onKeyDown}
      onClick={handleClick}
      className={`
        ${styles.bg}
        ${isDragging ? 'shadow-note-hover scale-[1.02]' : 'shadow-note hover:shadow-note-hover hover:-translate-y-0.5'}
        relative cursor-grab active:cursor-grabbing
        transition-all duration-150 ease-out
        w-full max-w-[220px]
        rounded-sm
        p-3
      `}
    >
      {/* Priority dot */}
      <div className="absolute top-2.5 left-2.5">
        <div className={`${styles.dot} w-2 h-2 rounded-full`} />
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center
          text-black/30 hover:text-black/70 hover:bg-black/5
          rounded transition-colors text-lg leading-none"
        title="Delete task"
      >
        ×
      </button>

      {/* Content */}
      <div className="mt-4 h-[calc(100%-2rem)] flex flex-col">
        {/* Task title */}
        <h3 className="font-hand text-lg font-semibold text-gray-900 leading-tight mb-1.5 pr-4 line-clamp-3">
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2 flex-shrink-0">
            {task.description}
          </p>
        )}

        {/* Claude working indicator */}
        {isWorking && (
          <div className="mt-auto pt-2 flex items-center gap-1.5">
            {task.ralph_enabled ? (
              <>
                <span className="claude-working text-sm">🔄</span>
                <span className="text-[10px] font-semibold text-sky-600 tracking-wide">
                  {task.ralph_current_iteration}/{task.ralph_max_iterations}
                </span>
              </>
            ) : (
              <>
                <span className="claude-working text-sm">✏️</span>
                <span className="text-[10px] font-semibold text-orange-500 tracking-wide">
                  Working
                </span>
              </>
            )}
          </div>
        )}

        {/* Ralph enabled badge (when not working) */}
        {!isWorking && !!task.ralph_enabled && (
          <div className="mt-auto pt-2 flex items-center gap-1">
            <span className="text-xs">🔄</span>
            <span className="text-[9px] font-medium text-sky-500 dark:text-sky-400">
              Ralph
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
