# Technology Stack

**Project:** Expense Splitter
**Researched:** 2026-02-13

## Research Constraints

Context7 MCP, WebSearch, WebFetch, and Bash tools were unavailable in this environment. All findings derive from training data (knowledge cutoff January 2025). Version numbers are approximate and MUST be verified against npm/official docs before scaffolding. Confidence levels reflect this constraint honestly.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | ^19.x | UI component model | Dominant ecosystem, hooks model fits the interactive form-heavy bill entry UI perfectly, huge component library support. React 19 stable as of Dec 2024 (verify). |
| TypeScript | ^5.x | Type safety | Financial calculations involving item assignments, split fractions, and rounding are exactly where runtime type errors cause penny bugs. Types make the math model explicit. |
| Vite | ^6.x | Build tool & dev server | Fastest HMR in the React space, trivially scaffolds React+TS, no config needed for client-only SPA. Replaces CRA which is effectively abandoned. |

**Confidence:** MEDIUM — React 19 and Vite 6 release statuses based on late 2024 training data. Verify exact stable versions at npmjs.com before scaffolding.

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | ^5.x | App-wide bill state | A bill (people + items + assignments + tip/tax settings) is one cohesive data structure that multiple components read and mutate. Zustand gives a single store without Redux boilerplate. Tiny bundle (~1KB). |

**Confidence:** MEDIUM — Zustand 5 was in active development as of mid-2024. Verify current stable. Alternative: React Context + useReducer is viable if adding a dependency feels unnecessary for this scope.

**Why not Redux Toolkit:** Overkill. This app has one domain object (a bill). Redux's action/reducer ceremony buys nothing here and adds ~40KB.

**Why not Context API alone:** Context re-renders the entire consumer tree on every state change. A bill can have many items and assignments; this causes visible lag on slower phones. Zustand solves this with selector-based subscriptions.

### Persistence

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| localStorage (native) | Browser API | Persisting past splits | No dependency needed. The data model is JSON-serializable. Key constraint: localStorage is synchronous and has a ~5MB limit — both are fine for storing a list of completed bill splits. |
| zustand/middleware persist | (bundled with Zustand) | Auto-sync store to localStorage | Eliminates manual serialization code. Zustand's built-in `persist` middleware handles JSON serialization, versioning, and hydration on app load. |

**Confidence:** HIGH — localStorage is a stable browser API. Zustand's persist middleware is well-documented and has been stable for years.

### Math / Precision

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Decimal.js | ^10.x | Penny-perfect arithmetic | JavaScript's IEEE 754 floats produce rounding errors in financial calculations (e.g., `0.1 + 0.2 !== 0.3`). Decimal.js provides arbitrary-precision decimal arithmetic. This is non-negotiable for a bill splitter. |

**Confidence:** MEDIUM — Decimal.js 10.x has been stable for several years; verify current version. Alternative candidates: `big.js` (lighter, less API surface) or `dinero.js` (money-specific). See Alternatives section.

**Why Decimal.js over native float math:** A bill with $47.83 split three ways and proportional tax creates cascading rounding. Native floats will reliably produce results where the total column doesn't match the sum of per-person totals. This breaks user trust instantly.

**Why Decimal.js over dinero.js:** Dinero.js v2 requires integer-cent inputs and is opinionated about currency. For a restaurant bill where users enter prices as decimals, Decimal.js is a more natural fit and requires less input transformation.

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | ^3.x or ^4.x | Utility-first styling | Mobile-first responsive design is Tailwind's primary use case. No CSS file management. Component classes map directly to design intent. Works perfectly with Vite. |

**Confidence:** MEDIUM — Tailwind v4 was announced and entering release in late 2024/early 2025. Verify whether v4 is stable or if v3 is the safer choice. If v4 is stable, use it (faster build, CSS-native config). If v4 is still in RC, use v3.4.x which is fully stable.

**Why not CSS Modules:** Valid alternative, but requires naming discipline for a project this small. Tailwind's mobile-first breakpoint system (`sm:`, `md:`) makes responsive layout faster to write.

**Why not styled-components or emotion:** CSS-in-JS adds runtime cost with zero benefit for a static-layout app. Avoid.

### UI Components

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Headless UI | ^2.x | Accessible dropdowns, modals | Tip/tax percentage selectors and confirmation modals need accessible keyboard/ARIA behavior. Headless UI provides this behavior without imposing visual style — style with Tailwind on top. |

**Confidence:** MEDIUM — Headless UI v2 with React support was released in 2024. Verify current version. This is optional: native `<select>` elements are acceptable for MVP and avoid the dependency.

**Alternative:** Skip Headless UI for MVP. Use native form elements. Add Headless UI in a later phase if UX polish requires custom dropdowns.

### Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vitest | ^2.x | Unit testing | Same config as Vite, zero setup. The math engine (split calculations, rounding logic) is pure functions that must be unit tested. Penny-perfect rounding bugs are caught by unit tests, not manual QA. |

**Confidence:** MEDIUM — Vitest 2.x was stable as of mid-2024. Verify current stable version.

