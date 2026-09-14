# Usage Examples

## End-to-end workflow

```bash
# 1. Define your feature
/speckit.specify "User can log in with email and password"

# 2. Plan it
/speckit.plan

# 3. Break it into tasks. At the end, the after_tasks hook proposes:
/speckit.tasks
/speckit.tasks-to-project.publish   # accept the optional hook

# 4. Implement and commit. At the end, the after_implement hook proposes:
/speckit.implement
/speckit.tasks-to-project.sync      # accept the optional hook
```

## Publishing only one user story (MVP)

```yaml
# .specify/extensions/tasks-to-project/tasks-to-project-config.yml
only_stories: ["US1"]
```

Then:

```bash
.specify/extensions/tasks-to-project/scripts/bash/publish-tasks-to-project.sh
```

Only tasks tagged `[US1]` will be published. Re-run with
`only_stories: ["US2"]` later to add story 2 to the same board.

## Switching to issue-backed cards

```yaml
mode: "issues"
add_labels: true
```

Each task becomes a real GitHub issue in the `origin` repo, with labels
`speckit:us1`, `speckit:phase:setup`, `speckit:p1`, etc., and the issue is
added to the project automatically.

## Re-aligning priorities after a spec change

1. Edit `spec.md`: e.g. promote a story from `P2` to `P1`.
2. Run:
   ```bash
   .specify/extensions/tasks-to-project/scripts/bash/sync-tasks-to-project.sh
   ```
3. Every card carrying the `[USn]` label of the affected story is moved
   to the matching `Priority` option on the board.

## Dry-run anything

Both scripts accept `--dry-run` (bash) / `-DryRun` (PowerShell). The script
parses `tasks.md` + `spec.md`, prints exactly what it would create or
update, and exits without touching GitHub.

```bash
.specify/extensions/tasks-to-project/scripts/bash/publish-tasks-to-project.sh --dry-run
.specify/extensions/tasks-to-project/scripts/bash/sync-tasks-to-project.sh    --dry-run
```
