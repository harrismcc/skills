---
name: bug-fix-loop
description: Use when a user asks to fix a bug with strict failing-evidence-first workflow using isolated verifier and worker subagents.
---

# Bug Fix Loop

Run a strict failing-evidence-first bug-fix loop through a single orchestrator. Use this when you need explicit progress tracking, isolated verifier/worker passes, and a bounded retry loop.

## When to Use

- User asks you to fix a bug
- The task benefits from explicit failing evidence before implementation
- You want isolated verification and implementation passes with artifact handoff through the main agent only

## Checklist

Progress:
- [ ] Create `/tmp/bug-fix-loop/<run-id>/`
- [ ] Initialize `state.json`
- [ ] Research the codebase before proposing any hypothesis
- [ ] Write the current hypothesis to `iterations/NN.md`
- [ ] Get failing evidence before implementation
- [ ] Apply the minimal fix
- [ ] Validate the fix on the updated code
- [ ] Update `state.json` and `iterations/NN.md` with the decision
- [ ] Retry only with a changed hypothesis or instruction set
- [ ] Stop as `resolved`, `blocked`, or `invalid`

## Core Rules

1. The orchestrator is the only stateful actor.
2. Verifier and worker never communicate directly.
3. No implementation starts without failing evidence.
4. Every retry must change the hypothesis, reproduction strategy, worker instructions, or validation scope.
5. No commit happens without post-fix verification.
6. The files under `/tmp/bug-fix-loop/<run-id>/` are the source of truth for progress.

## Gotchas

- Do not keep verifier notes, fix notes, and validation notes in separate files for the same theory; append them to the same `iterations/NN.md`.
- Do not overwrite a previous iteration file when a theory fails; create the next numbered file.
- Do not form a hypothesis from the bug report alone; inspect the relevant code paths first.
- Do not ask the worker to explore broadly; pass only the verified failing evidence and target scope.
- Do not retry with the same hypothesis phrased differently; explicitly record what changed.
- Do not commit just because the worker claims the fix is done; require verifier confirmation after the change.

## Local State Tracking

Create a per-run working directory under `/tmp/bug-fix-loop/<run-id>/` as soon as the loop starts.

Use this layout:

```text
/tmp/bug-fix-loop/<run-id>/
  state.json
  iterations/
    01.md
    02.md
    03.md
```

`state.json` is the canonical current state and should be updated after each step. Keep fields like:

```json
{
  "bug_report": "",
  "status": "diagnosing",
  "iteration": 1,
  "current_hypothesis": "",
  "current_iteration_file": "/tmp/bug-fix-loop/<run-id>/iterations/01.md",
  "result": null
}
```

Each `iterations/NN.md` file is the full record for one theory. Never overwrite prior iteration files when retrying.

Recommended statuses:

- `diagnosing`
- `reproducing`
- `fixing`
- `validating`
- `resolved`
- `blocked`
- `invalid`

Default retry budget: `max_iterations = 10`

## Procedure

### 1. Research

- Inspect the bug report, repo context, and nearby code before proposing any theory
- Read the relevant files and search for the specific code paths, components, or tests involved
- Identify the likely execution path, existing tests, and the most relevant files
- Form a concrete root-cause hypothesis
- Create `/tmp/bug-fix-loop/<run-id>/state.json`
- Create the next `iterations/NN.md` file before dispatching verification
- Record the codebase findings in the iteration file before the hypothesis section

Update `state.json` to:

```json
{
  "bug_report": "",
  "status": "diagnosing",
  "iteration": 1,
  "current_hypothesis": "",
  "current_iteration_file": "/tmp/bug-fix-loop/<run-id>/iterations/01.md",
  "result": null
}
```

The first iteration file should begin with:

```md
# Iteration 01

## Codebase Research
- relevant files inspected
- likely execution path
- existing tests or missing coverage

## Hypothesis
Root-cause theory here.
```

### 2. Reproduce

- Dispatch the `worker` droid in verifier mode
- Ask it to add or update a failing test, or provide explicit reproduction steps
- Append the failing evidence to the current `iterations/NN.md`
- Update `state.json` to `reproducing`

If the verifier cannot reproduce the issue, refine the hypothesis or stop as blocked.

### 3. Fix

- Dispatch the `worker` droid in worker mode with only the verified failure context
- Request the narrowest fix that addresses the failing evidence
- Append the fix attempt to the current `iterations/NN.md`
- Update `state.json` to `fixing`

### 4. Validate

- Dispatch the `worker` droid in verifier mode on the updated codebase
- Rerun the relevant failing test
- Run additional validation needed for the touched area
- Append validation results to the current `iterations/NN.md`
- Update `state.json` to `validating`

### 5. Decide

- Choose `resolved`, `retry`, `blocked`, or `invalid`
- Record the decision in the current iteration file
- Update `state.json`

After deciding:

- if retrying, create a new iteration file and explicitly note what changed from the previous theory
- if resolved or blocked, stop the loop

## Retry Policy

Retries are valid only when supported by new evidence.

Valid retry triggers:

- reproduced failure only partially matches the bug report
- worker fixed the wrong root cause
- validation exposes a clearer failure mode
- previous instructions were underspecified

Before retrying, update at least one of:

- root-cause hypothesis
- reproduction strategy
- worker instructions
- validation scope

Blind retries are forbidden.

## Default Dispatch Prompts

Use the `worker` custom droid for both verifier and worker tasks. Keep prompts role-specific and include only the minimum context needed.

- For verifier dispatch, read `references/verifier-prompt.md`
- For worker dispatch, read `references/worker-prompt.md`

## Output Templates

Each `iterations/NN.md` file should use this structure:

```md
# Iteration 01

## Codebase Research
- relevant files inspected
- likely execution path
- existing tests or missing coverage

## Hypothesis
Root-cause theory here.

## Why This Hypothesis
Why this is the next best theory to test.

## Reproduction Plan
What the verifier should try.

## Failing Evidence
- test or repro steps
- command run
- observed failure
- why it matches the bug

## Fix Attempt
- files changed
- minimal implementation summary
- assumptions

## Validation
- commands run
- pass/fail results
- regressions or follow-up failures

## Decision
Confirmed | Rejected | Partial | Blocked | Resolved

## Next Change
What must change before another iteration, if any.
```

Keep verifier, fix, and validation notes together in that single file for the iteration.

## Termination Conditions

### Success

Success requires all of:

- failing evidence was demonstrated first
- a minimal fix was implemented
- relevant validation passed after the fix
- the orchestrator concludes the bug is resolved

### Blocked

Stop as blocked when:

- the verifier cannot reproduce the bug after reasonable attempts
- retry budget is exhausted
- unresolved regressions remain
- there is not enough evidence for a credible next hypothesis

### Invalid

Stop as invalid when:

- the report is not actually a bug
- expected behavior is too ambiguous to verify
- required environment dependencies are unavailable

## Final Output

Return a concise summary containing:

- bug statement
- final hypothesis
- iteration count
- iteration log summary
- validation result
- final state: `resolved`, `blocked`, or `invalid`

If the user also asked for a commit, only create it after successful validation and after completing the repository's required checks.
