# Phase 1: Foundation - Research

**Researched:** 2026-02-15
**Domain:** Integer cent arithmetic, largest-remainder rounding, full-stack scaffolding (React + TypeScript + Vite + Zustand + Tailwind + Vitest)
**Confidence:** HIGH (all package versions verified via npm; algorithm patterns verified via official docs and authoritative sources)

---

## Summary

Phase 1 establishes the calculation engine and proves the full stack runs locally. The core technical problem is monetary arithmetic: JavaScript's IEEE 754 floating-point representation cannot store decimals like 0.1 or 0.2 exactly, so `0.1 + 0.2 === 0.30000000000000004` in JS. The standard solution — storing all values as integer cents — eliminates floating-point error entirely because integer arithmetic in floating-point is exact up to `Number.MAX_SAFE_INTEGER` (~90 trillion cents, well beyond any bill-splitting scenario).

The second mathematical requirement is distributing rounding remainders without creating or losing cents. The largest-remainder method (Hamilton method) is the standard algorithm: floor each share, compute remainders, award one extra cent to whichever shares have the largest fractional remainder until the total cent count matches the desired sum. This guarantees the allocation sum equals the original amount exactly.

The stack is almost exactly as decided (React 19 + TypeScript 5 + Zustand 5 + Tailwind), with two version discrepancies to flag: the current Vite release is **7.x** (not 6), and Vitest is at **4.x** (not implicitly paired with Vite 6). The prior decision to "verify versions before scaffolding" was wise — this research confirms that verification step is needed.

**Primary recommendation:** Scaffold with `npm create vite@latest` using the `react-ts` template, install Vitest 4, add Tailwind v4 via the `@tailwindcss/vite` plugin, and implement the calculation engine as pure TypeScript functions with no framework dependencies.

---

## Standard Stack

### Core

| Library | Current Version (npm) | Purpose | Why Standard |
|---------|----------------------|---------|--------------|
| react | 19.2.4 | UI framework | Per project decision; latest stable |
| react-dom | 19.2.4 | DOM renderer | Paired with react |
| typescript | 5.9.3 | Static typing | Per project decision; latest stable |
| vite | 7.3.1 | Build tool and dev server | Per project decision — NOTE: latest is v7, not v6 |
| @vitejs/plugin-react | 5.1.4 | React Fast Refresh in Vite | Standard Babel-based React plugin |
| zustand | 5.0.11 | State management | Per project decision; supports React 19, TS 5+ |
| tailwindcss | 4.1.18 | Utility CSS | Per project decision |
| @tailwindcss/vite | 4.1.18 | Tailwind v4 Vite plugin | Replaces PostCSS config in v4 |
| vitest | 4.0.18 | Unit testing | Per project decision; native Vite integration |

### Supporting

| Library | Current Version (npm) | Purpose | When to Use |
|---------|----------------------|---------|-------------|
| @types/react | 19.2.14 | TypeScript types for React | Always with React + TS |
| @types/react-dom | 19.2.3 | TypeScript types for ReactDOM | Always with React + TS |
| jsdom | 28.1.0 | DOM simulation for tests | When testing React components (Phase 3+); not needed for pure calc engine tests |
| @testing-library/react | 16.3.2 | Component testing utilities | Phase 3+ when UI components are tested |
| @testing-library/jest-dom | 6.9.1 | Custom matchers (toBeInDocument, etc.) | Phase 3+ when testing DOM assertions |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vitest | Jest | Vitest is native Vite; zero config overhead. Jest requires babel transforms for ESM. Vitest preferred for Vite projects. |
| @tailwindcss/vite plugin | PostCSS + tailwindcss v3 | Tailwind v4 drops PostCSS requirement for Vite. Plugin approach is simpler and the v4 standard. |
| Integer cents | big.js / decimal.js | Libraries add dependency weight. Integer cents are sufficient for bill-splitting amounts; BigInt not needed unless supporting >$90T. |
| @vitejs/plugin-react | @vitejs/plugin-react-swc | SWC is faster for large apps; Babel (default) is simpler and more compatible. Either works; Babel is scaffolded by default. |

**Installation (full stack):**
```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm install -D vitest
npm install tailwindcss @tailwindcss/vite
npm install zustand
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── engine/          # Pure calculation functions (no React imports)
│   ├── math.ts      # Integer cent arithmetic, largest-remainder method
│   └── math.test.ts # Vitest unit tests co-located with source
├── store/           # Zustand state slices
│   └── billStore.ts
├── components/      # React UI components (Phase 3+)
└── main.tsx         # App entry point
```

