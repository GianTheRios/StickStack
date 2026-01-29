import { spawn, ChildProcess } from 'child_process';
import type { Task, RalphStatus, ClaudeModel } from '../types/index.js';
import { updateTask, getTaskById } from './database.js';
import { sanitizeTaskText, validateProjectDirectory, detectSuspiciousContent } from '../utils/security.js';

type BroadcastFn = (type: string, payload: unknown) => void;

const activeProcesses = new Map<string, ChildProcess>();
const activeRalphLoops = new Map<string, { cancelled: boolean }>();

// Map user-friendly model names to Claude CLI model aliases
const MODEL_IDS: Record<ClaudeModel, string> = {
  opus: 'opus',
  sonnet: 'sonnet',
  haiku: 'haiku',
};

function getModelId(model: ClaudeModel | null): string {
  return MODEL_IDS[model || 'opus'];
}

/**
 * Check if output contains a completion promise tag
 */
function checkCompletionPromise(output: string, expected: string): boolean {
  const match = output.match(/<promise>(.+?)<\/promise>/is);
  if (!match) return false;
  return match[1].trim().toLowerCase() === expected.trim().toLowerCase();
}

/**
 * Build the prompt for a Ralph iteration
 */
function buildIterationPrompt(task: Task, iteration: number, maxIterations: number): string {
  const safeTitle = sanitizeTaskText(task.title);
  const safeDescription = sanitizeTaskText(task.description);

  return `**Task:** ${safeTitle}
${safeDescription ? `**Details:** ${safeDescription}` : ''}
**Iteration:** ${iteration}/${maxIterations}

Work efficiently. When COMPLETE and verified, output: <promise>${task.ralph_completion_promise}</promise>

Only include the promise tag when genuinely finished.`;
}

export async function startClaudeTask(
  task: Task,
  broadcast: BroadcastFn
): Promise<void> {
  // Cancel any existing process for this task
  cancelClaudeTask(task.id);

  // Validate project directory if set
  if (task.project_directory) {
    const pathValidation = validateProjectDirectory(task.project_directory);
    if (!pathValidation.valid) {
      broadcast('claude:progress', {
        taskId: task.id,
        message: `Error: ${pathValidation.error}`,
      });
      return;
    }
  }

  // Sanitize task inputs to prevent prompt injection
  const safeTitle = sanitizeTaskText(task.title);
  const safeDescription = sanitizeTaskText(task.description);

  // Log any suspicious content (for monitoring)
  const warnings = detectSuspiciousContent(task.title + ' ' + (task.description || ''));
  if (warnings.length > 0) {
    console.warn(`[Security] Task ${task.id} has suspicious content:`, warnings);
  }

  const prompt = `Complete this task efficiently:

**Task:** ${safeTitle}
${safeDescription ? `**Details:** ${safeDescription}` : ''}

APPROACH:
- Read relevant files first to understand the codebase
- Make focused changes - don't over-engineer
- Keep explanations brief - focus on doing, not explaining
- Test your changes work if possible`;

  let fullOutput = '';

  try {
    broadcast('claude:progress', {
      taskId: task.id,
      message: 'Starting Claude...',
    });

    // Spawn claude CLI with the prompt
    // Use bypassPermissions for non-interactive use
    // Only allow Bash if explicitly enabled by user
    const allowedTools = task.allow_shell_commands
      ? 'Read Edit Write Glob Grep Bash'
      : 'Read Edit Write Glob Grep';

    const claudeArgs = [
      '-p', prompt,
      '--permission-mode', 'bypassPermissions',
      '--allowedTools', allowedTools,
      '--model', getModelId(task.claude_model),
    ];

    const claudeProcess = spawn('claude', claudeArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
      cwd: task.project_directory || undefined,
    });

    activeProcesses.set(task.id, claudeProcess);

    claudeProcess.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      fullOutput += text;
      broadcast('claude:progress', {
        taskId: task.id,
        message: text,
      });
    });

    claudeProcess.stderr?.on('data', (data: Buffer) => {
      const text = data.toString();
      // Filter out non-error stderr messages (like progress indicators)
      if (text.includes('Error') || text.includes('error')) {
        fullOutput += `\n[stderr] ${text}`;
        broadcast('claude:progress', {
          taskId: task.id,
          message: `[stderr] ${text}`,
        });
      }
    });

    await new Promise<void>((resolve, reject) => {
      claudeProcess.on('close', (code) => {
        activeProcesses.delete(task.id);

        if (code === 0) {
          // Update task with output and mark as done
          updateTask(task.id, {
            status: 'done',
            claude_output: fullOutput,
          });

          broadcast('claude:complete', {
            taskId: task.id,
            result: fullOutput,
          });

          const updatedTask = updateTask(task.id, {});
          if (updatedTask) {
            broadcast('task:updated', updatedTask);
          }
          resolve();
        } else {
          // Keep the task in progress if it failed
          updateTask(task.id, {
            claude_output: fullOutput + `\n\n[Process exited with code ${code}]`,
          });
          reject(new Error(`Claude exited with code ${code}`));
        }
      });

      claudeProcess.on('error', (error) => {
        activeProcesses.delete(task.id);
        reject(error);
      });
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    fullOutput += `\n--- Error ---\n${errorMessage}`;

    updateTask(task.id, {
      claude_output: fullOutput,
    });

    broadcast('claude:progress', {
      taskId: task.id,
      message: `Error: ${errorMessage}`,
    });
  }
}

