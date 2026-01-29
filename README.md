# StickStack

A full-stack kanban board that triggers Claude Code to work on tasks via drag-and-drop sticky notes.

## Features

- Drag-and-drop kanban board with 4 columns: Backlog, To Do, In Progress, Done
- Real-time synchronization via WebSocket
- Claude Code integration - drag a task to "In Progress" to have Claude work on it
- Live status updates as Claude works
- Color-coded priority levels (High/Medium/Low)
- Sticky note aesthetic with subtle animations

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Drag & Drop | @dnd-kit/core |
| Styling | Tailwind CSS |
| Backend | Node.js + Express |
| WebSocket | ws |
| Database | SQLite via better-sqlite3 |
| Claude Integration | @anthropic-ai/claude-code |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```
The server runs on http://localhost:3001

2. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
```
The app runs on http://localhost:5173

## Usage

1. **Create a Task**: Click the "+ New Task" button to create a new sticky note
2. **Organize**: Drag tasks between columns to update their status
3. **Start Claude**: Drag a task to the "In Progress" column to trigger Claude
4. **Monitor**: Watch Claude's progress in the status panel at the top
5. **Complete**: When Claude finishes, the task automatically moves to "Done"

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create new task |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `task:created` | Server → Client | New task created |
| `task:updated` | Server → Client | Task updated |
| `task:deleted` | Server → Client | Task deleted |
| `claude:progress` | Server → Client | Claude progress update |
| `claude:complete` | Server → Client | Claude finished task |

## Project Structure

```
StickStack/
├── frontend/          # React + Vite frontend
│   └── src/
│       ├── components/  # UI components
│       ├── hooks/       # Custom React hooks
│       └── types/       # TypeScript types
├── backend/           # Node.js + Express backend
│   └── src/
│       ├── routes/      # API routes
│       ├── services/    # Business logic
│       └── types/       # TypeScript types
└── skill/             # Claude Code skill definition
```
