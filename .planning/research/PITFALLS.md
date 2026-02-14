# Domain Pitfalls: Expense Splitter

**Domain:** Restaurant bill splitting web app (client-side)
**Researched:** 2026-02-13
**Confidence:** HIGH for math/rounding (first-principles provable), HIGH for state management patterns (well-established JS behavior), MEDIUM for UX patterns (community-derived but consistent across sources)

---

## Critical Pitfalls

Mistakes that cause rewrites or produce provably wrong results.

---

### Pitfall 1: Floating-Point Money Arithmetic

**What goes wrong:** Using JavaScript's native `number` type for all arithmetic. `0.1 + 0.2` equals `0.30000000000000004` in JS. When you do `14.99 + 3.50 + 7.01`, you may get `25.499999999999996` instead of `25.50`. Multiplying for tip/tax compounds the error. Displaying with `toFixed(2)` masks the error visually but does not fix the underlying value — you can still accumulate errors across multiple operations.

**Why it happens:** IEEE 754 double-precision floats cannot represent most decimal fractions exactly. This is not a JavaScript-specific bug — it affects every language using 64-bit floats. The problem is treating financial values as floating-point rather than integers.

**Consequences:**
- Per-person totals display as `$12.3300000000001` without careful formatting
- Sum of all individual totals does not equal the bill total (pennies disappear or multiply)
- `toFixed(2)` has its own rounding bugs in some JS engines (`(1.005).toFixed(2)` returns `"1.00"` not `"1.01"` in V8)
- Users lose trust immediately when they see impossible numbers

**Prevention:** Work exclusively in integer cents. Convert at input: `Math.round(parseFloat(input) * 100)`. All internal arithmetic uses integer cents. Convert at display: `(cents / 100).toFixed(2)`. Never multiply percentages against floats mid-calculation — convert the percentage itself to a cents calculation.

```javascript
// BAD: float arithmetic
const tipAmount = subtotal * 0.18; // e.g., 25.499... * 0.18 = 4.58999...

// GOOD: integer cents throughout
const subtotalCents = 2550; // $25.50 stored as cents
const tipCents = Math.round(subtotalCents * 0.18); // 459 = $4.59
```

**Detection:** Write a unit test: split a $10.00 bill three ways. Assert the three shares sum to exactly 1000 cents. If using floats, this will fail. Also test: `0.1 + 0.2 === 0.3` — it returns `false` in any JS runtime.

**Phase:** Address in Phase 1 (core calculation engine). This cannot be retrofitted after UI is built without touching all state.

---

### Pitfall 2: Rounding Distribution Does Not Sum to Total

**What goes wrong:** When splitting a bill N ways, you round each share individually. The sum of rounded shares often does not equal the original total. Example: $10.00 split three ways = $3.333... each. Round each to $3.33 = $9.99 total. One cent vanishes. With five people and complex items, you can lose or gain 3-4 cents. Users who add up the numbers manually will notice.

**Why it happens:** Rounding is applied per-person rather than distributing the remainder explicitly.

**Consequences:** The app calculates individual shares correctly by its own logic but the sum is provably wrong. High-scrutiny users (accountants, anyone who checks the math) will find this immediately.