The calculation engine in `src/engine/` must have zero React dependencies. It is pure TypeScript: input numbers, output numbers. This enables testing without DOM setup and reuse outside React.

### Pattern 1: Integer Cent Representation

**What:** All monetary values are stored and manipulated as integer cents (e.g., $10.00 = 1000). Input/output conversions happen only at the UI boundary.

**When to use:** Every monetary value — amounts, shares, tips, taxes.

**Example:**
```typescript
// Source: Verified against https://www.honeybadger.io/blog/currency-money-calculations-in-javascript/
// and https://frontstuff.io/how-to-handle-monetary-values-in-javascript

// WRONG - floating point error
const total = 10.00;
const share = total / 3; // 3.3333333333333335
const check = share * 3; // 10.000000000000002 — off by 0.000000000000002

// CORRECT - integer cent arithmetic
const totalCents = 1000; // $10.00 as cents
const shareCents = Math.floor(totalCents / 3); // 333 cents each
// sum = 999 — one cent short; largest-remainder fixes this
```

### Pattern 2: Largest-Remainder Method (Hamilton Method)

**What:** Distributes integer shares that sum exactly to the target, assigning extra cents to entries with the largest fractional remainders.

**When to use:** Any time a total must be split into integer parts (splitting bill shares, distributing tip, distributing tax).

**Example:**
```typescript
// Source: Adapted from https://gist.github.com/hijonathan/e597addcc327c9bd017c
// Algorithm verified via https://en.wikipedia.org/wiki/Largest_remainder_method

/**
 * Splits totalCents into shares proportional to weights[].
 * Returns integer cent shares that sum to exactly totalCents.
 * @param totalCents - total to distribute (integer cents)
 * @param weights - proportional weights (need not sum to any specific value)
 * @returns integer cent allocations summing to totalCents
 */
function distributeByLargestRemainder(
  totalCents: number,
  weights: number[]
): number[] {
  const weightSum = weights.reduce((a, b) => a + b, 0);

  // Compute raw (fractional) share for each weight
  const rawShares = weights.map((w) => (w / weightSum) * totalCents);

  // Floor each share and track remainder for ordering
  let flooredSum = 0;
  const parts = rawShares.map((raw, index) => {
    const floored = Math.floor(raw);
    flooredSum += floored;
    return { floored, remainder: raw - floored, index };
  });

  // Distribute remaining cents to highest-remainder entries
  const centsShort = totalCents - flooredSum;
  parts.sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; i < centsShort; i++) {
    parts[i].floored++;
  }

  // Restore original order
  parts.sort((a, b) => a.index - b.index);
  return parts.map((p) => p.floored);
}

// Usage: split $10.00 three ways
distributeByLargestRemainder(1000, [1, 1, 1]);
// => [334, 333, 333]  — sums to exactly 1000
```

### Pattern 3: Vitest for Pure Function Testing

**What:** Vitest with `environment: 'node'` (the default) is sufficient for testing pure calculation functions. No jsdom needed.

**When to use:** For all `src/engine/` tests in Phase 1.

**Example `vitest.config.ts`:**
```typescript
// Source: https://vitest.dev/guide/
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // 'node' is the default; explicit for clarity
    environment: 'node',
  },
})
```

**Example test:**
```typescript
// Source: Pattern verified against https://vitest.dev/guide/
import { describe, it, expect } from 'vitest'
import { distributeByLargestRemainder } from './math'

describe('distributeByLargestRemainder', () => {
  it('splits $10.00 three ways and sums to exactly 1000 cents', () => {
    const shares = distributeByLargestRemainder(1000, [1, 1, 1])
    expect(shares.reduce((a, b) => a + b, 0)).toBe(1000)
  })

  it('produces zero residual when distributing proportional tip', () => {
    const shares = distributeByLargestRemainder(150, [300, 250, 200])
    expect(shares.reduce((a, b) => a + b, 0)).toBe(150)
  })
})
```

### Pattern 4: Tailwind v4 Setup (Vite Plugin)

**What:** Tailwind v4 uses a Vite plugin instead of PostCSS. No `tailwind.config.js` is required for basic usage.

**When to use:** All new projects with Tailwind v4 + Vite.

```typescript
// vite.config.ts — Source: https://tailwindcss.com/docs (official)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

```css
/* src/index.css — replaces @tailwind base/components/utilities */
@import "tailwindcss";
```

### Pattern 5: Zustand Store (TypeScript)

**What:** TypeScript stores require the curried `create<T>()()` syntax.

**When to use:** All Zustand stores in the project.

```typescript
// Source: https://zustand.docs.pmnd.rs/guides/beginner-typescript
import { create } from 'zustand'

