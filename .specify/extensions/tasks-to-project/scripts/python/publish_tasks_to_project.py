#!/usr/bin/env python3
"""Publish or sync a Spec Kit tasks.md to a GitHub Project (v2) kanban board.

Subcommands:
    publish   Create one card per task on the configured GitHub Project (v2).
    sync      Reconcile tasks.md against the cards already on the project:
              create missing cards, move completed tasks to the "done" column,
              and warn about orphan cards (cards whose task id no longer
              exists in tasks.md).

Both subcommands share configuration:
    .specify/extensions/tasks-to-project/tasks-to-project-config.yml

This script shells out to the `gh` CLI for every GitHub interaction.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

try:
    import yaml  # type: ignore
except ImportError:  # pragma: no cover - environment guard
    print(
        "tasks-to-project: PyYAML is required but is not installed in the current "
        "Python environment.\n"
        "  To resolve: pip install pyyaml",
        file=sys.stderr,
    )
    sys.exit(2)


EXT_DIR = Path(".specify/extensions/tasks-to-project")
CONFIG_PATH = EXT_DIR / "tasks-to-project-config.yml"

# Canonical Spec Kit task line:
#   - [ ] T001 [P] [US1] Description with file path
#   - [ ] T001 Description
TASK_RE = re.compile(
    r"^\s*-\s*\[(?P<done>[ xX])\]\s+"
    r"(?P<id>T\d+)"
    r"(?:\s+\[(?P<parallel>P)\])?"
    r"(?:\s+\[(?P<story>US\d+)\])?"
    r"\s+(?P<desc>.+?)\s*$"
)
PHASE_RE = re.compile(r"^\s*##\s+Phase\s+(?P<num>\d+)\s*:\s*(?P<name>.+?)\s*$", re.IGNORECASE)
USER_STORY_RE = re.compile(
    r"^\s*#{2,6}\s+User\s+Story\s+(?P<num>\d+)\b", re.IGNORECASE
)
PRIORITY_RE = re.compile(r"\bP(?P<p>[1-9]\d?)\b")
TITLE_TASK_ID_RE = re.compile(r"\[(T\d+)\]")


@dataclass
class Task:
    id: str
    description: str
    done: bool
    parallel: bool
    story: str | None  # e.g. "US1"
    phase: str | None
    line_no: int


@dataclass
class Config:
    owner: str
    number: int
    mode: str
    status_field: str
    default_status: str
    done_status: str
    priority_field: str
    add_labels: bool
    skip_completed: bool
    only_stories: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Generic helpers
# ---------------------------------------------------------------------------


def die(msg: str) -> "None":
    print(f"tasks-to-project: {msg}", file=sys.stderr)
    sys.exit(1)


# ---------------------------------------------------------------------------
# Config / discovery
# ---------------------------------------------------------------------------


def load_config(project_root: Path) -> Config:
    cfg_path = project_root / CONFIG_PATH
    if not cfg_path.is_file():
        die(f"config file not found: {cfg_path}")
    try:
        data = yaml.safe_load(cfg_path.read_text(encoding="utf-8")) or {}
    except yaml.YAMLError as exc:
        die(f"unable to parse {cfg_path}: {exc}")
    project = data.get("project") or {}
    cfg = Config(
        owner=str(project.get("owner") or "").strip(),
        number=int(project.get("number") or 0),
        mode=str(data.get("mode") or "draft").strip().lower(),
        status_field=str(data.get("status_field") or "Status").strip(),
        default_status=str(data.get("default_status") or "").strip(),
        done_status=str(data.get("done_status") or "Done").strip(),
        priority_field=str(data.get("priority_field") or "").strip(),
        add_labels=bool(data.get("add_labels", True)),
        skip_completed=bool(data.get("skip_completed", True)),
        only_stories=[str(s).strip().upper() for s in (data.get("only_stories") or [])],
    )
    if cfg.mode not in {"draft", "issues"}:
        die(f"invalid mode in config: {cfg.mode!r} (must be 'draft' or 'issues')")
    if cfg.number <= 0:
        die("config.project.number must be set to a positive integer")
    return cfg


def detect_origin(project_root: Path) -> tuple[str, str]:
    try:
        url = subprocess.check_output(
            ["git", "-C", str(project_root), "remote", "get-url", "origin"],
            text=True,
        ).strip()
    except (subprocess.CalledProcessError, FileNotFoundError) as exc:
        die(f"`git remote get-url origin` failed: {exc}")
    m = re.match(
        r"(?:https?://[^/]+/|git@[^:]+:)(?P<owner>[^/]+)/(?P<repo>[^/]+?)(?:\.git)?/?$",
        url,
    )
    if not m:
        die(f"could not parse owner/repo from origin URL: {url!r}")
    return m.group("owner"), m.group("repo")


def find_tasks_file(project_root: Path, override: str | None) -> Path:
    if override:
        p = Path(override)
        if not p.is_absolute():
            p = project_root / p
        if not p.is_file():
            die(f"tasks file not found: {p}")
        return p
    specs = project_root / "specs"
    if not specs.is_dir():
        die(f"no specs directory at {specs}; nothing to publish")
    candidates = sorted(
        specs.glob("*/tasks.md"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if not candidates:
        die("no specs/*/tasks.md found; run /speckit.tasks first")
    return candidates[0]


# ---------------------------------------------------------------------------
# tasks.md / spec.md parsing
# ---------------------------------------------------------------------------


def parse_tasks(path: Path) -> list[Task]:
    tasks: list[Task] = []
    current_phase: str | None = None
    for idx, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        ph = PHASE_RE.match(raw_line)
        if ph:
            current_phase = ph.group("name").strip()
            continue
        m = TASK_RE.match(raw_line)
        if not m:
            continue
        tasks.append(
            Task(
                id=m.group("id"),
                description=m.group("desc").strip(),
                done=m.group("done").lower() == "x",
                parallel=bool(m.group("parallel")),
                story=m.group("story"),
                phase=current_phase,
                line_no=idx,
            )
        )
    return tasks


def parse_story_priorities(spec_path: Path) -> dict[str, str]:
    """Return a mapping `{"US1": "P1", "US2": "P2", ...}` parsed from spec.md.

    Supports multiple Spec Kit heading conventions:
        ### User Story 1 - Title (Priority: P1)
        ### User Story 2: Title [P2]
        ### User Story 3 (P3)
        ### User Story 4
            **Priority**: P1

    A priority found on the same heading line wins; otherwise the next
    non-empty lines (up to 10) are scanned for the first `P\\d+` token.
    """
    if not spec_path.is_file():
        return {}
    lines = spec_path.read_text(encoding="utf-8").splitlines()
    priorities: dict[str, str] = {}
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        m = USER_STORY_RE.match(line)
        if not m:
            i += 1
            continue
        story_id = f"US{int(m.group('num'))}"
        # Look on the same heading line first.
        prio = _extract_priority(line)
        if not prio:
            # Then scan the next few non-empty lines, stopping at the next heading.
            for j in range(i + 1, min(i + 12, n)):
                nxt = lines[j]
                if re.match(r"^\s*#{1,6}\s+", nxt):
                    break
                prio = _extract_priority(nxt)
                if prio:
                    break
        if prio and story_id not in priorities:
            priorities[story_id] = prio
        i += 1
    return priorities


def _extract_priority(text: str) -> str | None:
    # Strip code spans to avoid matching "P1" inside e.g. `Pipeline`.
    cleaned = re.sub(r"`[^`]*`", "", text)
    m = PRIORITY_RE.search(cleaned)
    return f"P{int(m.group('p'))}" if m else None


def filter_tasks(tasks: Iterable[Task], cfg: Config) -> list[Task]:
    out: list[Task] = []
    for t in tasks:
        if cfg.skip_completed and t.done:
            continue
        if cfg.only_stories:
            if not t.story or t.story.upper() not in cfg.only_stories:
                continue
        out.append(t)
    return out


# ---------------------------------------------------------------------------
# gh CLI helpers
# ---------------------------------------------------------------------------


class GhError(RuntimeError):
    pass


def run_gh(args: list[str], *, input_text: str | None = None) -> str:
    cmd = ["gh", *args]
    try:
        proc = subprocess.run(
            cmd,
            input=input_text,
            text=True,
            check=True,
            capture_output=True,
        )
    except FileNotFoundError:
        die("`gh` CLI is not installed or not on PATH. See https://cli.github.com/")
    except subprocess.CalledProcessError as exc:
        msg = (exc.stderr or "").strip() or (exc.stdout or "").strip() or str(exc)
        raise GhError(f"`gh {' '.join(args)}` failed: {msg}")
    return (proc.stdout or "").strip()


def ensure_gh_ready() -> None:
    if shutil.which("gh") is None:
        die("`gh` CLI is required. Install: https://cli.github.com/")
    try:
        subprocess.run(["gh", "auth", "status"], check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as exc:
        msg = (exc.stderr or "").strip()
        die(
            "`gh` is not authenticated. Run `gh auth login` first.\n"
            f"  details: {msg}"
        )


def get_project_info(owner: str, number: int) -> dict:
    raw = run_gh([
        "project", "view", str(number),
        "--owner", owner,
        "--format", "json",
    ])
    return json.loads(raw)


def list_project_fields(owner: str, number: int) -> list[dict]:
    raw = run_gh([
        "project", "field-list", str(number),
        "--owner", owner,
        "--format", "json",
    ])
    data = json.loads(raw)
    fields = data.get("fields") if isinstance(data, dict) else data
    if fields is None:
        return []
    return list(fields)


def find_field(fields: list[dict], name: str) -> dict | None:
    target = name.strip().lower()
    for f in fields:
        if f.get("name", "").strip().lower() == target:
            return f
    return None


def find_option(field_obj: dict, option_name: str) -> str | None:
    target = option_name.strip().lower()
    for opt in field_obj.get("options", []) or []:
        if opt.get("name", "").strip().lower() == target:
            return opt.get("id")
    return None


def list_project_items(owner: str, number: int) -> list[dict]:
    raw = run_gh([
        "project", "item-list", str(number),
        "--owner", owner,
        "--limit", "1000",
        "--format", "json",
    ])
    data = json.loads(raw)
    items = data.get("items") if isinstance(data, dict) else data
    return list(items or [])


def add_draft_to_project(owner: str, number: int, title: str, body: str) -> str:
    raw = run_gh([
        "project", "item-create", str(number),
        "--owner", owner,
        "--title", title,
        "--body", body,
        "--format", "json",
    ])
    return json.loads(raw).get("id", "")


def add_issue_to_project(owner: str, number: int, issue_url: str) -> str:
    raw = run_gh([
        "project", "item-add", str(number),
        "--owner", owner,
        "--url", issue_url,
        "--format", "json",
    ])
    return json.loads(raw).get("id", "")


def set_item_option(
    project_id: str,
    item_id: str,
    field_id: str,
    option_id: str,
) -> None:
    run_gh([
        "project", "item-edit",
        "--id", item_id,
        "--field-id", field_id,
        "--project-id", project_id,
        "--single-select-option-id", option_id,
    ])


def create_issue(repo: str, title: str, body: str, labels: list[str]) -> str:
    args = ["issue", "create", "--repo", repo, "--title", title, "--body", body]
    for lbl in labels:
        args.extend(["--label", lbl])
    return run_gh(args).strip()


def ensure_labels(repo: str, labels: Iterable[str]) -> None:
    try:
        raw = run_gh([
            "label", "list", "--repo", repo, "--limit", "200",
            "--json", "name",
        ])
        existing = {entry["name"] for entry in json.loads(raw)}
    except (GhError, json.JSONDecodeError, KeyError):
        existing = set()
    for lbl in labels:
        if lbl in existing:
            continue
        try:
            run_gh([
                "label", "create", lbl,
                "--repo", repo,
                "--color", "ededed",
                "--description", "Managed by speckit tasks-to-project extension",
            ])
        except GhError:
            # Race or insufficient perms; the subsequent issue-create will error
            # cleanly if the label really is missing.
            pass


# ---------------------------------------------------------------------------
# Card payload helpers
# ---------------------------------------------------------------------------


def task_title(task: Task) -> str:
    return f"[{task.id}] {task.description}"


def task_body(task: Task, tasks_file_rel: str, priority: str | None) -> str:
    parts = [
        f"**Task ID**: `{task.id}`",
        f"**Phase**: {task.phase or 'n/a'}",
        f"**User Story**: {task.story or 'n/a'}",
        f"**Priority**: {priority or 'n/a'}",
        f"**Parallelizable**: {'yes' if task.parallel else 'no'}",
        "",
        task.description,
        "",
        f"_Source: `{tasks_file_rel}` line {task.line_no}_",
        "",
        "<sub>Created by speckit `tasks-to-project` extension.</sub>",
    ]
    return "\n".join(parts)


def labels_for(task: Task, priority: str | None) -> list[str]:
    out: list[str] = []
    if task.story:
        out.append(f"speckit:{task.story.lower()}")
    if task.phase:
        slug = re.sub(r"[^a-z0-9]+", "-", task.phase.lower()).strip("-")
        if slug:
            out.append(f"speckit:phase:{slug}")
    if priority:
        out.append(f"speckit:{priority.lower()}")
    return out


def task_id_from_item(item: dict) -> str | None:
    """Extract a task ID like 'T001' from a project item's title/body."""
    content = item.get("content") or {}
    title = content.get("title") if isinstance(content, dict) else None
    if not title and isinstance(item.get("title"), str):
        title = item["title"]
    if title:
        m = TITLE_TASK_ID_RE.search(title)
        if m:
            return m.group(1)
    body = content.get("body") if isinstance(content, dict) else None
    if body:
        m = re.search(r"Task ID\**:\s*`?(T\d+)`?", body)
        if m:
            return m.group(1)
    return None