**Prevention:** Use the "largest remainder" method (also called Hamilton's method):
1. Compute exact share for each person in cents (may be fractional)
2. Floor each share to whole cents
3. Compute remainder: `total - sum(floored shares)`
4. Distribute remainder 1 cent at a time to persons with the largest fractional parts

```javascript
function distributeWithRemainder(totalCents, weights) {
  // weights: array of numbers (can be unequal for proportional splits)
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const exactShares = weights.map(w => (totalCents * w) / totalWeight);
  const flooredShares = exactShares.map(Math.floor);
  const remainder = totalCents - flooredShares.reduce((a, b) => a + b, 0);

  // Sort by descending fractional part to distribute remainder
  const fractionals = exactShares.map((v, i) => ({ i, frac: v - Math.floor(v) }));
  fractionals.sort((a, b) => b.frac - a.frac);

  for (let k = 0; k < remainder; k++) {
    flooredShares[fractionals[k].i] += 1;
  }
  return flooredShares; // guaranteed to sum to totalCents
}
```

**Detection:** After every calculation, assert `sum(personShares) === billTotal`. This assertion should run in dev mode on every state change and in production tests.

**Phase:** Address in Phase 1 alongside integer-cents decision. The two are inseparable.

---

### Pitfall 3: Tip/Tax Applied Before or After Discounts in Wrong Order

**What goes wrong:** The order of operations for tax and tip matters. Tax is typically applied on the pre-tip subtotal. If you apply tip first, then tax on (subtotal + tip), the tax is inflated. Some apps also apply tip to the taxed total, which is nonstandard. Users have strong opinions and expectations here; getting this wrong produces amounts that feel wrong even when internally consistent.

**Why it happens:** The calculation chain is implemented without explicitly modeling the order: subtotal → tax (on subtotal) → tip (on subtotal OR on subtotal+tax depending on restaurant convention).

**Consequences:** Amounts are wrong by 1-5% depending on tip/tax rates. Users who know the restaurant's actual charges will see the discrepancy.

**Prevention:** Make the calculation order explicit and documented in code:
1. Calculate `itemSubtotal` = sum of all assigned item amounts
2. Calculate `taxAmount` = itemSubtotal × taxRate (or use fixed tax input)
3. Calculate `tipAmount` = itemSubtotal × tipRate (tip on pre-tax subtotal is the US standard)
4. Total = itemSubtotal + taxAmount + tipAmount

Then distribute each bucket (tax, tip) separately to persons based on their chosen split method (equal or proportional). Do NOT fold tip and tax into a single "fees" bucket and split together unless the split method is the same for both.

**Detection:** Test with a known receipt. Use a restaurant receipt where you know the correct breakdown and verify the app reproduces it exactly.

**Phase:** Phase 1 (calculation engine). Document the intended order of operations in a code comment at the top of the calculation module.

---

### Pitfall 4: Shared Item Split Creates Phantom Assignments

**What goes wrong:** An item is marked "shared by everyone" (or a subset of people). When a person is later removed from the bill, the shared item's portions are not recalculated. The removed person's fraction either stays orphaned (making the remaining shares sum to less than the item price) or the item total is split but orphaned fractions are ignored.

**Why it happens:** People and items are managed in separate state slices. Removal of a person does not trigger recalculation of all items that referenced that person.

**Consequences:** The sum of assigned portions no longer equals the item price. Total bill calculates incorrectly. This is a state consistency bug that is hard to detect visually until you check the math.

**Prevention:**
- Treat item assignments as derived from the person list, not as independent state
- On person removal, immediately recalculate all shared items that included them
- For equal-split shared items: assignment is `[...participants]` derived from the current person list, not stored explicitly
- For custom-portion shared items: on person removal, decide policy upfront: (a) redistribute their portion equally, or (b) leave item as partially assigned and show a warning

**Detection:** Add a validation check: for every item, `sum(assigned portions) === item price`. Surface warnings in the UI when this invariant is violated.

**Phase:** Phase 2 (item assignment UI). This is an architectural decision about state shape — whether person lists are stored by reference or by ID, and whether item assignments are computed or stored.

---

### Pitfall 5: localStorage Deserialization Produces Invalid State

**What goes wrong:** You save a bill to localStorage as JSON. On reload, `JSON.parse` succeeds but the resulting object is structurally wrong — missing fields added in a later version, or with values of wrong types (e.g., prices stored as strings from an earlier version when they were floats, now expected as integer cents). The app crashes or silently computes wrong results.

**Why it happens:** localStorage has no schema. Any version of the app can write any shape. After even one field rename or type change during development, old localStorage data becomes a landmine.

**Consequences:**
- `Cannot read properties of undefined` errors on reload
- Silent wrong calculations if a value coerces in an unexpected direction
- User loses their saved bill data when you push a schema change

**Prevention:**
- Version the storage schema from day one: `{ version: 1, data: {...} }`
- Write a migration function that runs on load: `migrateFromV1toV2(data)`
- Validate the deserialized object with a schema checker (Zod is ideal) before using it
- On validation failure, fall back to empty state and optionally show "saved data was incompatible, starting fresh"

```javascript
const STORAGE_VERSION = 1;

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('expense-splitter');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== STORAGE_VERSION) return migrate(parsed);
    return BillSchema.parse(parsed.data); // Zod throws on invalid shape
  } catch {
    return null; // graceful degradation
  }
}
```

**Detection:** After any state shape change during development, manually test: clear localStorage, use the app, reload, verify data persists correctly. Also test: manually corrupt localStorage and verify the app doesn't crash.

**Phase:** Phase 3 (persistence). Versioning must be built in from the first persistence implementation — retrofitting it later risks corrupting any existing saved data.

---

## Moderate Pitfalls

---

### Pitfall 6: Proportional Tip/Tax Split Produces Unintuitive Results for Zero-Price Items

**What goes wrong:** A person's item subtotal is $0 (e.g., they only had a free birthday dessert, or all their items were comped). With proportional tip/tax split, their share of tip and tax is also $0. Users expect them to contribute something. This creates a conflict between mathematical correctness and social expectation.

**Prevention:** This is not a bug to fix but a UX decision to make explicitly. Options:
1. If a person has $0 subtotal, default them to equal-split tip/tax
2. Show a notice: "Proportional split: [Name] contributes $0 to tip/tax because their items total $0"
3. Let the operator override per-person tip/tax contribution

Pick option 2 as the default — it is transparent without assuming intent. Document this decision.

**Phase:** Phase 2 (tip/tax UI). Decide before implementing proportional split.

---

### Pitfall 7: Multiple Sources of Truth for Person Names

**What goes wrong:** Person names are stored in three places: (1) the people array, (2) item assignment maps keyed by person name, (3) past splits in localStorage. A person name is edited. Only the people array is updated. Item assignments still reference the old name string. The person's items become unassigned.

**Prevention:** Use stable IDs (UUID or incrementing integer) for all cross-references. Never key by display name. Names are display-only properties on an `{ id, name }` object. Assignment maps use IDs: `{ itemId: [personId1, personId2] }`.

```javascript
// BAD: keying by name
assignments['Alice'] = 0.50;

// GOOD: keying by stable ID
assignments['person_1'] = 0.50;
```

**Phase:** Phase 1 (data model design). This structural decision affects every other feature. The people array schema must be `{ id: string, name: string }[]` before any assignment logic is built.

---

### Pitfall 8: Input Validation Allows Negative or Zero Prices

**What goes wrong:** A user enters `-5.00` or `0` as an item price (keyboard slip, testing, copy-paste). The calculation engine produces a negative subtotal for that person, which then propagates into negative tip/tax shares. The final result shows someone "owes" a negative amount.

**Prevention:**
- Validate item prices: must be a positive number, minimum $0.01
- Validate people count: minimum 1
- Validate tip/tax: non-negative, tip capped at a reasonable maximum (e.g., 100%)
- Validate custom portions: each must be positive, and the sum must be validated before final calculation
- Show inline validation errors, not just form-level errors — users are on mobile entering numbers one at a time

**Detection:** Test suite should include: negative price, zero price, empty price, non-numeric price. All should produce validation errors, not wrong calculations.

**Phase:** Phase 2 (input forms). Validation is part of input, not calculation.

---

### Pitfall 9: Tax Input Ambiguity — Amount vs. Percentage

**What goes wrong:** The app offers tax entry as either a flat amount (e.g., "$3.47") or a percentage (e.g., "8.5%"). The user enters "8.5" into the amount field thinking it is a percentage. The app treats $8.50 as the tax, which is wildly wrong on a $25 bill. Or vice versa: they enter "847" meaning "$8.47" but the app reads it as a percentage.

**Prevention:**
- Make the input mode extremely explicit: a toggle clearly labeled "$ amount" / "% rate" with a persistent visible indicator
- In percentage mode, show the calculated dollar amount in real-time as the user types: "8.5% = $2.13"
- In amount mode, show what percentage that represents in small text: "$3.47 = 8.2%"
- Do not silently switch modes based on value magnitude

**Phase:** Phase 2 (tax input UI). This is a UX design decision that must be made before the input component is built.

---

### Pitfall 10: Custom Portion Split Doesn't Enforce That Portions Sum to Whole Item

**What goes wrong:** A $30 bottle of wine is being split with custom portions. Alice: 40%, Bob: 40%, Carol: 40%. Total: 120% of the item. The app distributes the full $30 across the three people but their shares ($12 + $12 + $12 = $36) exceed the item price by $6. Or the opposite: portions sum to 60%, and $12 of the bottle is "unassigned."

**Prevention:**
- Interpret custom portions as relative weights, not absolute percentages: if Alice=2, Bob=1, Carol=1, Alice pays 50%, others 25% each
- Display portions as a fraction of total in real-time as user enters them: "Alice: 2/4 = 50%"
- Alternatively, use percentage mode but enforce that percentages sum to 100% before allowing save (show running total with a clear indicator of over/under)
- The "weights" interpretation is more forgiving of user input errors and should be the default

**Phase:** Phase 2 (custom split UI).

---

## Minor Pitfalls

---

### Pitfall 11: Mobile Keyboard Doesn't Show Numeric Pad for Price Inputs

**What goes wrong:** Price inputs use `type="text"` or `type="number"`. On mobile, `type="number"` shows a numeric keyboard without a decimal point on some Android devices. `type="text"` shows the full keyboard. Neither is ideal for currency entry.

**Prevention:** Use `type="text"` with `inputmode="decimal"` and `pattern="[0-9]*\.?[0-9]{0,2}"`. This shows the decimal-capable numeric keyboard on both iOS and Android without the quirks of `type="number"`.

```html
<input type="text" inputmode="decimal" pattern="[0-9]*\.?[0-9]{0,2}" />
```

**Phase:** Phase 2 (any monetary input field).

---

### Pitfall 12: localStorage Quota Exceeded Is Not Handled

**What goes wrong:** localStorage has a ~5MB limit per origin. Saving many past splits with long item lists can approach this limit. `localStorage.setItem()` throws a `QuotaExceededError` exception when the limit is hit. If this is not caught, the save silently fails or crashes the app.

**Prevention:** Wrap all `localStorage.setItem()` calls in try/catch. On quota error, show the user a message: "Storage full — oldest saved bills will be removed to make space." Implement a cap on saved bill history (e.g., keep the 20 most recent). In practice, bill data is small and this limit is unlikely to be hit in realistic usage, but the error path must exist.

**Phase:** Phase 3 (persistence). Handle at implementation time.

---

### Pitfall 13: Tip Percentage Applied to Wrong Subtotal When Items Are Partially Assigned

**What goes wrong:** Three items are added to the bill but one item has no person assigned yet. The subtotal used for tip calculation includes that unassigned item's price. The tip is calculated on the full expected bill total. But the per-person breakdowns only sum to the assigned items. The tip distributed to individuals is correct proportionally, but the total doesn't match what the app claimed at the top.

**Prevention:** Display two states clearly:
1. "Current assigned subtotal" (sum of items with at least one assignment)
2. "Unassigned items" (shown as a warning with their total)

Disable or warn on the final calculation if any item is unassigned. Do not calculate a "final total" until all items are assigned. This is a UX guard, not a math fix.

**Phase:** Phase 2 (item assignment UI). The assignment completeness check should be part of the form validation before showing the results screen.

---

### Pitfall 14: Removing the Last Person Leaves Orphaned Item Assignments

**What goes wrong:** There is one person left. All items are assigned to them. The user removes that person (perhaps by mistake, or to rename them by remove+add). All item assignments now reference a deleted person ID. The state is valid structurally but meaningless: all items are "unassigned."

**Prevention:**
- Enforce a minimum of 1 person in the people list (disable the remove button when only 1 person remains, or require at least 2 for meaningful splitting)
- On person removal, show a confirmation if they have items assigned: "Removing [Name] will unassign 3 items. Continue?"
- After removal, immediately run the orphaned-assignment cleanup

**Phase:** Phase 2 (people management UI).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Core calculation engine | Floating-point arithmetic (Pitfall 1) | Commit to integer-cents from the start, write tests before UI |
| Core calculation engine | Rounding doesn't sum to total (Pitfall 2) | Implement largest-remainder algorithm, add sum assertion |
| Core calculation engine | Wrong tax/tip order of operations (Pitfall 3) | Document and test the calculation order explicitly |
| Data model / state design | Keying by name instead of ID (Pitfall 7) | Define `{ id, name }` people schema before building any assignment logic |
| Item assignment UI | Shared item orphaned on person removal (Pitfall 4) | State mutation for person removal must trigger assignment recomputation |
| Item assignment UI | Unassigned items distort tip calculation (Pitfall 13) | Block final calculation until all items assigned |
| Item assignment UI | Custom portions don't sum to 100% (Pitfall 10) | Use weight-based (relative) portions, display real-time fraction |
| Tip/tax input UI | Tax amount vs. percentage confusion (Pitfall 9) | Clear toggle with real-time preview of the other representation |
| Tip/tax calculation | Zero-subtotal person with proportional split (Pitfall 6) | Decide policy upfront, surface as UI warning |
| Input validation | Negative/zero prices (Pitfall 8) | Validate all monetary inputs at entry point |
| Mobile input UX | Wrong keyboard type for prices (Pitfall 11) | Use `inputmode="decimal"` on all price inputs |
| Persistence | localStorage schema changes break saved data (Pitfall 5) | Version schema from first save, run migration on load |
| Persistence | Quota exceeded silently fails (Pitfall 12) | Wrap all setItem calls in try/catch, cap saved bill count |

---

## Confidence Notes

- **Pitfalls 1-3 (math/rounding):** HIGH confidence. These are mathematically provable from IEEE 754 specification and JavaScript language semantics. No external source needed — they can be reproduced in any browser console.
- **Pitfall 4 (orphaned assignments):** HIGH confidence. This is a direct consequence of state mutation without cascade, a well-understood problem in any stateful UI.
- **Pitfall 5 (localStorage schema):** HIGH confidence. localStorage's lack of schema versioning is a documented limitation. Migration patterns are established practice.
- **Pitfalls 6-14:** MEDIUM confidence. These are derived from common patterns observed in similar apps and UX heuristics. The specific manifestations may vary, but the underlying causes (input ambiguity, missing validation, state consistency gaps) are reliable.

---

## Sources

- IEEE 754 double-precision floating-point standard (first-principles, not web-sourced)
- JavaScript language specification for `Number.toFixed()` behavior — known V8 rounding bug with values like `1.005` is documented in the ECMAScript specification discussions and reproduced in any Chrome/Node console
- Hamilton's method (largest remainder) for fair rounding — standard apportionment algorithm from electoral mathematics, directly applicable to bill splitting
- MDN `inputmode` attribute documentation (training data; verify current browser support at https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode if needed)
- localStorage quota and error behavior: Web Storage specification, 5MB limit is the conventional browser default (some browsers differ)

*Note: WebSearch and WebFetch were unavailable during this research session. All findings derive from training knowledge of JavaScript semantics, financial calculation algorithms, and web storage specifications. The mathematical pitfalls (1-3) are verifiable from first principles. The UX pitfalls (6-14) carry MEDIUM confidence and should be validated against community discussions when network access is available.*
