# Nekora

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