def item_status_name(item: dict, status_field_id: str | None) -> str | None:
    """Best-effort extraction of the item's current Status option name."""
    for fv in item.get("fieldValues") or []:
        field_obj = fv.get("field") if isinstance(fv, dict) else None
        # gh's shape varies between releases; accept a few common ones.
        fid = (field_obj or {}).get("id") if isinstance(field_obj, dict) else fv.get("fieldId")
        if status_field_id and fid and fid != status_field_id:
            continue
        name = fv.get("name") or fv.get("text")
        if name:
            return str(name)
    return None


# ---------------------------------------------------------------------------
# Setup that publish & sync share
# ---------------------------------------------------------------------------


@dataclass
class RuntimeCtx:
    cfg: Config
    owner: str
    repo_full: str
    tasks_path: Path
    tasks_file_rel: str
    all_tasks: list[Task]
    story_priorities: dict[str, str]
    project_id: str
    status_field: dict | None
    status_option_default: str | None
    status_option_done: str | None
    priority_field: dict | None


def build_runtime(
    project_root: Path,
    cfg: Config,
    tasks_md: str | None,
    *,
    skip_remote: bool,
) -> RuntimeCtx:
    origin_owner, origin_repo = detect_origin(project_root)
    owner = cfg.owner or origin_owner
    repo_full = f"{origin_owner}/{origin_repo}"

    tasks_path = find_tasks_file(project_root, tasks_md)
    tasks_file_rel = tasks_path.relative_to(project_root).as_posix()
    all_tasks = parse_tasks(tasks_path)
    if not all_tasks:
        die(f"no tasks found in {tasks_file_rel}")

    spec_path = tasks_path.parent / "spec.md"
    story_priorities = parse_story_priorities(spec_path)

    project_id = "<dry-run-project-id>"
    status_field: dict | None = None
    status_option_default: str | None = None
    status_option_done: str | None = None
    priority_field: dict | None = None

    if not skip_remote:
        ensure_gh_ready()
        project = get_project_info(owner, cfg.number)
        project_id = project.get("id") or project.get("projectId") or ""
        if not project_id:
            die(f"could not resolve project id for {owner}/#{cfg.number}: {project}")

        fields = list_project_fields(owner, cfg.number)
        if cfg.status_field:
            status_field = find_field(fields, cfg.status_field)
            if status_field is None:
                print(
                    f"tasks-to-project: warning - status field {cfg.status_field!r} "
                    "not found on project; cards will use the project default column."
                )
        if status_field and cfg.default_status:
            status_option_default = find_option(status_field, cfg.default_status)
            if not status_option_default:
                print(
                    f"tasks-to-project: warning - option {cfg.default_status!r} not "
                    f"found on field {cfg.status_field!r}."
                )
        if status_field and cfg.done_status:
            status_option_done = find_option(status_field, cfg.done_status)
        if cfg.priority_field:
            priority_field = find_field(fields, cfg.priority_field)
            if priority_field is None:
                print(
                    f"tasks-to-project: warning - priority field "
                    f"{cfg.priority_field!r} not found on project; priorities will "
                    "not be applied to cards."
                )

    return RuntimeCtx(
        cfg=cfg,
        owner=owner,
        repo_full=repo_full,
        tasks_path=tasks_path,
        tasks_file_rel=tasks_file_rel,
        all_tasks=all_tasks,
        story_priorities=story_priorities,
        project_id=project_id,
        status_field=status_field,
        status_option_default=status_option_default,
        status_option_done=status_option_done,
        priority_field=priority_field,
    )


