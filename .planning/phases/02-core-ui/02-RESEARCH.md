# Phase 2: Core UI - Research

**Researched:** 2026-02-16
**Domain:** Zustand 5 state design, React 19 component patterns, form input handling, Vitest + jsdom component testing, Tailwind v4 form styling
**Confidence:** HIGH (stack verified; npm versions confirmed; patterns cross-referenced with official docs and current WebSearch)

---

## Summary

Phase 2 is the largest phase in the project: it takes the pure calculation engine from Phase 1 and wires it to a complete, interactive React UI. The technical work falls into three distinct layers that must be built in order — Data Model first, then Calculation Integration, then UI Components.

The data model layer is the critical design decision. The Zustand 5 store must represent people, items, assignments (the most complex entity), tip/tax settings, and computed results in a way that makes the calculation engine easy to call. Item assignment is the genuinely hard problem: a single item can be assigned to one person, several people equally, several people with custom portions, or everyone at once. This maps cleanly to a discriminated union type with four modes (single, equal, custom, everyone). The store stores only raw intent data; the calculation engine computes all monetary values on demand.

The UI layer uses React 19 controlled components for all inputs. There is no need for a form library — React Hook Form would add complexity without benefit on a single-page app. The key patterns for this phase are: `useId` for accessible label/input linkage in repeated rows; `crypto.randomUUID()` (built-in, zero dependency) for stable item and person IDs; Vitest with jsdom and React Testing Library for component tests; and `@testing-library/user-event` for realistic interaction simulation.

**Primary recommendation:** Build the Zustand store and TypeScript types first (the data model defines all downstream contracts), then wire the calculation engine to produce derived results, then build UI section by section (People → Items → Assignments → Tip/Tax → Results). Test the data model with node-environment unit tests; test UI components with jsdom environment tests.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PEOPLE-01 | User can add people to a bill by name | Zustand `addPerson` action with `crypto.randomUUID()` for stable ID; controlled text input; duplicate name check on add |
| PEOPLE-02 | User can remove people from a bill | Zustand `removePerson` action filters by ID; React list rendering with stable keys; must also clean up assignments referencing removed person |
| PEOPLE-03 | User sees a warning when entering a duplicate name | Case-insensitive name comparison in store selector; warning rendered conditionally; does NOT block adding |
| PEOPLE-04 | User can quick-add names from previous splits | Out of scope for Phase 2 — no persistence layer yet (localStorage comes in Phase 4); omit this requirement from Phase 2 implementation |
| ITEM-01 | User can add items with a name and price | Zustand `addItem` action; price stored as integer cents using existing `dollarsToCents` from engine; controlled text input + price input |
| ITEM-02 | User can edit an existing item's name or price | Zustand `updateItem` action; inline edit pattern (click to edit, blur/enter to confirm); controlled inputs pre-populated with current values |
| ITEM-03 | User can delete an item from the bill | Zustand `removeItem` action; must also remove any assignments for deleted item; React list key stability required |
| ITEM-04 | User sees a running subtotal as items are added or changed | Derived value — sum of all item prices in cents; computed in a Zustand selector or useMemo; `centsToDollars` for display; aria-live region for accessibility |
| ASSIGN-01 | User can assign an item to one person | Assignment mode "single" — stores one personId; radio/select UI |
| ASSIGN-02 | User can assign an item to multiple people to split equally | Assignment mode "equal" — stores array of personIds; multi-checkbox UI; distribute() called with equal weights |
| ASSIGN-03 | User can assign an item with custom portions per person | Assignment mode "custom" — stores array of { personId, weight } objects; numeric inputs; distribute() called with weights |
| ASSIGN-04 | User can assign an item to everyone with one click | Assignment mode "everyone" — treated as equal-split across all people; single button; updates assignment for the item |
| TIP-01 | User can select a tip percentage from presets (15%, 18%, 20%) or enter a custom percentage | Preset buttons toggle tipPercent; custom input overrides; tip amount in cents = distribute(floor(subtotalCents * tipPercent / 100), weights) |
| TIP-02 | User can choose to split tip equally or proportionally based on each person's subtotal | tipSplitMode: "equal" or "proportional"; equal uses uniform weights; proportional uses per-person subtotal cents as weights |
| TAX-01 | User can enter tax as a dollar amount or a percentage | taxMode: "amount" or "percent"; amount uses dollarsToCents on input; percent computes cents from subtotal; radio toggle |
| TAX-02 | User can choose to split tax equally or proportionally based on each person's subtotal | taxSplitMode: "equal" or "proportional"; same weight logic as TIP-02 |
| RESULT-01 | User sees a per-person breakdown showing subtotal, tip share, tax share, and total owed | Derived computation using distribute() for tip and tax distribution; per-person subtotal = sum of their item shares; table/card per person |
| RESULT-02 | User sees verification that all individual totals sum to the grand total | Grand total check: sum of all person totals === subtotal + tip + tax; display difference (should always be 0 with LRM) |
</phase_requirements>

