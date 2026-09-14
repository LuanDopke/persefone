# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-06-21

### Added

- New `/speckit.tasks-to-project.sync` command (idempotent reconciliation
  between `tasks.md` and the existing GitHub Project (v2) cards). Registered
  as an optional `after_implement` hook.
- Priority field support: priorities (`P1`, `P2`, `P3`, ...) are parsed from
  the user-story headings of `spec.md` and applied to a configurable
  single-select Project field (`priority_field`). Multiple heading styles are
  recognized (`(Priority: P1)`, `[P2]`, `(P3)`, or `**Priority**: Px` on a
  following line).
- `done_status` config key — `sync` moves cards to this column when the
  matching task gets `[x]`-checked in `tasks.md`.
- `speckit:p<n>` GitHub labels emitted in `mode: issues` when a priority is
  known.
- Offline test runner (`tests/run_offline_test.sh`) covering parsing, label
  emission, priority resolution, `only_stories` filtering, dry-run publish
  and dry-run sync.

### Changed

- Python entry point refactored into a subcommand CLI (`publish` / `sync`).
- Bash and PowerShell wrappers split into `publish-*` and `sync-*` variants.

## [0.1.0] - 2026-06-21

### Added

- Initial release.
- `/speckit.tasks-to-project.publish` command (optional `after_tasks` hook).
- `mode: draft` (Project v2 draft items) and `mode: issues` (real GitHub
  issues linked to the project).
- Configurable `status_field` / `default_status` for kanban column
  assignment on creation.
- `only_stories` filter, `skip_completed` toggle, and automatic phase /
  user-story labels in `mode: issues`.
