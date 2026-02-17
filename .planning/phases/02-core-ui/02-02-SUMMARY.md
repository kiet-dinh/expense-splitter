---
phase: 02-core-ui
plan: 02
subsystem: ui
tags: [react, zustand, tailwind, testing-library, vitest, jsdom]

requires:
  - phase: 02-01
    provides: billStore with people/items/assignments state and actions, computeResults engine, Zustand store pattern

provides:
  - PeopleSection component — add/remove people with case-insensitive duplicate warning
  - ItemSection component — add items, inline edit, delete, running subtotal with aria-live
  - App.tsx updated to compose PeopleSection + ItemSection in mobile-first layout
  - Component test patterns using @testing-library/react + user-event in jsdom

affects: [02-03, 03-assignments, 04-persistence]

tech-stack:
  added: []
  patterns:
    - useShallow from zustand/shallow for selecting multiple store values without re-render churn
    - useId() for accessible label/input linkage
    - Per-file @vitest-environment jsdom directive for component tests
    - afterEach(cleanup) explicit call required for test DOM isolation in Vitest 4 jsdom
    - Container onBlur with relatedTarget.contains() to allow focus movement within edit rows
    - Enter key commits inline edits (more reliable than blur in jsdom test environment)
    - String state for price inputs while typing, convert to cents only on submit/Enter

key-files:
  created:
    - gsd-module-test/src/components/PeopleSection.tsx
    - gsd-module-test/src/components/PeopleSection.test.tsx
    - gsd-module-test/src/components/ItemSection.tsx
    - gsd-module-test/src/components/ItemSection.test.tsx
  modified:
    - gsd-module-test/src/App.tsx
    - gsd-module-test/tsconfig.app.json

key-decisions:
  - "afterEach(cleanup) must be explicit in Vitest 4 jsdom — auto-cleanup does not run between tests without it, causing DOM accumulation"
  - "Container onBlur with relatedTarget.contains() allows focus to move between name and price edit inputs without prematurely committing the edit"
  - "Tests use Enter key (user.keyboard('{Enter}')) to commit inline edits rather than blur — more reliable in jsdom where relatedTarget is often null"
  - "tsconfig.app.json types expanded to include @testing-library/jest-dom to fix build TypeScript errors from jest-dom matchers in test files under src/"
  - "PEOPLE-04 (quick-add from previous splits) explicitly omitted — deferred to Phase 4 (requires localStorage)"

patterns-established:
  - "Component tests: top-of-file // @vitest-environment jsdom, afterEach(cleanup), beforeEach store reset via useBillStore.setState()"
  - "Inline edit: local editingId + editName + editPrice state; container onBlur with contains() check; Enter/Escape keyboard shortcuts"
  - "Price display: centsToDollars() for display, dollarsToCents() for conversion on submit only"

requirements-completed:
  - PEOPLE-01
  - PEOPLE-02
  - PEOPLE-03
  - ITEM-01
  - ITEM-02
  - ITEM-03
  - ITEM-04

duration: 4min
completed: 2026-02-16
---

# Phase 02 Plan 02: People and Item UI Sections Summary

**PeopleSection and ItemSection React components with Zustand integration — add/remove/edit people and items with duplicate warning, inline editing, and live-updating subtotal**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-17T03:17:43Z
- **Completed:** 2026-02-17T03:21:43Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- PeopleSection: name input, add/remove people, case-insensitive duplicate warning, PEOPLE-04 deferred with code comment
- ItemSection: add form with name+price inputs, inline edit (Enter to commit, Escape to cancel, container onBlur for multi-field support), delete, running subtotal in aria-live region at all times
- App.tsx updated to mobile-first max-w-2xl centered layout composing both sections
- 17 new component tests (8 PeopleSection + 9 ItemSection), 76/76 total tests passing

## Task Commits

Each task was committed atomically:

1. **Task 1: PeopleSection with add, remove, duplicate warning** - `f96392b` (feat)
2. **Task 2: ItemSection with inline edit, subtotal, and App.tsx update** - `39415d5` (feat)

**Plan metadata:** (committed after SUMMARY/STATE)

## Files Created/Modified