export function cancelClaudeTask(taskId: string): boolean {
  const process = activeProcesses.get(taskId);
  if (process) {
    process.kill('SIGTERM');
    activeProcesses.delete(taskId);
    return true;
  }
  return false;
}

export function isTaskRunning(taskId: string): boolean {
  return activeProcesses.has(taskId);
}

/**
 * Run a single Claude iteration and return the output
 */
async function runSingleIteration(
  task: Task,
  prompt: string,
  broadcast: BroadcastFn
): Promise<{ output: string; exitCode: number | null }> {
  return new Promise((resolve) => {
    let fullOutput = '';

    // Use bypassPermissions for non-interactive use
    // Only allow Bash if explicitly enabled by user
    const allowedTools = task.allow_shell_commands
      ? 'Read Edit Write Glob Grep Bash'
      : 'Read Edit Write Glob Grep';

    const claudeArgs = [
      '-p', prompt,
      '--permission-mode', 'bypassPermissions',
      '--allowedTools', allowedTools,
      '--model', getModelId(task.claude_model),
    ];

    const claudeProcess = spawn('claude', claudeArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
      cwd: task.project_directory || undefined,
    });

    activeProcesses.set(task.id, claudeProcess);

    claudeProcess.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      fullOutput += text;
      broadcast('claude:progress', {
        taskId: task.id,
        message: text,
      });
    });

    claudeProcess.stderr?.on('data', (data: Buffer) => {
      const text = data.toString();
      if (text.includes('Error') || text.includes('error')) {
        fullOutput += `\n[stderr] ${text}`;
        broadcast('claude:progress', {
          taskId: task.id,
          message: `[stderr] ${text}`,
        });
      }
    });

    claudeProcess.on('close', (code) => {
      activeProcesses.delete(task.id);
      resolve({ output: fullOutput, exitCode: code });
    });

    claudeProcess.on('error', (error) => {
      activeProcesses.delete(task.id);
      fullOutput += `\n[error] ${error.message}`;
      resolve({ output: fullOutput, exitCode: 1 });
    });
  });
}

/**
 * Run the Ralph Loop - iteratively spawn Claude until promise detected or max iterations
 */
