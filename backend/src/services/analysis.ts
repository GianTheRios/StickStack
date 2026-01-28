import { spawn, ChildProcess } from 'child_process';

type BroadcastFn = (type: string, payload: unknown) => void;

export interface TaskInput {
  title: string;
  description?: string;
}

export interface AnalysisResult {
  taskTitle: string;
  status: 'complete' | 'partial' | 'not_started' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  evidence: string;
}

interface ClaudeAnalysisOutput {
  results: AnalysisResult[];
}

const ANALYSIS_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Build the prompt for Claude to analyze the codebase
 */
function buildAnalysisPrompt(tasks: TaskInput[]): string {
  const taskList = tasks
    .map((task, index) => `${index + 1}. "${task.title}"`)
    .join('\n');

  return `Analyze this codebase to determine which tasks are already implemented.

TASKS:
${taskList}

APPROACH:
1. Start with glob to understand the project structure
2. Use grep to find task-related keywords (component names, features, routes)
3. Read files to verify implementation when you find matches
4. Be efficient - use grep before reading full files

OUTPUT FORMAT (JSON only, no markdown):
{
  "results": [
    {"taskTitle": "exact title", "status": "complete|partial|not_started", "confidence": "high|medium|low", "evidence": "brief explanation"}
  ]
}

RULES:
- Mark "complete" with "high" confidence only if you found clear evidence
- When uncertain, default to "not_started"
- Keep evidence concise (1 sentence)
- Output ONLY valid JSON, nothing else`;
}

/**
 * Parse Claude's output to extract the analysis results
 */
function parseAnalysisOutput(output: string): AnalysisResult[] | null {
  try {
    // Try to find JSON in the output (Claude might add some text before/after)
    const jsonMatch = output.match(/\{[\s\S]*"results"[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Claude output');
      return null;
    }

    const parsed: ClaudeAnalysisOutput = JSON.parse(jsonMatch[0]);
    if (!parsed.results || !Array.isArray(parsed.results)) {
      console.error('Invalid analysis output structure');
      return null;
    }

    return parsed.results;
  } catch (error) {
    console.error('Failed to parse analysis output:', error);
    return null;
  }
}

/**
 * Analyze a codebase to detect which tasks are already complete
 */
export async function analyzeCodebase(
  projectDirectory: string,
  tasks: TaskInput[],
  broadcast?: BroadcastFn
): Promise<AnalysisResult[]> {
  const prompt = buildAnalysisPrompt(tasks);

  return new Promise((resolve) => {
    let fullOutput = '';
    let timedOut = false;

    // Spawn claude with read-only tools, using Haiku for speed
    const claudeArgs = [
      '-p', prompt,
      '--permission-mode', 'bypassPermissions',
      '--allowedTools', 'Read Glob Grep',
      '--output-format', 'text',
      '--model', 'haiku',
    ];

    broadcast?.('analysis:start', { taskCount: tasks.length });

    const claudeProcess: ChildProcess = spawn('claude', claudeArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
      cwd: projectDirectory,
    });

    // Set up timeout
    const timeoutId = setTimeout(() => {
      timedOut = true;
      claudeProcess.kill('SIGTERM');
      console.log('Analysis timed out after 2 minutes');
    }, ANALYSIS_TIMEOUT_MS);

    claudeProcess.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      fullOutput += text;
      broadcast?.('analysis:progress', { message: text });
    });

    claudeProcess.stderr?.on('data', (data: Buffer) => {
      const text = data.toString();
      // Only log actual errors
      if (text.includes('Error') || text.includes('error')) {
        console.error('Claude stderr:', text);
      }
    });

    claudeProcess.on('close', (code) => {
      clearTimeout(timeoutId);

      if (timedOut) {
        // Return unknown for all tasks on timeout
        const unknownResults: AnalysisResult[] = tasks.map((task) => ({
          taskTitle: task.title,
          status: 'unknown' as const,
          confidence: 'low' as const,
          evidence: 'Analysis timed out',
        }));
        broadcast?.('analysis:complete', { results: unknownResults, timedOut: true });
        resolve(unknownResults);
        return;
      }

      if (code !== 0) {
        console.error(`Claude analysis exited with code ${code}`);
        // Return unknown for all tasks on error
        const unknownResults: AnalysisResult[] = tasks.map((task) => ({
          taskTitle: task.title,
          status: 'unknown' as const,
          confidence: 'low' as const,
          evidence: 'Analysis failed',
        }));
        broadcast?.('analysis:complete', { results: unknownResults, error: true });
        resolve(unknownResults);
        return;
      }

      // Parse the output
      const results = parseAnalysisOutput(fullOutput);

      if (!results) {
        // Return unknown for all tasks if parsing failed
        const unknownResults: AnalysisResult[] = tasks.map((task) => ({
          taskTitle: task.title,
          status: 'unknown' as const,
          confidence: 'low' as const,
          evidence: 'Could not parse analysis results',
        }));
        broadcast?.('analysis:complete', { results: unknownResults, parseError: true });
        resolve(unknownResults);
        return;
      }

      // Ensure all tasks have a result (fill in missing ones)
      const resultsMap = new Map(results.map((r) => [r.taskTitle, r]));
      const completeResults: AnalysisResult[] = tasks.map((task) => {
        const existing = resultsMap.get(task.title);
        if (existing) return existing;

        // Task not in results, mark as unknown
        return {
          taskTitle: task.title,
          status: 'unknown' as const,
          confidence: 'low' as const,
          evidence: 'Not analyzed',
        };
      });

      broadcast?.('analysis:complete', { results: completeResults });
      resolve(completeResults);
    });

    claudeProcess.on('error', (error) => {
      clearTimeout(timeoutId);
      console.error('Claude analysis process error:', error);

      // Return unknown for all tasks on process error
      const unknownResults: AnalysisResult[] = tasks.map((task) => ({
        taskTitle: task.title,
        status: 'unknown' as const,
        confidence: 'low' as const,
        evidence: `Process error: ${error.message}`,
      }));
      broadcast?.('analysis:complete', { results: unknownResults, error: true });
      resolve(unknownResults);
    });
  });
}
