from typing import Any

from nekora_core.sdk import NekoraModule, NekoraTool, ToolContext


TEXT_INPUT_SCHEMA = {
    "type": "object",
    "required": ["text"],
    "properties": {
        "text": {
            "type": "string",
            "title": "Text",
            "description": "Text to process.",
        }
    },
}

TEXT_OUTPUT_SCHEMA = {
    "type": "object",
    "required": ["text"],
    "properties": {"text": {"type": "string"}},
}


def _text_value(input_data: dict[str, Any]) -> str:
    value = input_data.get("text", "")
    if not isinstance(value, str):
        raise ValueError("Expected input_data.text to be a string")
    return value


def uppercase(input_data: dict[str, Any], _context: ToolContext) -> dict[str, Any]:
    return {"text": _text_value(input_data).upper()}


def lowercase(input_data: dict[str, Any], _context: ToolContext) -> dict[str, Any]:
    return {"text": _text_value(input_data).lower()}


def count_text(input_data: dict[str, Any], _context: ToolContext) -> dict[str, Any]:
    text = _text_value(input_data)
    words = [part for part in text.split() if part]
    return {"characters": len(text), "words": len(words), "lines": len(text.splitlines())}


def create_module() -> NekoraModule:
    return NekoraModule(
        id="nekora.neko_text",
        name="NekoText",
        version="0.1.0",
        description="Basic text utilities for the Nekora core MVP.",
        author="Nekora",
        permissions=(),
        source="builtin",
        tools=(
            NekoraTool(
                id="text.uppercase",
                name="Uppercase",
                description="Convert text to uppercase.",
                input_schema=TEXT_INPUT_SCHEMA,
                output_schema=TEXT_OUTPUT_SCHEMA,
                run=uppercase,
            ),
            NekoraTool(
                id="text.lowercase",
                name="Lowercase",
                description="Convert text to lowercase.",
                input_schema=TEXT_INPUT_SCHEMA,
                output_schema=TEXT_OUTPUT_SCHEMA,
                run=lowercase,
            ),
            NekoraTool(
                id="text.count",
                name="Count Text",
                description="Count characters, words, and lines.",
                input_schema=TEXT_INPUT_SCHEMA,
                output_schema={
                    "type": "object",
                    "required": ["characters", "words", "lines"],
                    "properties": {
                        "characters": {"type": "integer"},
                        "words": {"type": "integer"},
                        "lines": {"type": "integer"},
                    },
                },
                run=count_text,
            ),
        ),
    )

