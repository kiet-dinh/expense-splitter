# Phase 4: Persistence - Research

**Researched:** 2026-02-17
**Domain:** Zustand persist middleware, localStorage schema design, bill history UI, PEOPLE-04 quick-add
**Confidence:** HIGH (Zustand persist API verified via official docs and DeepWiki; localStorage behavior verified via MDN; pitfalls cross-referenced from multiple authoritative sources)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERSIST-01 | User can save a completed split to browser local storage | Zustand persist middleware with a separate `useHistoryStore`; save action snapshots BillState + savedAt timestamp + user-chosen name |
| PERSIST-02 | User can view a list of previously saved splits | History store exposes a `savedSplits` array; `HistorySection` component renders the list; tapping an entry loads it into `useBillStore` |
| PERSIST-03 | User can delete a saved split | `deleteSplit(id)` action on history store filters out the entry and persists the result immediately |
| PEOPLE-04 | User can quick-add names from previous splits (deferred from Phase 2) | Extract unique names from `savedSplits[].people`; display as clickable suggestions in `PeopleSection` |
</phase_requirements>

---

## Summary

Phase 4 adds persistence using only the browser's `localStorage` API — no backend, no new npm packages required. The Zustand `persist` middleware (bundled inside `zustand/middleware`) wraps a dedicated second store (`useHistoryStore`) that holds an array of saved bill snapshots. The existing `useBillStore` is deliberately NOT wrapped with persist: only explicitly saved splits persist, so the app always starts fresh. This avoids the complexity of merging live UI state from storage and keeps the save/load flow intentional.

The data schema is straightforward: each saved split is a snapshot of `BillState` data fields (people, items, assignments, tip/tax settings) plus metadata (id, name, savedAt). Integer cents serialize naturally to JSON numbers without precision loss — all values are well within `Number.MAX_SAFE_INTEGER`. Schema versioning via the `version` + `migrate` persist options guards against future field additions breaking stored data. Starting at version 1 and incrementing on any breaking change is the standard pattern.

The history UI can be implemented as a new section in `App.tsx` or as a collapsible panel. The key patterns are: render the saved list from `useHistoryStore`, provide a "Save this split" button in `ResultsSection` that prompts for a name, load by calling `useBillStore.setState(snapshot.billData)`, and delete by filtering the array. PEOPLE-04 (quick-add names) is a small enhancement to `PeopleSection` that reads distinct names from history and shows them as suggestion chips.

**Primary recommendation:** Use Zustand `persist` middleware on a new `useHistoryStore` with a unique key `'bill-splitter-history'`. Keep `useBillStore` ephemeral. Wrap all `localStorage.setItem` paths in try/catch to handle `QuotaExceededError` gracefully.

---

## Standard Stack

### Core (no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand/middleware (`persist`) | 5.0.11 (bundled) | Persist store to localStorage | Already installed; built-in to Zustand 5; no extra dependency |
| zustand/middleware (`createJSONStorage`) | 5.0.11 (bundled) | Create localStorage-backed storage object | Official Zustand helper; avoids raw localStorage access |
| localStorage (browser API) | N/A | Storage backend | No install; synchronous; ideal for this data size |

### Supporting (no new packages needed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| crypto.randomUUID() | Browser API | Generate unique IDs for saved splits | Already used in `billStore.ts` for people/items |
| @testing-library/react | 16.3.2 (already installed) | Component tests for HistorySection | Same pattern as existing component tests |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zustand persist middleware | Manual localStorage hooks (`useEffect`) | Middleware handles hydration, merge, versioning, and storage failures automatically. Manual hooks require re-implementing all that. Use the middleware. |
| localStorage | IndexedDB | IndexedDB handles larger data and async access. For bill history (small JSON, sync reads), localStorage is simpler and sufficient. Only switch if hitting the 5-10MB quota. |
| Single store with `partialize` | Separate history store | A single store with partialize is possible but risks accidentally persisting stale UI state. Separate stores isolate concerns cleanly. |

