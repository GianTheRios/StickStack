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

const ANALYSIS_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Build the prompt for Claude to analyze the codebase
 */
function buildAnalysisPrompt(tasks: TaskInput[]): string {
  const taskList = tasks
    .map((task, index) => `${index + 1}. "${task.title}" - ${task.description || 'No description'}`)
    .join('\n');

  return `Analyze this codebase to determine which PRD tasks are already complete.

TASKS:
${taskList}

INSTRUCTIONS:
1. Use Glob and Grep to explore the codebase structure and find relevant files
2. Use Read to examine files that might contain implementations of these tasks
3. Look for evidence that each task has been completed (e.g., relevant functions, components, routes, tests)
4. Be thorough but efficient - check key files that would indicate completion

OUTPUT FORMAT (JSON only, no markdown code blocks):
{
  "results": [
    {
      "taskTitle": "exact title from above",
      "status": "complete" | "partial" | "not_started" | "unknown",
      "confidence": "high" | "medium" | "low",
      "evidence": "Brief explanation of what you found"
    }
  ]
}

RULES:
- Only mark "complete" with "high" confidence if you found clear evidence
- When uncertain, prefer "not_started" - it's better to let users mark tasks done manually
- "partial" means you found some but not all expected implementation
- Provide one result object for each task above
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

    // Spawn claude with read-only tools only
    const claudeArgs = [
      '-p', prompt,
      '--permission-mode', 'bypassPermissions',
      '--allowedTools', 'Read Glob Grep',
      '--output-format', 'text',
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
      console.log('Analysis timed out after 3 minutes');
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
