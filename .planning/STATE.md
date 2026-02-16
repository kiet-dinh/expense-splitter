# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** Accurately calculate what each person owes when a group shares a restaurant bill with mixed individual and shared items.
**Current focus:** Phase 1 - Foundation

## Current Position

Phase: 1 of 4 (Foundation)
Plan: 1 of 2 in current phase
Status: Executing
Last activity: 2026-02-16 — Plan 01-01 complete (scaffold + stack setup)

Progress: [█░░░░░░░░░] 10%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 3 min
- Total execution time: 0.05 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 1/2 | 3 min | 3 min |

**Recent Trend:**
- Last 5 plans: 3 min
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Stack: React 19 + TypeScript 5 + **Vite 7** (not 6) + Zustand 5 + Tailwind v4 + Vitest 4 — all versions confirmed via npm install
- Math: All monetary values stored as integer cents; largest-remainder method for rounding distribution
- Architecture: Three-layer design — Data Model, Calculation Engine (pure functions), UI Components
- Tailwind v4: Configured via @tailwindcss/vite plugin — no tailwind.config.js or postcss.config.js needed
- Vitest passWithNoTests: Added to vitest.config.ts and test script — Vitest 4 exits code 1 with no test files by default

### Pending Todos

None.

### Blockers/Concerns

None — npm package versions verified and installed successfully.

## Session Continuity

Last session: 2026-02-16
Stopped at: Plan 01-01 complete — ready to execute Plan 01-02 (calculation engine)
Resume file: None