**Installation:** No new packages. Everything needed is in `zustand@5.0.11` already installed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── store/
│   ├── billStore.ts          # EXISTING — ephemeral, NOT persisted
│   ├── historyStore.ts       # NEW — persisted via Zustand persist middleware
│   ├── computeResults.ts     # EXISTING
│   └── computeResults.test.ts
├── components/
│   ├── PeopleSection.tsx     # MODIFY — add PEOPLE-04 quick-add suggestions
│   ├── ResultsSection.tsx    # MODIFY — add "Save this split" button
│   ├── HistorySection.tsx    # NEW — list of saved splits with load/delete
│   └── HistorySection.test.tsx # NEW
└── App.tsx                   # MODIFY — mount HistorySection
```

### Pattern 1: Separate History Store with Persist Middleware

**What:** A second Zustand store holds `savedSplits: SavedSplit[]` and is wrapped with `persist`. The main `useBillStore` remains ephemeral.

**When to use:** Whenever you want only explicitly user-triggered saves — not automatic live-state persistence.

**Example:**
```typescript
// Source: https://zustand.docs.pmnd.rs/middlewares/persist
// Source: https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Person, Item, ItemAssignment, TipSplitMode, TaxMode, TaxSplitMode } from './billStore'

export interface SavedSplit {
  id: string            // crypto.randomUUID()
  name: string          // user-chosen label, e.g. "Friday dinner"
  savedAt: string       // ISO 8601 timestamp, e.g. new Date().toISOString()
  schemaVersion: number // always 1 for Phase 4 saves
  people: Person[]
  items: Item[]
  assignments: ItemAssignment[]
  tipPercent: number
  tipSplitMode: TipSplitMode
  taxMode: TaxMode
  taxValue: number
  taxSplitMode: TaxSplitMode
}

interface HistoryState {
  savedSplits: SavedSplit[]
  saveSplit:   (split: Omit<SavedSplit, 'id' | 'savedAt' | 'schemaVersion'>) => void
  deleteSplit: (id: string) => void
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      savedSplits: [],

      saveSplit: (data) =>
        set((s) => ({
          savedSplits: [
            {
              id: crypto.randomUUID(),
              savedAt: new Date().toISOString(),
              schemaVersion: 1,
              ...data,
            },
            ...s.savedSplits,  // newest first
          ],
        })),

      deleteSplit: (id) =>
        set((s) => ({
          savedSplits: s.savedSplits.filter((split) => split.id !== id),
        })),
    }),
    {
      name: 'bill-splitter-history',          // unique localStorage key
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState, version) => {
        // Future migrations go here when version increments
        // Example: if (version === 0) { ... rename fields ... }
        return persistedState as HistoryState
      },
    }
  )
)
```

### Pattern 2: Save Current Bill into History

**What:** The "Save this split" action extracts the data-only fields from `useBillStore` and calls `useHistoryStore.getState().saveSplit(...)`.

**When to use:** User clicks "Save" button (after naming the split).

**Example:**
```typescript
// Source: pattern derived from Zustand docs — getState() for non-reactive reads
// https://zustand.docs.pmnd.rs/guides/flux-inspired-practice

function handleSave(name: string) {
  const s = useBillStore.getState()
  try {
    useHistoryStore.getState().saveSplit({
      name,
      people: s.people,
      items: s.items,
      assignments: s.assignments,
      tipPercent: s.tipPercent,
      tipSplitMode: s.tipSplitMode,
      taxMode: s.taxMode,
      taxValue: s.taxValue,
      taxSplitMode: s.taxSplitMode,
    })
  } catch (err) {
    // QuotaExceededError: notify user
    console.error('Could not save: storage quota exceeded', err)
  }
}
```

### Pattern 3: Load a Saved Split into the Current Bill

**What:** Calling `useBillStore.setState(savedSplit)` overwrites the bill with the snapshot's data, restoring it for viewing.

**When to use:** User taps a saved split in the history list.

**Example:**
```typescript
// Source: Zustand setState docs — https://zustand.docs.pmnd.rs/guides/flux-inspired-practice
function handleLoad(split: SavedSplit) {
  useBillStore.setState({
    people:      split.people,
    items:       split.items,
    assignments: split.assignments,
    tipPercent:  split.tipPercent,
    tipSplitMode: split.tipSplitMode,
    taxMode:     split.taxMode,
    taxValue:    split.taxValue,
    taxSplitMode: split.taxSplitMode,
  })
  // Optionally scroll to top or switch to the "current bill" view
}
```

### Pattern 4: Partialize — What to Persist vs. Exclude

**What:** `partialize` selects only data fields for storage. Functions (actions) are not serializable and must be excluded.

**When to use:** Always with persist middleware when the store interface includes action functions.

```typescript
// Source: https://zustand.docs.pmnd.rs/middlewares/persist
{
  partialize: (state) => ({ savedSplits: state.savedSplits }),
}
```

Note: In Pattern 1 above, `HistoryState` only exposes `savedSplits` as data (actions are functions), so `partialize` explicitly excludes the action functions. This is safe — functions are re-created on every store instantiation.

### Pattern 5: Schema Versioning and Migration

**What:** Increment `version` when adding or renaming fields in `SavedSplit`. The `migrate` function transforms old stored data to the new shape.

**When to use:** Any time the `SavedSplit` interface changes in a breaking way.

```typescript
// Source: https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md
version: 2,
migrate: (persistedState: unknown, version: number) => {
  const state = persistedState as { savedSplits: unknown[] }
  if (version === 1) {
    // Example: rename 'tipPercent' to 'gratuityPercent'
    state.savedSplits = (state.savedSplits as SavedSplit[]).map((s) => ({
      ...s,
      // gratuityPercent: s.tipPercent,  // hypothetical rename
    }))
  }
  return state as HistoryState
},
```

### Pattern 6: Testing localStorage with Vitest jsdom

**What:** Component tests that use the history store need `localStorage` available. jsdom provides it. Reset between tests by calling `localStorage.clear()` in `beforeEach`.

**When to use:** All `HistorySection.test.tsx` tests.

```typescript
// Source: https://runthatline.com/vitest-mock-localstorage/
// Pattern also consistent with existing PeopleSection.test.tsx (// @vitest-environment jsdom)