def priority_for(task: Task, story_priorities: dict[str, str]) -> str | None:
    if not task.story:
        return None
    return story_priorities.get(task.story.upper())


# ---------------------------------------------------------------------------
# Subcommand: publish
# ---------------------------------------------------------------------------


def cmd_publish(project_root: Path, cfg: Config, args: argparse.Namespace) -> int:
    ctx = build_runtime(project_root, cfg, args.tasks_md, skip_remote=args.dry_run)
    tasks = filter_tasks(ctx.all_tasks, cfg)
    if not tasks:
        print(
            f"tasks-to-project: 0 tasks to publish after filtering "
            f"(parsed {len(ctx.all_tasks)}, skip_completed={cfg.skip_completed}, "
            f"only_stories={cfg.only_stories or 'all'})."
        )
        return 0

    print(
        f"tasks-to-project: parsed {len(ctx.all_tasks)} tasks from {ctx.tasks_file_rel}; "
        f"publishing {len(tasks)} to project {ctx.owner}/#{cfg.number} "
        f"(mode={cfg.mode})."
    )
    if ctx.story_priorities:
        print(
            "tasks-to-project: story priorities resolved from spec.md: "
            + ", ".join(f"{k}->{v}" for k, v in sorted(ctx.story_priorities.items()))
        )

    if args.dry_run:
        for t in tasks:
            prio = priority_for(t, ctx.story_priorities)
            print(
                f"  WOULD CREATE  {task_title(t)}  "
                f"priority={prio or '-'}  labels={labels_for(t, prio)}"
            )
        print("tasks-to-project: dry run complete; nothing was sent to GitHub.")
        return 0

    # Pre-create labels (issues mode).
    if cfg.mode == "issues" and cfg.add_labels:
        wanted: set[str] = set()
        for t in tasks:
            wanted.update(labels_for(t, priority_for(t, ctx.story_priorities)))
        if wanted:
            ensure_labels(ctx.repo_full, wanted)

    created = 0
    failed = 0
    for t in tasks:
        prio = priority_for(t, ctx.story_priorities)
        title = task_title(t)
        body = task_body(t, ctx.tasks_file_rel, prio)
        try:
            if cfg.mode == "issues":
                labels = labels_for(t, prio) if cfg.add_labels else []
                issue_url = create_issue(ctx.repo_full, title, body, labels)
                item_id = add_issue_to_project(ctx.owner, cfg.number, issue_url)
                print(f"  + {t.id} -> {issue_url}")
            else:
                item_id = add_draft_to_project(ctx.owner, cfg.number, title, body)
                print(f"  + {t.id} -> draft item {item_id}")
            _apply_status(ctx, item_id, ctx.status_option_default)
            _apply_priority(ctx, item_id, prio)
            created += 1
        except GhError as exc:
            failed += 1
            print(f"  ! {t.id} failed: {exc}", file=sys.stderr)

    print(
        f"tasks-to-project: done. created={created}, "
        f"failed={failed}, skipped={len(ctx.all_tasks) - len(tasks)}."
    )
    return 0 if failed == 0 else 1


