---
name: release-readiness
description: Use when checking whether a Nawy application or repository is ready for a release, deployment, or production handoff.
---
# Release Readiness

## Workflow
1. Read Focus AGENTS.md, docs/product-facts.md, docs/architecture.md, docs/known-limitations.md, docs/decisions.md and the deployment workflow.
2. Read shared SECURITY-AND-APPROVALS.md and ENGINEERING-STANDARDS.md in https://github.com/inawy/design-system when relevant.
3. Inspect Git status, target branch, latest commit, package versions, lockfile, build scripts, CI results and deployment configuration.
4. Confirm required product behavior against verified facts and decisions. List unresolved assumptions and release-blocking unknowns.
5. Run a reproducible install from the committed lockfile when one exists, typecheck, lint if configured, unit/integration tests, governance validation, production build and critical E2E tests where available.
6. Inspect secrets, frontend environment variables, permissions, dependencies, data export/import, IndexedDB migration and logging.
7. Check responsive UI, RTL/LTR, keyboard/accessibility basics, offline behavior and error recovery where relevant. State explicitly when browser/device testing was not performed.
8. Verify release notes, version, rollback path, storage compatibility and DNS/base-path/environment assumptions.
9. Classify findings as Blocker, High risk, Accepted limitation or Follow-up. Do not hide missing checks.
10. Produce a release report with exact command results, commit SHA and links to CI evidence.
11. Deployment is separate. Obtain explicit authorization before production deployment or domain/configuration changes.

## Hard rules
- Passing a build alone does not mean production-ready.
- Do not mark an unrun test as passed.
- Do not assume CI ran successfully; inspect the actual run and head SHA.
- Do not deploy or mutate production under this skill.