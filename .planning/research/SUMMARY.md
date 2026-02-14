# Project Research Summary

**Project:** Expense Splitter
**Domain:** Client-side restaurant bill splitting web app
**Researched:** 2026-02-13
**Confidence:** MEDIUM (stack versions unverified; architecture and pitfall patterns HIGH confidence)

## Executive Summary

This is a client-side SPA for splitting restaurant bills among a group — no backend, no accounts, mobile-first. The domain is well-understood: every major competitor (Splitwise, Tricount, Tab/Divvy) has solved the same core problem, but none covers the specific niche of no-signup + itemized + proportional tax/tip + mobile web. The recommended approach is React + TypeScript + Vite + Zustand + Tailwind, with all monetary values stored as integer cents and calculations isolated in a pure-function engine. This stack is standard, battle-tested, and has no exotic integration points.

The single biggest risk is mathematical correctness. Floating-point arithmetic produces penny errors in bill calculations that users will notice and that destroy trust. This must be addressed in Phase 1, before any UI is built, by committing to integer-cent storage and the largest-remainder rounding algorithm. The architecture research is high-confidence (React official docs) and prescribes a clean three-layer design — Data Model, Calculation Engine, UI — with unidirectional data flow and derived-not-stored results. Follow this structure from the start; retrofitting it later requires touching every component.

The feature scope is clear and well-bounded. The MVP happy path is: add people, add items, assign items, set tip/tax, see per-person totals. Post-MVP adds persistence (localStorage history), copy-to-clipboard sharing, and itemized receipt view. Everything requiring a backend (auth, push notifications, debt tracking over time, payment integrations) is explicitly out of scope and should not be revisited until the client-side value proposition is proven.

## Key Findings

### Recommended Stack

The recommended stack is React 19 + TypeScript 5 + Vite 6 + Zustand 5 + Tailwind CSS + Decimal.js. Vite replaces the abandoned Create React App; Zustand provides lightweight single-domain state without Redux ceremony; Tailwind handles mobile-first responsive layout with minimal overhead. Decimal.js is non-negotiable for financial arithmetic — native JavaScript floats will produce penny errors that break user trust. Testing via Vitest shares Vite config with zero additional setup.

All version numbers from training data (knowledge cutoff January 2025) and must be verified against npm before scaffolding. The technology choices themselves are stable; only the exact version numbers are uncertain.

**Core technologies:**
- React 19 + TypeScript 5: UI and type safety — types make the financial data model explicit and catch calculation errors at compile time
- Vite 6: Build tool — fastest HMR, shares config with Vitest, zero config for React + TS SPA
- Zustand 5 (with persist middleware): State management — one bill domain object, selector-based subscriptions prevent re-render cascades, built-in localStorage sync
- Decimal.js 10: Precision arithmetic — arbitrary-precision decimal math, required for correct tip/tax/split calculations; alternative is integer-cent storage (both approaches valid, use integer cents per architecture research)
- Tailwind CSS 3 or 4: Styling — mobile-first breakpoints, utility classes map directly to responsive layout intent
- Vitest 2: Testing — shared Vite config, no separate Babel/TS setup needed

### Expected Features

The feature landscape is mature and well-documented. The research identifies a clear MVP boundary: complete the happy path first, add persistence and sharing second.

**Must have (table stakes):**
- Add named participants — without this, output is meaningless
- Add line items with name + price — core input mechanism
- Assign items to one person or split equally among selected people
- Tip calculation with preset buttons (15%, 18%, 20%) and custom input
- Tax as percentage or flat dollar amount with explicit toggle
- Per-person breakdown: subtotal + tax share + tip share + total
- Proportional tax/tip split (not equal) — this is the mathematically correct approach and directly affects trust
- Unassigned item warning — prevents silent calculation errors
- Real-time recalculation — a "Calculate" button feels dated; totals update as input changes
- Clear all / start over — one-click reset between bills

**Should have (competitive):**
- Save/load bills via localStorage — avoids re-entry on page reload
- Named bill history — "Last Friday's dinner" vs. anonymous entries
- Copy-to-clipboard summary — single line of code, very high utility for group chats
- Itemized receipt view per person — builds trust by showing exactly which items each person pays
- Unassigned item warning with visual indicator

