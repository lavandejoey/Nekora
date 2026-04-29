from typing import Any

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from nekora_core import __version__
from nekora_core.modules.manager import ModuleError, ToolNotFoundError

router = APIRouter()


class ToolRunRequest(BaseModel):
    input_data: dict[str, Any] = Field(default_factory=dict)


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": __version__}


@router.get("/modules")
def list_modules(request: Request) -> list[dict[str, Any]]:
    return request.app.state.module_manager.list_modules()


@router.post("/modules/{module_id}/enable")
def enable_module(module_id: str, request: Request) -> dict[str, Any]:
    try:
        return request.app.state.module_manager.set_module_enabled(module_id, True)
    except ModuleError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/modules/{module_id}/disable")
def disable_module(module_id: str, request: Request) -> dict[str, Any]:
    try:
        return request.app.state.module_manager.set_module_enabled(module_id, False)
    except ModuleError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/tools")
def list_tools(request: Request) -> list[dict[str, Any]]:
    return request.app.state.module_manager.list_tools()


@router.get("/tools/{tool_id}")
def get_tool(tool_id: str, request: Request) -> dict[str, Any]:
    try:
        return request.app.state.module_manager.get_tool(tool_id)
    except ToolNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/tools/{tool_id}/run")
def run_tool(tool_id: str, payload: ToolRunRequest, request: Request) -> dict[str, Any]:
    try:
        return request.app.state.module_manager.run_tool(tool_id, payload.input_data)
    except ToolNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ModuleError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/history")
def history() -> list[dict[str, Any]]:
    return []


@router.get("/settings")
def settings() -> dict[str, Any]:
    return {"module_installation": "explicit", "external_modules_enabled": False}

