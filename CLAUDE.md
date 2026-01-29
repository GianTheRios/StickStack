# StickStack - Project Context

## What This Is
A SaaS product that turns PRD markdown files into visual roadmaps, then lets users execute tasks via Claude Code from a kanban board UI.

## Target User
"Vibecoders" — developers using Claude Code for AI-assisted development who want:
- Beautiful PRD visualization (can't get this in terminal)
- Visual progress tracking (kanban board)
- Claude Code orchestration from a web UI
- Local-first security (code never leaves their machine)

## Current State
Complete user flow implemented:
- **PRD Upload**: Drag-drop or paste markdown PRD files
- **PRD Visualization**: Beautiful view showing phases, tasks, tech stack, stats
- **CLAUDE.md Generation**: Auto-generate context file for Claude Code (preview, copy, download)
- **Kanban Board**: 4 columns (Backlog → To Do → In Progress → Done)
- **Drag-and-drop**: Sticky notes colored by priority
- **Claude Code Integration**: Drag to "In Progress" triggers Claude CLI subprocess
- **Real-time Updates**: WebSocket for live status
- **3D Design System**: Bold black offset shadows, 2px borders, square sticky notes

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind |
| Drag & Drop | @dnd-kit/core |
| Backend | Node.js + Express + WebSocket (ws) |
| Database | SQLite via sql.js |
| Claude | Spawns `claude` CLI as subprocess |

## Project Structure
```
/Users/giantherios/Desktop/StickStack/
├── frontend/          # React app (localhost:5175)
│   └── src/
│       ├── components/
│       │   ├── Board.tsx          # Main kanban board
│       │   ├── Column.tsx         # Kanban column
│       │   ├── StickyNote.tsx     # Draggable task card
│       │   ├── StatusPanel.tsx    # Claude live status
│       │   ├── CreateTaskModal.tsx
│       │   ├── PRDUpload.tsx      # PRD upload + parsing
│       │   └── PRDViewer.tsx      # PRD visualization
│       ├── hooks/
│       │   ├── useTasks.ts
│       │   └── useWebSocket.ts
│       └── types/
├── backend/           # Express server (localhost:3001)
│   └── src/
│       ├── routes/
│       │   ├── tasks.ts           # Task CRUD API
│       │   └── prd.ts             # PRD/CLAUDE.md API
│       ├── services/
│       │   ├── database.ts        # SQLite via sql.js
│       │   ├── claude.ts          # Claude CLI subprocess
│       │   └── prd.ts             # CLAUDE.md generation
│       └── types/
└── CLAUDE.md          # This file
```

## SaaS Product Vision

### User Flow
1. **Upload** — User drops PRD.md file
2. **Visualize** — App renders beautiful PRD view (phases, tasks, tech stack)
3. **Connect** — User runs `npx stickstack-connect --token=XXX` locally
4. **Execute** — Kanban board with sticky notes, drag to "In Progress" triggers Claude

### Key Features
- [x] PRD upload + markdown parsing
- [x] PRD visualization view (phases, tasks, tech stack, stats)
- [x] CLAUDE.md auto-generation from PRD
- [x] Kanban board with drag-and-drop
- [x] Claude Code integration (subprocess)
- [ ] Local bridge CLI for connecting Claude Code
- [ ] Auto-detect Claude activity and update UI
- [ ] Toggle: "Control Claude from UI" ON/OFF
- [ ] Multi-agent task execution (fresh context per task)

### Not Building Yet
- Authentication (skip for testing)
- Team features (solo first)

## Design System
- **Colors**: Monochrome base (white/gray), sticky notes are the only color
- **Shadows**: Bold 3D offset (`4px 4px 0 0 #171717`)
- **Borders**: 2px black borders on cards
- **Typography**: Inter for UI, Caveat for handwritten titles
- **Sticky notes**: Square aspect ratio, slight rotation, priority colors

## Running the App
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```
- Frontend: http://localhost:5175
- Backend: http://localhost:3001

## Next Steps
1. Build multi-agent task execution (orchestrator spawns fresh Claude per task)
2. Create local bridge CLI concept (`npx stickstack-connect`)
3. Add phase-based task organization in kanban view
4. Improve Claude output display in StatusPanel
