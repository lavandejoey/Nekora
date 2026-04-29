import sys
from pathlib import Path
from typing import Any

from nekora_core.sdk import NekoraModule, ToolContext


class ModuleError(RuntimeError):
    pass


class ToolNotFoundError(ModuleError):
    pass


class ModuleManager:
    def __init__(self) -> None:
        self._modules: dict[str, NekoraModule] = {}
        self._enabled: dict[str, bool] = {}

    def load_builtin_modules(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        if str(repo_root) not in sys.path:
            sys.path.insert(0, str(repo_root))

        from modules_builtin.neko_text.neko_text.module import create_module

        self.register_module(create_module())

    def register_module(self, module: NekoraModule) -> None:
        if module.id in self._modules:
            raise ModuleError(f"Module already registered: {module.id}")
        tool_ids = [tool.id for tool in module.tools]
        if len(tool_ids) != len(set(tool_ids)):
            raise ModuleError(f"Module has duplicate tool ids: {module.id}")
        self._modules[module.id] = module
        self._enabled[module.id] = True

    def list_modules(self) -> list[dict[str, Any]]:
        return [
            module.describe(enabled=self._enabled.get(module.id, False))
            for module in self._modules.values()
        ]

    def set_module_enabled(self, module_id: str, enabled: bool) -> dict[str, Any]:
        module = self._modules.get(module_id)
        if module is None:
            raise ModuleError(f"Unknown module: {module_id}")
        self._enabled[module_id] = enabled
        return module.describe(enabled=enabled)

    def list_tools(self) -> list[dict[str, Any]]:
        tools: list[dict[str, Any]] = []
        for module in self._modules.values():
            if not self._enabled.get(module.id, False):
                continue
            tools.extend(tool.describe(module.id) for tool in module.tools)
        return tools

    def get_tool(self, tool_id: str) -> dict[str, Any]:
        module, tool = self._find_enabled_tool(tool_id)
        return tool.describe(module.id)

    def run_tool(self, tool_id: str, input_data: dict[str, Any]) -> dict[str, Any]:
        module, tool = self._find_enabled_tool(tool_id)
        context = ToolContext(module_id=module.id, permissions=module.permissions)
        try:
            result = tool.run(input_data, context)
        except ValueError as exc:
            raise ModuleError(str(exc)) from exc
        return {"tool_id": tool.id, "module_id": module.id, "output": result}

    def _find_enabled_tool(self, tool_id: str):
        for module in self._modules.values():
            if not self._enabled.get(module.id, False):
                continue
            for tool in module.tools:
                if tool.id == tool_id:
                    return module, tool
        raise ToolNotFoundError(f"Unknown or disabled tool: {tool_id}")
