---
phase: 02-core-ui
verified: 2026-02-16T22:31:00Z
status: human_needed
score: 17/18 requirements verified (PEOPLE-04 deliberately deferred to Phase 4)
re_verification: false
human_verification:
  - test: "Full happy path walkthrough"
    expected: "Add Alice and Bob, add Pizza ($25) and Drinks ($10), assign Pizza to Alice (single), Drinks to everyone, set 20% tip proportional, enter $3 tax dollar amount, see per-person breakdown with $0.00 verification"
    why_human: "End-to-end user flow correctness cannot be verified programmatically — requires visual confirmation that all sections compose correctly and values update in real time without a page refresh"
  - test: "Duplicate name warning display"
    expected: "Type 'Alice' in PeopleSection after Alice already added — warning 'Name already added' appears immediately below the input field while typing"
    why_human: "Visual timing and placement of the warning text requires human observation"
  - test: "Inline item edit interaction"
    expected: "Double-click an item row or click Edit button — inputs appear pre-populated with current name and price; Enter key commits, Escape cancels"
    why_human: "Keyboard interaction feel and focus behavior in a real browser may differ from jsdom test environment"
  - test: "Custom assignment portions UX"
    expected: "In AssignSection with Custom mode, enter dollar amounts per person — amounts save on blur and per-person breakdown updates immediately in ResultsSection"
    why_human: "Real-time reactivity between AssignSection and ResultsSection requires visual verification in browser"
  - test: "Verification line shows $0.00 in all scenarios"
    expected: "Verification line in ResultsSection always shows green '$0.00' regardless of tip/tax configuration"
    why_human: "Visual color (green vs red) and correctness in edge cases (fractional cents) requires human spot-check"
---

# Phase 2: Core UI Verification Report

**Phase Goal:** Users can enter a complete restaurant bill and see a correct per-person breakdown without refreshing the page
**Verified:** 2026-02-16T22:31:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can add and remove named people, and sees a warning on duplicate name entry | VERIFIED | PeopleSection.tsx: addPerson/removePerson wired to useBillStore; isDuplicate check case-insensitive; warning rendered conditionally; 8 passing component tests |
| 2 | User can add, edit, and delete line items and sees a running subtotal update in real time | VERIFIED | ItemSection.tsx: addItem/updateItem/removeItem wired; aria-live subtotal always in DOM; dollarsToCents/centsToDollars imported from engine/math; 9 passing component tests |
| 3 | User can assign any item to one person, multiple people equally, multiple people with custom portions, or everyone at once | VERIFIED | AssignSection.tsx: 4 modes (single dropdown, equal checkboxes, custom dollar inputs, everyone button) all call setAssignment; ItemRow sub-component manages per-item state; 9 passing component tests |
| 4 | User can set tip via preset buttons (15%, 18%, 20%) or custom input, and choose equal or proportional split | VERIFIED | TipTaxSection.tsx: TIP_PRESETS=[15,18,20], handlePresetClick wired, custom tip input on blur calls setTipPercent, split mode toggle calls setTipSplitMode; 12 passing component tests |
| 5 | User sees a per-person breakdown with subtotal, tip share, tax share, and total, plus a grand-total verification | VERIFIED | ResultsSection.tsx: imports computeResults, calls with useMemo, renders perPerson cards with subtotalCents/tipCents/taxCents/totalCents, grand total summary, verification line with grandTotalCheck; 9 passing component tests |

**Score:** 5/5 success criteria truths verified

### Required Artifacts

