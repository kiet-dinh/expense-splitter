# Architecture Patterns

**Domain:** Client-side expense splitting web app (restaurant bill splitter)
**Researched:** 2026-02-13
**Overall confidence:** HIGH (React official docs + MDN official docs)

---

## Recommended Architecture

A single-page app with three distinct layers: **Data Model** (state), **Calculation Engine** (pure functions), and **UI** (components). State flows in one direction: user actions mutate state, the calculation engine derives results from state, and components render those results.

```
+--------------------------------------------------+
|                    App Shell                      |
|  (router/layout, localStorage sync, top state)   |
+--------------------------------------------------+
         |                          ^
   [state + dispatch]          [read state]
         |                          |
+------------------+    +---------------------+
|   State Store    |    |  Calculation Engine  |
|  (useReducer +   |--->|   (pure functions,   |
|   Context)       |    |   no side effects)   |
+------------------+    +---------------------+
         |                          |
         |                [derived results]
         v                          v
+--------------------------------------------------+
|                  UI Components                    |
|  SessionSetup | PeoplePanel | ItemsPanel |        |
|  AssignPanel  | ResultsPanel            |        |
+--------------------------------------------------+
         |
    [user actions]
         |
   dispatch(action)
         |
  +------------------+
  | LocalStorage     |
  | Persistence      |
  | (serialize on    |
  |  state change)   |
  +------------------+
```

---

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **App Shell** | Root layout, initializes state from localStorage, wraps providers | All components via Context |
| **State Store** (`BillContext`) | Holds all bill data (people, items, assignments, settings); exposes dispatch | Calculation Engine (read), UI Components (read + dispatch) |
| **Calculation Engine** | Pure functions that take bill state and return per-person totals; no side effects | State Store (reads from), ResultsPanel (writes to via derived values) |
| **PeoplePanel** | Add/remove/rename participants | State Store (dispatch: ADD_PERSON, REMOVE_PERSON, RENAME_PERSON) |
| **ItemsPanel** | Add/remove/edit line items (name, price) | State Store (dispatch: ADD_ITEM, REMOVE_ITEM, UPDATE_ITEM) |
| **AssignPanel** | Assign items to people (individual or shared with weights) | State Store (dispatch: ASSIGN_ITEM, SET_ITEM_SPLIT_MODE), reads People + Items |
| **SettingsPanel** | Set tip %, tax %, tip/tax calculation mode | State Store (dispatch: SET_TIP, SET_TAX, SET_SETTINGS) |
| **ResultsPanel** | Display per-person breakdown and totals | Calculation Engine output (read-only); triggers no state mutations |
| **LocalStorage Layer** | Serialize/deserialize bill state; detect storage availability | App Shell (reads/writes on state change) |

---

## Data Model

The canonical state shape. Keep it flat — avoid nesting people inside items or vice versa. Use IDs to express relationships, compute everything else.

```typescript
// Core state (what lives in useReducer / localStorage)
interface BillState {
  people: Record<string, Person>;       // keyed by id
  items: Record<string, LineItem>;      // keyed by id
  assignments: Record<string, Assignment>; // keyed by itemId
  settings: BillSettings;
  meta: BillMeta;
}

interface Person {
  id: string;          // uuid or nanoid
  name: string;
}

interface LineItem {
  id: string;
  name: string;
  price: number;       // in cents (integer) to avoid floating-point drift
}

interface Assignment {
  itemId: string;
  splitMode: 'individual' | 'equal' | 'custom';
  // splitMode = 'individual': one person pays
  assignedTo?: string;          // personId when splitMode = 'individual'
  // splitMode = 'equal': split evenly across listed people
  // splitMode = 'custom': split by weight portions
  participants: string[];       // personIds (for equal or custom)
  weights?: Record<string, number>; // personId -> portion (for custom)
}

interface BillSettings {
  tipPercent: number;           // 0-100 (e.g., 18 = 18%)
  taxPercent: number;           // 0-100
  tipOnPreTax: boolean;         // tip calculated on subtotal before tax
}

interface BillMeta {
  createdAt: string;            // ISO timestamp
  updatedAt: string;
}
```

**Why integers for price:** Floating-point addition of decimals causes cents-level rounding errors that compound across many items. Store prices as cents (integer), display as dollars.

---

## Data Flow

```
User Action
    |
    v
dispatch(action)
    |
    v
billReducer(state, action) --> new BillState
    |
    +----> localStorage.setItem('bill', JSON.stringify(newState))
    |
    v
React re-render triggered
    |
    v
calculateResults(BillState) --> PerPersonResult[]   [pure, in render or useMemo]
    |
    v
ResultsPanel renders PerPersonResult[]
```

Key invariant: **calculation is always derived, never stored.** The `PerPersonResult[]` is never put in state or localStorage — it is recomputed on every render from the canonical `BillState`. This eliminates an entire class of sync bugs.

---

## Calculation Engine (Pure Functions)

The engine lives in a separate module with no React imports. This makes it unit-testable without a browser or component harness.