**Defer (v2+):**
- Shareable URL encoding — complex for client-side-only, requires encoding full state; marginal value
- Dark mode — no correctness impact, purely aesthetic
- Item quantity field — convenience only
- Venmo/payment app deep links — adds UI complexity for uncommon use case
- shadcn/ui component library — overkill for MVP; consider for UX polish phase

**Out of scope (anti-features, do not build):**
- User accounts / authentication
- Debt tracking over time
- Multi-currency support
- Receipt photo scanning / OCR
- Push notifications
- Social features

### Architecture Approach

The correct architecture is three-layer: a flat Data Model (state held in useReducer + Context), a pure Calculation Engine (isolated module with no React imports), and UI Components (panels that dispatch actions and render derived results). Data flows in one direction. Calculated results (PerPersonResult[]) are never stored — they are computed via useMemo on every render from canonical BillState. This eliminates an entire class of sync bugs.

All monetary values are stored as integer cents, not floating-point dollars. Conversion happens only at the UI boundary: input parses dollars to cents, display converts cents to formatted dollars. The largest-remainder method ensures that distributed shares always sum exactly to the original total.

**Major components:**
1. BillState (useReducer + Context) — holds people, items, assignments, settings; exposes dispatch and read contexts via custom hooks
2. Calculation Engine (src/lib/calculate.ts) — pure functions, no React imports, takes BillState returns PerPersonResult[]; fully unit-testable without DOM
3. PeoplePanel — add/remove/rename participants; dispatches ADD_PERSON, REMOVE_PERSON
4. ItemsPanel — add/remove/edit line items; dispatches ADD_ITEM, REMOVE_ITEM, UPDATE_ITEM
5. AssignPanel — assign items to one or multiple people; dispatches ASSIGN_ITEM
6. SettingsPanel — set tip %, tax %, calculation order; dispatches SET_TIP, SET_TAX, SET_SETTINGS
7. ResultsPanel — renders PerPersonResult[] from Calculation Engine; triggers no state mutations
8. LocalStorage Layer — serializes BillState on every change; validates schema on hydration; versioned from day one

**Key data model decisions:**
- People and items keyed by stable UUID, never by display name
- Assignments stored by itemId, referencing personIds — display names are display-only
- Prices stored as integer cents throughout
- Calculated results derived, never stored

### Critical Pitfalls

All five critical pitfalls are mathematically provable or architecturally well-established. They cannot be addressed mid-project without rewrites.

1. **Floating-point money arithmetic** — use integer cents throughout; never do float arithmetic on prices or calculated shares. Address in Phase 1, before UI. Detection: unit test that splits $10.00 three ways and asserts the sum equals exactly 1000 cents.

2. **Rounding distribution doesn't sum to total** — implement the largest-remainder method (Hamilton's method) for all proportional distributions. A $10.00 split three ways produces $3.33 + $3.33 + $3.33 = $9.99 without this. Address in Phase 1 alongside integer-cents decision.

3. **Wrong tax/tip order of operations** — document and enforce: (1) item subtotals, (2) tax on pre-tip subtotal, (3) tip on pre-tax subtotal (US standard). Test against a known restaurant receipt. Address in Phase 1 calculation engine.

4. **Shared item orphaned on person removal** — when a person is removed, all items assigned to them must be immediately reconciled. Use stable IDs; treat assignment participants as derived from the current person list. Address in Phase 2 (assignment UI and state mutation).

5. **localStorage schema breaks on any field change** — version the schema from the very first save implementation: `{ version: 1, data: {...} }`. Validate deserialized data with a type guard before use. Fall back to empty state on validation failure. Address in Phase 3 (persistence).

## Implications for Roadmap

Based on the combined research, the architecture's own suggested build order and the pitfall phase warnings converge on a clear 4-phase structure. Dependencies are strict: the calculation engine must exist before it can be tested; the state store must exist before UI panels; AssignPanel depends on People and Items panels being functional first.

