Nekora Next-Gen Development Prompt

Build and extend Nekora as a local-first modular desktop toolkit using:

- Desktop shell: Tauri v2
- Frontend: React + TypeScript + Vite
- Backend: Python 3.12 + FastAPI

Nekora core is a host. Tools come from modules. Keep core and module boundaries explicit.

---

Current Repository Shape

```text
Nekora/
├── backend/
│   └── nekora_core/
│       ├── api/
│       ├── modules/
│       ├── sdk/
│       └── main.py
├── desktop/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   ├── styles.css
│   │   └── components/
│   │       ├── Sidebar.tsx
│   │       ├── CommandBar.tsx
│   │       ├── ToolWorkspace.tsx
│   │       ├── UnifiedInputPanel.tsx
│   │       ├── OutputPanel.tsx
│   │       ├── ModuleModal.tsx
│   │       ├── HistoryModal.tsx
│   │       ├── AboutModal.tsx
│   │       └── StatusIndicator.tsx
│   └── src-tauri/
├── modules_builtin/
│   └── neko_text/
└── scripts/
```

---

UI Contract

1) Layout
- Fixed 3-column shell:
  - left: Sidebar (logo+title head + module loaded + tool list + copyright foot)
  - center: ToolWorkspace
  - right: OutputPanel
  - Search bar and app tool (top of center and right areas)

2) Sidebar
- Contains only:
  - Nekora title + version
  - Modules section (+ opens ModuleModal)
  - Tools section (collapsible categories)
  - fixed bottom copyright
- No history/settings/about/status in sidebar.

3) Top Bar
- CommandBar includes:
  - search input (always visible)
  - icon-only actions: History, About, Settings
  - single status indicator at end of actions
- No Cmd/Ctrl+K behavior.

4) Input
- UnifiedInputPanel only (no tabs):
  - textarea
  - file drop zone
  - URL row
- File zone supports drag/drop and click-to-upload.
- Input mode is auto-detected:
  - file present -> file
  - else URL present -> link
  - else text

5) Output
- OutputPanel supports:
  - rich preview (default)
  - code/raw toggle
  - icon-only controls: copy, code-toggle, expand, fullscreen
  - copy copies source content (not stripped rendered text)
  - file output row with download button when output contains file URL
  - metadata row: chars / words / lines / execution time

6) Floating Panels
- HistoryModal: list of runs + restore state
- AboutModal: version + core info
- ModuleModal: installed/available modules, single active selection

7) Motion
- subtle transitions only:
  - tool workspace switch
  - output highlight fade-in
  - run spinner

---

Frontend Data Flow (Current)

- App.tsx owns main state:
  - modules, tools, selected module/tool
  - search query and filtered tools
  - unified input state (text/url/file)
  - run result + execution time
  - run history list
  - modal open/close state
- Run flow:
  1. user runs selected tool
  2. backend `/tools/{tool_id}/run`
  3. result stored in state
  4. history entry appended
- History restore:
  - restores selected tool + input + output + execution time

---

Backend API Baseline

```text
GET  /health
GET  /modules
GET  /tools
POST /tools/{tool_id}/run
```

Current UI consumes only these directly.

---

Development Guardrails

1) Preserve existing UX constraints
- no profile/user UI
- no tabbed input mode UI
- no page navigation for modal content
- keep icon-only action controls where already icon-only

2) Do not redesign backend unless requested
- extend payload handling minimally and compatibly

3) Keep components compact and quiet
- avoid heavy animation
- avoid extra scroll regions

4) Keep module model host-centric
- core hosts tools; module internals stay outside UI assumptions

---

Near-Term Extension Priorities

1. Real module install/enable/disable lifecycle APIs.
2. Persist history/settings in backend storage.
3. True markdown renderer with safe formatting.
4. File output preview adapters by MIME type.
5. Search scope extension to module names and metadata.

---

Definition of Done for Future UI Changes

- Build passes (`desktop`: `npm run build`)
- 3-column layout remains intact
- one status indicator only
- search, history restore, and run flow continue to work
- no regressions to unified input behavior
