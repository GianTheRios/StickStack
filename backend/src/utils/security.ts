import { resolve, isAbsolute, normalize } from 'path';
import { homedir } from 'os';

/**
 * Validate that a project directory path is safe to use.
 * - Must be an absolute path
 * - Cannot traverse above home directory
 * - Cannot access system directories
 */
export function validateProjectDirectory(path: string): { valid: boolean; error?: string } {
  if (!path || typeof path !== 'string') {
    return { valid: false, error: 'Path is required' };
  }

  // Must be absolute
  if (!isAbsolute(path)) {
    return { valid: false, error: 'Path must be absolute (start with /)' };
  }

  // Normalize to resolve any .. or . segments
  const normalized = normalize(path);

  // Check for path traversal attempts
  if (normalized !== path && path.includes('..')) {
    return { valid: false, error: 'Path traversal not allowed' };
  }

  // Block sensitive system directories
  const blockedPaths = [
    '/etc',
    '/var',
    '/usr',
    '/bin',
    '/sbin',
    '/System',
    '/Library',
    '/private/etc',
    '/private/var',
  ];

  for (const blocked of blockedPaths) {
    if (normalized === blocked || normalized.startsWith(blocked + '/')) {
      return { valid: false, error: 'Access to system directories not allowed' };
    }
  }

  // Should be within user's home or common dev directories
  const home = homedir();
  const allowedPrefixes = [
    home,
    '/tmp',
    '/Users',
    '/home',
  ];

  const isAllowed = allowedPrefixes.some(prefix =>
    normalized === prefix || normalized.startsWith(prefix + '/')
  );

  if (!isAllowed) {
    return { valid: false, error: 'Path must be within your home directory or /tmp' };
  }

  return { valid: true };
}

/**
 * Sanitize task text to reduce prompt injection risks.
 * This doesn't make it 100% safe, but removes obvious attack patterns.
 */
export function sanitizeTaskText(text: string | null | undefined): string {
  if (!text) return '';

  let sanitized = text;

  // Remove common prompt injection patterns
  const dangerousPatterns = [
    // System/role override attempts
    /\b(SYSTEM|HUMAN|ASSISTANT|USER):\s*/gi,
    /<\s*(system|human|assistant|user)\s*>/gi,
    /\[\s*(INST|SYS)\s*\]/gi,

    // Instruction override attempts
    /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
    /disregard\s+(all\s+)?(previous|above|prior)/gi,
    /forget\s+(everything|all|your)\s+(instructions?|rules?|prompts?)/gi,
    /you\s+are\s+now\s+(a|an|the)/gi,
    /new\s+instructions?:/gi,
    /override\s+(mode|instructions?|rules?)/gi,

    // Jailbreak attempts
    /\bDAN\b/g,
    /do\s+anything\s+now/gi,
    /jailbreak/gi,
  ];

  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, '[FILTERED]');
  }

  // Limit length to prevent context stuffing
  const MAX_LENGTH = 5000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.slice(0, MAX_LENGTH) + '... [TRUNCATED]';
  }

  return sanitized;
}

/**
 * Check if text contains suspicious patterns that might indicate an attack.
 * Returns warnings but doesn't block (for logging/monitoring).
 */
export function detectSuspiciousContent(text: string): string[] {
  const warnings: string[] = [];

  if (!text) return warnings;

  // Check for base64 encoded content (could hide malicious instructions)
  if (/[A-Za-z0-9+/]{50,}={0,2}/.test(text)) {
    warnings.push('Contains possible base64 encoded content');
  }

  // Check for attempts to read sensitive files
  const sensitiveFilePatterns = [
    /\/\.ssh\//i,
    /\/\.aws\//i,
    /\/\.env/i,
    /credentials/i,
    /password/i,
    /secret/i,
    /api[_-]?key/i,
    /private[_-]?key/i,
  ];

  for (const pattern of sensitiveFilePatterns) {
    if (pattern.test(text)) {
      warnings.push(`Contains reference to sensitive file/data: ${pattern.source}`);
    }
  }

  return warnings;
}
