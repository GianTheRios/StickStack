import { Router, type Request, type Response } from 'express';
import { existsSync, statSync } from 'fs';
import { analyzeCodebase, type TaskInput, type AnalysisResult } from '../services/analysis.js';
import { validateProjectDirectory, sanitizeTaskText } from '../utils/security.js';

type BroadcastFn = (type: string, payload: unknown) => void;

interface AnalyzeRequestBody {
  projectDirectory: string;
  tasks: TaskInput[];
}

export function createAnalysisRouter(broadcast: BroadcastFn): Router {
  const router = Router();

  // POST /api/analysis/codebase - Analyze codebase for completed tasks
  router.post('/codebase', async (req: Request, res: Response) => {
    const body = req.body as AnalyzeRequestBody;

    // Validate request body
    if (!body.projectDirectory || typeof body.projectDirectory !== 'string') {
      res.status(400).json({ error: 'projectDirectory is required' });
      return;
    }

    if (!body.tasks || !Array.isArray(body.tasks) || body.tasks.length === 0) {
      res.status(400).json({ error: 'tasks array is required and must not be empty' });
      return;
    }

    // Validate directory path is safe
    const pathValidation = validateProjectDirectory(body.projectDirectory);
    if (!pathValidation.valid) {
      res.status(400).json({ error: pathValidation.error });
      return;
    }

    // Validate directory exists and is a directory
    if (!existsSync(body.projectDirectory)) {
      res.status(400).json({ error: 'Directory does not exist' });
      return;
    }

    try {
      const stats = statSync(body.projectDirectory);
      if (!stats.isDirectory()) {
        res.status(400).json({ error: 'Path is not a directory' });
        return;
      }
    } catch {
      res.status(400).json({ error: 'Cannot access directory' });
      return;
    }

    // Validate and sanitize tasks
    const sanitizedTasks: TaskInput[] = [];
    for (const task of body.tasks) {
      if (!task.title || typeof task.title !== 'string') {
        res.status(400).json({ error: 'Each task must have a title' });
        return;
      }
      sanitizedTasks.push({
        title: sanitizeTaskText(task.title),
        description: sanitizeTaskText(task.description),
      });
    }

    try {
      const results: AnalysisResult[] = await analyzeCodebase(
        body.projectDirectory,
        sanitizedTasks,
        broadcast
      );

      res.json({ results });
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
