# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** Accurately calculate what each person owes when a group shares a restaurant bill with mixed individual and shared items.
**Current focus:** Phase 2 (Core UI) — Plan 2 complete, ready for Plan 3

## Current Position

Phase: 2 of 4 (Core UI)
Plan: 2 of 3 in current phase — complete
Status: Verified ✓
Last activity: 2026-02-16 — Plan 02-02 complete (76/76 tests pass, 0 type errors, build passes)

Progress: [████░░░░░░] 40%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 2.8 min
- Total execution time: 0.19 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2/2 | 5 min | 2.5 min |
| 02-core-ui | 2/3 | 6 min | 3 min |

**Recent Trend:**
- Last 5 plans: 4 min, 3 min, 2 min, 2 min
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
- afterEach(cleanup) must be explicit in Vitest 4 jsdom — auto-cleanup does not run between tests without it
- Container onBlur with relatedTarget.contains() for inline edit rows — prevents premature commit on focus change within row
- Tests use Enter key (user.keyboard('{Enter}')) to commit inline edits — more reliable than blur in jsdom
- tsconfig.app.json types include @testing-library/jest-dom — required since test files under src/ are compiled in build
- PEOPLE-04 (quick-add from previous splits) deferred to Phase 4 — requires localStorage persistence

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-16
Stopped at: Plan 02-02 complete — PeopleSection + ItemSection + App.tsx layout ready, plan 02-03 unblocked
Resume file: None
