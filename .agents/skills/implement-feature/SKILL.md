---
name: implement-feature
description: Use when implementing a new feature or product behavior in a Nawy application.
---
# Implement Feature

## Goal
Deliver the smallest complete feature that matches verified product requirements and the existing application architecture.

## Workflow
1. Read the root AGENTS.md and Focus documents: docs/product-facts.md, docs/architecture.md, docs/decisions.md and docs/known-limitations.md.
2. Read relevant shared guidance from https://github.com/inawy/design-system, especially AI-GUIDELINES.md, ENGINEERING-STANDARDS.md and SECURITY-AND-APPROVALS.md when available.
3. Inspect the actual repository, branch, relevant source files, tests, package scripts, dependencies and existing patterns.
4. Separate requirements into Verified, Decision, Assumption and Unknown. Never invent missing behavior.
5. Ask only when a critical behavior cannot be inferred safely; otherwise state a reversible assumption.
6. Identify the smallest set of files and tests needed. Do not refactor unrelated modules.
7. Reuse sound abstractions; do not add a dependency without a concrete reason and compatibility/license check.
8. Add or update tests for normal, edge and failure states where relevant.
9. Run the repository's actual typecheck, tests, lint, governance validator and build. Read their real exit status.
10. Review the final diff for accidental edits, secrets, unsafe data changes and inaccessible controls.
11. Report changed files, decisions, exact checks, results, assumptions and unverified items.

## Hard rules
- Inspect APIs and files before claiming they exist.
- Do not silently change product scope, data ownership or user-facing copy.
- Do not add a control without a working action and accessible name.
- Do not deploy or perform destructive production changes under this skill.