// @vitest-environment jsdom
import { beforeEach, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { useHistoryStore } from '../store/historyStore'

beforeEach(() => {
  localStorage.clear()
  useHistoryStore.setState({ savedSplits: [] })
})

afterEach(() => {
  cleanup()
})
```

**Node 24 note:** This project runs Node 24.13.0. The Node v25 Web Storage API conflict (which breaks jsdom localStorage) is NOT present in Node 24. No workaround needed.

### Pattern 7: PEOPLE-04 Quick-Add from History

**What:** Extract all unique names from `savedSplits[*].people`, display as suggestion chips in `PeopleSection`. Clicking a chip calls `addPerson(name)`.

**When to use:** When `savedSplits.length > 0` and the name is not already in the current bill's `people`.

```typescript
// Pattern: derive suggestion list from history store
const { savedSplits } = useHistoryStore(useShallow((s) => ({ savedSplits: s.savedSplits })))
const { people, addPerson } = useBillStore(useShallow((s) => ({ people: s.people, addPerson: s.addPerson })))

const currentNames = new Set(people.map((p) => p.name.toLowerCase()))

const suggestions = Array.from(
  new Set(
    savedSplits.flatMap((split) => split.people.map((p) => p.name))
  )
).filter((name) => !currentNames.has(name.toLowerCase()))
```

### Anti-Patterns to Avoid

- **Persisting `useBillStore` directly:** Leads to stale state being automatically loaded on every page refresh. Only `useHistoryStore` should be persisted.
- **Storing computed results (`BillResults`) in the snapshot:** `computeResults` is a pure function — always recompute from intent data. Storing results wastes space and risks stale values.
- **Using the same `name` key for both stores:** Each persisted store must have a globally unique `name`. Use `'bill-splitter-history'` for history; if `useBillStore` were ever persisted it would need a different key.
- **Calling `localStorage.setItem` directly instead of through persist:** Bypasses version tracking and merge logic. Always use the store's actions.
- **Not excluding functions from `partialize`:** Functions cannot be JSON-serialized. Always use `partialize: (state) => ({ savedSplits: state.savedSplits })` to exclude action methods.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| localStorage read/write/parse | Custom `useLocalStorage` hook | Zustand `persist` middleware | Handles hydration timing, error boundaries, versioning, merge logic automatically |
| Schema migration | Custom migration runner | `persist` `version` + `migrate` options | Built in; runs automatically on version mismatch; zero boilerplate |
| Storage quota check | `navigator.storage.estimate()` loop | try/catch around `saveSplit()` | QuotaExceededError fires synchronously on setItem; catching is sufficient |
| Name deduplication for PEOPLE-04 | Complex fuzzy matching | Exact case-insensitive Set comparison | Bill splitter names are short and intentional; exact match is correct behavior |

**Key insight:** The persist middleware is purpose-built for this exact use case. It handles the entire localStorage lifecycle. The only hand-rolled code needed is the schema definition and the UI that calls `saveSplit` / `deleteSplit` / `setState`.

---

## Common Pitfalls

### Pitfall 1: Shallow Merge on Rehydration Overwrites Array State

**What goes wrong:** Zustand persist's default `merge` is a shallow merge: `{ ...currentState, ...persistedState }`. For the `savedSplits` array this is fine (the whole array is replaced). But if a future version adds a nested object to `HistoryState`, the merge may not deep-merge it.

**Why it happens:** `{ ...currentState, ...persistedState }` replaces top-level keys entirely, so any new keys added to `HistoryState` that aren't in old persisted data will get their default values from `currentState`. This is actually correct behavior for this schema.

**How to avoid:** The `savedSplits: SavedSplit[]` array is a single top-level key. No deep merge is needed. If nested state is ever added, revisit with a custom `merge` function.

**Warning signs:** Unexpected undefined values on new fields after a version upgrade without a migration.

### Pitfall 2: QuotaExceededError Is Silently Swallowed

**What goes wrong:** If `localStorage` is full and `setItem` throws `QuotaExceededError`, the Zustand persist middleware may not surface this error visibly to the user.

**Why it happens:** The persist middleware calls `storage.setItem` in its `setState` subscriber. Errors thrown there are caught internally or may bubble up as unhandled promise rejections.

**How to avoid:** Wrap the `saveSplit()` call site in a try/catch. Display a toast or alert if saving fails. Optionally limit `savedSplits` to a maximum count (e.g., 50) to prevent quota issues entirely.

```typescript
try {
  useHistoryStore.getState().saveSplit({ name, ...billData })
} catch (err) {
  // Show error message to user
  alert('Unable to save: browser storage is full.')
}
```

**Warning signs:** User reports "my saved split is gone" — likely a failed write that appeared successful.

### Pitfall 3: Loading a Saved Split Overwrites the Current Unsaved Bill

**What goes wrong:** User has an in-progress bill, accidentally taps "Load" on a history entry, and loses their work.

**Why it happens:** `useBillStore.setState(snapshot)` replaces all fields immediately.

**How to avoid:** If the current bill has any people or items, show a confirmation dialog ("Loading this split will replace your current bill. Continue?") before calling `setState`.

**Warning signs:** User complaint about losing in-progress data.

### Pitfall 4: Schema Version Mismatch on Old Browser Data

**What goes wrong:** A user has data saved at schema version 1. After a code deploy that increments to version 2 without a migrate function, the persist middleware discards the old data rather than migrating it.

**Why it happens:** When `version` in `PersistOptions` doesn't match the stored version AND no `migrate` function is provided (or `migrate` returns undefined), Zustand discards the stored state and starts fresh.

**How to avoid:** ALWAYS increment `version` AND write a corresponding `migrate` function together. Never skip the migrate function when bumping the version.

**Warning signs:** After a deploy, users report their history is empty.

### Pitfall 5: Functions Serialized into Storage (TypeScript Type Error)

**What goes wrong:** Forgetting `partialize` causes action functions to be included in the serialization attempt. JSON.stringify converts functions to `undefined`, silently dropping them from the stored object.

**Why it happens:** `JSON.stringify` silently drops function-valued properties. On rehydration, the actions are missing from the parsed object, but Zustand re-creates them from the initializer, so the behavior is usually still correct — but the stored JSON is bloated with `undefined`-mapped keys.

**How to avoid:** Always use `partialize: (state) => ({ savedSplits: state.savedSplits })`.

**Warning signs:** localStorage entry contains unexpected `null` or missing fields.

### Pitfall 6: Stale History Store State in Tests

**What goes wrong:** Tests that use `useHistoryStore` share state across test runs because Zustand stores are module-level singletons.

**Why it happens:** Unlike ephemeral React state, Zustand store state persists across test file reruns unless explicitly reset.

**How to avoid:** In `beforeEach`, call both `localStorage.clear()` AND `useHistoryStore.setState({ savedSplits: [] })`. The same pattern already used for `useBillStore` in existing tests applies here.

**Warning signs:** Tests pass in isolation but fail in sequence because previous test's history bleeds through.

---

## Code Examples

Verified patterns from official sources:

### Full HistoryStore Definition

```typescript
// Source: https://zustand.docs.pmnd.rs/middlewares/persist
// Source: https://deepwiki.com/pmndrs/zustand/3.1-persist-middleware

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Person, Item, ItemAssignment, TipSplitMode, TaxMode, TaxSplitMode } from './billStore'

