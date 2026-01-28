import initSqlJs, { Database } from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types/index.js';

const DB_PATH = 'kanban.db';
let db: Database | null = null;

export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const fileBuffer = readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Initialize table
  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'backlog',
      priority TEXT DEFAULT 'medium',
      claude_output TEXT,
      ralph_enabled INTEGER DEFAULT 0,
      ralph_max_iterations INTEGER DEFAULT 10,
      ralph_completion_promise TEXT DEFAULT 'TASK_COMPLETE',
      ralph_current_iteration INTEGER DEFAULT 0,
      ralph_status TEXT,
      project_directory TEXT,
      allow_shell_commands INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Add Ralph columns if they don't exist (for existing databases)
  const columns = db.exec("PRAGMA table_info(tasks)");
  const columnNames = columns[0]?.values.map((row) => row[1] as string) || [];

  if (!columnNames.includes('ralph_enabled')) {
    db.run('ALTER TABLE tasks ADD COLUMN ralph_enabled INTEGER DEFAULT 0');
  }
  if (!columnNames.includes('ralph_max_iterations')) {
    db.run('ALTER TABLE tasks ADD COLUMN ralph_max_iterations INTEGER DEFAULT 10');
  }
  if (!columnNames.includes('ralph_completion_promise')) {
    db.run("ALTER TABLE tasks ADD COLUMN ralph_completion_promise TEXT DEFAULT 'TASK_COMPLETE'");
  }
  if (!columnNames.includes('ralph_current_iteration')) {
    db.run('ALTER TABLE tasks ADD COLUMN ralph_current_iteration INTEGER DEFAULT 0');
  }
  if (!columnNames.includes('ralph_status')) {
    db.run('ALTER TABLE tasks ADD COLUMN ralph_status TEXT');
  }
  if (!columnNames.includes('project_directory')) {
    db.run('ALTER TABLE tasks ADD COLUMN project_directory TEXT');
  }
  if (!columnNames.includes('allow_shell_commands')) {
    db.run('ALTER TABLE tasks ADD COLUMN allow_shell_commands INTEGER DEFAULT 0');
  }

  saveDatabase();
}

function saveDatabase(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(DB_PATH, buffer);
}

function getDb(): Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function getAllTasks(): Task[] {
  const stmt = getDb().prepare('SELECT * FROM tasks ORDER BY created_at DESC');
  const tasks: Task[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    tasks.push(row as unknown as Task);
  }
  stmt.free();
  return tasks;
}

export function getTaskById(id: string): Task | undefined {
  const stmt = getDb().prepare('SELECT * FROM tasks WHERE id = ?');
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row as unknown as Task;
  }
  stmt.free();
  return undefined;
}

export function createTask(input: CreateTaskInput): Task {
  const id = uuidv4();
  const now = new Date().toISOString();
  getDb().run(
    `INSERT INTO tasks (id, title, description, priority, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.title, input.description || null, input.priority || 'medium', now, now]
  );
  saveDatabase();
  return getTaskById(id)!;
}

export function updateTask(id: string, input: UpdateTaskInput): Task | undefined {
  const existing = getTaskById(id);
  if (!existing) return undefined;

  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.title !== undefined) {
    updates.push('title = ?');
    values.push(input.title);
  }
  if (input.description !== undefined) {
    updates.push('description = ?');
    values.push(input.description);
  }
  if (input.status !== undefined) {
    updates.push('status = ?');
    values.push(input.status);
  }
  if (input.priority !== undefined) {
    updates.push('priority = ?');
    values.push(input.priority);
  }
  if (input.claude_output !== undefined) {
    updates.push('claude_output = ?');
    values.push(input.claude_output);
  }
  if (input.ralph_enabled !== undefined) {
    updates.push('ralph_enabled = ?');
    values.push(input.ralph_enabled ? 1 : 0);
  }
  if (input.ralph_max_iterations !== undefined) {
    updates.push('ralph_max_iterations = ?');
    values.push(input.ralph_max_iterations);
  }
  if (input.ralph_completion_promise !== undefined) {
    updates.push('ralph_completion_promise = ?');
    values.push(input.ralph_completion_promise);
  }
  if (input.ralph_current_iteration !== undefined) {
    updates.push('ralph_current_iteration = ?');
    values.push(input.ralph_current_iteration);
  }
  if (input.ralph_status !== undefined) {
    updates.push('ralph_status = ?');
    values.push(input.ralph_status);
  }
  if (input.project_directory !== undefined) {
    updates.push('project_directory = ?');
    values.push(input.project_directory);
  }
  if (input.allow_shell_commands !== undefined) {
    updates.push('allow_shell_commands = ?');
    values.push(input.allow_shell_commands ? 1 : 0);
  }

  if (updates.length > 0) {
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    getDb().run(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values);
    saveDatabase();
  }

  return getTaskById(id);
}

export function deleteTask(id: string): boolean {
  const existing = getTaskById(id);
  if (!existing) return false;
  getDb().run('DELETE FROM tasks WHERE id = ?', [id]);
  saveDatabase();
  return true;
}