| Artifact | Min Lines | Actual Lines | Status | Details |
|----------|-----------|--------------|--------|---------|
| `gsd-module-test/src/store/billStore.ts` | - | 145 | VERIFIED | Exports useBillStore, Person, Item, Assignment, ItemAssignment, TipSplitMode, TaxMode, TaxSplitMode; crypto.randomUUID used |
| `gsd-module-test/src/store/computeResults.ts` | - | 112 | VERIFIED | Exports computeResults, PersonResult, BillResults; imports distribute from ../engine/math |
| `gsd-module-test/src/store/billStore.test.ts` | 50 | 204 | VERIFIED | 17 unit tests covering all actions and cascade cleanup |
| `gsd-module-test/src/store/computeResults.test.ts` | 40 | 203 | VERIFIED | 14 unit tests covering all 5 assignment modes, tip, tax, edge cases |
| `gsd-module-test/vitest.setup.ts` | - | 1 | VERIFIED | Imports @testing-library/jest-dom/vitest |
| `gsd-module-test/vitest.config.ts` | - | 11 | VERIFIED | react plugin + setupFiles configured |
| `gsd-module-test/src/components/PeopleSection.tsx` | 40 | 84 | VERIFIED | Add/remove/duplicate warning with useBillStore + useShallow |
| `gsd-module-test/src/components/PeopleSection.test.tsx` | 30 | 111 | VERIFIED | 8 component tests in jsdom |
| `gsd-module-test/src/components/ItemSection.tsx` | 50 | 208 | VERIFIED | Add/edit/delete/subtotal with dollarsToCents/centsToDollars |
| `gsd-module-test/src/components/ItemSection.test.tsx` | 30 | 141 | VERIFIED | 9 component tests in jsdom |
| `gsd-module-test/src/components/AssignSection.tsx` | 80 | 295 | VERIFIED | 4 assignment modes, ItemRow sub-component, useBillStore wired |
| `gsd-module-test/src/components/AssignSection.test.tsx` | 40 | 163 | VERIFIED | 9 component tests covering all modes |
| `gsd-module-test/src/components/TipTaxSection.tsx` | 60 | 214 | VERIFIED | Preset buttons, custom tip, tax mode/value/split toggles |
| `gsd-module-test/src/components/TipTaxSection.test.tsx` | 30 | 161 | VERIFIED | 12 component tests |
| `gsd-module-test/src/components/ResultsSection.tsx` | 40 | 140 | VERIFIED | computeResults via useMemo, per-person cards, verification line |
| `gsd-module-test/src/components/ResultsSection.test.tsx` | 30 | 121 | VERIFIED | 9 component tests |

All 16 artifacts exist, are substantive, and pass minimum line thresholds.

### Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|----|--------|---------|
| computeResults.ts | engine/math.ts | `import { distribute } from '../engine/math'` | WIRED | Line 1 of computeResults.ts |
| billStore.ts | crypto.randomUUID() | `crypto.randomUUID()` in addPerson and addItem | WIRED | Lines 83, 112 of billStore.ts |
| PeopleSection.tsx | billStore.ts | `import { useBillStore }` + useShallow selection | WIRED | Lines 3, 8-14 of PeopleSection.tsx |
| ItemSection.tsx | billStore.ts | `import { useBillStore }` + useShallow selection | WIRED | Lines 4, 7-14 of ItemSection.tsx |
| ItemSection.tsx | engine/math.ts | `import { centsToDollars, dollarsToCents }` | WIRED | Line 3 of ItemSection.tsx; both functions used |
| App.tsx | PeopleSection.tsx | `import { PeopleSection }` + `<PeopleSection />` rendered | WIRED | Lines 1, 13 of App.tsx |
| App.tsx | ItemSection.tsx | `import { ItemSection }` + `<ItemSection />` rendered | WIRED | Lines 2, 14 of App.tsx |
| AssignSection.tsx | billStore.ts | `import { useBillStore }` + setAssignment called in all 4 modes | WIRED | Lines 4-5, 86/99/112/setAssignment calls |
| TipTaxSection.tsx | billStore.ts | `import { useBillStore }` + all 5 setters called | WIRED | Lines 4-5, setTipPercent/setTipSplitMode/setTaxMode/setTaxValue/setTaxSplitMode called |
| ResultsSection.tsx | computeResults.ts | `import { computeResults }` + called in useMemo | WIRED | Lines 5, 32-43 of ResultsSection.tsx |
| ResultsSection.tsx | engine/math.ts | `import { centsToDollars }` + used throughout | WIRED | Lines 3, 69/83/89/93/97/etc. |
| App.tsx | AssignSection.tsx | `import { AssignSection }` + `<AssignSection />` rendered | WIRED | Lines 3, 15 of App.tsx |
| App.tsx | TipTaxSection.tsx | `import { TipTaxSection }` + `<TipTaxSection />` rendered | WIRED | Lines 4, 16 of App.tsx |
| App.tsx | ResultsSection.tsx | `import { ResultsSection }` + `<ResultsSection />` rendered | WIRED | Lines 5, 17 of App.tsx |

