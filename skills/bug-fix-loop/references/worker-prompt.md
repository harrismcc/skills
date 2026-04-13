# Worker Prompt Template

Use this prompt when dispatching the `worker` droid in worker mode.

```text
Role: worker
Goal: Implement the minimal fix for the verified failing evidence.

Provide:
- files changed
- implementation summary
- assumptions
- risks or unresolved uncertainty

Constraints:
- Do not run broad exploratory work unrelated to the failing evidence
- Do not assume knowledge of verifier internals beyond the provided artifact
```