interface BillStore {
  totalCents: number
  setTotal: (cents: number) => void
}

const useBillStore = create<BillStore>()((set) => ({
  totalCents: 0,
  setTotal: (cents) => set({ totalCents: cents }),
}))
```

### Anti-Patterns to Avoid

- **Using floating-point for any monetary value:** Never store `3.33` as a share; always store `333`. The UI formats for display only.
- **Using `value | 0` for flooring in LRM:** Bitwise operations are 32-bit signed integer operations. For monetary cents, the values are always well within range (~2.1 billion cents max for bitwise safety), but `Math.floor()` is more readable, explicit, and avoids the cognitive trap.
- **Using alphabetical sort in LRM:** The sort comparator must be `(a, b) => b.remainder - a.remainder`, not default `.sort()`. Default sort compares strings and produces wrong ordering.
- **Importing React into the engine:** The calculation engine must be a pure TypeScript module. No React imports. This keeps it testable in Node environment and reusable.
- **Creating a `tailwind.config.js` for v4:** Tailwind v4 does not use a config file by default. Customizations go in CSS using `@theme {}` blocks.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Decimal arithmetic | Custom decimal type | Integer cent arithmetic (native JS) | No library needed for bill-splitting scale; integer math is exact |
| Arbitrary-precision arithmetic | Custom big number class | Native BigInt (if ever needed) | JS has built-in `bigint` type; not needed for this project |
| Test runner | Custom test harness | Vitest 4 | Handles TS/ESM natively, watch mode, coverage built in |

**Key insight:** The integer-cent pattern is so simple it needs no library. The complexity is in disciplined application: the decision to use cents must be made at the data model level and enforced everywhere; one floating-point leak invalidates the guarantee.

---

## Common Pitfalls

### Pitfall 1: Vite Version Mismatch

**What goes wrong:** The prior decisions document says "Vite 6" but the current npm release is Vite **7.x** (`npm view vite version` returns `7.3.1`). Scaffolding with `npm create vite@latest` will install Vite 7, not 6.

**Why it happens:** Version numbers in planning documents become stale. Vite 7 was released June 24, 2025.

**How to avoid:** Run `npm create vite@latest` (no pinned version) to get Vite 7. Do not pin to `vite@6` unless there is a specific compatibility requirement. Vitest 4 requires Vite >= 6.0.0, so Vite 7 is compatible.

**Warning signs:** If `npm create vite@6` is run, the project will have outdated Vite and miss Node.js 20+ alignment.

### Pitfall 2: Floating-Point Leak at Conversion Boundaries

**What goes wrong:** Input parsing (`parseFloat`, `Number()`) introduces floating-point error before cent conversion. For example: `parseFloat("33.33") * 100 === 3332.9999999999995` not `3333`.

**Why it happens:** `parseFloat` returns an IEEE 754 double; multiplying by 100 magnifies the error.

**How to avoid:** Parse user input by splitting on the decimal point and computing cents directly:
```typescript
// CORRECT: parse "$33.33" to 3333 cents
function parseToCents(dollarStr: string): number {
  const [dollars, cents = '00'] = dollarStr.replace(/[^0-9.]/g, '').split('.')
  return parseInt(dollars, 10) * 100 + parseInt(cents.padEnd(2, '0').slice(0, 2), 10)
}
```

**Warning signs:** Any test that computes `someFloat * 100` and expects an exact integer will fail intermittently.

### Pitfall 3: Largest-Remainder Sort Stability

**What goes wrong:** When two items have identical fractional remainders, the sorting is unstable — different JS engines may order them differently, producing non-deterministic distributions.

**Why it happens:** JavaScript's `Array.prototype.sort()` is stable in all modern engines (ES2019+), but equal-remainder items can be ordered arbitrarily by the sort.

**How to avoid:** Add a secondary sort key (e.g., `index`) as a tiebreaker:
```typescript
parts.sort((a, b) => b.remainder - a.remainder || a.index - b.index);
```

**Warning signs:** Tests pass locally but distribute pennies differently across environments or when items are reordered.

### Pitfall 4: Tailwind v4 Breaking Change (PostCSS config)

**What goes wrong:** Developers familiar with Tailwind v3 add a `postcss.config.js` and `tailwind.config.js`, but in Tailwind v4 these are not the recommended setup path for Vite projects.

**Why it happens:** Tailwind v4 introduces a Vite-native plugin (`@tailwindcss/vite`) that replaces the PostCSS pipeline. Mixing both can cause styles to not generate correctly.

**How to avoid:** Use only `@tailwindcss/vite` as the plugin in `vite.config.ts` and `@import "tailwindcss"` in the CSS entry. Do not create `tailwind.config.js` or `postcss.config.js`.

**Warning signs:** Classes don't generate, or you see warnings about duplicate Tailwind configurations.

### Pitfall 5: Testing Environment Mismatch

**What goes wrong:** Running calculation engine tests with `environment: 'jsdom'` adds unnecessary overhead and can mask whether the engine truly has no browser dependencies. Conversely, when UI tests are added later (Phase 3+), forgetting to add `jsdom` causes "document is not defined" errors.

**Why it happens:** Vitest environment defaults to `'node'` globally but component tests need `'jsdom'`.

**How to avoid:** Use Vitest's per-file environment override for the split:
```typescript
// src/engine/math.test.ts — pure functions, no DOM needed
// @vitest-environment node

