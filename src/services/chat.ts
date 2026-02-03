import { spawn, ChildProcess } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import type { ChatSendPayload } from '../types/index.js';
import { validateProjectDirectory, sanitizeTaskText } from '../utils/security.js';

type BroadcastFn = (type: string, payload: unknown) => void;

let activeChatProcess: ChildProcess | null = null;
let currentMessageId: string | null = null;

export function sendChatMessage(
  payload: ChatSendPayload,
  broadcast: BroadcastFn
): string {
  // Cancel any existing chat process
  cancelChat();

  const messageId = uuidv4();
  currentMessageId = messageId;

  // Validate project directory if provided
  if (payload.projectDirectory) {
    const pathValidation = validateProjectDirectory(payload.projectDirectory);
    if (!pathValidation.valid) {
      broadcast('chat:response', {
        messageId,
        content: `Error: ${pathValidation.error}`,
        done: true,
      });
      return messageId;
    }
  }

  // Sanitize message
  const safeMessage = sanitizeTaskText(payload.message);

  // Build Claude CLI arguments
  const allowedTools = payload.allowShellCommands
    ? 'Read Edit Write Glob Grep Bash'
    : 'Read Edit Write Glob Grep';

  const claudeArgs = [
    '-p', safeMessage,
    '--permission-mode', 'bypassPermissions',
    '--allowedTools', allowedTools,
  ];

  try {
    const claudeProcess = spawn('claude', claudeArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
      cwd: payload.projectDirectory || process.cwd(),
    });

    activeChatProcess = claudeProcess;

    let fullResponse = '';

    claudeProcess.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      fullResponse += text;
      broadcast('chat:response', {
        messageId,
        content: text,
        done: false,
      });
    });

    claudeProcess.stderr?.on('data', (data: Buffer) => {
      const text = data.toString();
      // Only broadcast actual errors
      if (text.includes('Error') || text.includes('error')) {
        broadcast('chat:response', {
          messageId,
          content: `[Error] ${text}`,
          done: false,
        });
      }
    });

    claudeProcess.on('close', (code) => {
      activeChatProcess = null;
      currentMessageId = null;

      broadcast('chat:response', {
        messageId,
        content: '',
        done: true,
      });

      if (code !== 0 && code !== null) {
        console.log(`Chat process exited with code ${code}`);
      }
    });

    claudeProcess.on('error', (error) => {
      activeChatProcess = null;
      currentMessageId = null;

      broadcast('chat:response', {
        messageId,
        content: `Error: ${error.message}`,
        done: true,
      });
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    broadcast('chat:response', {
      messageId,
      content: `Error: ${errorMessage}`,
      done: true,
    });
  }

  return messageId;
}

export function cancelChat(): boolean {
  if (activeChatProcess) {
    activeChatProcess.kill('SIGTERM');
    activeChatProcess = null;
    currentMessageId = null;
    return true;
  }
  return false;
}

export function isChatActive(): boolean {
  return activeChatProcess !== null;
}
