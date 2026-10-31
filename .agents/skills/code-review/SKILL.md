---
name: code-review
description: Use when reviewing a commit, pull request, diff, proposed implementation, or codebase for defects and risks.
---
# Code Review

## Workflow
1. Read root instructions and the review rules nearest to the changed files.
2. Inspect the complete diff and enough surrounding code to understand behavior; do not review from a summary alone.
3. Identify the intended behavior from accepted product facts and decisions. Treat undocumented intent as unknown.
4. Prioritize findings that are demonstrable: correctness, security, data loss, regressions, accessibility, performance and test gaps.
5. Verify each potential finding against actual code paths and tests. Do not report hypothetical concerns as definite bugs.
6. Report findings first, ordered by severity, with file path and line/range, impact, reproduction/evidence and a concrete remediation.
7. Separate blocking findings from non-blocking suggestions. Do not invent severity or cite lines that do not exist.
8. If no findings are found, say so, then state review coverage and checks that were not run.

## Severity
- **Critical:** exploitable security issue, severe data loss, or production outage.
- **High:** major user flow broken, privilege bypass, or high-risk data corruption.
- **Medium:** limited but material functional defect, regression, or accessibility barrier.
- **Low:** minor defect or maintainability issue with specific future impact.

## Hard rules
- Do not praise or criticize style as a substitute for findings.
- Do not report an issue without evidence.
- Do not claim tests passed unless executed.
- Do not modify code while performing a review unless the user separately asks for fixes.
