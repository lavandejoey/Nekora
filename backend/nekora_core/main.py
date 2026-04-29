from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from nekora_core import __version__
from nekora_core.api.routes import router
from nekora_core.modules.manager import ModuleManager


def create_app() -> FastAPI:
    manager = ModuleManager()
    manager.load_builtin_modules()

    app = FastAPI(title="Nekora Core", version=__version__)
    app.state.module_manager = manager

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:1420", "http://127.0.0.1:1420"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router)
    return app


app = create_app()