---

**Note on PEOPLE-04:** The "quick-add names from previous splits" requirement (PEOPLE-04) depends on the localStorage persistence layer that ships in Phase 4. Phase 2 cannot implement it without that foundation. The planner should include PEOPLE-04 in the plan as a stub UI placeholder (disabled button or hidden section) with a TODO, or explicitly defer it and document the gap.

---

## Standard Stack

### Core (already installed from Phase 1)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| react | 19.2.4 | UI framework | Already installed |
| zustand | 5.0.11 | Global state management | Already installed; no additional install needed |
| tailwindcss | 4.1.18 | Utility CSS | Already installed; `@import "tailwindcss"` in index.css |
| typescript | 5.9.3 | Static typing | Already installed |
| vite | 7.3.1 | Build tool | Already installed |
| vitest | 4.0.18 | Test runner | Already installed; currently environment: 'node' |

### New Installs Required for Phase 2

| Library | Version (npm) | Purpose | Why |
|---------|--------------|---------|-----|
| jsdom | 28.1.0 | DOM simulation for component tests | Required for vitest component testing; not needed for pure engine tests |
| @testing-library/react | 16.3.2 | Component testing utilities | Standard React component test toolkit |
| @testing-library/jest-dom | 6.9.1 | Custom DOM matchers (toBeInDocument, etc.) | Readable test assertions |
| @testing-library/user-event | 14.6.1 | Realistic event simulation | Required for testing typing, clicking, form interactions accurately |

**No new runtime dependencies needed.** ID generation uses `crypto.randomUUID()` (built-in to modern browsers and Node 19+, already available in this stack). The calculation engine (`distribute`, `dollarsToCents`, `centsToDollars`) is already implemented in Phase 1.

**Optional (not recommended for this scope):**
- `immer` (11.1.4): The Zustand immer middleware enables mutable-style state updates. For this app's store complexity, it adds a dependency without strong justification — plain spread/filter updates are sufficient and more transparent. Only add immer if the store update code becomes unwieldy.
- `@tailwindcss/forms` (0.5.11): Provides a cross-browser form element reset. Useful if default browser input styling is inconsistent. In Tailwind v4, add via `@plugin "@tailwindcss/forms"` in index.css. Optional for Phase 2 — plain Tailwind utilities are sufficient.

**Installation:**
```bash
cd gsd-module-test
npm install -D jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Alternatives Considered

| Instead of | Could Use | Why We Don't |
|------------|-----------|-------------|
| `crypto.randomUUID()` | `nanoid` (5.1.6) | Built-in saves a dependency; crypto.randomUUID is 4x faster; UUIDs are fine for this app's list sizes |
| Plain Zustand updates | Zustand + immer | immer adds dependency and cognitive overhead; spread/filter updates are readable at this complexity level |
| React Testing Library | Vitest Browser Mode | RTL + jsdom is the standard tested pattern; browser mode is newer and less documented |
| `@testing-library/user-event` | `fireEvent` from RTL | userEvent simulates real browser behavior (focus, blur, keypress sequence); fireEvent dispatches synthetic events that miss real-world bugs |

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── engine/
│   ├── math.ts            # Phase 1: distribute, dollarsToCents, centsToDollars
│   └── math.test.ts       # Phase 1: 28 passing tests
├── store/
│   ├── billStore.ts       # Single Zustand store: all bill state + actions
│   └── billStore.test.ts  # Unit tests for store actions (node environment)
├── components/
│   ├── PeopleSection.tsx
│   ├── PeopleSection.test.tsx
│   ├── ItemSection.tsx
│   ├── ItemSection.test.tsx
│   ├── AssignSection.tsx
│   ├── AssignSection.test.tsx
│   ├── TipTaxSection.tsx
│   ├── TipTaxSection.test.tsx
│   └── ResultsSection.tsx
│   └── ResultsSection.test.tsx
├── App.tsx                # Composes all sections
├── index.css              # @import "tailwindcss"
└── main.tsx               # Entry point
```

Tests co-located with source. Store tests run in `node` environment (no DOM). Component tests run in `jsdom` environment.

---

### Pattern 1: Zustand Store TypeScript Design

**What:** Single store with explicit TypeScript interfaces, `create<T>()()` curried syntax.
**When to use:** All global state in this phase.

