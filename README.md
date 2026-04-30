# Nekora

Copyright © 2026 Ziyi LIU.

Nekora is a local-first modular desktop toolkit host built with Tauri v2, React, TypeScript, Vite, and FastAPI.  
Core app responsibilities: UI shell, tool execution flow, module surface, and shared API contracts.  
Tool logic is provided by modules (currently built-in `NekoText`).

## Current Product State

Implemented desktop UX baseline:

- 3-column layout: `Sidebar | ToolWorkspace | OutputPanel`
- unified input panel (textarea + file drop/upload + URL row)
- real-time tool search in top bar
- icon-only top-right actions for history/about/settings
- floating panels for modules/history/about
- rich output preview with code/raw toggle
- output metadata (chars, words, lines, exec time)
- single status indicator in command bar actions

## Project Structure

```text
Nekora/
├── backend/                    # FastAPI host backend
├── desktop/                    # Tauri + React frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   ├── styles.css
│   │   └── components/
│   └── src-tauri/
├── modules_builtin/
│   └── neko_text/              # Built-in text tools module
└── scripts/
```

## Backend

Install:

```bash
cd backend
python -m pip install -e ".[dev]"
```

Run:

```bash
scripts/run_backend.sh
```

Active endpoints used by UI:

```text
GET  /health
GET  /modules
GET  /tools
POST /tools/{tool_id}/run
```

## Desktop

Install:

```bash
cd desktop
npm install
```

Build:

```bash
npm run build
```

Dev mode:

```bash
npm run dev
```

Default frontend backend target:

```text
http://127.0.0.1:8000
```

Override with `VITE_NEKORA_API_BASE` if needed.

## Runtime Scripts

```text
scripts/NekoraBk   # backend only
scripts/NekoraUi   # UI only
scripts/Nekora     # combined launcher
```

## UI Component Map

- `App.tsx`: root state + orchestration
- `Sidebar.tsx`: modules/tools navigation and collapsible tool groups
- `CommandBar.tsx`: search + history/about/settings + status
- `ToolWorkspace.tsx`: selected tool header, actions, unified input host
- `UnifiedInputPanel.tsx`: text/file/url inputs with auto mode detection
- `OutputPanel.tsx`: rich preview/code toggle/copy/metadata/download row
- `ModuleModal.tsx`: module selection panel
- `HistoryModal.tsx`: past run list and restore
- `AboutModal.tsx`: app info panel
- `StatusIndicator.tsx`: ready/loading indicator

## Data Flow (Frontend)

1. Load app bootstrap data from `/health`, `/modules`, `/tools`.
2. Select tool from sidebar (or search + Enter).
3. Build input payload from unified panel:
   - text
   - optional URL
   - optional file name + file text
4. Run tool via `/tools/{tool_id}/run`.
5. Store output and append history entry.
6. Restore full workspace state from history item click.

## Module Direction

Nekora core remains a host. External modules should stay independent from core repo and expose compatible metadata + entrypoints.  
Do not hard-code tool implementation details in frontend.

## License

GNU GPL v3.0. See `LICENSE`.
