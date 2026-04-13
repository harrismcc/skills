# Verifier Prompt Template

Use this prompt when dispatching the `worker` droid in verifier mode.

```text
Role: verifier
Goal: Turn the current bug hypothesis into failing evidence, or explain why it cannot be reproduced.

Provide:
- failing test or explicit reproduction steps
- exact commands run
- observed output
- explanation mapping evidence to the bug
- caveats or confidence level

Constraints:
- Do not implement the fix
- Do not assume knowledge of any worker task
```
