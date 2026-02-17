---
phase: 02-core-ui
plan: 03
subsystem: ui
tags: [react, typescript, zustand, tailwind, vitest, testing-library]

# Dependency graph
requires:
  - phase: 02-01
    provides: PeopleSection, ItemSection, Zustand store with people/items/tip/tax actions
  - phase: 02-02
    provides: billStore with setAssignment, computeResults engine

provides:
  - AssignSection: item assignment UI with 4 modes (single, equal, custom, everyone)
  - TipTaxSection: preset tip buttons, custom tip input, dollar/percent tax, split mode toggles
  - ResultsSection: per-person breakdown with subtotal/tip/tax/total, verification check
  - App.tsx: all 5 sections wired into complete bill-splitting app

affects: [03-polish, 04-persistence]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useMemo for computeResults — avoids recomputing on every render
    - ItemRow as sub-component within AssignSection — encapsulates per-item state
    - String state while typing, convert-on-blur for monetary inputs (consistent with ItemSection)
    - Scoped aria-label on role=group for disambiguation in tests (tip vs tax split buttons)

key-files:
  created:
    - gsd-module-test/src/components/AssignSection.tsx
    - gsd-module-test/src/components/AssignSection.test.tsx
    - gsd-module-test/src/components/TipTaxSection.tsx
    - gsd-module-test/src/components/TipTaxSection.test.tsx
    - gsd-module-test/src/components/ResultsSection.tsx
    - gsd-module-test/src/components/ResultsSection.test.tsx
  modified:
    - gsd-module-test/src/App.tsx

key-decisions:
  - "ItemRow extracted as sub-component in AssignSection — each item owns its own mode state initialized from store"
  - "Mode switch to 'everyone' immediately updates store — no separate button needed for mode switch"
  - "useMemo wraps computeResults call in ResultsSection — prevents unnecessary recomputes on unrelated re-renders"
  - "Test query disambiguation via role=group + aria-label — 'Tip split mode' vs 'Tax split mode' scopes getByRole lookups"
  - "getAllByText used in ResultsSection tests where values appear in both per-person cards and grand total summary"

patterns-established:
  - "Sub-component pattern for repeated list items with per-item state (ItemRow in AssignSection)"
  - "String-while-typing / convert-on-blur pattern for all monetary/numeric inputs"
  - "useShallow for multi-field store selections across all components"
  - "afterEach(cleanup) + resetStore() pattern for isolation in component tests"

requirements-completed:
  - ASSIGN-01
  - ASSIGN-02
  - ASSIGN-03
  - ASSIGN-04
  - TIP-01
  - TIP-02
  - TAX-01
  - TAX-02
  - RESULT-01
  - RESULT-02

# Metrics
duration: 3min
completed: 2026-02-16
---

# Phase 2 Plan 3: Assignment, Tip/Tax, Results UI Summary

**AssignSection (4 modes: single/equal/custom/everyone), TipTaxSection (preset tip, dollar/percent tax, equal/proportional toggles), ResultsSection (per-person breakdown with $0.00 verified grand total) — completing the Phase 2 happy path**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-17T03:23:55Z
- **Completed:** 2026-02-17T03:27:00Z
- **Tasks:** 2
- **Files modified:** 7 (6 created, 1 updated)

## Accomplishments

- AssignSection: 4 assignment modes (single dropdown, equal checkboxes, custom dollar amounts, everyone button) with useShallow store integration and mode state per item
- TipTaxSection: tip presets (15%/18%/20%), custom tip %, equal/proportional split toggles, dollar-amount or percentage tax with mode-reset-on-switch
- ResultsSection: useMemo-wrapped computeResults, per-person breakdown cards, grand total summary, $0.00 verification line, unassigned items warning
- App.tsx: all 5 sections rendered in mobile-first vertical layout — full happy path complete

## Task Commits

Each task was committed atomically:

1. **Task 1: Create AssignSection component with all 4 assignment modes** - `de132d7` (feat)
2. **Task 2: Create TipTaxSection, ResultsSection, and wire final App.tsx** - `e073b3c` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `gsd-module-test/src/components/AssignSection.tsx` - Item assignment UI with 4 modes, pill-button mode selector, mode-specific sub-UI, useShallow
- `gsd-module-test/src/components/AssignSection.test.tsx` - 9 tests: empty state, display, single/equal/custom/everyone modes, mode switching
- `gsd-module-test/src/components/TipTaxSection.tsx` - Tip presets, custom tip, tip/tax split toggles, dollar/percent tax input
- `gsd-module-test/src/components/TipTaxSection.test.tsx` - 12 tests: preset clicks, custom tip, split toggles, tax mode, tax value input, mode reset
- `gsd-module-test/src/components/ResultsSection.tsx` - Per-person breakdown, grand total, verification line, unassigned warning
- `gsd-module-test/src/components/ResultsSection.test.tsx` - 9 tests: empty state, per-person display, grand total, verification, unassigned warning, reactivity
- `gsd-module-test/src/App.tsx` - Updated to import and render all 5 sections

## Decisions Made

- ItemRow extracted as sub-component in AssignSection — encapsulates per-item mode state, initialized from current store assignment
- Mode switch to 'everyone' immediately calls setAssignment (no separate button required for the mode change itself)
- useMemo wraps computeResults call in ResultsSection — prevents unnecessary recomputes
- getAllByText used in ResultsSection tests where values appear in both per-person cards and grand total row (multiple matches expected)
- Scoped `getByRole('group', { name: 'Tip split mode' })` pattern to disambiguate tip vs tax split buttons in tests

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test query ambiguity for 'Proportional' button**
- **Found during:** Task 2 (TipTaxSection test — both tip and tax have Proportional buttons)
- **Issue:** `screen.getByText('Proportional')` found 2 elements and threw MultipleElementsFoundError
- **Fix:** Scoped query via `getByRole('group', { name: 'Tip split mode' }).querySelectorAll('button')[1]`
- **Files modified:** TipTaxSection.test.tsx
- **Verification:** Test passes; 12/12 TipTaxSection tests green
- **Committed in:** e073b3c (Task 2 commit)

**2. [Rule 1 - Bug] Fixed test query ambiguity for '$25.00' in ResultsSection**
- **Found during:** Task 2 (ResultsSection test — amount appears in per-person card and grand total)
- **Issue:** `screen.getByText('$25.00')` found 2 elements and threw MultipleElementsFoundError
- **Fix:** Changed to `screen.getAllByText('$25.00').length > 0` assertion
- **Files modified:** ResultsSection.test.tsx
- **Verification:** Test passes; 9/9 ResultsSection tests green
- **Committed in:** e073b3c (Task 2 commit)

**3. [Rule 1 - Bug] Fixed unused variable 'bobId' causing TypeScript build error**
- **Found during:** Task 2 (npm run build — tsc -b fails with TS6133)
- **Issue:** `bobId` declared in beforeEach but never used in test assertions
- **Fix:** Removed `bobId` variable declaration; `aliceId` is still used for single-assignment test setup
- **Files modified:** ResultsSection.test.tsx
- **Verification:** `npm run build` passes; 0 TypeScript errors
- **Committed in:** e073b3c (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (3x Rule 1 - bug)
**Impact on plan:** All fixes were test correctness issues discovered during verification. No scope creep, no architectural changes.

## Issues Encountered

None — all issues were test query ambiguities and an unused variable, resolved inline.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 2 complete: full bill-splitting happy path works end-to-end
- 106 tests pass (28 engine + 14 computeResults + 17 store + 47 component)
- 0 TypeScript errors, build passes
- Phase 3 (polish) can refine UI/UX, add error boundaries, improve accessibility
- Phase 4 (persistence) can add localStorage for PEOPLE-04 quick-add from previous splits

---
*Phase: 02-core-ui*
*Completed: 2026-02-16*
