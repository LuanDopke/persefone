---
description: "Publish the current feature's tasks.md to a GitHub Project (v2) kanban board"
---

# Publish Tasks to GitHub Project

Push the tasks listed in the current feature's `tasks.md` to a GitHub Project
(v2) kanban board as one card per task.

## Behavior

The publish script reads its configuration from
`.specify/extensions/tasks-to-project/tasks-to-project-config.yml`:

- `project.owner` / `project.number` — the target GitHub Project (v2). If
  `owner` is empty, it is auto-detected from `git remote get-url origin`.
- `mode` — `draft` to create draft project items, `issues` to open real
  issues in the `origin` repo and link them to the project.
- `status_field` / `default_status` — the project field and option used as
  the initial kanban column for every new card.
- `add_labels` — when `mode: issues`, also tag each issue with
  `speckit:<storyId>` and `speckit:phase:<phase-name>` labels (created on the
  fly if missing).
- `skip_completed` — when `true`, tasks already checked off (`- [x]`) are
  skipped.
- `only_stories` — optional list of story IDs (e.g. `["US1", "US2"]`) to
  restrict publication.

The script auto-discovers the most recently modified `specs/*/tasks.md`. A
custom path can be passed as the first positional argument.

## Pre-requisites (enforced by the script)

1. `gh` CLI is installed and authenticated (`gh auth status`).
2. The active token has the `project` scope (the script suggests
   `gh auth refresh -s project` otherwise).
3. The `origin` git remote points to a GitHub repository.

> [!CAUTION]
> The script ONLY publishes to the project configured in
> `tasks-to-project-config.yml`. It NEVER touches issues / projects in
> repositories that do not match the `origin` remote.

## Execution

- **Bash**: `.specify/extensions/tasks-to-project/scripts/bash/publish-tasks-to-project.sh [tasks_md_path]`
- **PowerShell**: `.specify/extensions/tasks-to-project/scripts/powershell/publish-tasks-to-project.ps1 [tasks_md_path]`

## Done When

- [ ] Every eligible task line in `tasks.md` has a corresponding card on the
      configured GitHub Project board.
- [ ] In `issues` mode, an issue exists for each card and is linked to the
      project.
- [ ] Cards default to the configured kanban column (`default_status`) when
      the field/option exist on the project.
- [ ] A summary is printed listing how many cards were created, skipped, or
      failed.
