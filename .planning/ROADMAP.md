# Roadmap: Expense Splitter

## Overview

Build a mobile-first web app that splits restaurant bills accurately among friends. The project starts with a correct math engine (the trust foundation), then layers on the full bill-entry UI, then adds sharing and history. Four phases deliver a complete, locally-persistent bill splitter with no backend required.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Scaffold project and build a correct, tested calculation engine (completed 2026-02-15)
- [x] **Phase 2: Core UI** - Complete happy path: add people, items, assignments, tip/tax, see results (completed 2026-02-16)
- [x] **Phase 3: Results Polish** - Copy-to-clipboard summary and itemized per-person receipt view (completed 2026-02-17)
- [x] **Phase 4: Persistence** - Save, browse, and delete bill history in local storage (completed 2026-02-18)

## Phase Details

### Phase 1: Foundation
**Goal**: A tested calculation engine exists that handles all monetary math without floating-point errors or rounding mistakes
**Depends on**: Nothing (first phase)
**Requirements**: MATH-01, MATH-02
**Success Criteria** (what must be TRUE):
  1. A unit test splits $10.00 three ways and asserts the three shares sum to exactly 1000 cents
  2. A unit test verifies proportional tip and tax distributions using the largest-remainder method produce zero residual
  3. The project builds and runs locally with the full stack (React, TypeScript, Vite, Zustand, Tailwind)
**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md -- Scaffold Vite 7 + React 19 + TypeScript 5 + Zustand 5 + Tailwind v4 + Vitest 4 project
- [x] 01-02-PLAN.md -- TDD: Calculation engine with integer-cent arithmetic and largest-remainder rounding

### Phase 2: Core UI
**Goal**: Users can enter a complete restaurant bill and see a correct per-person breakdown without refreshing the page
**Depends on**: Phase 1
**Requirements**: PEOPLE-01, PEOPLE-02, PEOPLE-03, PEOPLE-04, ITEM-01, ITEM-02, ITEM-03, ITEM-04, ASSIGN-01, ASSIGN-02, ASSIGN-03, ASSIGN-04, TIP-01, TIP-02, TAX-01, TAX-02, RESULT-01, RESULT-02
**Success Criteria** (what must be TRUE):
  1. User can add and remove named people, and sees a warning on duplicate name entry
  2. User can add, edit, and delete line items and sees a running subtotal update in real time
  3. User can assign any item to one person, multiple people equally, multiple people with custom portions, or everyone at once
  4. User can set tip via preset buttons (15%, 18%, 20%) or custom input, and choose equal or proportional split
  5. User sees a per-person breakdown with subtotal, tip share, tax share, and total, plus a grand-total verification
**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md -- Zustand store, computeResults function, and test infrastructure
- [x] 02-02-PLAN.md -- People and Item UI sections with component tests
- [x] 02-03-PLAN.md -- Assignment, Tip/Tax, and Results UI sections with final App composition

### Phase 3: Results Polish
**Goal**: Users can share the split result and inspect exactly which items they owe
**Depends on**: Phase 2
**Requirements**: RESULT-03, RESULT-04
**Success Criteria** (what must be TRUE):
  1. User can copy a formatted text summary of the split to the clipboard with one tap
  2. User can view an itemized receipt showing each person's individual items and their assigned shares
**Plans**: TBD

Plans:
- [x] 03-01: Copy-to-clipboard summary and itemized receipt view

### Phase 4: Persistence
**Goal**: Users can save a completed split, browse past splits by name, and delete ones they no longer need
**Depends on**: Phase 3
**Requirements**: PERSIST-01, PERSIST-02, PERSIST-03, PEOPLE-04
**Success Criteria** (what must be TRUE):
  1. User can save a named split and reload the app to find it still listed in history
  2. User can tap a past split to view its full breakdown
  3. User can delete a saved split and it is removed from the list immediately
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md — Persisted history store (useHistoryStore with Zustand persist middleware)
- [x] 04-02-PLAN.md — HistorySection UI (list, load, delete) wired into App.tsx
- [x] 04-03-PLAN.md — Save Split button in ResultsSection + PEOPLE-04 quick-add chips in PeopleSection

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
| --- | --- | --- | --- |
| 1. Foundation | 2/2 | ✓ Complete | 2026-02-15 |
| 2. Core UI | 3/3 | ✓ Complete | 2026-02-16 |
| 3. Results Polish | 1/1 | ✓ Complete | 2026-02-17 |
| 4. Persistence | 3/3 | ✓ Complete | 2026-02-18 |
