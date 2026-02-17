# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** Accurately calculate what each person owes when a group shares a restaurant bill with mixed individual and shared items.
**Current focus:** Phase 2 (Core UI) — Plan 1 complete, ready for Plan 2

## Current Position

Phase: 2 of 4 (Core UI)
Plan: 1 of 3 in current phase — complete
Status: Verified ✓
Last activity: 2026-02-16 — Plan 02-01 complete (59/59 tests pass, 0 type errors, build passes)

Progress: [███░░░░░░░] 30%

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 2.7 min
- Total execution time: 0.13 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2/2 | 5 min | 2.5 min |
| 02-core-ui | 1/3 | 2 min | 2 min |

**Recent Trend:**
- Last 5 plans: 3 min, 2 min, 2 min
- Trend: Stable

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
- distribute() tiebreak: lower index wins when remainders are equal — ensures stable deterministic output
- dollarsToCents() string-split: splits on "." and uses parseInt — avoids parseFloat * 100 floating-point error
- centsToDollars() toFixed(2): acceptable only for display output, not stored computation
- Store holds only intent data — no derived monetary values stored in Zustand; computeResults() computes on demand
- Single Zustand store (not slices) — removePerson must cascade to assignments, simpler without slice coordination
- Assignment as discriminated union: unassigned | single | equal | everyone | custom
- All-zero proportional weights fall back to equal distribution to prevent NaN
- Per-file @vitest-environment jsdom directive for component tests; node remains default

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-16
Stopped at: Plan 02-01 complete — store + computeResults + test infra ready, plans 02-02 and 02-03 unblocked
Resume file: None
