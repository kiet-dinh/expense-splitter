# Expense Splitter

## What This Is

A web app that splits restaurant bills fairly among friends. One person enters the bill details — people, items, who had what — and the app calculates exactly what each person owes, including tip and tax. Designed to be used at the table on a phone or laptop.

## Core Value

Accurately calculate what each person owes when a group shares a restaurant bill with mixed individual and shared items.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Add/remove people to a bill by name
- [ ] Add items with prices from the receipt
- [ ] Assign items to one person, multiple people, or everyone
- [ ] Shared items split equally or by custom portions per person
- [ ] Tip calculation with preset percentages (15%, 18%, 20%) and custom input
- [ ] Tip split method: equal across everyone OR proportional to subtotal
- [ ] Tax calculation by amount or percentage
- [ ] Tax split method: equal OR proportional
- [ ] Final per-person breakdown showing subtotal, tip share, tax share, and total
- [ ] Save splits to browser local storage
- [ ] View past splits

### Out of Scope

- Receipt OCR / photo upload — high complexity, v2 feature
- Payment deep links (Venmo, etc.) — v2 feature
- Sharing splits via link — requires backend
- User accounts / authentication — unnecessary for local-first tool
- Multi-device collaboration — single operator model
- Backend / database — browser-only, no server

## Context

- Single-page web app, no backend required
- One person operates the app and enters the full bill
- Local storage for persistence across sessions
- Must handle rounding correctly (pennies shouldn't disappear or multiply)
- Mobile-friendly — likely used on a phone at the table
- Tech stack to be determined by research

## Constraints

- **Platform**: Web browser (mobile-first responsive)
- **Storage**: Browser local storage only, no server
- **Operator model**: Single user enters everything
- **Math accuracy**: Rounding must account for every penny (no lost/extra cents)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web app, not native | Accessible from any device, no install needed | — Pending |
| Single operator | Simpler UX, more practical at a dinner table | — Pending |
| Local storage only | No backend complexity, privacy-friendly | — Pending |
| Shared items: equal or custom portions | Flexibility for different sharing scenarios | — Pending |

---
*Last updated: 2026-02-13 after initialization*
