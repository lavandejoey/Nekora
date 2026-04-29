Nekora Architecture: External Module System

Design and build Nekora as a cross-platform local-first desktop toolkit app with an external module system.

Core idea:
Nekora itself (core) is only the host application. Individual tool packages should be independent modules that can be downloaded, installed, loaded, disabled, updated, and removed independently.

Example:

- Root app repo: Nekora
- Independent module repo: NekoPDF
- Independent module repo: NekoImage
- Independent module repo: NekoText
- Independent module repo: NekoOCR
- Independent module repo: NekoML

Each module should be installable from:

- Git repository URL
- Local compressed
- Later: official module registry

The root app should not hard-code tool implementations. It should only provide:

- Desktop UI
- Backend API
- Module manager
- Module loader
- Settings
- History
- Permission control
- Logs
- Shared SDK/interface

Recommended stack:

- Desktop shell: Tauri v2
- Frontend: React + TypeScript + Vite
- Backend: Python 3.12 FastAPI with Conda (neko312)
- Storage: SQLite
- Module metadata: `nekora.module.json`
- Module runtime: Python package loaded dynamically
- Module source: Git repo or local folder
- Module installation folder: user data directory, not the root repo

Root repo structure:

```bash
Nekora/
├── desktop/                  # Tauri + React frontend
├── backend/                  # FastAPI host backend
│   ├── nekora_core/
│   │   ├── api/              # FastAPI routes
│   │   ├── modules/          # module manager / loader / registry
│   │   ├── sdk/              # shared module interface
│   │   ├── db/               # SQLite logic
│   │   └── main.py
│   └── pyproject.toml
├── modules_builtin/          # optional base modules shipped with app
│   └── neko_text/
├── data/                     # dev database/cache only
├── scripts/
├── META.prompt.md
└── README.md
```

Installed module default location at runtime:

```bash
~/.local/share/Nekora/modules/        # Linux
%APPDATA%/Nekora/modules/             # Windows
```

Each independent module repo should look like:

```bash
NekoPDF/
├── nekora.module.json
├── nekopdf/
│   ├── __init__.py
│   ├── module.py
│   └── tools/
│       ├── extract_text.py
│       ├── merge_pdf.py
│       └── split_pdf.py
├── requirements.txt
├── README.md
└── LICENSE
```

Module manifest example:

```json
{
  "id": "nekora.nekopdf",
  "name": "NekoPDF",
  "version": "0.1.0",
  "description": "PDF tools for Nekora.",
  "entry": "nekopdf.module:create_module",
  "author": "Nekora",
  "runtime": "python",
  "min_nekora_version": "0.1.0",
  "permissions": ["file.read", "file.write"],
  "tools": ["pdf.extract_text", "pdf.merge", "pdf.split"]
}
```

Every module must expose a factory function:

```python
def create_module():
    return NekoraModule(...)
```

Every tool inside a module must expose:

- id
- name
- description
- input_schema
- output_schema
- run(input_data, context)

Backend API should include:

```
GET    /health
GET    /modules
POST   /modules/install
POST   /modules/install-from-git
POST   /modules/install-from-local
POST   /modules/{module_id}/enable
POST   /modules/{module_id}/disable
DELETE /modules/{module_id}
GET    /tools
GET    /tools/{tool_id}
POST   /tools/{tool_id}/run
GET    /history
GET    /settings
```

Module lifecycle:

1. Download or copy module
2. Read `nekora.module.json`
3. Validate module id, version, entry point, permissions
4. Install Python dependencies if needed
5. Register module in SQLite
6. Load module dynamically
7. Expose tools through `/tools`
8. Allow disable without deleting
9. Allow delete to remove files and release disk space

Important design requirements:

- The root app must still work without any external module.
- At least one base module should be built first.
- External modules should not modify Nekora core files.
- Modules should be removable by deleting their installed folder and database entry.
- The frontend should not know whether a tool is built-in or external.
- Module installation should be explicit and visible to the user.
- Heavy models should belong to modules, not the root app.
- Module disk usage should be tracked.
- Module dependencies should be isolated as much as possible.
- Security should be considered before running arbitrary Git modules.
