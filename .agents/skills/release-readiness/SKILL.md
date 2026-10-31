---
name: release-readiness
description: Use when checking whether a Nawy application or repository is ready for a release, deployment, or production handoff.
---
# Release Readiness

## Workflow
1. Read `AGENTS.md`, `SECURITY-AND-APPROVALS.md`, `KNOWN-LIMITATIONS.md` and the product's architecture/deployment guide.
2. Inspect Git status, target branch, latest commit, package versions, lockfile, build scripts, CI results and deployment configuration.
3. Confirm required product behavior against accepted facts and decisions. List unresolved assumptions and release-blocking unknowns.
4. Run reproducible install from lockfile, typecheck, lint if configured, unit/integration tests, production build and critical E2E tests.
5. Inspect security posture: secrets, public environment variables, permissions, dependencies, auth/RLS, data export/migration and logging.
6. Check responsive UI, RTL/LTR, keyboard/accessibility basics, offline behavior and error recovery as relevant to the product.
7. Verify release notes, version, rollback path, storage compatibility and any DNS/base-path/environment assumptions.
8. Classify findings as Blocker, High risk, Accepted limitation or Follow-up. Do not hide missing checks.
9. Produce a release report with exact command results, commit SHA and links to CI evidence where available.
10. Deployment is a separate action. Obtain explicit authorization before production deployment or domain/configuration changes.

## Hard rules
- Passing a build alone does not mean production-ready.
- Do not mark an unrun test as passed.
- Do not assume CI ran successfully; inspect the actual run.
- Do not deploy or mutate production under this skill.
