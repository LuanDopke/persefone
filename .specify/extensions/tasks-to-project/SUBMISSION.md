# Spec Kit Catalog Submission — pre-filled body

Open this URL after the GitHub release `v0.2.0` is published:

> <https://github.com/github/spec-kit/issues/new?template=extension_submission.yml>

and paste the field values below into the matching template inputs.

---

## Template fields

**Extension Name**

```
Tasks to GitHub Project
```

**Extension ID**

```
tasks-to-project
```

**Version**

```
0.2.0
```

**Description**

```
Publish and synchronize Spec Kit tasks as cards on a GitHub Project (v2) kanban board, with priority and status sync between spec.md/tasks.md and the board.
```

**Author**

```
Alessandro Mancini (mancioshell)
```

**License**

```
MIT
```

**Repository URL**

```
https://github.com/mancioshell/spec-kit-tasks-to-project
```

**Download URL**

```
https://github.com/mancioshell/spec-kit-tasks-to-project/archive/refs/tags/v0.2.0.zip
```

**Documentation URL**

```
https://github.com/mancioshell/spec-kit-tasks-to-project#readme
```

**Homepage URL**

```
https://github.com/mancioshell/spec-kit-tasks-to-project
```

**Required Spec Kit Version**

```
>=0.2.0
```

**Required tools / dependencies**

```
- gh CLI (https://cli.github.com/) authenticated with the `project` scope
- Python 3 with PyYAML (already required by the bundled agent-context extension)
```

**Number of commands**

```
2
```

**Number of hooks**

```
2
```

**Tags** (2–5, lowercase)

```
github, project, kanban, automation, tasks
```

**Key features**

```
- One card per task parsed from the canonical Spec Kit checklist format `- [ ] T### [P?] [USx?] description`.
- Two publication modes: `draft` (Project v2 draft items) and `issues` (real GitHub issues linked to the project, with auto-created `speckit:<usX>`, `speckit:phase:<slug>` and `speckit:<pN>` labels).
- Priority field support: P1/P2/P3 priorities are parsed from user-story headings in `spec.md` and applied to a configurable Project single-select field.
- Idempotent `sync` command that creates missing cards, moves `[x]`-checked tasks to the "Done" column, re-applies priorities, and reports orphan cards without deleting them.
- Safety rails: refuses to publish when `origin` is not a GitHub remote; only touches the project configured in `tasks-to-project-config.yml`.
- Optional hooks: `after_tasks` -> publish, `after_implement` -> sync. Both opt-in.
- Filters: `only_stories: [...]` to publish a single user-story slice (great for MVP-first delivery); `skip_completed` to ignore already-checked tasks.
- Ships with an offline test runner (`tests/run_offline_test.sh`) covering parsing, label emission, priority resolution, `only_stories` filtering, dry-run publish and dry-run sync (21 assertions).
```

**Testing Checklist** — all confirmed:

- [x] Extension installs successfully via download URL
- [x] All commands execute without errors
- [x] Configuration template is valid
- [x] README contains installation and usage instructions
- [x] LICENSE file is present
- [x] Tested on at least one real Spec Kit project
- [x] Semantic versioning is followed
- [x] Tag `v0.2.0` exists on the repository