```typescript
// src/store/billStore.ts
// Source: https://zustand.docs.pmnd.rs/guides/beginner-typescript

import { create } from 'zustand'

// --- Data model types ---

export interface Person {
  id: string      // crypto.randomUUID()
  name: string
}

export interface Item {
  id: string      // crypto.randomUUID()
  name: string
  priceCents: number  // integer cents — never decimal
}

// Assignment: discriminated union on mode
export type Assignment =
  | { mode: 'unassigned' }
  | { mode: 'single';    personId: string }
  | { mode: 'equal';     personIds: string[] }
  | { mode: 'everyone' }
  | { mode: 'custom';    portions: { personId: string; weight: number }[] }

export interface ItemAssignment {
  itemId: string
  assignment: Assignment
}

export type TipSplitMode = 'equal' | 'proportional'
export type TaxMode      = 'amount' | 'percent'
export type TaxSplitMode = 'equal' | 'proportional'

// --- Store state + actions ---

interface BillState {
  people:      Person[]
  items:       Item[]
  assignments: ItemAssignment[]

  // Tip
  tipPercent:    number        // e.g. 15 for 15%; 0 = no tip
  tipSplitMode:  TipSplitMode

  // Tax
  taxMode:       TaxMode
  taxValue:      number        // cents (if taxMode==='amount') OR percent (if taxMode==='percent')
  taxSplitMode:  TaxSplitMode

  // --- Actions ---

  // People
  addPerson:    (name: string) => void
  removePerson: (id: string)   => void

  // Items
  addItem:    (name: string, priceCents: number) => void
  updateItem: (id: string, changes: Partial<Pick<Item, 'name' | 'priceCents'>>) => void
  removeItem: (id: string) => void

  // Assignments
  setAssignment: (itemId: string, assignment: Assignment) => void

  // Tip/Tax
  setTipPercent:   (percent: number)    => void
  setTipSplitMode: (mode: TipSplitMode) => void
  setTaxMode:      (mode: TaxMode)      => void
  setTaxValue:     (value: number)      => void
  setTaxSplitMode: (mode: TaxSplitMode) => void
}

export const useBillStore = create<BillState>()((set, get) => ({
  people:      [],
  items:       [],
  assignments: [],
  tipPercent:   0,
  tipSplitMode: 'equal',
  taxMode:      'amount',
  taxValue:     0,
  taxSplitMode: 'equal',

  addPerson: (name) =>
    set((s) => ({
      people: [...s.people, { id: crypto.randomUUID(), name: name.trim() }],
    })),

  removePerson: (id) =>
    set((s) => ({
      people: s.people.filter((p) => p.id !== id),
      // Clean up assignments referencing the removed person
      assignments: s.assignments.map((a) => {
        if (a.assignment.mode === 'single' && a.assignment.personId === id) {
          return { ...a, assignment: { mode: 'unassigned' } }
        }
        if (a.assignment.mode === 'equal') {
          const personIds = a.assignment.personIds.filter((pid) => pid !== id)
          return personIds.length === 0
            ? { ...a, assignment: { mode: 'unassigned' } }
            : { ...a, assignment: { mode: 'equal', personIds } }
        }
        if (a.assignment.mode === 'custom') {
          const portions = a.assignment.portions.filter((p) => p.personId !== id)
          return portions.length === 0
            ? { ...a, assignment: { mode: 'unassigned' } }
            : { ...a, assignment: { mode: 'custom', portions } }
        }
        return a
      }),
    })),

  addItem: (name, priceCents) =>
    set((s) => ({
      items: [...s.items, { id: crypto.randomUUID(), name, priceCents }],
    })),

  updateItem: (id, changes) =>
    set((s) => ({
      items: s.items.map((item) =>
        item.id === id ? { ...item, ...changes } : item
      ),
    })),

  removeItem: (id) =>
    set((s) => ({
      items:       s.items.filter((item) => item.id !== id),
      assignments: s.assignments.filter((a) => a.itemId !== id),
    })),

  setAssignment: (itemId, assignment) =>
    set((s) => {
      const exists = s.assignments.find((a) => a.itemId === itemId)
      return exists
        ? {
            assignments: s.assignments.map((a) =>
              a.itemId === itemId ? { ...a, assignment } : a
            ),
          }
        : { assignments: [...s.assignments, { itemId, assignment }] }
    }),

  setTipPercent:   (percent) => set({ tipPercent: percent }),
  setTipSplitMode: (mode)    => set({ tipSplitMode: mode }),
  setTaxMode:      (mode)    => set({ taxMode: mode }),
  setTaxValue:     (value)   => set({ taxValue: value }),
  setTaxSplitMode: (mode)    => set({ taxSplitMode: mode }),
}))
```

---

### Pattern 2: Derived Computation Function (Calculation Engine Integration)

**What:** A pure TypeScript function (not a hook, not inside the store) that takes raw store state and returns all computed monetary values. This keeps the calculation engine pure and fully unit-testable.
**When to use:** Called from a React hook (`useBillResults`) that subscribes to the store.

