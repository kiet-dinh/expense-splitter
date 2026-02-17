---
phase: 02-core-ui
plan: 01
subsystem: ui
tags: [zustand, vitest, react-testing-library, jsdom, typescript]

requires:
  - phase: 01-foundation
    provides: "distribute(), dollarsToCents(), centsToDollars() from engine/math.ts"

provides:
  - "Zustand 5 store (useBillStore) with all state and actions for people, items, assignments, tip, and tax"
  - "computeResults() pure function integrating distribute() for per-person bill breakdown"
  - "Vitest component test infrastructure: jsdom environment, jest-dom matchers, RTL, user-event"
  - "59 unit tests covering engine (28), store actions (17), and computation (14)"

affects:
  - 02-02-PLAN
  - 02-03-PLAN

tech-stack:
  added:
    - jsdom (DOM simulation for component tests)
    - "@testing-library/react 16"
    - "@testing-library/jest-dom 6 (vitest entry point)"
    - "@testing-library/user-event 14"
  patterns:
    - "Zustand create<T>()() curried syntax for TypeScript inference"
    - "Assignment as discriminated union (unassigned | single | equal | everyone | custom)"
    - "computeResults as pure function — not inside store, fully testable"
    - "Per-file @vitest-environment directive for mixed node/jsdom environments"
    - "All-zero weight guard: proportional weights fall back to equal (NaN prevention)"
    - "removePerson cascades to assignments to prevent stale personId references"

key-files:
  created:
    - gsd-module-test/src/store/billStore.ts
    - gsd-module-test/src/store/billStore.test.ts
    - gsd-module-test/src/store/computeResults.ts
    - gsd-module-test/src/store/computeResults.test.ts
    - gsd-module-test/vitest.setup.ts
  modified:
    - gsd-module-test/vitest.config.ts
    - gsd-module-test/package.json
    - gsd-module-test/package-lock.json

key-decisions:
  - "Store holds only intent data (people, items, assignments, tip/tax settings); computeResults computes all monetary values on demand — no derived state stored"
  - "Single Zustand store (not slices) — cross-domain actions (removePerson cascade) simpler without slice coordination overhead at this project scale"
  - "computeResults imports only distribute() from engine/math — centsToDollars() excluded (display is UI's job)"
  - "Assignment cascade on removePerson: single -> unassigned, equal -> filter (empty -> unassigned), custom -> filter (empty -> unassigned), everyone -> no change"

patterns-established:
  - "Pattern 1: Zustand store design — create<BillState>()((set) => ...) with discriminated union Assignment type"
  - "Pattern 2: computeResults(people, items, assignments, tipPercent, tipSplitMode, taxMode, taxValue, taxSplitMode) pure function signature"
  - "Pattern 3: vitest.config.ts with react plugin + setupFiles; per-file // @vitest-environment jsdom for component tests"

requirements-completed:
  - PEOPLE-01
  - PEOPLE-02
  - PEOPLE-03
  - ITEM-01
  - ITEM-02
  - ITEM-03
  - ASSIGN-01
  - ASSIGN-02
  - ASSIGN-03
  - ASSIGN-04
  - TIP-01
  - TIP-02
  - TAX-01
  - TAX-02

duration: 2min
completed: 2026-02-16
---

# Phase 2 Plan 01: Zustand Store, computeResults, and Test Infrastructure Summary

**Zustand 5 store with discriminated-union Assignment type, pure computeResults() integrating Phase 1 distribute(), and jsdom/RTL test infrastructure — 59 tests, zero type errors**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-17T03:12:42Z
- **Completed:** 2026-02-17T03:15:39Z
- **Tasks:** 2
- **Files modified:** 8 (4 created in store/, 2 config, 2 package files)

## Accomplishments

- Zustand 5 store defined as single source of truth for all bill state with full typed discriminated union Assignment type (unassigned / single / equal / everyone / custom)
- All store actions implemented including cascading removePerson cleanup that prevents stale personId references in assignments
- computeResults() pure function bridges Phase 1 engine to UI layer — handles all 5 assignment modes, proportional/equal tip and tax, and guards all-zero weight edge case
- Vitest upgraded with react plugin + jest-dom/vitest setup enabling both node-environment store tests and jsdom-environment component tests
- 59 total tests passing: 28 engine (Phase 1), 17 store actions, 14 computeResults scenarios

## Task Commits

Each task was committed atomically:

1. **Task 1: Install test dependencies and configure Vitest for component testing** - `92b4ea0` (chore)
2. **Task 2: Create Zustand store with types, actions, and computeResults function** - `99d286f` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `gsd-module-test/src/store/billStore.ts` - Zustand store with Person, Item, Assignment types and all actions
- `gsd-module-test/src/store/billStore.test.ts` - 17 unit tests for all store actions and cascading cleanup
- `gsd-module-test/src/store/computeResults.ts` - Pure computation function integrating distribute() from engine/math
- `gsd-module-test/src/store/computeResults.test.ts` - 14 tests for all 5 assignment modes, tip, tax, edge cases
- `gsd-module-test/vitest.setup.ts` - Global jest-dom/vitest matchers for component tests
- `gsd-module-test/vitest.config.ts` - Added react plugin and setupFiles for component test support
- `gsd-module-test/package.json` - Added 4 dev dependencies: jsdom, RTL, jest-dom, user-event
- `gsd-module-test/package-lock.json` - Updated lock file

## Decisions Made

- Store holds only intent data (no derived monetary values stored in Zustand)
- Single store chosen over slices because removePerson needs to update assignments cross-domain
- computeResults imports only `distribute()` — centsToDollars excluded by design (display is the UI layer's responsibility)
- All-zero proportional weights fall back to equal distribution (prevents NaN when no items assigned)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed unused variable TypeScript error blocking production build**
- **Found during:** Task 2 (verification: npm run build)
- **Issue:** `const [alice, bob]` destructured `bob` but only `alice` used in first sub-test of the equal cascade test — TypeScript TS6133 error caused build to fail
- **Fix:** Renamed to `_bob` and added `void _bob` to satisfy TypeScript strict mode without removing the destructuring pattern
- **Files modified:** gsd-module-test/src/store/billStore.test.ts
- **Verification:** `npm run build` passed after fix; all 59 tests still pass
- **Committed in:** 99d286f (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Necessary fix for production build correctness. No scope creep.

## Issues Encountered

None beyond the auto-fixed TypeScript unused variable caught during build verification.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Store data contracts fully defined — downstream plans 02-02 (People + Items UI) and 02-03 (Assignments, Tip/Tax, Results UI) can import types and actions directly
- Component test infrastructure ready: `// @vitest-environment jsdom` at file top activates jsdom for any component test
- All must-haves verified: store exports, computeResults exports, test counts, key links (distribute import, crypto.randomUUID usage), and zero grandTotalCheck in all computeResults tests

---
*Phase: 02-core-ui*
*Completed: 2026-02-16*