// src/components/BillForm.test.tsx — needs DOM
// @vitest-environment jsdom
```
Or configure separate test projects in `vitest.config.ts`.

**Warning signs:** Tests pass in one environment but fail in another, or slow test runs due to jsdom initialization for non-UI tests.

---

## Code Examples

Verified patterns from official sources and authoritative implementations:

### Dollar String to Cents Parser

```typescript
// Pattern verified against: https://frontstuff.io/how-to-handle-monetary-values-in-javascript

/**
 * Parses a dollar string to integer cents without floating-point error.
 * Handles: "10", "10.5", "10.50", "$10.00"
 */
function dollarsToCents(input: string): number {
  const cleaned = input.replace(/[^0-9.]/g, '')
  const [dollars, fractional = ''] = cleaned.split('.')
  const cents = fractional.padEnd(2, '0').slice(0, 2)
  return parseInt(dollars || '0', 10) * 100 + parseInt(cents, 10)
}

/**
 * Formats integer cents back to display string.
 */
function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2)
}
```

### Largest-Remainder Distributor (Production-Ready)

```typescript
// Algorithm: https://en.wikipedia.org/wiki/Largest_remainder_method
// JS implementation reference: https://gist.github.com/hijonathan/e597addcc327c9bd017c
// Sort correctness verification: cross-checked with https://github.com/ManNguyen/LargestRemainderRound

/**
 * Distributes totalCents proportionally to weights using the largest-remainder
 * method. The returned shares sum to exactly totalCents.
 *
 * @param totalCents - Total cents to distribute (must be non-negative integer)
 * @param weights - Proportional weights (each must be > 0)
 * @returns Integer cent allocations in same order as weights
 */
export function distribute(totalCents: number, weights: number[]): number[] {
  if (weights.length === 0) return []
  if (totalCents === 0) return weights.map(() => 0)

  const weightSum = weights.reduce((acc, w) => acc + w, 0)
  const rawShares = weights.map((w) => (w / weightSum) * totalCents)

  let flooredSum = 0
  const parts = rawShares.map((raw, index) => {
    const floored = Math.floor(raw)
    flooredSum += floored
    return { floored, remainder: raw - floored, index }
  })

  // Award remaining cents to largest-remainder entries; stable tiebreaker by index
  const centsShort = totalCents - flooredSum
  parts.sort((a, b) => b.remainder - a.remainder || a.index - b.index)
  for (let i = 0; i < centsShort; i++) {
    parts[i].floored++
  }

  return parts.sort((a, b) => a.index - b.index).map((p) => p.floored)
}
```

### Vitest Test File for Success Criteria

```typescript
// src/engine/math.test.ts
// Source: https://vitest.dev/guide/

import { describe, it, expect } from 'vitest'
import { distribute } from './math'

