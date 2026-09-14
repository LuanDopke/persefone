#!/usr/bin/env bash
# release.sh
#
# Helper to tag a new release for the tasks-to-project Spec Kit extension.
# Reads the version from `extension.yml` (`extension.version`) and creates
# a matching git tag `v<version>`. Run with `--push` to push the tag to
# origin (this is what the Spec Kit catalog references via the archive URL
# `archive/refs/tags/v<version>.zip`).
#
# Usage:
#   scripts/release.sh [--push]

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v python3 >/dev/null 2>&1 && ! python --version 2>&1 | grep -q "^Python 3"; then
  echo "release: Python 3 is required to read extension.yml" >&2
  exit 1
fi
PY="$(command -v python3 || command -v python)"

VERSION="$("$PY" - <<'PY'
import yaml, pathlib
data = yaml.safe_load(pathlib.Path("extension.yml").read_text(encoding="utf-8"))
print((data.get("extension") or {}).get("version", "").strip())
PY
)"

if [[ -z "$VERSION" ]]; then
  echo "release: could not read extension.version from extension.yml" >&2
  exit 1
fi

TAG="v$VERSION"

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "release: tag $TAG already exists locally"
else
  echo "release: tagging $TAG"
  git tag -a "$TAG" -m "Release $TAG"
fi

if [[ "${1:-}" == "--push" ]]; then
  echo "release: pushing $TAG to origin"
  git push origin "$TAG"
  echo
  echo "release: archive URL will be:"
  REMOTE="$(git remote get-url origin)"
  REMOTE="${REMOTE%.git}"
  echo "  ${REMOTE}/archive/refs/tags/${TAG}.zip"
fi
