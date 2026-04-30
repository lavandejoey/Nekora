# Nekora

Copyright © 2026 Ziyi LIU.

Nekora is a local-first desktop toolkit host. The core app provides the
desktop UI, backend API, module manager, shared SDK, settings, history, and
permission boundaries. Tool implementations live in built-in or external
modules.

The root repository is for the core host only. Independent tool packages such
as `NekoPDF`, `NekoImage`, or `NekoOCR` should live in separate repositories and
can be checked out locally under ignored development folders such as
`external_modules/`.

## Current Slice

- FastAPI backend in `backend/`
- React + Vite UI scaffold in `desktop/`
- Tauri v2 shell config in `desktop/src-tauri/`
- Built-in `NekoText` module in `modules_builtin/neko_text/`
- In-memory module registry and tool runner

## Backend

Install backend dependencies in the `neko312` Python 3.12 environment:

```bash
cd backend
python -m pip install -e ".[dev]"
```

Run the backend:

```bash
scripts/run_backend.sh
```

Available MVP endpoints:

```text
GET  /health
GET  /modules
POST /modules/{module_id}/enable
POST /modules/{module_id}/disable
GET  /tools
GET  /tools/{tool_id}
POST /tools/{tool_id}/run
GET  /history
GET  /settings
```

Example tool run:

```bash
curl -X POST http://127.0.0.1:8000/tools/text.uppercase/run \
  -H "Content-Type: application/json" \
  -d '{"input_data":{"text":"hello nekora"}}'
```

## Desktop UI

Install frontend dependencies:

```bash
cd desktop
npm install
```

Run the Vite UI:

```bash
scripts/run_desktop_dev.sh
```

The UI expects the backend at `http://127.0.0.1:8000`. Override with
`VITE_NEKORA_API_BASE` if needed.

Text input is capped at 100,000 characters. Typed or pasted text runs live;
loaded `.txt` files and direct `.txt` links require pressing Process Text before
the output updates. File/link results can be downloaded from the output panel.

## Runtime Modes

Nekora has three local run modes:

```text
NekoraBk  Backend only
NekoraUi  Windowed UI only
Nekora    Combined one-click app: starts backend, then opens the window
```

Development helpers:

```bash
scripts/NekoraBk
scripts/NekoraUi
scripts/Nekora
```

`Nekora` starts the backend as a child process and stops it when the window
closes. `NekoraUi` expects a backend to already be available at
`http://127.0.0.1:8000`.

## Windowed Desktop Builds

Quick CLI:

```bash
# Linux / WSLg combined app
cd desktop && npm install && npm run tauri:build:linux
./src-tauri/target/release/Nekora
```

```powershell
# Windows combined app
cd desktop
npm install
npm run tauri:build
.\src-tauri\target\release\Nekora.exe
```

Build and run the combined Linux app on Linux or WSL with WSLg:

```bash
cd desktop
npm run tauri:build:linux
./src-tauri/target/release/Nekora
```

Build the frontend-only UI executable:

```bash
cd desktop
cargo build --manifest-path src-tauri/Cargo.toml --release --bin NekoraUi
./src-tauri/target/release/NekoraUi
```

The Debian bundle is written to:

```text
desktop/src-tauri/target/release/bundle/deb/Nekora_0.1.0_amd64.deb
```

Build the Windows executable from a Windows shell, not from WSL:

```powershell
cd desktop
npm install
npm run tauri:build
```

The unpackaged Windows executable is expected under:

```text
desktop\src-tauri\target\release\Nekora.exe
```

The frontend-only Windows executable can be built with:

```powershell
cargo build --manifest-path src-tauri\Cargo.toml --release --bin NekoraUi
```

Expected output:

```text
desktop\src-tauri\target\release\NekoraUi.exe
```

Windows builds require the Rust toolchain, Microsoft C++ Build Tools, WebView2,
Node.js, and npm installed on Windows.

## Module Direction

Each module should expose a `nekora.module.json` manifest and a Python factory:

```python
def create_module():
    return NekoraModule(...)
```

External module installation, SQLite persistence, dependency isolation, and
permission enforcement are intentionally not in the first slice. They will be
added after the backend/module contract stabilizes.

## License

Nekora is licensed under the GNU General Public License v3.0. See `LICENSE`.