# ---------------------------------------------------------------------------
# Subcommand: sync
# ---------------------------------------------------------------------------


def cmd_sync(project_root: Path, cfg: Config, args: argparse.Namespace) -> int:
    ctx = build_runtime(project_root, cfg, args.tasks_md, skip_remote=args.dry_run)

    print(
        f"tasks-to-project: parsed {len(ctx.all_tasks)} tasks from {ctx.tasks_file_rel}; "
        f"syncing against project {ctx.owner}/#{cfg.number} (mode={cfg.mode})."
    )
    if ctx.story_priorities:
        print(
            "tasks-to-project: story priorities resolved from spec.md: "
            + ", ".join(f"{k}->{v}" for k, v in sorted(ctx.story_priorities.items()))
        )

    # Build an index of existing items by task ID.
    existing: dict[str, dict] = {}
    if args.dry_run:
        print("tasks-to-project: dry-run sync assumes no existing items on the project.")
    else:
        items = list_project_items(ctx.owner, cfg.number)
        for it in items:
            tid = task_id_from_item(it)
            if tid:
                existing[tid] = it

    by_id = {t.id: t for t in ctx.all_tasks}
    seen_ids: set[str] = set()
    created = updated = unchanged = failed = 0
    for t in ctx.all_tasks:
        if cfg.only_stories and (
            not t.story or t.story.upper() not in cfg.only_stories
        ):
            continue
        seen_ids.add(t.id)
        prio = priority_for(t, ctx.story_priorities)
        title = task_title(t)
        body = task_body(t, ctx.tasks_file_rel, prio)

        if t.id in existing:
            item = existing[t.id]
            item_id = item.get("id") or ""
            target_option = None
            target_label = None
            if t.done and ctx.status_option_done:
                target_option = ctx.status_option_done
                target_label = cfg.done_status
            elif not t.done and ctx.status_option_default:
                # Only move to default column when the card is currently in the
                # "done" column - this avoids resetting in-progress work.
                current = item_status_name(item, (ctx.status_field or {}).get("id"))
                if current and current.strip().lower() == cfg.done_status.lower():
                    target_option = ctx.status_option_default
                    target_label = cfg.default_status

            try:
                changed = False
                if args.dry_run:
                    if target_option:
                        print(f"  WOULD UPDATE  {t.id} status -> {target_label}")
                        changed = True
                    if prio and ctx.priority_field:
                        print(
                            f"  WOULD UPDATE  {t.id} priority -> {prio} "
                            f"(field={cfg.priority_field})"
                        )
                        changed = True
                    if not changed:
                        print(f"  = {t.id} already up to date")
                else:
                    if target_option:
                        set_item_option(
                            ctx.project_id, item_id,
                            ctx.status_field["id"], target_option,
                        )
                        print(f"  ~ {t.id} status -> {target_label}")
                        changed = True
                    if prio:
                        _apply_priority(ctx, item_id, prio)
                        changed = changed or bool(ctx.priority_field)
                updated += 1 if changed else 0
                unchanged += 0 if changed else 1
            except GhError as exc:
                failed += 1
                print(f"  ! {t.id} update failed: {exc}", file=sys.stderr)
            continue

        # Missing card -> create (respect skip_completed).
        if cfg.skip_completed and t.done:
            unchanged += 1
            continue
        try:
            if args.dry_run:
                print(
                    f"  WOULD CREATE  {title}  "
                    f"priority={prio or '-'}  labels={labels_for(t, prio)}"
                )
                created += 1
                continue
            if cfg.mode == "issues":
                labels = labels_for(t, prio) if cfg.add_labels else []
                if labels:
                    ensure_labels(ctx.repo_full, labels)
                issue_url = create_issue(ctx.repo_full, title, body, labels)
                item_id = add_issue_to_project(ctx.owner, cfg.number, issue_url)
                print(f"  + {t.id} -> {issue_url}")
            else:
                item_id = add_draft_to_project(ctx.owner, cfg.number, title, body)
                print(f"  + {t.id} -> draft item {item_id}")
            initial_option = (
                ctx.status_option_done if t.done else ctx.status_option_default
            )
            _apply_status(ctx, item_id, initial_option)
            _apply_priority(ctx, item_id, prio)
            created += 1
        except GhError as exc:
            failed += 1
            print(f"  ! {t.id} create failed: {exc}", file=sys.stderr)

    orphans = sorted(set(existing) - seen_ids)
    if orphans:
        print(
            "tasks-to-project: orphan cards (task id no longer in tasks.md): "
            + ", ".join(orphans)
        )

    print(
        f"tasks-to-project: sync done. created={created}, updated={updated}, "
        f"unchanged={unchanged}, orphans={len(orphans)}, failed={failed}."
    )
    return 0 if failed == 0 else 1


