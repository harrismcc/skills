# Resolve PR Comments u2014 Implementation Plan

**Date:** 2026-04-22
**Design:** `docs/designs/2026-04-22-resolve-pr-comments-design.md`

## Steps

Each step is self-contained and testable. Complete them in order.

---

### Step 1: Scaffold the plugin structure

**Scope:** Create the directory layout and plugin manifest.

**Work:**
1. Create `skills/resolve-pr-comments/` directory
2. Create `agents/` directory
3. Create placeholder `skills/resolve-pr-comments/SKILL.md` with frontmatter only
4. Create placeholder `agents/pr-comment-fixer.md` with frontmatter only
5. Create placeholder `agents/pr-comment-verifier.md` with frontmatter only
6. Create `README.md` with basic description and usage

**Acceptance:**
- `claude --plugin-dir .` loads the plugin without errors
- `/comment-fixer:resolve-pr-comments` appears in `/help`
- Both agents appear in `/agents`

---

### Step 2: Write the `pr-comment-fixer` agent

**Scope:** Full system prompt for the fixer agent.

**Work:**
1. Write `agents/pr-comment-fixer.md` with:
   - Frontmatter: `name`, `description`, `model: inherit`
   - System prompt covering: read the comment, explore relevant code, implement the minimal fix, do NOT commit, return a summary of changes

**Acceptance:**
- Agent file parses correctly (valid YAML frontmatter)
- Agent is visible in `/agents` when plugin is loaded
- Manual test: invoke the agent with a sample comment prompt and verify it reads code and makes changes without committing

---

### Step 3: Write the `pr-comment-verifier` agent

**Scope:** Full system prompt for the verifier agent.

**Work:**
1. Write `agents/pr-comment-verifier.md` with:
   - Frontmatter: `name`, `description`, `model: inherit`
   - System prompt covering: read verification criteria, inspect uncommitted changes, run appropriate checks, commit if verified (with `fix: address review comment u2014 <description>` message), report failure details if not verified

**Acceptance:**
- Agent file parses correctly
- Agent is visible in `/agents` when plugin is loaded
- Manual test: stage some changes, invoke verifier with sample criteria, verify it either commits or rejects with clear feedback

---

### Step 4: Write the SKILL.md u2014 mermaid flowchart and PR detection

**Scope:** The top of the skill file: flowchart, frontmatter, and the PR detection + dirty-check logic.

**Work:**
1. Add SKILL.md frontmatter with `name` and `description`
2. Add the mermaid flowchart from the design doc at the top of the skill body
3. Write the procedure for Step 1 of the orchestration:
   - Detect PR from current branch via `gh pr view --json number,url` or accept user-provided PR number/URL
   - Check `git status --porcelain` for dirty working tree, abort if dirty

**Acceptance:**
- Skill loads without errors
- When invoked on a branch with an open PR, it correctly detects the PR number
- When invoked with a dirty working tree, it aborts with a clear message

---

### Step 5: Write the SKILL.md u2014 fetch, dedupe, and comments.json generation

**Scope:** The fetch + dedupe + verification step generation + conflict detection + JSON write.

**Work:**
1. Add procedure for fetching unresolved review threads via `gh api graphql`:
   - GraphQL query to get `pullRequest.reviewThreads` where `isResolved: false`
   - Extract: comment body, thread node ID (`PRRT_xxx`), comment URL (for `githubLinks`)
2. Add procedure for logical deduplication (AI judgment)
3. Add procedure for generating `verificationSteps` (freeform markdown, conceptual)
4. Add procedure for conflict detection u2014 flag conflicting comments, ask user
5. Add procedure for writing `/tmp/<pr-number>/comments.json`

**Acceptance:**
- On a real PR with unresolved comments, the skill produces a valid `comments.json` with correct structure
- Logically duplicate comments are merged into one entry with multiple `githubLinks` and `threadIds`
- Conflicting comments are flagged before proceeding

---

