---
name: implement-feature
description: Use when implementing a new feature or product behavior in a Nawy application or shared library.
---
# Implement Feature

## Goal
Deliver the smallest complete feature that matches the verified product requirements and existing architecture.

## Workflow
1. Read root `AGENTS.md`, then the relevant product facts, architecture, design, engineering and security documents.
2. Inspect the actual repository: branch/status, relevant source files, tests, package scripts, dependencies and existing patterns.
3. Separate requirements into Verified, Decision, Assumption and Unknown. Never fill a missing requirement with invented behavior.
4. If a critical behavior cannot be inferred safely, ask one focused question. Otherwise state the assumption and proceed with a reversible implementation.
5. Identify the smallest set of files and tests needed. Do not refactor unrelated modules.
6. Implement in small steps. Reuse existing abstractions where they are sound; do not introduce a new dependency without a concrete reason and compatibility/license check.
7. Add or update tests for normal, edge and failure states. Include permissions, offline and persistence behavior only when relevant.
8. Run the repository's actual typecheck, tests and build commands. Read their exit status and relevant output.
9. Inspect the final diff for accidental edits, secrets, unsafe data changes, inaccessible controls and incomplete states.
10. Report changed files, design decisions, exact checks run, results, remaining assumptions and unverified items.

## Hard rules
- Do not claim an API, function, file or database field exists until you inspect it.
- Do not mark the feature complete just because code was generated.
- Do not silently change product scope, data ownership or user-facing copy.
- Do not add a UI control without a working action and accessible name.
- Do not perform deployment, destructive migration or production configuration changes under this skill.
