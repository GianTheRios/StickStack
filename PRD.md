# Claude Kanban

## Overview
A SaaS product that transforms PRD markdown files into visual roadmaps and lets developers execute tasks via Claude Code from a beautiful kanban board UI. Built for "vibecoders" who want visual progress tracking while using AI-assisted development. The app is local-first — code never leaves the user's machine.

## Tech Stack
- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS
- Drag & Drop: @dnd-kit/core
- Backend: Node.js + Express
- WebSocket: ws library
- Database: SQLite via sql.js
- AI Integration: Claude CLI subprocess

## Features

### Phase 1: Core Infrastructure
- [x] Project setup with monorepo structure
- [x] Express server with CORS and JSON middleware
- [x] SQLite database initialization
- [x] WebSocket server for real-time updates
- [x] Task CRUD API endpoints

### Phase 2: Kanban Board
- [x] Board layout with 4 columns (Backlog, To Do, In Progress, Done)
- [x] Draggable sticky note components
- [x] Priority-based color coding (yellow, coral, mint)
- [x] 3D shadow design system
- [x] Real-time task sync via WebSocket

### Phase 3: Claude Integration
- [x] Spawn Claude CLI as subprocess
- [x] Stream Claude output to frontend
- [x] Auto-trigger Claude when task moves to In Progress
- [x] Display live Claude status in StatusPanel
- [x] Cancel running Claude tasks

### Phase 4: PRD System
- [x] PRD upload component with drag-drop
- [x] Markdown parser for PRD structure
- [x] PRD visualization view with stats
- [x] CLAUDE.md auto-generation
- [ ] Task creation from PRD phases

### Phase 5: Polish & UX
- [x] Smooth drag animations
- [x] Loading states and error handling
- [ ] Responsive layout
- [ ] Keyboard shortcuts
- [x] Dark mode support
