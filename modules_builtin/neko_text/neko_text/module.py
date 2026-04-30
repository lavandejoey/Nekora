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


def _source_text(input_data: dict[str, Any]) -> str:
    file_text = input_data.get("file_text")
    if isinstance(file_text, str) and file_text:
        return file_text
    files = input_data.get("files")
    if isinstance(files, list) and files:
        first = files[0]
        if isinstance(first, dict):
            embedded_text = first.get("text")
            if isinstance(embedded_text, str) and embedded_text:
                return embedded_text
    return _text_value(input_data)


def uppercase(input_data: dict[str, Any], _context: ToolContext) -> dict[str, Any]:
    return {"text": _text_value(input_data).upper()}


def lowercase(input_data: dict[str, Any], _context: ToolContext) -> dict[str, Any]:
    return {"text": _text_value(input_data).lower()}


def count_text(input_data: dict[str, Any], _context: ToolContext) -> dict[str, Any]:
    text = _source_text(input_data)
    words = [part for part in text.split() if part]
    non_space_characters = sum(1 for char in text if not char.isspace())
    word_or_character_units = sum(
        1 if any(char.isalnum() and char.isascii() for char in part) else len(part)
        for part in words
    )
    lines = len(text.splitlines()) if text else 0
    pages = max(1, (word_or_character_units + 499) // 500) if text.strip() else 0
    return {
        "pages": pages,
        "lines": lines,
        "words": len(words),
        "characters": len(text),
        "characters_no_spaces": non_space_characters,
        "word_or_character_units": word_or_character_units,
    }


def create_module() -> NekoraModule:
    return NekoraModule(
        id="nekora.neko_text",
        name="NekoText",
        version="0.1.0",
        description="Basic text utilities for the Nekora core.",
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
                name="Statistics",
                description="Measure text length, lines, words, and pages.",
                input_schema=TEXT_INPUT_SCHEMA,
                output_schema={
                    "type": "object",
                    "required": [
                        "pages",
                        "lines",
                        "words",
                        "characters",
                        "characters_no_spaces",
                        "word_or_character_units",
                    ],
                    "properties": {
                        "pages": {"type": "integer"},
                        "lines": {"type": "integer"},
                        "words": {"type": "integer"},
                        "characters": {"type": "integer"},
                        "characters_no_spaces": {"type": "integer"},
                        "word_or_character_units": {"type": "integer"},
                    },
                },
                run=count_text,
            ),
        ),
    )
