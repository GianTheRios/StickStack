export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  claude_output: string | null;
  phase?: string;
  created_at: string;
  updated_at: string;
}

export interface Phase {
  id: string;
  name: string;
  description?: string;
  tasks: Task[];
}

export interface PRD {
  id: string;
  title: string;
  overview: string;
  techStack: TechStackItem[];
  phases: Phase[];
  rawMarkdown: string;
  createdAt: string;
}

export interface TechStackItem {
  category: string;
  technology: string;
}

export interface Column {
  id: TaskStatus;
  title: string;
}

export const COLUMNS: Column[] = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

export interface WebSocketMessage {
  type: 'task:created' | 'task:updated' | 'task:deleted' | 'claude:progress' | 'claude:complete';
  payload: unknown;
}

export interface ClaudeProgress {
  taskId: string;
  message: string;
}

// View modes for the app
export type ViewMode = 'upload' | 'prd' | 'kanban';
