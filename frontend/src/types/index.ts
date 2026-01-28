export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type RalphStatus = 'iterating' | 'completed' | 'max_reached' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  claude_output: string | null;
  ralph_enabled: number; // SQLite uses 0/1 for boolean
  ralph_max_iterations: number;
  ralph_completion_promise: string;
  ralph_current_iteration: number;
  ralph_status: RalphStatus | null;
  project_directory: string | null;
  allow_shell_commands: number;
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
  type:
    | 'task:created'
    | 'task:updated'
    | 'task:deleted'
    | 'claude:progress'
    | 'claude:complete'
    | 'ralph:iteration_start'
    | 'ralph:iteration_complete'
    | 'ralph:complete';
  payload: unknown;
}

export interface ClaudeProgress {
  taskId: string;
  message: string;
}

export interface RalphProgress {
  taskId: string;
  iteration: number;
  maxIterations: number;
  status: 'iterating' | 'completed' | 'max_reached' | 'cancelled';
}

export interface RalphIterationStartPayload {
  taskId: string;
  iteration: number;
  maxIterations: number;
}

export interface RalphIterationCompletePayload {
  taskId: string;
  iteration: number;
  promiseFound: boolean;
}

export interface RalphCompletePayload {
  taskId: string;
  iteration: number;
  reason: 'promise_fulfilled' | 'max_reached' | 'cancelled' | 'error';
}

// View modes for the app
export type ViewMode = 'upload' | 'prd' | 'kanban';

// Analysis result from codebase analysis
export interface AnalysisResult {
  taskTitle: string;
  status: 'complete' | 'partial' | 'not_started' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  evidence: string;
}
