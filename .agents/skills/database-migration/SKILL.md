---
name: database-migration
description: Use when changing a database schema, IndexedDB or Dexie version, storage format, migrations, import, export, backup, or sync behavior.
---
# Database Migration

## Workflow
1. Read Focus AGENTS.md, docs/architecture.md, docs/product-facts.md, docs/decisions.md and relevant limitations.
2. Read the shared ENGINEERING-STANDARDS.md and SECURITY-AND-APPROVALS.md from https://github.com/inawy/design-system.
3. Inspect the actual Dexie schema, migration history, types, reads/writes and representative data shapes.
4. Document old/new schema, affected records, defaults, nullability, indexes, migration order and compatibility.
5. Use additive forward-safe migrations. Never edit a migration already shipped; add a new version.
6. Define backup/export and recovery before transformations that could lose or invalidate user data.
7. Test empty stores, populated stores, old versions, malformed records, duplicate values and interrupted migration where relevant.
8. Validate imported data at the boundary; do not trust JSON shape or historic stored values.
9. Run migration tests and relevant typecheck/lint/test/build checks. Record exactly what was not tested.
10. Obtain explicit approval before destructive, irreversible or production data changes.

## Hard rules
- Do not drop stores, fields or records without an approved recovery plan and explicit authorization.
- Do not assume a backup exists; verify creation and restore path.
- Do not claim IndexedDB is permanent or immune to browser eviction.
- Do not conflate local save, backup and multi-device synchronization.
- Do not deploy a migration to production under this skill.