```typescript
// src/store/computeResults.ts
// Source: Derived from Phase 1 engine design decisions

import { distribute, centsToDollars } from '../engine/math'
import type { Person, Item, ItemAssignment, TipSplitMode, TaxMode, TaxSplitMode } from './billStore'

export interface PersonResult {
  personId:    string
  name:        string
  subtotalCents: number
  tipCents:    number
  taxCents:    number
  totalCents:  number
}

export interface BillResults {
  subtotalCents:  number
  tipCents:       number
  taxCents:       number
  grandTotalCents: number
  perPerson:      PersonResult[]
  grandTotalCheck: number   // should always be 0: grandTotal - sum(person.total)
}

export function computeResults(
  people: Person[],
  items: Item[],
  assignments: ItemAssignment[],
  tipPercent: number,
  tipSplitMode: TipSplitMode,
  taxMode: TaxMode,
  taxValue: number,
  taxSplitMode: TaxSplitMode,
): BillResults {
  if (people.length === 0) {
    return { subtotalCents: 0, tipCents: 0, taxCents: 0, grandTotalCents: 0, perPerson: [], grandTotalCheck: 0 }
  }

  // 1. Per-person item subtotals
  const personSubtotals = new Map<string, number>(people.map((p) => [p.id, 0]))

  for (const item of items) {
    const asgn = assignments.find((a) => a.itemId === item.id)?.assignment ?? { mode: 'unassigned' }

    if (asgn.mode === 'unassigned') continue

    if (asgn.mode === 'single') {
      const cur = personSubtotals.get(asgn.personId) ?? 0
      personSubtotals.set(asgn.personId, cur + item.priceCents)
    }
    else if (asgn.mode === 'everyone') {
      const shares = distribute(item.priceCents, people.map(() => 1))
      people.forEach((p, i) => {
        personSubtotals.set(p.id, (personSubtotals.get(p.id) ?? 0) + shares[i])
      })
    }
    else if (asgn.mode === 'equal') {
      const recipients = asgn.personIds
      const shares = distribute(item.priceCents, recipients.map(() => 1))
      recipients.forEach((pid, i) => {
        personSubtotals.set(pid, (personSubtotals.get(pid) ?? 0) + shares[i])
      })
    }
    else if (asgn.mode === 'custom') {
      const { portions } = asgn
      const shares = distribute(item.priceCents, portions.map((p) => p.weight))
      portions.forEach(({ personId }, i) => {
        personSubtotals.set(personId, (personSubtotals.get(personId) ?? 0) + shares[i])
      })
    }
  }

  const subtotalCents = Array.from(personSubtotals.values()).reduce((a, b) => a + b, 0)

  // 2. Tip
  const tipCents = Math.round(subtotalCents * tipPercent / 100)
  const tipWeights = tipSplitMode === 'proportional'
    ? people.map((p) => personSubtotals.get(p.id) ?? 0)
    : people.map(() => 1)
  const tipShares = distribute(tipCents, tipWeights.every((w) => w === 0) ? people.map(() => 1) : tipWeights)

  // 3. Tax
  const taxCents = taxMode === 'amount'
    ? taxValue
    : Math.round(subtotalCents * taxValue / 100)
  const taxWeights = taxSplitMode === 'proportional'
    ? people.map((p) => personSubtotals.get(p.id) ?? 0)
    : people.map(() => 1)
  const taxShares = distribute(taxCents, taxWeights.every((w) => w === 0) ? people.map(() => 1) : taxWeights)

  // 4. Per-person results
  const grandTotalCents = subtotalCents + tipCents + taxCents
  const perPerson: PersonResult[] = people.map((p, i) => {
    const sub = personSubtotals.get(p.id) ?? 0
    const tip = tipShares[i]
    const tax = taxShares[i]
    return { personId: p.id, name: p.name, subtotalCents: sub, tipCents: tip, taxCents: tax, totalCents: sub + tip + tax }
  })

  const grandTotalCheck = grandTotalCents - perPerson.reduce((a, r) => a + r.totalCents, 0)

  return { subtotalCents, tipCents, taxCents, grandTotalCents, perPerson, grandTotalCheck }
}
```

---

### Pattern 3: Vitest Configuration for Mixed Environments

**What:** Phase 2 needs two test environments: `node` for store/engine tests, `jsdom` for component tests. Use Vitest's `projects` array (v4 syntax) or per-file directives.

**Recommended approach — per-file directive (simpler for this project size):**

