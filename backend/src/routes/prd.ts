import { Router, type Request, type Response } from 'express';
import { generateClaudeMd, writeClaudeMd } from '../services/prd.js';

export function createPrdRouter(): Router {
  const router = Router();

  // POST /api/prd/generate-claude-md - Generate CLAUDE.md content (preview only)
  router.post('/generate-claude-md', (req: Request, res: Response) => {
    const { prd } = req.body;

    if (!prd || !prd.title) {
      res.status(400).json({ error: 'Valid PRD data is required' });
      return;
    }

    try {
      const content = generateClaudeMd(prd);
      res.json({ content });
    } catch (error) {
      console.error('Failed to generate CLAUDE.md:', error);
      res.status(500).json({ error: 'Failed to generate CLAUDE.md' });
    }
  });

  // POST /api/prd/write-claude-md - Write CLAUDE.md to project directory
  router.post('/write-claude-md', async (req: Request, res: Response) => {
    const { prd, projectPath } = req.body;

    if (!prd || !prd.title) {
      res.status(400).json({ error: 'Valid PRD data is required' });
      return;
    }

    if (!projectPath || typeof projectPath !== 'string') {
      res.status(400).json({ error: 'Project path is required' });
      return;
    }

    try {
      const filePath = await writeClaudeMd(prd, projectPath);
      res.json({ success: true, filePath });
    } catch (error) {
      console.error('Failed to write CLAUDE.md:', error);
      res.status(500).json({ error: 'Failed to write CLAUDE.md' });
    }
  });

  return router;
}
