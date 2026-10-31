---
name: ui-implementation
description: Use when creating or changing screens, components, layouts, interactions, visual styling, icons, responsive behavior, or RTL and LTR support.
---
# UI Implementation

## Workflow
1. Read the shared Nawy Design System at https://github.com/inawy/design-system: DESIGN-SYSTEM.md, foundations/, tokens/ and components/README.md. Read Focus-specific UI decisions in docs/product-facts.md and docs/decisions.md.
2. Inspect the existing screen, components, dependencies and actual icon assets before editing.
3. Preserve established Focus workflows. The timer is primary; do not add dashboards, reminders, categories or unrelated steps.
4. Use Nawy tokens and Nawy Blue. Treat provisional neutral colors and measurements as provisional until visually checked.
5. Use approved local Google Material Symbols Outlined SVG assets and preserve source/license. No Emoji, WhatsApp stickers, random icon packs or emoji fonts as UI icons.
6. Use semantic HTML and real controls. Give icon-only buttons accessible names and decorative SVGs aria-hidden=true.
7. Implement RTL/LTR using logical CSS properties. Check directional icons semantically; do not mirror non-directional symbols.
8. Design relevant default, focus, pressed, disabled, loading, empty, error and success states.
9. Check mobile and desktop widths, text scaling, keyboard interaction, focus order, contrast and reduced motion.
10. Run available visual/component/unit tests and production build. When browser/screenshot verification is unavailable, say visual verification was not performed.
11. Report changed components, icon sources, checks and remaining UI risks.

## Hard rules
- Do not fabricate design tokens, breakpoints, component APIs or asset names.
- Do not introduce a UI dependency without need and license check.
- Do not claim full accessibility compliance from a checklist alone.