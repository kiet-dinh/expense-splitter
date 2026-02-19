# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** Accurately calculate what each person owes when a group shares a restaurant bill with mixed individual and shared items.
**Current focus:** Phase 4 (Persistence) — in progress

## Current Position

Phase: 4 of 4 (Persistence) — In Progress
Plan: 2 of 3 in current phase — complete
Status: In Progress
Last activity: 2026-02-18 — Plan 04-02 complete (HistorySection.tsx created, 135/135 tests pass, 0 type errors)

Progress: [█████████░] 88%

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: 3.1 min
- Total execution time: 0.35 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2/2 | 5 min | 2.5 min |
| 02-core-ui | 3/3 | 9 min | 3 min |
| 03-results-polish | 1/1 | 4 min | 4 min |
| 04-persistence | 1/3 | 3 min | 3 min |

**Recent Trend:**
- Last 5 plans: 3 min, 4 min, 3 min, 2 min, 3 min
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
- ItemRow sub-component in AssignSection: encapsulates per-item mode state, initialized from store assignment
- useMemo wraps computeResults in ResultsSection: prevents unnecessary recomputes on unrelated renders
- Scoped role=group + aria-label for split mode buttons: disambiguates tip vs tax buttons in tests
- getAllByText used when dollar amounts appear in both per-person cards and grand total summary
- Separate useHistoryStore from useBillStore — only history persisted, bill store remains ephemeral
- partialize: (state) => ({ savedSplits: state.savedSplits }) — excludes non-serializable action functions from localStorage
- CURRENT_SCHEMA_VERSION = 1 used as both persist version and schemaVersion field on each SavedSplit entry
- Spy on useBillStore.setState after store setup calls (not before) to avoid capturing setup setState in test assertions

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-18
Stopped at: Plan 04-02 complete — HistorySection.tsx, tests, and App.tsx wired up
Resume file: None
