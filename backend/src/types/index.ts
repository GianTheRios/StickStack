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
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  claude_output?: string;
  ralph_enabled?: boolean;
  ralph_max_iterations?: number;
  ralph_completion_promise?: string;
  ralph_current_iteration?: number;
  ralph_status?: RalphStatus | null;
}

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

export interface ClaudeProgressPayload {
  taskId: string;
  message: string;
}

export interface ClaudeCompletePayload {
  taskId: string;
  result: string;
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
