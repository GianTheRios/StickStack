import { Router, type Request, type Response } from 'express';
import { getAllTasks, getTaskById, createTask, updateTask, deleteTask } from '../services/database.js';
import { startClaudeTask, cancelClaudeTask, runRalphLoop, cancelRalphLoop, isRalphLoopRunning } from '../services/claude.js';
import type { CreateTaskInput, UpdateTaskInput } from '../types/index.js';

type BroadcastFn = (type: string, payload: unknown) => void;

export function createTasksRouter(broadcast: BroadcastFn): Router {
  const router = Router();

  // GET /api/tasks - List all tasks
  router.get('/', (_req: Request, res: Response) => {
    const tasks = getAllTasks();
    res.json(tasks);
  });

  // GET /api/tasks/:id - Get single task
  router.get('/:id', (req: Request, res: Response) => {
    const task = getTaskById(req.params.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(task);
  });

  // POST /api/tasks - Create new task
  router.post('/', (req: Request, res: Response) => {
    const input: CreateTaskInput = req.body;

    if (!input.title || typeof input.title !== 'string') {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const task = createTask(input);
    broadcast('task:created', task);
    res.status(201).json(task);
  });

  // PATCH /api/tasks/:id - Update task
  router.patch('/:id', async (req: Request, res: Response) => {
    const input: UpdateTaskInput = req.body;
    const previousTask = getTaskById(req.params.id);

    if (!previousTask) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const task = updateTask(req.params.id, input);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    broadcast('task:updated', task);

    // If status changed to in_progress, start Claude (or Ralph loop)
    if (input.status === 'in_progress' && previousTask.status !== 'in_progress') {
      // Check if Ralph loop is enabled
      if (task.ralph_enabled) {
        // Reset Ralph state for new run
        updateTask(task.id, {
          ralph_current_iteration: 0,
          ralph_status: null,
        });
        // Start Ralph loop asynchronously
        runRalphLoop(task, broadcast).catch(console.error);
      } else {
        // Start regular Claude task asynchronously
        startClaudeTask(task, broadcast).catch(console.error);
      }
    }

    // If status changed from in_progress to something else, cancel Claude/Ralph
    if (previousTask.status === 'in_progress' && input.status && input.status !== 'in_progress') {
      cancelClaudeTask(task.id);
      cancelRalphLoop(task.id);
    }

    res.json(task);
  });

  // DELETE /api/tasks/:id - Delete task
  router.delete('/:id', (req: Request, res: Response) => {
    const taskId = req.params.id;

    // Cancel any running Claude process or Ralph loop
    cancelClaudeTask(taskId);
    cancelRalphLoop(taskId);

    const deleted = deleteTask(taskId);
    if (!deleted) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    broadcast('task:deleted', { id: taskId });
    res.status(204).send();
  });

  return router;
}
