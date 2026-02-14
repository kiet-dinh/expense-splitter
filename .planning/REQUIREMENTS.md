# Requirements: Expense Splitter

**Defined:** 2026-02-13
**Core Value:** Accurately calculate what each person owes when a group shares a restaurant bill with mixed individual and shared items.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### People Management

- [ ] **PEOPLE-01**: User can add people to a bill by name
- [ ] **PEOPLE-02**: User can remove people from a bill
- [ ] **PEOPLE-03**: User sees a warning when entering a duplicate name
- [ ] **PEOPLE-04**: User can quick-add names from previous splits

### Item Entry

- [ ] **ITEM-01**: User can add items with a name and price
- [ ] **ITEM-02**: User can edit an existing item's name or price
- [ ] **ITEM-03**: User can delete an item from the bill
- [ ] **ITEM-04**: User sees a running subtotal as items are added or changed

### Item Assignment

- [ ] **ASSIGN-01**: User can assign an item to one person
- [ ] **ASSIGN-02**: User can assign an item to multiple people to split equally
- [ ] **ASSIGN-03**: User can assign an item with custom portions per person
- [ ] **ASSIGN-04**: User can assign an item to everyone with one click

### Tip & Tax

- [ ] **TIP-01**: User can select a tip percentage from presets (15%, 18%, 20%) or enter a custom percentage
- [ ] **TIP-02**: User can choose to split tip equally or proportionally based on each person's subtotal
- [ ] **TAX-01**: User can enter tax as a dollar amount or a percentage
- [ ] **TAX-02**: User can choose to split tax equally or proportionally based on each person's subtotal

### Results

- [ ] **RESULT-01**: User sees a per-person breakdown showing subtotal, tip share, tax share, and total owed
- [ ] **RESULT-02**: User sees verification that all individual totals sum to the grand total
- [ ] **RESULT-03**: User can copy a text summary of the split to clipboard
- [ ] **RESULT-04**: User can view an itemized receipt showing what each person ordered

### Persistence

- [ ] **PERSIST-01**: User can save a completed split to browser local storage
- [ ] **PERSIST-02**: User can view a list of previously saved splits
- [ ] **PERSIST-03**: User can delete a saved split

### Math Accuracy

- [ ] **MATH-01**: All calculations use integer cent arithmetic (no floating-point errors)
- [ ] **MATH-02**: Rounding distributes pennies correctly using largest-remainder method (no lost or extra cents)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Input

- **INPUT-01**: User can upload a receipt photo and auto-populate items via OCR

### Payments

- **PAY-01**: User can generate Venmo/payment deep links from the results screen

### Sharing

- **SHARE-01**: User can share a split via a shareable link

### History

- **HIST-01**: User can view history with search and date filtering

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / authentication | Unnecessary for local-first tool |
| Backend / database | Browser-only, no server needed |
| Multi-device sync | Single operator model, no backend |
| Real-time collaboration | Single operator enters everything |
| Ongoing debt tracking | This is a one-time split tool, not a ledger |
| Native mobile app | Web-first, accessible from any device |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PEOPLE-01 | — | Pending |
| PEOPLE-02 | — | Pending |
| PEOPLE-03 | — | Pending |
| PEOPLE-04 | — | Pending |
| ITEM-01 | — | Pending |
| ITEM-02 | — | Pending |
| ITEM-03 | — | Pending |
| ITEM-04 | — | Pending |
| ASSIGN-01 | — | Pending |
| ASSIGN-02 | — | Pending |
| ASSIGN-03 | — | Pending |
| ASSIGN-04 | — | Pending |
| TIP-01 | — | Pending |
| TIP-02 | — | Pending |
| TAX-01 | — | Pending |
| TAX-02 | — | Pending |
| RESULT-01 | — | Pending |
| RESULT-02 | — | Pending |
| RESULT-03 | — | Pending |
| RESULT-04 | — | Pending |
| PERSIST-01 | — | Pending |
| PERSIST-02 | — | Pending |
| PERSIST-03 | — | Pending |
| MATH-01 | — | Pending |
| MATH-02 | — | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 0
- Unmapped: 25 ⚠️

---
*Requirements defined: 2026-02-13*
*Last updated: 2026-02-13 after initial definition*