export const CURRENT_SCHEMA_VERSION = 1

export interface SavedSplit {
  id: string
  name: string
  savedAt: string       // ISO 8601
  schemaVersion: number
  people: Person[]
  items: Item[]
  assignments: ItemAssignment[]
  tipPercent: number
  tipSplitMode: TipSplitMode
  taxMode: TaxMode
  taxValue: number
  taxSplitMode: TaxSplitMode
}

interface HistoryState {
  savedSplits: SavedSplit[]
  saveSplit:   (data: Omit<SavedSplit, 'id' | 'savedAt' | 'schemaVersion'>) => void
  deleteSplit: (id: string) => void
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      savedSplits: [],

      saveSplit: (data) =>
        set((s) => ({
          savedSplits: [
            {
              id: crypto.randomUUID(),
              savedAt: new Date().toISOString(),
              schemaVersion: CURRENT_SCHEMA_VERSION,
              ...data,
            },
            ...s.savedSplits,
          ],
        })),

      deleteSplit: (id) =>
        set((s) => ({
          savedSplits: s.savedSplits.filter((split) => split.id !== id),
        })),
    }),
    {
      name: 'bill-splitter-history',
      storage: createJSONStorage(() => localStorage),
      version: CURRENT_SCHEMA_VERSION,
      partialize: (state) => ({ savedSplits: state.savedSplits }),
      migrate: (persistedState, _version) => {
        // v1 → future: add migrations here as schemaVersion increments
        return persistedState as HistoryState
      },
    }
  )
)
```

### HistorySection Component (Structural Pattern)

```typescript
// @vitest-environment jsdom
// Pattern: list + load + delete, consistent with existing section components