export async function runRalphLoop(
  task: Task,
  broadcast: BroadcastFn
): Promise<void> {
  const maxIterations = task.ralph_max_iterations || 10;
  const completionPromise = task.ralph_completion_promise || 'TASK_COMPLETE';

  // Set up cancellation tracking
  activeRalphLoops.set(task.id, { cancelled: false });

  let currentIteration = 0;
  let allOutput = '';
  let finalReason: 'promise_fulfilled' | 'max_reached' | 'cancelled' | 'error' = 'max_reached';

  // Update task to iterating status
  updateTask(task.id, {
    ralph_status: 'iterating',
    ralph_current_iteration: 0,
  });

  broadcast('task:updated', getTaskById(task.id));

  try {
    while (currentIteration < maxIterations) {
      // Check if cancelled
      const loopState = activeRalphLoops.get(task.id);
      if (loopState?.cancelled) {
        finalReason = 'cancelled';
        break;
      }

      currentIteration++;

      // Update iteration count
      updateTask(task.id, { ralph_current_iteration: currentIteration });

      // Broadcast iteration start
      broadcast('ralph:iteration_start', {
        taskId: task.id,
        iteration: currentIteration,
        maxIterations,
      });

      broadcast('task:updated', getTaskById(task.id));

      // Refresh task from DB to get latest state
      const currentTask = getTaskById(task.id);
      if (!currentTask) {
        finalReason = 'error';
        break;
      }

      // Build prompt and run iteration
      const prompt = buildIterationPrompt(currentTask, currentIteration, maxIterations);

      broadcast('claude:progress', {
        taskId: task.id,
        message: `--- Ralph Loop: Starting iteration ${currentIteration}/${maxIterations} ---\n`,
      });

      const { output, exitCode } = await runSingleIteration(currentTask, prompt, broadcast);
      allOutput += `\n--- Iteration ${currentIteration} ---\n${output}`;

      // Check for completion promise
      const promiseFound = checkCompletionPromise(output, completionPromise);

      broadcast('ralph:iteration_complete', {
        taskId: task.id,
        iteration: currentIteration,
        promiseFound,
      });

      if (promiseFound) {
        finalReason = 'promise_fulfilled';
        break;
      }

      // If Claude failed, log but continue
      if (exitCode !== 0) {
        broadcast('claude:progress', {
          taskId: task.id,
          message: `\n[Iteration ${currentIteration} exited with code ${exitCode}, continuing...]\n`,
        });
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    allOutput += `\n--- Error ---\n${errorMessage}`;
    finalReason = 'error';
  }

  // Clean up
  activeRalphLoops.delete(task.id);

  // Determine final status
  let ralphStatus: RalphStatus;
  let taskStatus = task.status;

  switch (finalReason) {
    case 'promise_fulfilled':
      ralphStatus = 'completed';
      taskStatus = 'done';
      break;
    case 'max_reached':
      ralphStatus = 'max_reached';
      // Keep in_progress so user can continue
      break;
    case 'cancelled':
      ralphStatus = 'cancelled';
      break;
    case 'error':
      ralphStatus = 'cancelled';
      break;
  }

  // Final update
  updateTask(task.id, {
    status: taskStatus,
    claude_output: allOutput,
    ralph_status: ralphStatus,
    ralph_current_iteration: currentIteration,
  });

  // Broadcast completion
  broadcast('ralph:complete', {
    taskId: task.id,
    iteration: currentIteration,
    reason: finalReason,
  });

  if (finalReason === 'promise_fulfilled') {
    broadcast('claude:complete', {
      taskId: task.id,
      result: allOutput,
    });
  }

  broadcast('task:updated', getTaskById(task.id));
}

/**
 * Cancel an active Ralph loop
 */
export function cancelRalphLoop(taskId: string): boolean {
  const loopState = activeRalphLoops.get(taskId);
  if (loopState) {
    loopState.cancelled = true;
    // Also cancel any running Claude process
    cancelClaudeTask(taskId);
    return true;
  }
  return false;
}

/**
 * Check if a Ralph loop is running for a task
 */
export function isRalphLoopRunning(taskId: string): boolean {
  return activeRalphLoops.has(taskId);
}
