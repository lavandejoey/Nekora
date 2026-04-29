from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any


ToolRunner = Callable[[dict[str, Any], "ToolContext"], dict[str, Any]]


@dataclass(frozen=True)
class ToolContext:
    module_id: str
    permissions: tuple[str, ...] = ()


@dataclass(frozen=True)
class NekoraTool:
    id: str
    name: str
    description: str
    input_schema: dict[str, Any]
    output_schema: dict[str, Any]
    run: ToolRunner

    def describe(self, module_id: str) -> dict[str, Any]:
        return {
            "id": self.id,
            "module_id": module_id,
            "name": self.name,
            "description": self.description,
            "input_schema": self.input_schema,
            "output_schema": self.output_schema,
        }


@dataclass(frozen=True)
class NekoraModule:
    id: str
    name: str
    version: str
    description: str
    author: str
    permissions: tuple[str, ...] = ()
    tools: tuple[NekoraTool, ...] = field(default_factory=tuple)
    source: str = "builtin"

    def describe(self, enabled: bool) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "description": self.description,
            "author": self.author,
            "permissions": list(self.permissions),
            "tools": [tool.id for tool in self.tools],
            "source": self.source,
            "enabled": enabled,
        }

