#!/usr/bin/env bash
# publish-tasks-to-project.sh
#
# Wrapper around the Python implementation that publishes a Spec Kit
# tasks.md to a GitHub Project (v2) kanban board.
#
# Usage:
#   publish-tasks-to-project.sh [tasks_md_path] [--dry-run]

set -euo pipefail

PROJECT_ROOT="$(pwd)"
EXT_DIR="$PROJECT_ROOT/.specify/extensions/tasks-to-project"
PY_SCRIPT="$EXT_DIR/scripts/python/publish_tasks_to_project.py"

if [[ ! -f "$PY_SCRIPT" ]]; then
  echo "tasks-to-project: python script not found at $PY_SCRIPT" >&2
  exit 1
fi

_python=""
if command -v python3 >/dev/null 2>&1; then
  _python="python3"
elif command -v python >/dev/null 2>&1 && python --version 2>&1 | grep -q "^Python 3"; then
  _python="python"
fi

if [[ -z "$_python" ]]; then
  echo "tasks-to-project: Python 3 not found on PATH; cannot publish." >&2
  exit 1
fi

exec "$_python" "$PY_SCRIPT" publish "$@"
