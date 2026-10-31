---
name: debug-bug
description: Use when investigating a bug, regression, runtime error, broken interaction, or unexpected application behavior.
---
# Debug Bug

## Workflow
1. Read `AGENTS.md` and any product-specific instructions.
2. Reproduce the problem or identify the exact error, environment, input and expected behavior. If it cannot be reproduced, say so.
3. Inspect the actual source, call path, state transitions, browser console, network/storage behavior and relevant history. Do not infer a root cause from the symptom alone.
4. Form a short list of evidence-backed hypotheses. Label uncertain hypotheses as assumptions.
5. Find the smallest discriminating test or observation that can confirm or reject the leading hypothesis.
6. Fix the root cause, not merely the visible symptom. Avoid broad refactors during bug repair.
7. Add a regression test that fails before the fix when practical.
8. Run targeted tests, then the relevant wider checks.
9. Review the diff and verify the reported behavior after the fix.
10. Report reproduction status, proven cause (or say unknown), evidence, fix, regression test, checks and remaining risk.

## Hard rules
- Never invent log output, browser behavior, reproduction steps or root cause.
- Do not make multiple speculative changes at once.
- Do not delete user data, clear production storage or alter live service settings to "test" a theory.
- If evidence is insufficient, explain what evidence is missing instead of asserting a cause.