- `gsd-module-test/src/components/PeopleSection.tsx` - People management UI with add, remove, duplicate warning, useShallow + useId
- `gsd-module-test/src/components/PeopleSection.test.tsx` - 8 component tests in jsdom
- `gsd-module-test/src/components/ItemSection.tsx` - Item entry UI with add form, inline edit, delete, aria-live subtotal
- `gsd-module-test/src/components/ItemSection.test.tsx` - 9 component tests in jsdom
- `gsd-module-test/src/App.tsx` - Replaced placeholder with PeopleSection + ItemSection in responsive layout
- `gsd-module-test/tsconfig.app.json` - Added @testing-library/jest-dom to types for build compatibility

## Decisions Made

- Explicit `afterEach(cleanup)` required in Vitest 4 — auto-cleanup does not run between tests, causing DOM accumulation and "multiple elements found" errors
- Container `onBlur` with `relatedTarget.contains()` pattern for inline edit prevents premature commit when focus moves between name/price fields
- Tests use `user.keyboard('{Enter}')` to commit inline edits — more reliable in jsdom where `relatedTarget` is often `null` on blur
- `tsconfig.app.json` types expanded to include `@testing-library/jest-dom` since test files live under `src/` and are picked up by the app TypeScript build

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] DOM accumulation between tests without cleanup**
- **Found during:** Task 1 (PeopleSection tests)
- **Issue:** Vitest 4 does not automatically run `@testing-library/react` cleanup between tests in jsdom; each `render()` call accumulates into the same document body, causing "multiple elements found" errors
- **Fix:** Added `import { cleanup } from '@testing-library/react'` and `afterEach(() => { cleanup() })` to both test files
- **Files modified:** PeopleSection.test.tsx, ItemSection.test.tsx
- **Verification:** All 8 PeopleSection tests pass after fix
- **Committed in:** f96392b (Task 1 commit)

**2. [Rule 1 - Bug] Premature edit commit when clicking price input**
- **Found during:** Task 2 (ItemSection tests — "updates price on blur")
- **Issue:** Name input had `autoFocus` and its individual `onBlur` fired when user clicked price input, committing the edit before price was changed. Two separate `onBlur` handlers on each input caused this
- **Fix:** Moved blur handling to the container `<li>` using `onBlur` with `e.currentTarget.contains(e.relatedTarget)` check; only commits when focus leaves the entire row. Tests updated to use `user.keyboard('{Enter}')` for reliable commit triggering
- **Files modified:** ItemSection.tsx, ItemSection.test.tsx
- **Verification:** All 9 ItemSection tests pass after fix
- **Committed in:** 39415d5 (Task 2 commit)

**3. [Rule 1 - Bug] Build fails with TypeScript errors on jest-dom matchers**
- **Found during:** Task 2 verification (npm run build)
- **Issue:** `tsconfig.app.json` only had `"types": ["vite/client"]`; component test files under `src/` use `@testing-library/jest-dom` matchers (`toBeInTheDocument`, `toHaveValue`) which TypeScript couldn't resolve
- **Fix:** Added `"@testing-library/jest-dom"` to the types array in `tsconfig.app.json`
- **Files modified:** tsconfig.app.json
- **Verification:** `npm run build` completes successfully
- **Committed in:** 39415d5 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (all Rule 1 bugs)
**Impact on plan:** All fixes necessary for test isolation, component correctness, and build integrity. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- PeopleSection and ItemSection complete — data entry panels for people and items are fully operational
- Store has people[] and items[] populated by UI actions, ready for 02-03 (AssignSection, TipTaxSection, ResultsSection)
- Component test infrastructure established (jsdom + cleanup + store reset pattern) — 02-03 can follow same patterns
- No blockers

---
*Phase: 02-core-ui*
*Completed: 2026-02-16*

## Self-Check: PASSED

- FOUND: gsd-module-test/src/components/PeopleSection.tsx
- FOUND: gsd-module-test/src/components/PeopleSection.test.tsx
- FOUND: gsd-module-test/src/components/ItemSection.tsx
- FOUND: gsd-module-test/src/components/ItemSection.test.tsx
- FOUND: .planning/phases/02-core-ui/02-02-SUMMARY.md
- FOUND: commit f96392b (feat(02-02): PeopleSection)
- FOUND: commit 39415d5 (feat(02-02): ItemSection + App.tsx)
