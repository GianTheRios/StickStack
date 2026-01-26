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
- [ ] Project setup with monorepo structure
- [ ] Express server with CORS and JSON middleware
- [ ] SQLite database initialization
- [ ] WebSocket server for real-time updates
- [ ] Task CRUD API endpoints

### Phase 2: Kanban Board
- [ ] Board layout with 4 columns (Backlog, To Do, In Progress, Done)
- [ ] Draggable sticky note components
- [ ] Priority-based color coding (yellow, coral, mint)
- [ ] 3D shadow design system
- [ ] Real-time task sync via WebSocket

### Phase 3: Claude Integration
- [ ] Spawn Claude CLI as subprocess
- [ ] Stream Claude output to frontend
- [ ] Auto-trigger Claude when task moves to In Progress
- [ ] Display live Claude status in StatusPanel
- [ ] Cancel running Claude tasks

### Phase 4: PRD System
- [ ] PRD upload component with drag-drop
- [ ] Markdown parser for PRD structure
- [ ] PRD visualization view with stats
- [ ] CLAUDE.md auto-generation
- [ ] Task creation from PRD phases

### Phase 5: Polish & UX
- [ ] Smooth drag animations
- [ ] Loading states and error handling
- [ ] Responsive layout
- [ ] Keyboard shortcuts
- [ ] Dark mode support
