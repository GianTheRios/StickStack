import { spawn, ChildProcess } from 'child_process';
import type { Task } from '../types/index.js';
import { updateTask } from './database.js';

type BroadcastFn = (type: string, payload: unknown) => void;

const activeProcesses = new Map<string, ChildProcess>();

export async function startClaudeTask(
  task: Task,
  broadcast: BroadcastFn
): Promise<void> {
  // Cancel any existing process for this task
  cancelClaudeTask(task.id);

  const prompt = `You are working on a kanban task. Here are the details:

**Task Title:** ${task.title}

**Task Description:** ${task.description || 'No description provided.'}

Please complete this task. Work step by step, explaining what you're doing as you go.`;

  let fullOutput = '';

  try {
    broadcast('claude:progress', {
      taskId: task.id,
      message: 'Starting Claude...',
    });

    // Spawn claude CLI with the prompt
    const claudeProcess = spawn('claude', ['-p', prompt, '--no-input'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
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