```typescript
// vitest.config.ts — updated from Phase 1
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // default environment stays 'node' (engine + store tests)
    environment: 'node',
    passWithNoTests: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

```typescript
// vitest.setup.ts — NEW file for jest-dom matchers
import '@testing-library/jest-dom/vitest'
```

```typescript
// src/components/PeopleSection.test.tsx — top of file
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
```

**Note:** `globals: true` in vitest.config is optional. If you set it, add `"types": ["vitest/globals"]` to tsconfig.app.json. If not set, import `describe`, `it`, `expect` from `'vitest'` in each test (already the existing pattern from Phase 1).

---

### Pattern 4: Controlled Price Input (String State While Typing)

**What:** Price inputs must accept user text while typing (e.g., "1", "1.", "1.5") but store integer cents. The anti-pattern is parsing on every keystroke (causes cursor jump).

**How to avoid the cursor-jump problem:**
```typescript
// Component keeps string while user types; converts to cents only on blur
const [priceInput, setPriceInput] = useState('')

function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
  // Accept raw string while user is typing
  setPriceInput(e.target.value)
}

function handlePriceBlur() {
  // Convert to cents only when done typing
  const cents = dollarsToCents(priceInput)
  updateItem(itemId, { priceCents: cents })
  // Reformat for display
  setPriceInput(centsToDollars(cents))
}
```

This is local component state — NOT in the Zustand store. Only the final `priceCents` integer lives in the store.

---

### Pattern 5: useId for Accessible Form Labels

**What:** When the same component renders multiple times (one row per item, one row per person), each label needs a unique `htmlFor`/`id` pair. `useId` generates a stable, unique, SSR-safe prefix.

```typescript
import { useId } from 'react'

function PersonRow({ person }: { person: Person }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={`${id}-name`}>Name</label>
      <input id={`${id}-name`} value={person.name} onChange={...} />
    </div>
  )
}
```

Source: https://react.dev/reference/react/useId

---

### Pattern 6: Zustand useShallow for Multi-Value Selectors

**What:** When a component needs multiple values from the store, use `useShallow` to prevent re-renders when other unrelated state changes.

```typescript
import { useShallow } from 'zustand/shallow'
import { useBillStore } from '../store/billStore'

function ItemSection() {
  const { items, addItem, removeItem } = useBillStore(
    useShallow((s) => ({
      items:      s.items,
      addItem:    s.addItem,
      removeItem: s.removeItem,
    }))
  )
  // ...
}
```

Source: https://zustand.docs.pmnd.rs/hooks/use-shallow

---

### Pattern 7: Running Subtotal with aria-live

**What:** ITEM-04 requires real-time subtotal updates. Use `aria-live="polite"` so screen readers announce changes without interrupting the user.

```tsx
{/* Subtotal display — MUST be in DOM before content updates for aria-live to fire */}
<div aria-live="polite" aria-atomic="true">
  <span>Subtotal: ${centsToDollars(subtotalCents)}</span>
</div>
```

The element must be present in the DOM at mount time, not conditionally rendered — otherwise the screen reader loses track of it.

---

### Anti-Patterns to Avoid

- **Storing derived values in the store:** Never store `subtotalCents`, `tipCents`, or `grandTotalCents` in Zustand. Compute them in `computeResults()` called from a hook. Storing derived values creates sync bugs.
- **Using array index as React key for people/items:** Items can be deleted and reordered. Always use `item.id` (the UUID) as the React key.
- **Parsing price on every keystroke:** Leads to cursor-jump bugs. Keep raw string in local state, parse to cents only on blur.
- **Putting calculation logic inside Zustand actions:** Actions manipulate intent data only. `computeResults()` is a pure function called by the UI layer.
- **Re-using the `node` vitest environment for component tests:** Calling `render()` from React Testing Library without jsdom will throw "document is not defined".
- **Forgetting to clean up assignments when removing a person or item:** Stale references cause wrong distributions. `removePerson` must update assignments; `removeItem` must remove the assignment entry.
- **Equal weight when all personSubtotals are zero:** `distribute(tipCents, [0, 0, 0])` will divide by zero (weightSum = 0). Guard: if all weights are zero, fall back to uniform weights. This is handled in Pattern 2's code above.
- **`Math.round` vs `Math.floor` for tip/tax amount:** `Math.round(subtotalCents * tipPercent / 100)` gives the "closest cent" tip amount; then `distribute()` splits it exactly. Do NOT floor the tip amount and distribute — that drops cents.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Integer cent splitting | Custom rounding logic | `distribute()` from Phase 1 engine | Already built, tested with 28 tests; edge cases covered |
| Dollar string parsing | Custom regex | `dollarsToCents()` from Phase 1 engine | Already built; handles $, decimals, etc. |
| Unique IDs for people/items | Incrementing counter, Math.random() | `crypto.randomUUID()` (built-in) | Globally unique, collision-proof, zero dependency |
| DOM testing | Custom render harness | React Testing Library + Vitest | Industry standard; abstracts implementation details |
| Form validation library | Manual validation state | Plain React state + conditional render | RHF adds complexity not justified for this app's form complexity |
| Component library | Custom design system | Plain Tailwind utility classes | Tailwind v4 is already installed; custom components are simpler and more flexible |

**Key insight:** The biggest "don't hand-roll" is the calculation engine — it's already done. The entire Phase 2 logic layer is a thin data model + a call to `computeResults()`.

---

## Common Pitfalls

### Pitfall 1: vitest.config.ts Does Not Include React Plugin

**What goes wrong:** When the vitest config is separate from vite.config.ts (as it is in this project), the React plugin must be re-added to `vitest.config.ts` or component rendering will fail with "React is not defined".

**Why it happens:** Vitest uses its own plugin pipeline, separate from vite.config.ts. The current vitest.config.ts only has `environment: 'node'` — no React plugin.

**How to avoid:** When adding jsdom component tests, update vitest.config.ts to include the React plugin:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: { ... }
})
```

