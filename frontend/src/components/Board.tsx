import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import confetti from 'canvas-confetti';
import { Column } from './Column';
import { StickyNote } from './StickyNote';
import { StatusPanel } from './StatusPanel';
import { ProgressTracker } from './ProgressTracker';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskDetailModal } from './TaskDetailModal';
import { ThemeToggle } from './ThemeToggle';
import { ProjectSettings, useProjectSettings } from './ProjectSettings';
import { useTasks } from '../hooks/useTasks';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Task, TaskStatus } from '../types';
import { COLUMNS } from '../types';
import type { ParsedPRD } from './PRDUpload';

// Celebration confetti burst (debounced to prevent spam during bulk imports)
let confettiTimeout: ReturnType<typeof setTimeout> | null = null;

function celebrateCompletion() {
  // Debounce: only fire once even if multiple tasks complete at the same time
  if (confettiTimeout) return;

  confettiTimeout = setTimeout(() => {
    confettiTimeout = null;
  }, 1000); // 1 second debounce window

  const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];

  // Big initial burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0.5, y: 0.6 },
    colors,
  });

  // Side cannons
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors,
    });
  }, 150);

  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors,
    });
  }, 300);
}

interface BoardProps {
  initialPRD?: ParsedPRD | null;
  onBackToPRD?: () => void;
}

export function Board({ initialPRD, onBackToPRD }: BoardProps) {
  const { tasks, isLoading, createTask, updateTask, deleteTask, moveTask, setTasks } = useTasks();
  const { isConnected, claudeProgress, ralphProgress, onTaskCreated, onTaskUpdated, onTaskDeleted } = useWebSocket();
  const { projectDirectory, allowShellCommands, updateSettings } = useProjectSettings();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const prevTaskStatusRef = useRef<Map<string, TaskStatus>>(new Map());

  // Configure drag sensor with activation constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag starts
      },
    })
  );

  // Initialize status tracking for existing tasks
  useEffect(() => {
    tasks.forEach((task) => {
      if (!prevTaskStatusRef.current.has(task.id)) {
        prevTaskStatusRef.current.set(task.id, task.status);
      }
    });
  }, [tasks]);

  // Handle WebSocket events
  useEffect(() => {
    onTaskCreated((task) => {
      prevTaskStatusRef.current.set(task.id, task.status);
      setTasks((prev) => {
        if (prev.some((t) => t.id === task.id)) return prev;
        return [task, ...prev];
      });
    });

    onTaskUpdated((task) => {
      // Check if task just moved to done (e.g., Claude/Ralph completed it)
      const prevStatus = prevTaskStatusRef.current.get(task.id);
      if (task.status === 'done' && prevStatus && prevStatus !== 'done') {
        celebrateCompletion();
      }
      prevTaskStatusRef.current.set(task.id, task.status);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    });

    onTaskDeleted((id) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    });
  }, [onTaskCreated, onTaskUpdated, onTaskDeleted, setTasks]);

  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Celebrate if moving to done!
    if (newStatus === 'done' && task.status !== 'done') {
      celebrateCompletion();
    }

    // Update tracking ref
    prevTaskStatusRef.current.set(taskId, newStatus);

    // When moving to in_progress, apply global settings if task doesn't have its own
    const updates: Partial<Task> = { status: newStatus };
    if (newStatus === 'in_progress' && projectDirectory) {
      if (!task.project_directory) {
        updates.project_directory = projectDirectory;
      }
      if (!task.allow_shell_commands && allowShellCommands) {
        updates.allow_shell_commands = 1;
      }
    }

    // Optimistically update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );

    try {
      await updateTask(taskId, updates);
    } catch (error) {
      // Revert on error
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
      );
      console.error('Failed to move task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(id);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleCreateTask = async (title: string, description?: string, priority?: 'low' | 'medium' | 'high') => {
    await createTask(title, description, priority);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 dark:text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="p-6 max-w-[1500px] mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              {onBackToPRD && (
                <button
                  onClick={onBackToPRD}
                  className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  title="Back to PRD"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                {initialPRD?.title || 'StickStack'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                  px-4 py-2 rounded-xl
                  text-sm font-semibold
                  border-2 border-gray-900 dark:border-gray-600
                  shadow-3d-sm
                  hover:shadow-3d hover:-translate-x-px hover:-translate-y-px
                  active:shadow-none active:translate-x-[3px] active:translate-y-[3px]
                  transition-all duration-150
                  flex items-center gap-2"
              >
                <span className="text-base leading-none">+</span>
                New Task
              </button>
            </div>
          </div>

          <StatusPanel
            progress={claudeProgress}
            ralphProgress={ralphProgress}
            isConnected={isConnected}
            tasks={tasks}
          />
        </header>

        <ProjectSettings
          projectDirectory={projectDirectory}
          allowShellCommands={allowShellCommands}
          onSettingsChange={updateSettings}
        />

        <ProgressTracker tasks={tasks} onToggleTask={moveTask} />

        {/* Board */}
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-5 overflow-x-auto pb-6">
            {COLUMNS.map((column) => (
              <Column
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={getTasksByStatus(column.id)}
                onDeleteTask={handleDeleteTask}
                onTaskClick={(task) => setSelectedTask(task)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="rotate-3 scale-105 w-[260px]">
                <StickyNote task={activeTask} onDelete={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTask}
      />

      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={async (id, updates) => {
          await updateTask(id, updates);
          // Update selected task with new data
          setSelectedTask((prev) => prev ? { ...prev, ...updates } : null);
        }}
        onDelete={async (id) => {
          await deleteTask(id);
        }}
        onMoveToInProgress={async (id) => {
          await moveTask(id, 'in_progress');
        }}
      />
    </div>
  );
}
