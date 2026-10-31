---
name: database-migration
description: Use when changing a database schema, IndexedDB or Dexie version, storage format, migrations, import, export, backup, or sync behavior.
---
# Database Migration

## Workflow
1. Read `AGENTS.md`, `ENGINEERING-STANDARDS.md`, `SECURITY-AND-APPROVALS.md` and the product's data architecture.
2. Inspect the live schema definitions, migration history, representative types and all reads/writes affected by the change.
3. Identify the actual storage source and environments. Never assume that production data matches the current TypeScript type.
4. Document old schema, new schema, affected records, default values, nullability, indexes, migration order and compatibility behavior.
5. Choose an additive, forward-safe migration where possible. Never edit a migration that has already shipped; add a new version.
6. Define backup/export and recovery approach before any transformation that could lose or invalidate user data.
7. Write migration tests covering empty stores, populated stores, old versions, malformed records, duplicate values and interrupted/partial migration where relevant.
8. Validate imported/external data at the boundary (for example with Zod); do not trust JSON shape or stored historic values.
9. Run migration tests and the full relevant test/build checks. Record exactly what was and was not tested.
10. Ask for explicit approval before destructive, irreversible or production data changes.

## Hard rules
- Do not drop stores, columns or records without an approved recovery plan and explicit authorization.
- Do not assume a backup exists; verify its creation and restore path.
- Do not claim IndexedDB is permanent or immune to browser eviction.
- Do not conflate local save, backup and multi-device synchronization.
- Do not deploy a migration to production under this skill.
