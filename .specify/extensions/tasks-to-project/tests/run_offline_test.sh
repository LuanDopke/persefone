#!/usr/bin/env bash
# run_offline_test.sh
#
# Offline test for the tasks-to-project extension.
#
# Creates a temporary directory, copies the extension into a fake project
# layout (with a fake `specs/001-demo/spec.md` + `tasks.md` and a git
# repository pointing at a GitHub origin), then runs `publish --dry-run`
# and `sync --dry-run` and asserts the expected output.
#
# Uses --dry-run so no `gh` calls are made and the test works fully offline.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

TMP="$(mktemp -d 2>/dev/null || mktemp -d -t tasks-to-project)"
trap 'rm -rf "$TMP"' EXIT

echo "tasks-to-project test: scratch dir = $TMP"

mkdir -p "$TMP/.specify/extensions/tasks-to-project"
cp -r "$EXT_DIR/." "$TMP/.specify/extensions/tasks-to-project/"

# Fake git repo with a GitHub-looking origin.
git -C "$TMP" init -q
git -C "$TMP" remote add origin "https://github.com/example-org/example-repo.git"

# Fixture spec.md exercising multiple priority-declaration styles.
mkdir -p "$TMP/specs/001-demo"
cat > "$TMP/specs/001-demo/spec.md" <<'SPEC'
# Feature Spec: Demo

## User Stories

### User Story 1 - Login (Priority: P1)

As a user I want to log in.

### User Story 2: Reset Password [P2]

The user must be able to reset.

### User Story 3 (P3)

Settings page.

### User Story 4

**Priority**: P1

Audit log.
SPEC

# Fixture tasks.md covering every interesting path:
#   - tasks with/without [P]
#   - tasks with/without [USx]
#   - one task already done [x] (skipped on publish, moved to Done on sync)
#   - tasks for a story that has NO priority (just to confirm graceful handling)
cat > "$TMP/specs/001-demo/tasks.md" <<'TASKS'
# Tasks: Demo

## Phase 1: Setup

- [ ] T001 Create project scaffolding in apps/web
- [ ] T002 [P] Configure linting in tooling/eslint

## Phase 2: Foundational

- [ ] T003 Provision shared auth in src/auth/base.ts

## Phase 3: User Story 1 - Login

- [ ] T004 [P] [US1] Create login form in src/login/Form.tsx
- [x] T005 [US1] Wire login service in src/login/service.ts
- [ ] T006 [US1] Add login e2e test in tests/e2e/login.spec.ts

## Phase 4: User Story 2 - Reset Password

- [ ] T007 [US2] Create reset form in src/reset/Form.tsx
- [ ] T008 [P] [US2] Send reset email in src/reset/mailer.ts

## Phase 5: User Story 3 - Settings

- [ ] T009 [US3] Build settings page in src/settings/Page.tsx

## Phase 6: Polish

- [ ] T010 [P] Update README in README.md
TASKS

# Override config: empty owner -> auto-detected; project.number must be > 0
# even in dry-run because load_config validates it.
cat > "$TMP/.specify/extensions/tasks-to-project/tasks-to-project-config.yml" <<'YAML'
project:
  owner: ""
  number: 42
mode: "draft"
status_field: "Status"
default_status: "Todo"
done_status: "Done"
priority_field: "Priority"
add_labels: true
skip_completed: true
only_stories: []
YAML

_python=""
for _cand in python3 python py; do
  if command -v "$_cand" >/dev/null 2>&1; then
    _ver="$("$_cand" --version 2>&1 || true)"
    if [[ "$_ver" == Python\ 3.* ]]; then
      _python="$_cand"
      break
    fi
  fi
done
if [[ -z "$_python" ]]; then
  echo "Python 3 is required to run this test." >&2
  exit 1
fi
echo "tasks-to-project test: using interpreter = $_python"

# --- 1. publish --dry-run ---------------------------------------------------
echo
echo "== publish --dry-run =="
PUB_OUT="$(cd "$TMP" && "$_python" .specify/extensions/tasks-to-project/scripts/python/publish_tasks_to_project.py publish --dry-run 2>&1)"
echo "$PUB_OUT"

fail=0
check() {
  local needle="$1"; local haystack="$2"; local label="$3"
  if grep -Fq -- "$needle" <<<"$haystack"; then
    echo "  PASS  $label"
  else
    echo "  FAIL  $label  (expected to find: $needle)"
    fail=1
  fi
}

