#!/usr/bin/env python3
"""Convert chapter authoring YAML into canonical JSON chapter files.

Usage:
  python3 scripts/build_question_db.py --input data/source --output data/chapters
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

try:
    import yaml
except ModuleNotFoundError as exc:  # pragma: no cover - environment dependent
    raise SystemExit("PyYAML is required. Install it with: python3 -m pip install pyyaml") from exc


@dataclass
class ValidationError(Exception):
    message: str


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="Folder containing chapter YAML files")
    parser.add_argument("--output", required=True, type=Path, help="Folder to write canonical JSON files")
    args = parser.parse_args()

    input_dir: Path = args.input
    output_dir: Path = args.output

    if not input_dir.exists():
        raise SystemExit(f"Input folder does not exist: {input_dir}")

    output_dir.mkdir(parents=True, exist_ok=True)

    yaml_files = sorted(input_dir.glob("*.yml")) + sorted(input_dir.glob("*.yaml"))
    if not yaml_files:
        raise SystemExit(f"No YAML files found in {input_dir}")

    for yaml_file in yaml_files:
        chapter = load_yaml(yaml_file)
        normalized = validate_and_normalize(chapter, yaml_file)
        output_file = output_dir / f"{yaml_file.stem}.json"
        output_file.write_text(
            json.dumps(normalized, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        print(f"Wrote {output_file}")

    return 0


def load_yaml(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def validate_and_normalize(chapter: Any, path: Path) -> dict[str, Any]:
    if not isinstance(chapter, dict):
        raise ValidationError(f"{path}: chapter file must be a mapping")

    chapter_title = require_string(chapter, "chapterTitle", path)
    categories = require_list(chapter, "categories", path)

    normalized_categories: list[dict[str, Any]] = []
    category_ids: set[str] = set()

    for category_index, category in enumerate(categories):
        category_path = f"{path}:categories[{category_index}]"
        if not isinstance(category, dict):
            raise ValidationError(f"{category_path} must be a mapping")

        category_id = require_string(category, "id", path, category_path)
        if category_id in category_ids:
            raise ValidationError(f"{category_path}.id must be unique")
        category_ids.add(category_id)

        normalized_categories.append(
            {
                "id": category_id,
                "name": require_string(category, "name", path, category_path),
                "questions": normalize_questions(
                    require_list(category, "questions", path, category_path),
                    path,
                    category_path,
                ),
            }
        )

    return {"chapterTitle": chapter_title, "categories": normalized_categories}


def normalize_questions(questions: list[Any], path: Path, category_path: str) -> list[dict[str, Any]]:
    normalized_questions: list[dict[str, Any]] = []
    question_ids: set[str] = set()

    for question_index, question in enumerate(questions):
        question_path = f"{category_path}.questions[{question_index}]"
        if not isinstance(question, dict):
            raise ValidationError(f"{question_path} must be a mapping")

        question_id = require_string(question, "id", path, question_path)
        if question_id in question_ids:
            raise ValidationError(f"{question_path}.id must be unique within a category")
        question_ids.add(question_id)

        normalized: dict[str, Any] = {"id": question_id}

        question_type = question.get("type", "basic")
        if question_type not in {"basic", "multiple-choice", "numeric"}:
            raise ValidationError(f"{question_path}.type must be basic, multiple-choice, or numeric")
        if question_type != "basic":
            normalized["type"] = question_type

        if "prompt" in question:
            normalized["prompt"] = require_string(question, "prompt", path, question_path)
        if "hint" in question:
            normalized["hint"] = require_string(question, "hint", path, question_path)
        if "answer" in question:
            normalized["answer"] = require_string(question, "answer", path, question_path)
        if "lastUpdated" in question:
            normalized["lastUpdated"] = require_string(question, "lastUpdated", path, question_path)
        if "image" in question:
            normalized["image"] = normalize_image(question["image"], question_path)
        if "author" in question:
            authors = require_list_or_string(question, "author", path, question_path)
            normalized["author"] = [require_plain_string(author, f"{question_path}.author") for author in authors]
        if "reviewer" in question:
            reviewers = require_list_or_string(question, "reviewer", path, question_path)
            normalized["reviewer"] = [require_plain_string(reviewer, f"{question_path}.reviewer") for reviewer in reviewers]
        if question.get("parts") is not None:
            normalized["parts"] = normalize_parts(question["parts"], path, question_path)
        elif "prompt" not in question:
            raise ValidationError(f"{question_path}.prompt is required unless parts are provided")

        if question_type == "multiple-choice":
            options = require_list(question, "options", path, question_path)
            if len(options) < 2:
                raise ValidationError(f"{question_path}.options must contain at least two entries")
            normalized["options"] = [require_plain_string(option, f"{question_path}.options") for option in options]
            if "correctIndex" not in question:
                raise ValidationError(f"{question_path}.correctIndex is required for multiple-choice questions")
            correct_index = question["correctIndex"]
            if not isinstance(correct_index, int) or not (0 <= correct_index < len(options)):
                raise ValidationError(f"{question_path}.correctIndex must point to an option")
            normalized["correctIndex"] = correct_index

        if question_type == "numeric":
            if "answer" not in question:
                raise ValidationError(f"{question_path}.answer is required for numeric questions")
            try:
                float(str(question["answer"]))
            except ValueError as exc:
                raise ValidationError(f"{question_path}.answer must be numeric") from exc
            if "answerInfo" in question:
                normalized["answerInfo"] = require_string(question, "answerInfo", path, question_path)
            if "units" in question:
                normalized["units"] = require_string(question, "units", path, question_path)
            if "tolerance" in question:
                tolerance = question["tolerance"]
                if not isinstance(tolerance, (int, float)):
                    raise ValidationError(f"{question_path}.tolerance must be numeric")
                normalized["tolerance"] = tolerance

        normalized_questions.append(normalized)

    return normalized_questions


def normalize_parts(parts: Any, path: Path, question_path: str) -> list[dict[str, Any]]:
    if not isinstance(parts, list):
        raise ValidationError(f"{question_path}.parts must be a list")

    normalized_parts: list[dict[str, Any]] = []
    for part_index, part in enumerate(parts):
        part_path = f"{question_path}.parts[{part_index}]"
        if not isinstance(part, dict):
            raise ValidationError(f"{part_path} must be a mapping")

        normalized_part: dict[str, Any] = {}
        if "prompt" in part:
            normalized_part["prompt"] = require_string(part, "prompt", path, part_path)
        if "label" in part:
            normalized_part["label"] = require_string(part, "label", path, part_path)
        if "type" in part and part["type"] != "basic":
            normalized_part["type"] = part["type"]
        if "answer" in part:
            normalized_part["answer"] = require_string(part, "answer", path, part_path)
        if "hint" in part:
            normalized_part["hint"] = require_string(part, "hint", path, part_path)
        if "image" in part:
            normalized_part["image"] = normalize_image(part["image"], part_path)
        if "parts" in part:
            normalized_part["parts"] = normalize_parts(part["parts"], path, part_path)
        elif "prompt" not in part:
            raise ValidationError(f"{part_path}.prompt is required unless parts are provided")

        if part.get("type") == "multiple-choice":
            options = require_list(part, "options", path, part_path)
            if len(options) < 2:
                raise ValidationError(f"{part_path}.options must contain at least two entries")
            normalized_part["options"] = [require_plain_string(option, f"{part_path}.options") for option in options]
            if "correctIndex" not in part:
                raise ValidationError(f"{part_path}.correctIndex is required for multiple-choice parts")
            correct_index = part["correctIndex"]
            if not isinstance(correct_index, int) or not (0 <= correct_index < len(options)):
                raise ValidationError(f"{part_path}.correctIndex must point to an option")
            normalized_part["correctIndex"] = correct_index

        if part.get("type") == "numeric" and "tolerance" in part:
            tolerance = part["tolerance"]
            if not isinstance(tolerance, (int, float)):
                raise ValidationError(f"{part_path}.tolerance must be numeric")
            normalized_part["tolerance"] = tolerance

        if part.get("type") == "numeric" and "answerInfo" in part:
            normalized_part["answerInfo"] = require_string(part, "answerInfo", path, part_path)
        if part.get("type") == "numeric" and "units" in part:
            normalized_part["units"] = require_string(part, "units", path, part_path)

        normalized_parts.append(normalized_part)

    return normalized_parts


def normalize_image(image: Any, location: str) -> dict[str, Any]:
    if not isinstance(image, dict):
        raise ValidationError(f"{location}.image must be a mapping")

    result: dict[str, Any] = {"src": require_string(image, "src", Path(location))}
    if "alt" in image:
        result["alt"] = require_string(image, "alt", Path(location))
    if "caption" in image:
        result["caption"] = require_string(image, "caption", Path(location))
    return result


def require_string(value: dict[str, Any], key: str, path: Path, context: str | None = None) -> str:
    if key not in value:
        raise ValidationError(f"{context or path}.{key} is required")
    return require_plain_string(value[key], f"{context or path}.{key}")


def require_plain_string(value: Any, location: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValidationError(f"{location} must be a non-empty string")
    return value


def require_list(value: dict[str, Any], key: str, path: Path, context: str | None = None) -> list[Any]:
    if key not in value or not isinstance(value[key], list):
        raise ValidationError(f"{context or path}.{key} must be a list")
    return value[key]

def require_list_or_string(value: dict[str, Any], key: str, path: Path, context: str | None = None) -> list[Any]:
    if key not in value:
        raise ValidationError(f"{context or path}.{key} is required")
    if isinstance(value[key], list):
        return value[key]
    elif isinstance(value[key], str):
        return [value[key]]
    else:
        raise ValidationError(f"{context or path}.{key} must be a list or a string")

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except ValidationError as error:
        print(error.message, file=sys.stderr)
        raise SystemExit(1)