import { useShallow } from 'zustand/shallow'
import { useHistoryStore } from '../store/historyStore'
import { useBillStore } from '../store/billStore'
import type { SavedSplit } from '../store/historyStore'

export function HistorySection() {
  const { savedSplits, deleteSplit } = useHistoryStore(
    useShallow((s) => ({ savedSplits: s.savedSplits, deleteSplit: s.deleteSplit }))
  )

  function handleLoad(split: SavedSplit) {
    // Optionally: confirm if current bill has data
    useBillStore.setState({
      people:      split.people,
      items:       split.items,
      assignments: split.assignments,
      tipPercent:  split.tipPercent,
      tipSplitMode: split.tipSplitMode,
      taxMode:     split.taxMode,
      taxValue:    split.taxValue,
      taxSplitMode: split.taxSplitMode,
    })
  }

  if (savedSplits.length === 0) {
    return (
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">History</h2>
        <p className="text-sm text-gray-500">No saved splits yet</p>
      </section>
    )
  }

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">History</h2>
      <ul className="space-y-2">
        {savedSplits.map((split) => (
          <li key={split.id} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
            <div>
              <span className="text-sm font-medium text-gray-900">{split.name}</span>
              <span className="ml-2 text-xs text-gray-500">
                {new Date(split.savedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleLoad(split)} className="text-sm text-blue-600 hover:text-blue-700">
                Load
              </button>
              <button onClick={() => deleteSplit(split.id)} className="text-sm text-red-600 hover:text-red-700">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

### Save Button in ResultsSection

```typescript
// Minimal save flow: prompt for name, call saveSplit
const [showSaveDialog, setShowSaveDialog] = useState(false)
const [saveName, setSaveName] = useState('')
const { saveSplit } = useHistoryStore(useShallow((s) => ({ saveSplit: s.saveSplit })))

function handleSave() {
  const name = saveName.trim()
  if (!name) return
  const s = useBillStore.getState()
  try {
    saveSplit({
      name,
      people: s.people,
      items: s.items,
      assignments: s.assignments,
      tipPercent: s.tipPercent,
      tipSplitMode: s.tipSplitMode,
      taxMode: s.taxMode,
      taxValue: s.taxValue,
      taxSplitMode: s.taxSplitMode,
    })
    setSaveName('')
    setShowSaveDialog(false)
  } catch {
    alert('Could not save: browser storage is full.')
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `localStorage.getItem/setItem` in `useEffect` | Zustand `persist` middleware | Zustand 3+ (stable in v5) | No manual serialization, hydration, or version management code needed |
| Storing computed results alongside intent data | Store only intent data; recompute on load | Architecture decision (Phase 1) | Smaller stored payload; no stale computation values |
| IndexedDB for any local persistence | localStorage for small datasets | Modern default for small JSON | localStorage is synchronous (simpler code); sufficient for bill history |
| Race condition in hydration (Zustand v5.0.9) | Fixed in v5.0.10+ | January 2026 | No workaround needed; project uses 5.0.11 |

**Deprecated/outdated:**
- `zustand-persist` (npm package): Superseded by the official `zustand/middleware` `persist` export. Do not install the separate package.
- Storing full `BillResults` in history: Recomputable from intent data; increases storage size unnecessarily.

---

## Open Questions

1. **Should "Load" replace the current bill silently or show a confirmation?**
   - What we know: Loading calls `useBillStore.setState()` which immediately replaces all fields. If the user has unsaved work, it's lost.
   - What's unclear: UX preference — whether a confirmation dialog is required for success criteria.
   - Recommendation: Check if current bill has people or items; if yes, show a simple browser `confirm()` dialog. This satisfies accessibility without requiring a custom modal component.

2. **Should saved splits be capped at a maximum count?**
   - What we know: localStorage quota is ~5-10MB depending on browser. A single bill snapshot with 10 people and 20 items is roughly 2-5KB of JSON. 100 saves = ~500KB, well within quota.
   - What's unclear: Whether a cap is needed for this use case.
   - Recommendation: No cap required. The storage size for realistic use is negligible. If QuotaExceededError occurs (only possible after hundreds of saves), surface it to the user and let them delete old entries.

3. **Should PEOPLE-04 suggestions appear as a dropdown or inline chips?**
   - What we know: PeopleSection already has an `<input>` field. Suggestions could appear as a dropdown below the input or as chips/buttons above it.
   - What's unclear: UX preference not specified in requirements.
   - Recommendation: Inline chips below the input (similar to tag suggestions) are the simplest implementation. Only show when `suggestions.length > 0`. Each chip calls `addPerson(name)` directly.

4. **What happens to savedSplits that reference person UUIDs no longer in the current bill?**
   - What we know: When loading a split, `useBillStore.setState()` replaces `people` entirely, so the restored UUIDs will match the restored assignments.
   - What's unclear: No issue with saved data integrity — the snapshot is self-contained.
   - Recommendation: This is a non-issue. Each snapshot is a complete self-referential blob. No foreign key resolution needed.

---

## Sources

### Primary (HIGH confidence)
- https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md — Full persist middleware API (name, storage, partialize, version, migrate, merge, onRehydrateStorage, skipHydration, runtime methods)
- https://deepwiki.com/pmndrs/zustand/3.1-persist-middleware — Verified API summary, hydration timing, key gotchas
- https://zustand.docs.pmnd.rs/middlewares/persist — Official Zustand persist reference
- https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria — localStorage quota (5-10MB per origin)
- https://runthatline.com/vitest-mock-localstorage/ — Vitest localStorage testing patterns

### Secondary (MEDIUM confidence)
- https://github.com/vitest-dev/vitest/issues/8757 — Node v25 Web Storage API conflict (confirmed not applicable to Node 24.x)
- WebSearch results confirming: separate store pattern is recommended over multi-persist for independent persistence concerns
- WebSearch results on QuotaExceededError: confirmed thrown synchronously on setItem; try/catch is sufficient

### Tertiary (LOW confidence)
- Community patterns for "load saved split into store" via `setState` — logical inference from Zustand docs; not a named pattern in official docs but consistent with the API

---

## Metadata

**Confidence breakdown:**
- Standard stack (persist middleware API): HIGH — verified against official Zustand docs and DeepWiki
- Architecture (separate history store): HIGH — confirmed as recommended pattern for independent persistence
- Data schema: HIGH — straightforward TypeScript typing; integer cents are safe for JSON
- Pitfalls: HIGH — QuotaExceededError, shallow merge, test isolation all verified via official and authoritative sources
- PEOPLE-04 implementation: MEDIUM — logical extension of existing patterns; no official documentation for this exact pattern

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (Zustand persist API is stable; localStorage behavior is stable)