check "parsed 10 tasks"                                   "$PUB_OUT" "all 10 tasks parsed"
check "publishing 9 to project"                           "$PUB_OUT" "T005 (done) skipped on publish"
check "US1->P1"                                           "$PUB_OUT" "US1 mapped to P1"
check "US2->P2"                                           "$PUB_OUT" "US2 mapped to P2"
check "US3->P3"                                           "$PUB_OUT" "US3 mapped to P3"
check "WOULD CREATE  [T004] Create login form"            "$PUB_OUT" "T004 card title"
check "priority=P1"                                       "$PUB_OUT" "T004 priority shown"
check "'speckit:phase:setup'"                             "$PUB_OUT" "phase label slug present"
check "'speckit:us1'"                                     "$PUB_OUT" "story label present"
check "'speckit:p1'"                                      "$PUB_OUT" "priority label present"

# T010 is in Polish and has no story -> must not carry a US/priority label.
T010_LINE="$(grep -F 'WOULD CREATE  [T010]' <<<"$PUB_OUT" || true)"
if [[ -n "$T010_LINE" ]]; then
  if grep -Eq "speckit:us|speckit:p[0-9]" <<<"$T010_LINE"; then
    echo "  FAIL  T010 should not carry US/priority labels: $T010_LINE"
    fail=1
  else
    echo "  PASS  T010 (no story) has no US/priority labels"
  fi
else
  echo "  FAIL  T010 line not found in publish output"
  fail=1
fi

# --- 2. sync --dry-run (no items exist -> behaves like publish, but T005 is created in Done) ---
echo
echo "== sync --dry-run =="
SYNC_OUT="$(cd "$TMP" && "$_python" .specify/extensions/tasks-to-project/scripts/python/publish_tasks_to_project.py sync --dry-run 2>&1)"
echo "$SYNC_OUT"

check "parsed 10 tasks"                                   "$SYNC_OUT" "sync parses 10 tasks"
check "dry-run sync assumes no existing items"            "$SYNC_OUT" "sync dry-run notice present"
check "created=9, updated=0, unchanged=1, orphans=0"      "$SYNC_OUT" "sync summary: 9 created, 1 unchanged (the [x] task)"
if grep -Fq "WOULD CREATE  [T005]" <<<"$SYNC_OUT"; then
  echo "  FAIL  T005 ([x] + skip_completed) must NOT be created on sync"; fail=1
else
  echo "  PASS  T005 ([x] + skip_completed) correctly skipped by sync"
fi

# --- 3. only_stories filter ------------------------------------------------
cat > "$TMP/.specify/extensions/tasks-to-project/tasks-to-project-config.yml" <<'YAML'
project:
  owner: ""
  number: 42
mode: "issues"
status_field: "Status"
default_status: "Todo"
done_status: "Done"
priority_field: "Priority"
add_labels: true
skip_completed: true
only_stories: ["US1"]
YAML

echo
echo "== publish --dry-run (only_stories=[US1], mode=issues) =="
ONLY_OUT="$(cd "$TMP" && "$_python" .specify/extensions/tasks-to-project/scripts/python/publish_tasks_to_project.py publish --dry-run 2>&1)"
echo "$ONLY_OUT"

# US1 has T004, T005, T006. T005 is [x] so it's skipped: publish 2 cards.
check "publishing 2 to project"                           "$ONLY_OUT" "only_stories filter limits to 2 tasks"
check "WOULD CREATE  [T004]"                              "$ONLY_OUT" "T004 still present under US1 filter"
check "WOULD CREATE  [T006]"                              "$ONLY_OUT" "T006 still present under US1 filter"
if grep -Fq "WOULD CREATE  [T007]" <<<"$ONLY_OUT"; then
  echo "  FAIL  T007 (US2) should be filtered out"; fail=1
else
  echo "  PASS  T007 (US2) correctly filtered out"
fi
if grep -Fq "WOULD CREATE  [T001]" <<<"$ONLY_OUT"; then
  echo "  FAIL  T001 (no story) should be filtered out by only_stories"; fail=1
else
  echo "  PASS  T001 (no story) correctly filtered out"
fi

echo
if (( fail == 0 )); then
  echo "tasks-to-project: ALL CHECKS PASSED"
  exit 0
else
  echo "tasks-to-project: SOME CHECKS FAILED"
  exit 1
fi
