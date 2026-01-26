export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  claude_output: string | null;
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
}

export interface WebSocketMessage {
  type: 'task:created' | 'task:updated' | 'task:deleted' | 'claude:progress' | 'claude:complete';
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
