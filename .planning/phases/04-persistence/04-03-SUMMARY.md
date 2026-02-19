---
phase: 04-persistence
plan: "03"
subsystem: ui
tags: [react, zustand, localStorage, history, persistence]

requires:
  - phase: 04-01
    provides: useHistoryStore with saveSplit action and SavedSplit schema

provides:
  - Save Split button and inline name dialog in ResultsSection calling useHistoryStore.saveSplit()
  - PEOPLE-04 suggestion chips in PeopleSection derived from historyStore.savedSplits
  - Tests for save flow (7) and suggestion chips (5)

affects:
  - 04-02 (parallel plan — no file overlap; both depend on 04-01 historyStore)

tech-stack:
  added: []
  patterns:
    - "useHistoryStore(useShallow(...)) selector pattern for store reads"
    - "useBillStore.getState() snapshot at save time (not reactive selector)"
    - "Inline dialog pattern with autoFocus input for confirmation flows"

key-files:
  created: []
  modified:
    - gsd-module-test/src/components/ResultsSection.tsx
    - gsd-module-test/src/components/ResultsSection.test.tsx
    - gsd-module-test/src/components/PeopleSection.tsx
    - gsd-module-test/src/components/PeopleSection.test.tsx

key-decisions:
  - "Used useBillStore.getState() (not reactive selector) to snapshot bill state at save time — avoids stale closures in handleSave()"
  - "Grouped Save Split and Copy Summary in a flex div to keep header row clean"
  - "Suggestion chips filtered case-insensitively using Set<string>.has(name.toLowerCase())"

requirements-completed:
  - PERSIST-01
  - PEOPLE-04

duration: 18min
completed: 2026-02-18
---

# Phase 4 Plan 03: Save Split UI and Suggestion Chips Summary

**Save Split inline dialog wired to useHistoryStore.saveSplit() in ResultsSection, plus PEOPLE-04 history-name suggestion chips in PeopleSection using zustand persist store**

## Performance

- **Duration:** 18 min
- **Started:** 2026-02-18T21:28:00Z
- **Completed:** 2026-02-18T21:46:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- ResultsSection now shows a green Save Split button (alongside Copy Summary) when people exist, opening an inline name input dialog that calls useHistoryStore.saveSplit() with all bill fields on confirm
- QuotaExceededError caught and surfaced via alert so storage-full failures are graceful
- PeopleSection derives suggestion chips from all names across savedSplits, filtering out names already in the bill (case-insensitive), and chips call addPerson on click
- 12 new tests added (7 save + 5 chips), all 147 tests pass, 0 TypeScript errors

## Task Commits

1. **Task 1: Add Save Split flow to ResultsSection** - `656ea10` (feat)
2. **Task 2: Add PEOPLE-04 suggestion chips to PeopleSection** - `64e8628` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `gsd-module-test/src/components/ResultsSection.tsx` - Added useHistoryStore import, showSaveDialog/saveName state, handleSave(), Save Split button, and inline dialog JSX
- `gsd-module-test/src/components/ResultsSection.test.tsx` - Added useHistoryStore import, localStorage.clear() in beforeEach, 7 Save Split tests
- `gsd-module-test/src/components/PeopleSection.tsx` - Added useHistoryStore import, savedSplits selector, suggestions derivation, and chip JSX; removed PEOPLE-04 deferred comment
- `gsd-module-test/src/components/PeopleSection.test.tsx` - Added useHistoryStore import, localStorage.clear() + store reset in beforeEach, seedHistory() helper, 5 chip tests

## Decisions Made

- Used `useBillStore.getState()` snapshot inside `handleSave()` rather than a reactive selector to capture bill state at the moment of saving — avoids stale closure issues
- Grouped the Save Split and Copy Summary buttons in a `flex gap-2` wrapper so the header row remains a single justify-between row
- Suggestion deduplication uses `new Set(...)` over the flatMap of all people names, then filters by `currentNames.has(name.toLowerCase())` for case-insensitive exclusion

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- PERSIST-01 and PEOPLE-04 requirements complete; 04-01 store + 04-03 UI trigger together satisfy the full persistence feature
- 04-02 (HistorySection list UI) runs in parallel and has no file overlap — merges cleanly
- Phase 4 ready to verify end-to-end once 04-02 is also complete

---
*Phase: 04-persistence*
*Completed: 2026-02-18*
