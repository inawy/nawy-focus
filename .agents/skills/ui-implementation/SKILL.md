---
name: ui-implementation
description: Use when creating or changing screens, components, layouts, interactions, visual styling, icons, responsive behavior, or RTL and LTR support.
---
# UI Implementation

## Workflow
1. Read `DESIGN-SYSTEM.md`, `foundations/`, `tokens/`, `components/README.md` and the target product's UI decisions.
2. Inspect the existing screen, component library, installed dependencies and actual icon assets before editing.
3. Preserve established product workflows. Do not add dashboards, reminders, categories or steps that are not requested or needed by the verified product requirements.
4. Use the Nawy tokens and Nawy Blue. Treat proposed neutral colors and measurements as provisional until visually checked.
5. Use approved local SVG icons from Google Material Symbols Outlined. No Emoji, WhatsApp stickers, random icon packs or emoji fonts as UI icons. Preserve source and license information.
6. Use semantic HTML and real interactive elements. Give icon-only buttons accessible names; mark decorative SVGs `aria-hidden="true"`.
7. Implement RTL and LTR using logical CSS properties. Check directional icons semantically; do not mirror non-directional symbols.
8. Design relevant states: default, hover, focus-visible, pressed, disabled, loading, empty, error and success.
9. Check narrow mobile width and larger desktop width, text scaling, keyboard interaction, focus order, contrast and reduced motion.
10. Run available visual/component/unit tests and production build. If no browser/screenshot capability exists, say visual verification was not performed.
11. Report actual changed components, source of assets, checks performed and remaining UI risks.

## Hard rules
- Do not fabricate missing design tokens, breakpoints, component APIs or asset names.
- Do not use a symbol merely because it looks attractive; its meaning must match the action.
- Do not introduce a UI dependency without a need and license check.
- Do not claim full accessibility compliance from a checklist alone.