# ---------------------------------------------------------------------------
# Shared post-create steps
# ---------------------------------------------------------------------------


def _apply_status(ctx: RuntimeCtx, item_id: str, option_id: str | None) -> None:
    if item_id and ctx.status_field and option_id:
        set_item_option(ctx.project_id, item_id, ctx.status_field["id"], option_id)


def _apply_priority(ctx: RuntimeCtx, item_id: str, priority: str | None) -> None:
    if not (item_id and priority and ctx.priority_field):
        return
    option_id = find_option(ctx.priority_field, priority)
    if not option_id:
        print(
            f"tasks-to-project: warning - priority option {priority!r} not found "
            f"on field {ctx.cfg.priority_field!r}; skipping priority assignment."
        )
        return
    set_item_option(ctx.project_id, item_id, ctx.priority_field["id"], option_id)


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        prog="publish_tasks_to_project.py",
        description=__doc__,
    )
    sub = parser.add_subparsers(dest="cmd")

    p_pub = sub.add_parser("publish", help="Create one card per task on the project")
    p_pub.add_argument("tasks_md", nargs="?", default=None)
    p_pub.add_argument("--dry-run", action="store_true")

    p_sync = sub.add_parser("sync", help="Reconcile tasks.md against existing cards")
    p_sync.add_argument("tasks_md", nargs="?", default=None)
    p_sync.add_argument("--dry-run", action="store_true")

    args = parser.parse_args(argv)
    if not args.cmd:
        parser.print_help(sys.stderr)
        return 2

    project_root = Path.cwd()
    cfg = load_config(project_root)

    if args.cmd == "publish":
        return cmd_publish(project_root, cfg, args)
    if args.cmd == "sync":
        return cmd_sync(project_root, cfg, args)
    parser.print_help(sys.stderr)
    return 2


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main(sys.argv[1:]))
