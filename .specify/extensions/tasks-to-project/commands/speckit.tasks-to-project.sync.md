---
description: "Reconcile the current feature's tasks.md against existing cards on a GitHub Project (v2) board"
---

# Sync Tasks with GitHub Project

Reconcile the current feature's `tasks.md` against the cards already present
on the configured GitHub Project (v2) board. Unlike `publish`, this command
is **idempotent**: running it repeatedly is safe.

## Behavior

For each task in `tasks.md` the sync script matches an existing project item
by **task ID** (the `[T###]` prefix in the card title, or the `Task ID: T###`
line in the card body) and then:

1. **Missing card** → creates a new one (respecting `mode`, `add_labels`,
   `skip_completed` and `only_stories` from the config).
2. **Card exists & task is checked off `[x]`** → moves the card to the
   `done_status` column on the configured `status_field`.
3. **Card exists & task is unchecked, but the card is currently in
   `done_status`** → moves it back to `default_status`. In-progress columns
   are left untouched so manual kanban moves are preserved.
4. **Priority field configured** → re-applies the priority derived from
   `spec.md` (so updating a story's priority in the spec automatically
   propagates to the board).
5. **Orphan cards** (cards whose task ID no longer exists in `tasks.md`) are
   listed in the summary but **never deleted**.

Configuration lives in
`.specify/extensions/tasks-to-project/tasks-to-project-config.yml`. The
relevant fields are `status_field`, `default_status`, `done_status`,
`priority_field`, `mode`, `add_labels`, `skip_completed`, `only_stories`.

## Pre-requisites (enforced by the script)

1. `gh` CLI installed and authenticated with `project` scope.
2. `origin` git remote points to a GitHub repository.

> [!CAUTION]
> Sync ONLY touches the project configured in
> `tasks-to-project-config.yml`. It NEVER deletes existing cards.

## Execution

- **Bash**: `.specify/extensions/tasks-to-project/scripts/bash/sync-tasks-to-project.sh [tasks_md_path]`
- **PowerShell**: `.specify/extensions/tasks-to-project/scripts/powershell/sync-tasks-to-project.ps1 [tasks_md_path]`

Use `--dry-run` (bash) or `-DryRun` (PowerShell) to preview every change
without touching GitHub.

## Done When

- [ ] Every task in `tasks.md` has a matching card on the configured project.
- [ ] Cards for `[x]` tasks are in the `done_status` column.
- [ ] Cards demoted from `done_status` (because their task got unchecked) are
      back in the `default_status` column.
- [ ] When `priority_field` is configured, each card's priority option
      reflects the priority of its user story as written in `spec.md`.
- [ ] A summary is printed listing created / updated / unchanged / orphan /
      failed counts.