### Phase 1: Foundation — Data Model, Calculation Engine, and State Store

**Rationale:** Every subsequent phase depends on these three things existing and being correct. The calculation engine must be built and tested in isolation before any UI touches it — this is the only way to catch floating-point and rounding errors before they propagate. The data model defines the TypeScript interfaces every other file imports.

**Delivers:** Correct, tested calculation logic; typed data model; working Zustand store with persist middleware; scaffolded Vite + React + TypeScript + Tailwind project.

**Addresses features:** None directly user-visible, but makes all subsequent features possible.

**Avoids pitfalls:** Pitfall 1 (floating-point — commit to integer cents now), Pitfall 2 (rounding — implement largest-remainder now), Pitfall 3 (tax/tip order — document and test order now), Pitfall 7 (name vs. ID — define `{ id, name }` schema now).

**Research flag:** Standard patterns. React + Zustand + Vite scaffolding is well-documented. No additional research needed for this phase.

### Phase 2: Core UI — People, Items, Assignment, and Settings

**Rationale:** With the state store and calculation engine in place, this phase builds all user-facing data entry panels. AssignPanel depends on PeoplePanel and ItemsPanel being functional. SettingsPanel (tip/tax) can be developed in parallel with AssignPanel. ResultsPanel depends on all other panels being complete enough to produce meaningful state.

**Delivers:** Complete happy path — a user can enter a bill from scratch and see correct per-person totals. This is the app's core value proposition.

**Addresses features:** Add participants, add line items, assign items (individual + shared), tip calculation, tax handling (percentage or flat with toggle), per-person breakdown, unassigned item warning, real-time recalculation, clear/reset.