```typescript
// src/lib/calculate.ts  — no React imports, no side effects

export interface PerPersonResult {
  personId: string;
  personName: string;
  items: ItemCharge[];          // itemized breakdown
  subtotal: number;             // sum of item charges (cents)
  tipShare: number;             // cents
  taxShare: number;             // cents
  total: number;                // cents
}

export interface ItemCharge {
  itemId: string;
  itemName: string;
  itemPrice: number;            // full item price (cents)
  personCharge: number;         // this person's share (cents)
  splitDescription: string;     // "1 of 1", "1 of 3 equal", "30% of 3"
}

export function calculateResults(state: BillState): PerPersonResult[] {
  // 1. Distribute item costs to people per assignments
  // 2. Sum subtotals per person
  // 3. Compute tip on: sum of all assigned subtotals (or pre-tax subtotal)
  // 4. Distribute tip proportionally (person's subtotal / total subtotal)
  // 5. Compute tax proportionally (same ratio)
  // 6. Handle rounding: largest-remainder method to ensure totals sum exactly
  return results;
}
```

**Rounding strategy (largest-remainder method):**
When distributing tip/tax proportionally among N people, floating-point division will produce fractions of cents. Truncate all shares, then add the remaining 1-cent residuals to the people with the largest fractional parts, largest first. This guarantees `sum(shares) === total` exactly.

---

## Patterns to Follow

### Pattern 1: Centralized Reducer + Context

**What:** Single `useReducer` at the root holding all bill state. Expose via two contexts: one for state (read), one for dispatch (write). Components consume via custom hooks.

**When:** Always — this app has multiple panels that all read and mutate shared bill state. Prop drilling from a single root would require passing 4-6 props through 2-3 levels to every panel.

**Example:**
```typescript
// src/context/BillContext.tsx
const BillStateContext = createContext<BillState | null>(null);
const BillDispatchContext = createContext<Dispatch<BillAction> | null>(null);

export function BillProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(billReducer, initialState, initFromStorage);

  // Persist on every state change
  useEffect(() => {
    try {
      localStorage.setItem('gsd-bill', JSON.stringify(state));
    } catch {
      // QuotaExceededError — silent fail, state still works in-memory
    }
  }, [state]);

  return (
    <BillStateContext value={state}>
      <BillDispatchContext value={dispatch}>
        {children}
      </BillDispatchContext>
    </BillStateContext>
  );
}

// Custom hooks — components never import Context directly
export const useBillState = () => useContext(BillStateContext)!;
export const useBillDispatch = () => useContext(BillDispatchContext)!;
```

### Pattern 2: Derived Calculations via useMemo

**What:** Call `calculateResults(state)` inside a `useMemo` that depends on `state`. Never store results in state.

**When:** In the component or hook that renders results. Keep calculation out of the reducer.

**Example:**
```typescript
// src/components/ResultsPanel.tsx
function ResultsPanel() {
  const state = useBillState();
  const results = useMemo(() => calculateResults(state), [state]);
  // render results...
}
```

### Pattern 3: Prices as Integers (Cents)

**What:** Store all monetary values as integers representing cents. Convert to/from display format only at the UI boundary.

**When:** Everywhere monetary values are stored or calculated.

**Example:**
```typescript
// Parsing user input
const priceInCents = Math.round(parseFloat(inputValue) * 100);

// Displaying
const displayPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
```

### Pattern 4: Storage Init Function

**What:** Pass an `init` function as the third argument to `useReducer` to hydrate from localStorage on first render. Validate the shape before trusting it.

**When:** App startup.

**Example:**
```typescript
function initFromStorage(fallback: BillState): BillState {
  if (!storageAvailable('localStorage')) return fallback;
  try {
    const raw = localStorage.getItem('gsd-bill');
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return isValidBillState(parsed) ? parsed : fallback;
    // isValidBillState checks required keys exist and types are correct
  } catch {
    return fallback;
  }
}
```

### Pattern 5: Action-Based Dispatch (Explicit Commands)

**What:** Use string-literal action types in the reducer. Each action represents one user intent, not a generic "set state X".

**Why:** Enables undo/redo later, makes bugs traceable, keeps reducer testable.

