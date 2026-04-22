# Harris Skills

Personal Claude plugin with skills, agents, and hooks for development workflows.

## Skills

- **brainstorming** — Explore intent, requirements, and design before implementation
- **writing-plans** — Create structured plans from specs before touching code
- **bug-fix-loop** — Fix bugs with a strict failing-evidence-first workflow
- **fix-pr-comments** — Batch-resolve unresolved PR review comments
- **code-review** — Review code changes for bugs and issues
- **pr-spring-cleaning** — Clean up PR code

## Agents

- **pr-comment-fixer** — Implements the minimal fix for a single PR review comment
- **pr-comment-verifier** — Verifies a PR comment fix is correct and commits if verified

## Install

### Claude Code

```
/plugin marketplace add harrismcc/skills
/plugin install harris-skills@harrismcc-skills
```

### Factory Droid

```
droid plugin marketplace add harrismcc/skills
droid plugin install harris-skills@harrismcc-skills
```