describe('distribute - largest remainder method', () => {
  it('splits $10.00 three ways and shares sum to exactly 1000 cents', () => {
    const shares = distribute(1000, [1, 1, 1])
    // Individual values: [334, 333, 333]
    expect(shares.reduce((a, b) => a + b, 0)).toBe(1000)
  })

  it('produces zero residual on proportional tip distribution', () => {
    // Three diners with different base amounts; split $15.00 tip proportionally
    const shares = distribute(1500, [3000, 2500, 2000])
    expect(shares.reduce((a, b) => a + b, 0)).toBe(1500)
  })

  it('distributes zero as all zeros', () => {
    expect(distribute(0, [1, 1, 1])).toEqual([0, 0, 0])
  })

  it('handles single recipient (no rounding needed)', () => {
    expect(distribute(333, [1])).toEqual([333])
  })
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 via PostCSS | Tailwind v4 via `@tailwindcss/vite` plugin | Nov 2024 (v4 beta), stable 2025 | No `postcss.config.js` or `tailwind.config.js` needed for basic setup |
| Vite 6 (as in prior decisions) | Vite 7.x (current npm) | June 24, 2025 | Node.js 18 dropped; baseline-widely-available browser target |
| `jest` for React/Vite projects | `vitest` | 2022-2024, now mature v4 | Native ESM/TS support, no transform config needed |
| Zustand `create()` (v4 TS) | `create<T>()()` curried syntax (v5) | Zustand v5 (late 2024) | Must use curried form for TypeScript; plain `create()` still works in JS |

**Deprecated/outdated:**
- `@tailwind base; @tailwind components; @tailwind utilities` directives: Replaced by `@import "tailwindcss"` in v4
- `tailwind.config.js` content paths: Tailwind v4 auto-detects content; no explicit `content: []` array needed
- Vite 6 requirement for Vitest: Vitest 4 requires Vite >= 6.0.0, so Vite 7 fully satisfies this

---

## Open Questions

1. **Should Vite 7 be pinned or used as latest?**
   - What we know: Prior decisions say "Vite 6" but npm current is 7.3.1. Vite 7 is compatible with Vitest 4 (requires >= 6.0.0).
   - What's unclear: Whether the project has any reason to stay on Vite 6 (e.g., plugin compatibility, Node 18 support requirements).
   - Recommendation: Use Vite 7 (`npm create vite@latest`). If Node 18 is a target environment, Vite 6 is required since Vite 7 dropped Node 18. The prior decision to "verify versions against npm before scaffolding" means this is expected to be discovered at scaffolding time.

2. **Does `npm create vite@latest` need a project name, or will it scaffold in the current directory?**
   - What we know: The command `npm create vite@latest` prompts for project name. Passing `.` creates in current directory.
   - What's unclear: Whether the planner wants a subfolder project or in-place scaffolding in the repo root.
   - Recommendation: Planner should decide directory structure before writing the scaffolding task.

3. **Zustand needed in Phase 1?**
   - What we know: Phase 1 goal is only a calculation engine. Zustand is in the stack but the success criteria only require math tests and local build.
   - What's unclear: Whether Zustand installation and basic store scaffolding should be in Phase 1 or deferred to Phase 2 (Data Model).
   - Recommendation: Install Zustand in Phase 1 (verify it builds) but defer writing actual store logic to Phase 2. Phase 1 just needs `npm install zustand` to succeed.

---

## Sources

### Primary (HIGH confidence)

- npm registry (`npm view <package> version`) — verified current versions for: vite (7.3.1), react (19.2.4), typescript (5.9.3), zustand (5.0.11), vitest (4.0.18), tailwindcss (4.1.18), @tailwindcss/vite (4.1.18), @vitejs/plugin-react (5.1.4), @types/react (19.2.14), @types/react-dom (19.2.3), react-dom (19.2.4)
- https://vitest.dev/guide/ — Vitest configuration, environment options, minimum requirements (Vite >= 6)
- https://tailwindcss.com/docs — Tailwind v4 official installation guide for Vite (plugin setup, `@import "tailwindcss"`)
- https://vite.dev/blog/announcing-vite7 — Vite 7 breaking changes (Node 20+ required, browser target change, removed features)
- https://zustand.docs.pmnd.rs/guides/beginner-typescript — Zustand v5 TypeScript curried `create<T>()()` pattern

### Secondary (MEDIUM confidence)

- https://gist.github.com/hijonathan/e597addcc327c9bd017c — LRM implementation, verified against Wikipedia algorithm description
- https://frontstuff.io/how-to-handle-monetary-values-in-javascript — Integer cent arithmetic pattern
- https://www.honeybadger.io/blog/currency-money-calculations-in-javascript/ — Floating-point monetary pitfalls

### Tertiary (LOW confidence — needs validation)

- Medium articles on Vitest + React Testing Library setup — content plausible but not cross-verified against official Vitest docs for v4 specifics

---

## Metadata

**Confidence breakdown:**

- Standard stack versions: HIGH — all verified via `npm view` at research time (2026-02-15)
- Integer cent arithmetic: HIGH — well-established pattern verified via multiple independent sources
- Largest-remainder algorithm: HIGH — verified against Wikipedia canonical description and multiple JS implementations
- Tailwind v4 setup: HIGH — verified against official tailwindcss.com docs
- Vite 7 changes: HIGH — verified against official vite.dev release announcement
- Vitest 4 configuration: MEDIUM — official docs consulted but v4 specifics not as thoroughly documented as v3
- Architecture patterns: MEDIUM — based on established conventions, not a single authoritative source

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (stable ecosystem; npm versions may increment but APIs are stable)