**Avoids pitfalls:** Pitfall 4 (orphaned assignments on person removal — implement cascade cleanup in REMOVE_PERSON reducer action), Pitfall 6 (zero-subtotal person with proportional split — define policy in UI), Pitfall 8 (negative/zero prices — validate all monetary inputs), Pitfall 9 (tax amount vs. percentage confusion — explicit labeled toggle with real-time preview), Pitfall 10 (custom portions don't sum — use relative weights model), Pitfall 11 (mobile keyboard — use `inputmode="decimal"` on all price inputs), Pitfall 13 (unassigned items distort tip — block final results until all items assigned), Pitfall 14 (removing last person — enforce minimum 1 person or show confirmation).

**Research flag:** Standard patterns for React form handling and Zustand dispatch. No additional research needed. The mobile input patterns (`inputmode="decimal"`) are well-documented in MDN.

### Phase 3: Persistence and History

**Rationale:** The localStorage persist middleware from Zustand handles basic in-session persistence automatically from Phase 1. This phase adds the named bill history — saving, loading, and browsing past splits. Schema versioning must be implemented here from the start; retrofitting it later risks corrupting existing saved data.

**Delivers:** Save/load bill sessions, named bill history list, clear history, schema versioning with migration support.

**Addresses features:** Save/load bills (localStorage), named bill history, view past splits.

**Avoids pitfalls:** Pitfall 5 (localStorage schema breaks — version from first save, validate on load, fall back gracefully), Pitfall 12 (quota exceeded — wrap all setItem in try/catch, cap saved bill count at 20).

**Research flag:** Standard patterns. localStorage access patterns and Zod schema validation are well-documented. No additional research needed.

### Phase 4: Sharing and Polish

**Rationale:** The copy-to-clipboard feature is one line of code and delivers immediate value; the itemized receipt view adds trust. Dark mode and other aesthetic improvements come last — they have no correctness impact. This phase makes the app shareable and production-ready.

**Delivers:** Copy-to-clipboard formatted summary, itemized receipt view per person, mobile layout refinement, edge case handling (empty states, error boundaries), dark mode.

**Addresses features:** Copy-to-clipboard summary, itemized receipt view, dark mode, UX polish.

**Research flag:** Standard patterns. Clipboard API and CSS dark mode (prefers-color-scheme) are well-documented. No additional research needed.

### Phase Ordering Rationale

- Calculation engine before UI is non-negotiable: the math pitfalls (floating-point, rounding, tax order) cannot be detected or fixed if UI and calculation are developed together. Unit tests against pure functions catch these before they reach the user.
- State store before panels: all UI panels consume the Zustand store via custom hooks; panels cannot be built without it.
- AssignPanel after People + Items panels: the assignment UI renders people and items from state; they must exist in the store before they can be listed for selection.
- Persistence as its own phase: the schema versioning decision must be explicit and intentional, not tacked onto the end of Phase 2. Starting it in Phase 3 ensures the data model is stable before committing to a versioned schema.
- Polish last: correctness and completeness before aesthetics.

### Research Flags

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 1:** React + Zustand + Vite scaffolding is documented in official guides. Integer-cents and largest-remainder are established algorithms.
- **Phase 2:** React form handling, Zustand dispatch, MDN inputmode attribute — all standard.
- **Phase 3:** localStorage patterns and Zod schema validation — standard.
- **Phase 4:** Clipboard API, CSS prefers-color-scheme — standard.

No phases in this project require a `/gsd:research-phase` call. The domain is mature, the stack is standard, and the pitfalls are mathematically provable rather than requiring external API research.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Technology choices are sound; version numbers from training data (cutoff Jan 2025) and must be verified against npm before scaffolding. Zustand 5 was in development mid-2024 — verify stable status. |
| Features | MEDIUM | Derived from training knowledge of Splitwise, Tricount, Tab/Divvy. Domain is mature and stable; competitive landscape may have shifted since Jan 2025. |
| Architecture | HIGH | Sourced from React official docs ("Thinking in React," "Managing State," "Scaling Up with Reducer and Context") and MDN Web Storage API. Patterns are stable and well-established. |
| Pitfalls | HIGH | Mathematical pitfalls (1-3) are provable from IEEE 754 specification and JS semantics. Architectural pitfalls (4-5, 7) are well-established state management patterns. UX pitfalls (6, 8-14) are MEDIUM — community-derived but consistent across sources. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Package versions:** All npm package versions must be verified before scaffolding (`npm info react version`, etc.). Training data versions are starting points only.
- **Tailwind v4 stability:** STACK.md flags that Tailwind v4 was announced but status unclear as of training cutoff. Verify whether v4 is stable or v3.4.x is the safer choice before project setup.
- **Zustand 5 stability:** Zustand 5 was in active development mid-2024. Verify current stable version; Zustand 4.x is fully stable as a fallback.
- **Competitive landscape:** FEATURES.md notes competitive positioning has LOW confidence — the bill-splitting market may have new entrants since Jan 2025. Validate before using as a marketing argument.
- **Zod for schema validation:** PITFALLS.md recommends Zod for localStorage schema validation. This is not in STACK.md's dependency list — add it to Phase 3 setup if adopted.

## Sources

### Primary (HIGH confidence)
- React official docs — "Thinking in React," "Managing State," "Scaling Up with Reducer and Context," "Choosing the State Structure": https://react.dev/learn/ — architecture patterns and component design
- MDN Web Storage API — "Using the Web Storage API," "Window: localStorage": https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API — localStorage behavior, quota limits, error handling
- IEEE 754 double-precision floating-point standard — first-principles basis for Pitfalls 1-2
- Hamilton's method (largest-remainder algorithm) — standard apportionment algorithm, directly applicable to bill rounding

### Secondary (MEDIUM confidence)
- Training knowledge of Zustand, Decimal.js, Tailwind CSS, Vite, Vitest documentation (cutoff Jan 2025) — stack recommendations
- Training knowledge of Splitwise, Tricount, Tab/Divvy, Settle Up, Divvy UX patterns — feature landscape and UX conventions
- JavaScript community consensus on prices-as-integers pattern — widely documented in fintech OSS

### Tertiary (LOW confidence)
- Competitive positioning analysis — training data on bill-splitting app landscape as of Jan 2025; may be outdated
- Version numbers for all npm packages — approximate from training data; must be verified

---
*Research completed: 2026-02-13*
*Ready for roadmap: yes*