**Warning signs:** "React is not defined" error in component tests despite correct imports.

---

### Pitfall 2: @testing-library/jest-dom Import Path

**What goes wrong:** Using the wrong import in vitest.setup.ts causes matchers like `toBeInTheDocument()` to be undefined.

**Why it happens:** jest-dom has two entry points: the legacy `@testing-library/jest-dom` (for Jest) and the Vitest-specific `@testing-library/jest-dom/vitest`.

**How to avoid:** Always import the Vitest entry:
```typescript
// vitest.setup.ts
import '@testing-library/jest-dom/vitest'
```
And reference the setup file in vitest.config.ts:
```typescript
test: { setupFiles: ['./vitest.setup.ts'] }
```

**Warning signs:** `expect(...).toBeInTheDocument is not a function` at runtime.

---

### Pitfall 3: Tailwind v4 @plugin Directive for Forms Plugin

**What goes wrong:** Following Tailwind v3 docs and adding `plugins: [require('@tailwindcss/forms')]` in a non-existent `tailwind.config.js` — no effect in v4.

**Why it happens:** Tailwind v4 deprecated the JavaScript config file. Plugins are loaded via CSS.

**How to avoid:** If `@tailwindcss/forms` is needed, add to `src/index.css`:
```css
@import "tailwindcss";
@plugin "@tailwindcss/forms";
```
And install: `npm install -D @tailwindcss/forms`

**Warning signs:** Form element browser default styles not reset; styles inconsistent across browsers.

---

### Pitfall 4: Assignment Cascading on Remove

**What goes wrong:** Deleting a person leaves stale `personId` references inside `equal` and `custom` assignments, causing `distribute()` to be called with IDs that no longer exist in `people`.

**Why it happens:** The data model links items to people via IDs. Removing a person does not automatically update item assignments.

**How to avoid:** The `removePerson` action must update `assignments`:
- `single`: if personId matches removed → set to `unassigned`
- `equal`: filter personIds, if now empty → set to `unassigned`
- `custom`: filter portions, if now empty → set to `unassigned`

See Pattern 1 code above for the full implementation.

**Warning signs:** `computeResults` receiving personIds not in the `people` array; distribute called with empty weights.

---

### Pitfall 5: Proportional Tip/Tax with All-Zero Subtotals

**What goes wrong:** If no items are assigned, all person subtotals are 0. When `tipSplitMode === 'proportional'`, the weights array is all zeros. Calling `distribute(tipCents, [0, 0, 0])` produces `weightSum === 0`, which causes a divide-by-zero — resulting in `NaN` or `Infinity`.

**Why it happens:** The distribute function divides each weight by weightSum. If weightSum is 0, this produces NaN.

**How to avoid:** Guard in `computeResults`: if all proportional weights are zero, fall back to equal weights:
```typescript
const tipWeights = tipSplitMode === 'proportional'
  ? people.map((p) => personSubtotals.get(p.id) ?? 0)
  : people.map(() => 1)

// Guard: if all weights zero, use equal distribution
const safeWeights = tipWeights.every((w) => w === 0) ? people.map(() => 1) : tipWeights
const tipShares = distribute(tipCents, safeWeights)
```

**Warning signs:** NaN appearing in results display; console errors about NaN arithmetic.

---

### Pitfall 6: Unassigned Items Silently Lost From Grand Total