All 14 key links are WIRED.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| PEOPLE-01 | 02-01, 02-02 | User can add people to a bill by name | SATISFIED | PeopleSection: addPerson action wired, form submission works |
| PEOPLE-02 | 02-01, 02-02 | User can remove people from a bill | SATISFIED | PeopleSection: removePerson on each person row |
| PEOPLE-03 | 02-01, 02-02 | User sees warning on duplicate name | SATISFIED | PeopleSection: isDuplicate case-insensitive check renders warning text |
| PEOPLE-04 | NOT in any plan | User can quick-add names from previous splits | DEFERRED | Deliberately omitted — depends on Phase 4 localStorage. Code comment at PeopleSection.tsx line 5 documents deferral. ROADMAP maps this to Phase 2 but research concluded it cannot be implemented without Phase 4 foundation. |
| ITEM-01 | 02-01, 02-02 | User can add items with name and price | SATISFIED | ItemSection: addItem action wired, form submits name + dollarsToCents(price) |
| ITEM-02 | 02-01, 02-02 | User can edit an existing item's name or price | SATISFIED | ItemSection: inline edit with editingId state, updateItem called on commit |
| ITEM-03 | 02-01, 02-02 | User can delete an item from the bill | SATISFIED | ItemSection: removeItem action on Delete button |
| ITEM-04 | 02-02 | User sees running subtotal as items change | SATISFIED | ItemSection: aria-live="polite" subtotal always in DOM, recomputes from items array |
| ASSIGN-01 | 02-01, 02-03 | User can assign item to one person | SATISFIED | AssignSection: single mode with dropdown select |
| ASSIGN-02 | 02-01, 02-03 | User can assign item to multiple people equally | SATISFIED | AssignSection: equal mode with checkboxes |
| ASSIGN-03 | 02-01, 02-03 | User can assign item with custom portions | SATISFIED | AssignSection: custom mode with per-person dollar inputs, converted via dollarsToCents on blur |
| ASSIGN-04 | 02-01, 02-03 | User can assign item to everyone with one click | SATISFIED | AssignSection: everyone mode button immediately calls setAssignment({mode:'everyone'}) |
| TIP-01 | 02-01, 02-03 | User can select tip % from presets or enter custom | SATISFIED | TipTaxSection: TIP_PRESETS=[15,18,20] buttons + custom input |
| TIP-02 | 02-01, 02-03 | User can choose to split tip equally or proportionally | SATISFIED | TipTaxSection: tipSplitMode toggle buttons call setTipSplitMode |
| TAX-01 | 02-01, 02-03 | User can enter tax as dollar amount or percentage | SATISFIED | TipTaxSection: taxMode toggle (amount/percent) + value input with mode-aware conversion |
| TAX-02 | 02-01, 02-03 | User can choose to split tax equally or proportionally | SATISFIED | TipTaxSection: taxSplitMode toggle buttons call setTaxSplitMode |
| RESULT-01 | 02-03 | User sees per-person breakdown with subtotal, tip, tax, total | SATISFIED | ResultsSection: perPerson cards show subtotalCents/tipCents/taxCents/totalCents via centsToDollars |
| RESULT-02 | 02-03 | User sees verification that individual totals sum to grand total | SATISFIED | ResultsSection: grandTotalCheck from computeResults rendered as "Verification: difference = $X.XX" in green (0) or red (non-zero) |