### Step 6: Write the SKILL.md u2014 parallel fix dispatch

**Scope:** The parallelization logic and fixer agent dispatch.

**Work:**
1. Add procedure for analyzing `comments.json` to group comments by file
2. Add procedure for dispatching `pr-comment-fixer` agents via the Agent tool:
   - Parallel dispatch for comments on different files
   - Serial dispatch for comments on the same file (wait for full fix u2192 verify u2192 commit cycle)
3. Define the prompt template passed to each fixer (comment text, verification steps, optional verifier feedback)

**Acceptance:**
- When invoked, the skill correctly dispatches fixer agents
- Comments on different files are dispatched in parallel
- Comments on the same file are dispatched one at a time

---

### Step 7: Write the SKILL.md u2014 verify, commit, and retry loop

**Scope:** The verification dispatch, commit handling, `comments.json` updates, and retry logic.

**Work:**
1. Add procedure for dispatching `pr-comment-verifier` after each fixer completes
2. Define the prompt template passed to the verifier (original comment, verification steps, fixer's change summary)
3. Add procedure for handling verifier results:
   - Pass: orchestrator updates `comments.json` (`addressed: true`, `isVerified: true`)
   - Fail: orchestrator dispatches a new fixer with verifier feedback appended
4. Add the retry loop (no limit, continues until user intervenes)
5. Add procedure for checking if all comments are addressed and moving to push

**Acceptance:**
- After a fixer completes, verifier is dispatched and either commits or rejects
- On rejection, a new fixer is dispatched with the failure feedback
- `comments.json` is updated after each verified fix

---

### Step 8: Write the SKILL.md u2014 push and resolve threads

**Scope:** The final push and GitHub thread resolution.

**Work:**
1. Add procedure for `git push` after all comments are addressed
2. Add procedure for resolving GitHub threads via GraphQL:
   ```graphql
   mutation {
     resolveReviewThread(input: { threadId: "PRRT_xxx" }) {
       thread { isResolved }
     }
   }
   ```
3. Iterate through `comments.json`, resolve each thread via `gh api graphql`
4. Emphasize: this is the `resolveReviewThread` mutation ONLY u2014 no comments, no reactions, no fallbacks

**Acceptance:**
- After push, each verified comment's threads are resolved via the mutation
- Re-running the skill shows no unresolved threads for the already-fixed comments (idempotency)

---

### Step 9: End-to-end manual test

**Scope:** Full workflow test on a real PR.

**Work:**
1. Create a test PR with 2-3 review comments (mix of different files and same file)
2. Load the plugin with `claude --plugin-dir .`
3. Invoke `/comment-fixer:resolve-pr-comments`
4. Verify the full flow:
   - Comments fetched and deduped correctly
   - `comments.json` written with correct structure
   - Fixers dispatched (parallel for different files, serial for same file)
   - Verifiers validate and commit each fix
   - All commits pushed at once
   - GitHub threads resolved via mutation
5. Re-run the skill and verify idempotency (no unresolved threads found)

**Acceptance:**
- All review comments on the test PR are fixed, verified, committed, pushed, and resolved
- Re-running shows no remaining work
- Commit history shows one commit per resolved comment

---

### Step 10: README and documentation

**Scope:** User-facing documentation.

**Work:**
1. Write `README.md` with:
   - What the plugin does
   - Prerequisites (`gh` CLI, GitHub auth)
   - Installation (local dev and marketplace)
   - Usage (`/comment-fixer:resolve-pr-comments`)
   - How the flow works (reference the mermaid diagram)
   - Limitations and known constraints

**Acceptance:**
- README accurately describes the plugin
- Installation instructions work

---

## Dependencies

- `gh` CLI (GitHub CLI) must be installed and authenticated
- Claude Code with plugin support
- Git

## Out of Scope

- Marketplace distribution (future work)
- CI/CD integration
- Support for non-GitHub platforms (GitLab, Bitbucket)
- Automated retry limits (intentionally unbounded per design)