**What goes wrong:** Items with `mode: 'unassigned'` are excluded from all person subtotals, so the grand total displayed in results does NOT include them. This appears as a verification failure (per-person totals don't match the bill total).

**Why it happens:** The app allows items to exist before they're assigned. During intermediate entry, this is expected. But if the user never assigns an item, the results will show incorrect totals.

**How to avoid:** Track unassigned item cents separately in `computeResults` and display a clear warning: "X items unassigned — $Y not included in totals." Do not silently add them to grand total (that would create an incorrect result). The verification check (RESULT-02) should also surface this.

**Warning signs:** User complains the totals don't match the receipt amount.

---

## Code Examples

### Store Test (node environment — no jsdom)

```typescript
// src/store/billStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useBillStore } from './billStore'

describe('billStore - addPerson', () => {
  beforeEach(() => {
    // Reset store between tests
    useBillStore.setState({
      people: [], items: [], assignments: [],
      tipPercent: 0, tipSplitMode: 'equal',
      taxMode: 'amount', taxValue: 0, taxSplitMode: 'equal',
    })
  })

  it('adds a person with a unique id', () => {
    useBillStore.getState().addPerson('Alice')
    const { people } = useBillStore.getState()
    expect(people).toHaveLength(1)
    expect(people[0].name).toBe('Alice')
    expect(people[0].id).toBeTruthy()
  })

  it('cleans up single-mode assignment when person is removed', () => {
    useBillStore.getState().addPerson('Alice')
    const { people } = useBillStore.getState()
    useBillStore.getState().addItem('Burger', 1200)
    const { items } = useBillStore.getState()
    useBillStore.getState().setAssignment(items[0].id, { mode: 'single', personId: people[0].id })
    useBillStore.getState().removePerson(people[0].id)
    const { assignments } = useBillStore.getState()
    expect(assignments.find((a) => a.itemId === items[0].id)?.assignment.mode).toBe('unassigned')
  })
})
```

### Component Test (jsdom environment)

```typescript
// src/components/PeopleSection.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useBillStore } from '../store/billStore'
import { PeopleSection } from './PeopleSection'

describe('PeopleSection', () => {
  beforeEach(() => {
    useBillStore.setState({ people: [] })
  })

  it('adds a person when the form is submitted', async () => {
    render(<PeopleSection />)
    await userEvent.type(screen.getByRole('textbox', { name: /name/i }), 'Alice')
    await userEvent.click(screen.getByRole('button', { name: /add/i }))
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('shows a duplicate warning when the same name is entered', async () => {
    useBillStore.setState({ people: [{ id: 'x', name: 'Alice' }] })
    render(<PeopleSection />)
    await userEvent.type(screen.getByRole('textbox', { name: /name/i }), 'Alice')
    expect(screen.getByText(/duplicate/i)).toBeInTheDocument()
  })
})
```

### computeResults Unit Test (node environment)

```typescript
// src/store/computeResults.test.ts
import { describe, it, expect } from 'vitest'
import { computeResults } from './computeResults'

describe('computeResults - basic split', () => {
  it('splits one item between two people equally', () => {
    const people = [
      { id: 'a', name: 'Alice' },
      { id: 'b', name: 'Bob' },
    ]
    const items = [{ id: 'i1', name: 'Pizza', priceCents: 1000 }]
    const assignments = [{ itemId: 'i1', assignment: { mode: 'equal' as const, personIds: ['a', 'b'] } }]
    const result = computeResults(people, items, assignments, 0, 'equal', 'amount', 0, 'equal')
    expect(result.grandTotalCheck).toBe(0)
    expect(result.perPerson[0].subtotalCents + result.perPerson[1].subtotalCents).toBe(1000)
  })
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Zustand `create()` without generic (JS) | `create<T>()()` curried form (TS) | Zustand v5 (late 2024) | Required for correct TypeScript inference; double-parens not optional |
| `shallow` from `zustand/shallow` (v4) | `useShallow` hook from `zustand/shallow` (v5) | Zustand v5 | Must use `useShallow` hook, not bare `shallow` function |
| `@tailwind base/components/utilities` directives | `@import "tailwindcss"` | Tailwind v4 (2025) | Old directives are not valid in v4 |
| tailwind.config.js plugins array | `@plugin` directive in CSS | Tailwind v4 (2025) | No JS config file; plugins loaded from CSS |
| jsdom as sole test environment | Per-file `@vitest-environment` directive | Vitest 1+ (mature) | Engine tests stay in node; component tests opt into jsdom |
| `fireEvent` from RTL | `userEvent` from `@testing-library/user-event` | RTL v14+ | userEvent is now the recommended approach; fireEvent is for edge cases |
| Math.random() for IDs | `crypto.randomUUID()` | Node 19+, all modern browsers | Built-in; no dependency; UUID v4 standard |

**Deprecated/outdated:**
- `useBearStore(state => [state.a, state.b])` (without useShallow): Causes re-renders on every state change since the returned array is a new reference each time. Use `useShallow` instead.
- `shallow` import from `zustand/react/shallow`: In Zustand v5 the path changed to `zustand/shallow`.
- `@testing-library/react` < v16: v16+ requires `@testing-library/dom` as a peer dep; the npm install command above installs both.

---

## Open Questions

1. **PEOPLE-04: Deferred or stub?**
   - What we know: Quick-add names from previous splits requires reading from localStorage. The localStorage layer (PERSIST-01) is Phase 4 work.
   - What's unclear: Does the planner want a visible-but-disabled UI element as a placeholder, or should PEOPLE-04 be completely omitted and added in Phase 4?
   - Recommendation: Explicitly omit PEOPLE-04 from Phase 2 and document the dependency on Phase 4 in the plan. Do not add stub UI — that creates dead UI the user has to explain to testers. The Phase 4 plan can add the feature when the dependency exists.

2. **Single store vs. slices?**
   - What we know: The store has 5 logical domains (people, items, assignments, tip/tax, results). Slices would separate these. However, `removePerson` needs to update assignments — cross-slice coordination requires either a bound store or explicit imports.
   - What's unclear: At this project's scale, is slices complexity justified?
   - Recommendation: Use a single store (Pattern 1 above). The app is small enough that one store is readable. Move to slices only if the store exceeds ~300 lines or if cross-domain actions become hard to reason about.

3. **Inline edit vs. modal for item editing (ITEM-02)?**
   - What we know: "Edit an existing item's name or price" can be implemented as (a) inline editable fields in the item row, or (b) a modal/drawer triggered by an Edit button.
   - What's unclear: No user design decision was captured (no CONTEXT.md).
   - Recommendation: Use inline edit (click cell to edit, blur/enter to save). It's simpler to implement, requires no modal state, and works well in a list layout. The price-input anti-pattern (Pattern 4) applies here.

4. **Assignment UX for custom portions (ASSIGN-03)?**
   - What we know: Custom portions allow different weights per person. The weight could be a dollar amount (person owes $X of item), a percentage (person owes Y%), or an arbitrary ratio.
   - What's unclear: Which weight representation is most intuitive for the user?
   - Recommendation: Use dollar amounts as weights. The user is already thinking in dollars. Internally, `dollarsToCents` converts the entered dollar weight to a cent integer, and `distribute(item.priceCents, weightsCents)` computes the share. This is the most natural mapping.

---

## Sources

### Primary (HIGH confidence)

- npm registry (`npm view <pkg> version`) — confirmed current versions: @testing-library/react (16.3.2), @testing-library/jest-dom (6.9.1), @testing-library/user-event (14.6.1), jsdom (28.1.0), immer (11.1.4), nanoid (5.1.6), @tailwindcss/forms (0.5.11)
- Phase 1 RESEARCH.md, VERIFICATION.md — confirmed existing stack, engine implementation, vitest config, vite config
- https://react.dev/reference/react/useId — useId hook for stable unique IDs in repeated components
- https://zustand.docs.pmnd.rs/guides/beginner-typescript — `create<T>()()` curried syntax requirement
- https://zustand.docs.pmnd.rs/hooks/use-shallow — `useShallow` import from `zustand/shallow` (v5)

### Secondary (MEDIUM confidence)

- https://zustand.docs.pmnd.rs/guides/slices-pattern — Slices pattern documentation; verified as real but not consulted directly due to fetch error
- https://testing-library.com/docs/react-testing-library/setup/ — RTL setup; jsdom + setupFiles pattern verified via WebSearch cross-reference
- https://tailwindcss.com/blog/tailwindcss-v4 — @plugin directive for CSS-based plugin loading
- WebSearch results for Vitest 4 + jsdom setup (multiple sources consistent on the setupFiles + jest-dom/vitest pattern)

### Tertiary (LOW confidence — flag for validation)

- WebSearch results on Tailwind v4 @tailwindcss/forms compatibility — confirmed by GitHub discussion reference but forms plugin docs page not directly fetched
- WebSearch result claiming `crypto.randomUUID` is 4x faster than nanoid — cited without authoritative benchmark source

---

## Metadata

**Confidence breakdown:**
- Standard stack (new deps): HIGH — all versions verified via npm view
- Architecture (data model types): HIGH — derived directly from requirements + Phase 1 patterns
- Calculation integration: HIGH — uses already-proven Phase 1 engine
- Vitest jsdom setup: HIGH — consistent across multiple WebSearch sources, matches official RTL docs
- Tailwind v4 forms plugin: MEDIUM — @plugin directive confirmed by multiple sources but official tailwindcss.com forms plugin page not directly fetched
- Assignment UX (ASSIGN-03 weight representation): LOW — recommendation based on judgment, no user research

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (stable ecosystem; library APIs unlikely to change; review Zustand 5 migration guide if upgrading past 5.x)