**Why not Jest:** Jest requires separate Babel/TS config when using Vite. Vitest shares Vite config natively. No reason to use Jest for a Vite project.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | React 19 | Vue 3 | Both are excellent. React chosen for larger ecosystem and component library availability. Vue is a legitimate alternative if the team prefers it. |
| Framework | React 19 | Svelte / SvelteKit | Svelte has minimal overhead but smaller ecosystem. For a client-only SPA this small, the difference is negligible, but React offers more hiring familiarity. |
| Build tool | Vite | Create React App (CRA) | CRA is unmaintained and archived. Do not use. |
| Build tool | Vite | Next.js | Next.js is a server framework. This app has no server. Using Next.js would add SSR complexity for zero benefit. Avoid. |
| State | Zustand | Redux Toolkit | RTK is excellent but oversized for a single-domain bill object. Zustand is 40x smaller and requires 80% less boilerplate. |
| State | Zustand | Jotai | Jotai (atomic state) is a valid alternative, especially if bill state ends up highly granular. Zustand preferred because the bill is one cohesive object, not independent atoms. |
| Math | Decimal.js | big.js | big.js is lighter (~6KB vs ~32KB). Choose big.js if bundle size is a priority. Decimal.js preferred for richer API (trigonometry not needed, but formatting/rounding modes are). |
| Math | Decimal.js | dinero.js | Dinero v2 requires all values as integer cents. Transforms user input (decimal prices) into cents and back. More correct conceptually but more friction for this use case. |
| Math | Decimal.js | Native JS floats | Never. IEEE 754 floats produce penny errors in chained calculations. This is documented and well-understood. Do not use float math for financial calculations. |
| Styling | Tailwind CSS | CSS Modules | CSS Modules are fine but slower for responsive layout. Tailwind's mobile-first utilities (`px-4 sm:px-8`) map directly to the constraint. |
| Styling | Tailwind CSS | shadcn/ui | shadcn/ui is a component library built on Radix UI + Tailwind. High quality but adds Radix dependency and component scaffolding complexity. Overkill for MVP. Consider for v2. |
| Persistence | localStorage | IndexedDB | IndexedDB supports larger storage and complex queries. Unnecessary: a list of bill splits is small JSON. localStorage is simpler and sufficient. |
| Testing | Vitest | Jest | Jest requires separate config in a Vite project. Vitest shares Vite config. No reason to use Jest here. |

---

## Installation

```bash
# Scaffold with Vite (React + TypeScript template)
npm create vite@latest expense-splitter -- --template react-ts

cd expense-splitter

# Core dependencies
npm install zustand decimal.js

# Styling
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Optional: Accessible UI primitives (defer to later phase)
npm install @headlessui/react

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Note:** Version pins above are approximate. Before running, verify current stable versions:
- `npm info react version`
- `npm info vite version`
- `npm info zustand version`
- `npm info decimal.js version`
- `npm info tailwindcss version`
- `npm info vitest version`

---

## Version Verification Status

| Package | Training Data Version | Verification Status | Action Required |
|---------|----------------------|---------------------|-----------------|
| react | 19.x (Dec 2024) | UNVERIFIED | Check npmjs.com/package/react |
| vite | 6.x (late 2024) | UNVERIFIED | Check npmjs.com/package/vite |
| typescript | 5.x | UNVERIFIED | Check npmjs.com/package/typescript |
| zustand | 5.x (in dev mid-2024) | UNVERIFIED | Check npmjs.com/package/zustand |
| decimal.js | 10.x | UNVERIFIED | Check npmjs.com/package/decimal.js |
| tailwindcss | 3.x stable / 4.x announced | UNVERIFIED | Determine if v4 is stable |
| vitest | 2.x | UNVERIFIED | Check npmjs.com/package/vitest |

**All versions must be verified before scaffolding. Training data is a starting point, not a source of truth for current versions.**

---

## Key Constraints This Stack Addresses

| Constraint | How Stack Addresses It |
|------------|----------------------|
| Browser only, no backend | React SPA via Vite — pure client-side, no SSR needed |
| Local storage persistence | Zustand persist middleware — automatic JSON serialization/hydration |
| Penny-perfect math | Decimal.js — arbitrary-precision decimal arithmetic |
| Mobile-first responsive | Tailwind CSS — mobile-first breakpoint system |
| Single operator, simple UX | Zustand — minimal boilerplate for one-domain state |

---

## Sources

- Training data (knowledge cutoff January 2025) — confidence MEDIUM for framework choices, LOW for specific version numbers
- React 19 release: https://react.dev/blog/2024/12/05/react-19 (unverified, URL from training)
- Vite documentation: https://vitejs.dev/guide/ (unverified, URL from training)
- Decimal.js documentation: https://mikemcl.github.io/decimal.js/ (unverified, URL from training)
- Zustand documentation: https://zustand-demo.pmnd.rs/ (unverified, URL from training)
- Tailwind CSS documentation: https://tailwindcss.com/docs (unverified, URL from training)
- Vitest documentation: https://vitest.dev/ (unverified, URL from training)

**All URLs listed for reference. They were not fetched during this research session (WebFetch was unavailable). Verify before citing.**
