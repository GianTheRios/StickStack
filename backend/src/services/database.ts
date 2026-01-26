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
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

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
  const values: (string | null)[] = [];

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