**Coverage summary:** 17/18 requirements satisfied. PEOPLE-04 deliberately deferred to Phase 4 per documented research decision (requires localStorage that ships in Phase 4). This was a planned deferral, not an oversight.

### Anti-Patterns Found

No stub patterns, TODO blockers, or empty implementations found. All `return {}` / `return []` usages are legitimate initial state values (e.g., `return {}` for empty customInputs Record, `return new Set()` for checkedIds). All `placeholder` strings are HTML input attribute values, not stub comments.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| PeopleSection.tsx | 5 | `// PEOPLE-04: quick-add ... deferred to Phase 4` | Info | Documents intentional deferral — not a blocker |

### Human Verification Required

**All automated checks pass.** The following items require a human to verify in a browser:

#### 1. Full Happy Path End-to-End

**Test:** Open `npm run dev`. Add two people (Alice, Bob). Add three items (Pizza $25, Drinks $10, Dessert $8). In AssignSection, assign Pizza to Alice (single), Drinks to equal split between both, Dessert to everyone. Set tip to 20% proportional. Enter $3 tax as dollar amount equal split. Check ResultsSection.
**Expected:** Per-person cards appear immediately with correct subtotals, tip shares, tax shares, and totals. Grand total verification shows $0.00 difference in green. No page refresh needed at any step.
**Why human:** Reactive update timing and correctness of composed sections cannot be verified programmatically without running the browser.

#### 2. Duplicate Name Warning

**Test:** Add "Alice" to PeopleSection, then start typing "alice" (lowercase) in the input field.
**Expected:** Warning "Name already added" appears below the input immediately while typing, before any button is clicked.
**Why human:** Visual placement and timing of the warning requires real browser rendering.

#### 3. Inline Item Edit Keyboard UX

**Test:** Add an item. Click the Edit button. Verify inputs are pre-populated with current values. Change the name, press Enter.
**Expected:** Edit commits immediately, display view shows updated name.
**Why human:** Focus management and keyboard behavior in real browser may differ from jsdom environment used in tests.

#### 4. AssignSection to ResultsSection Reactivity

**Test:** With people and items seeded, switch an item from "One Person" to "Everyone" in AssignSection.
**Expected:** ResultsSection updates immediately (without page refresh) to reflect the new assignment in per-person totals.
**Why human:** Cross-section Zustand reactivity requires visual verification in a real browser.

#### 5. Verification Line Correctness

**Test:** Configure various tip/tax scenarios (fractional percentages, odd item counts). Check the verification line after each.
**Expected:** Verification always shows green "Verification: difference = $0.00".
**Why human:** Edge cases with largest-remainder rounding should be spot-checked visually to confirm the grandTotalCheck stays at zero across scenarios.

## Test Suite Results

```
Test Files  8 passed (8)
Tests       106 passed (106)
  - src/engine/math.test.ts         28 tests (Phase 1 regression: pass)
  - src/store/computeResults.test.ts 14 tests
  - src/store/billStore.test.ts      17 tests
  - src/components/ResultsSection.test.tsx  9 tests
  - src/components/AssignSection.test.tsx   9 tests
  - src/components/PeopleSection.test.tsx   8 tests
  - src/components/TipTaxSection.test.tsx  12 tests
  - src/components/ItemSection.test.tsx     9 tests
```

**TypeScript:** 0 errors (`npx tsc --noEmit` clean)
**Production build:** Passes (`npm run build` — 43 modules, 216KB JS bundle)

## PEOPLE-04 Deferral Note

PEOPLE-04 ("User can quick-add names from previous splits") is listed in the ROADMAP as a Phase 2 requirement. The 02-RESEARCH.md explicitly recommended deferral because it depends on Phase 4's localStorage layer. The 02-02-PLAN.md comments it out of the requirements list. The implementation correctly defers it with a code comment at PeopleSection.tsx line 5. This is a documented, intentional scope decision — not a gap created by incomplete implementation.

Phase 4 should claim PEOPLE-04 when it implements the persistence layer.

---

_Verified: 2026-02-16T22:31:00Z_
_Verifier: Claude (gsd-verifier)_