**Example:**
```typescript
type BillAction =
  | { type: 'ADD_PERSON'; name: string }
  | { type: 'REMOVE_PERSON'; personId: string }
  | { type: 'ADD_ITEM'; name: string; priceInCents: number }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'UPDATE_ITEM'; itemId: string; changes: Partial<LineItem> }
  | { type: 'ASSIGN_ITEM'; itemId: string; assignment: Assignment }
  | { type: 'SET_TIP'; percent: number }
  | { type: 'SET_TAX'; percent: number }
  | { type: 'RESET_BILL' };
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Calculated Results in State

**What:** Putting `PerPersonResult[]` into `useReducer` or localStorage.

**Why bad:** Calculated results are derived from bill data. Storing them creates two sources of truth that can diverge. Any mutation to people/items/assignments must also re-run and re-store calculations, or the display is stale. This causes subtle bugs when assignments are changed but calculations are not re-triggered.

**Instead:** Compute results in `useMemo` during render, from canonical bill state. Zero sync needed.

### Anti-Pattern 2: Floating-Point Money Arithmetic

**What:** Storing `price: 12.99` as a JavaScript float and adding/dividing floats directly.

**Why bad:** `0.1 + 0.2 === 0.30000000000000004` in JavaScript. Across a 10-item bill split 4 ways with tip and tax, these errors accumulate and produce totals like "$34.001" or rounding that doesn't sum to the bill total.

**Instead:** Store prices as integer cents, apply rounding only at display boundary. Use largest-remainder method for proportional distributions.

### Anti-Pattern 3: One Giant Component

**What:** Building the entire app as one large component with local state spread throughout.

**Why bad:** Assignment logic depends on people and items. Tax/tip depends on subtotals. If all this state lives in one `useState`-per-field component, any change anywhere triggers re-render of the entire tree and the inter-dependencies become spaghetti.

**Instead:** Centralized `useReducer` + Context with small focused components. Each panel owns its UI; the store owns all data.

### Anti-Pattern 4: Trusting localStorage Without Validation

**What:** `JSON.parse(localStorage.getItem('gsd-bill'))` and directly using the result without type checking.

**Why bad:** localStorage data is user-controlled and persists across deployments. An old schema (e.g., before you added `weights` to assignments) will silently produce `undefined` values mid-calculation. Users in incognito will get a null parse error. Corrupted data causes a white-screen crash.

**Instead:** Always validate the parsed shape. Have a `isValidBillState()` type guard. Fall back to `initialState` on any validation failure.

### Anti-Pattern 5: Per-Item Split Logic Scattered in UI Components

**What:** Putting the "how to split this item" calculation logic inside `AssignPanel` or `ItemRow` render functions.

**Why bad:** The assignment logic is business logic, not display logic. Scattering it means `ResultsPanel` can't use it, tests require mounting components, and changing split modes breaks multiple files.

**Instead:** All split math lives in `src/lib/calculate.ts`. UI components only dispatch intent; they never calculate shares.

---

## Suggested Build Order

Dependencies determine order. Each layer must exist before what depends on it.

```
1. Data Model (types/interfaces)
        |
        v
2. Calculation Engine (pure functions + tests)
        |
        v
3. State Store (useReducer + Context + localStorage)
        |
        v
4. Core UI Panels (PeoplePanel, ItemsPanel)
        |
        v
5. AssignPanel (depends on People + Items existing in state)
        |
        v
6. SettingsPanel (tip/tax, can be parallel with step 5)
        |
        v
7. ResultsPanel (depends on all state + Calculation Engine)
        |
        v
8. Polish (mobile layout, edge cases, empty states, error handling)
```

**Rationale:**
- Data model first because every other layer types against it.
- Calculation engine before UI because it is pure and can be verified independently.
- State store before panels because panels consume Context.
- AssignPanel after People + Items because it needs those entities to exist in state before it can render them.
- ResultsPanel last because it synthesizes all other data.

---

## Scalability Considerations

This is a client-side single-session tool. Scalability concerns are scope (number of people/items), not concurrent users.

| Concern | At typical use (2-8 people, 5-20 items) | At stress (20+ people, 100+ items) |
|---------|----------------------------------------|-------------------------------------|
| Calculation speed | Instant — O(people * items) | Still sub-millisecond — useMemo is sufficient |
| localStorage size | ~5KB — well within 5MB limit | ~50KB — still within limit |
| Re-render performance | Fine — Context re-renders all consumers on change | Could become noticeable; split Context into per-panel slices if needed |
| Rounding errors | Largest-remainder handles correctly | Same algorithm, same correctness |

No premature optimization is needed for the MVP. If re-render performance becomes noticeable, the fix is splitting `BillStateContext` into sub-contexts (e.g., `PeopleContext`, `ItemsContext`) so that editing an item doesn't re-render `PeoplePanel`. This refactor is backwards-compatible.

---

## Sources

- React official docs, "Thinking in React": https://react.dev/learn/thinking-in-react (HIGH confidence)
- React official docs, "Managing State": https://react.dev/learn/managing-state (HIGH confidence)
- React official docs, "Scaling Up with Reducer and Context": https://react.dev/learn/scaling-up-with-reducer-and-context (HIGH confidence)
- React official docs, "Choosing the State Structure": https://react.dev/learn/choosing-the-state-structure (HIGH confidence)
- MDN, "Using the Web Storage API": https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API (HIGH confidence)
- MDN, "Window: localStorage": https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage (HIGH confidence)
- Largest-remainder method for proportional rounding: well-established algorithm in financial software (MEDIUM confidence — training data, standard algorithm name verifiable independently)
- Prices-as-integers pattern for monetary values: JavaScript community consensus, widely documented in fintech OSS (MEDIUM confidence — training data + common practice)
