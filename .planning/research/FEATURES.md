# Feature Landscape

**Domain:** Restaurant bill splitting web app (client-side, no backend)
**Researched:** 2026-02-13
**Confidence note:** WebSearch and WebFetch were unavailable. All findings draw from training knowledge of Splitwise, Tricount, Tab, Settle Up, Divvy, and community discussions. Confidence is noted per section. The bill-splitting domain is mature and well-documented, so training data is reasonably reliable here.

---

## Table Stakes

Features users expect. Missing = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Add named participants | Every competitor has this; without names the output is meaningless | Low | Names only — no auth, no avatars needed |
| Add line items with prices | Core input mechanism; users expect itemized entry | Low | Item name + price as the minimum fields |
| Assign items to one person | The most primitive form of splitting — "this is mine" | Low | Must-have before shared-item support |
| Assign items to multiple people (shared) | Common real-world case: shared appetizer, bottle of wine | Medium | Requires splitting item price N-ways among assignees |
| Tip calculation | Every restaurant bill has tip; users expect this to be handled automatically | Low-Medium | Preset buttons (15%, 18%, 20%) + custom % input |
| Tax handling | Tax is on every bill; users expect it included in totals | Low-Medium | Either as percentage or as flat dollar amount |
| Per-person total breakdown | The whole point — "Alice owes $24.50" — must be the output | Low | Must show subtotal + tax + tip portions |
| Mobile-responsive layout | Bills are split at restaurants, on phones; desktop-only feels broken | Medium | Mobile-first is the correct default |
| Real-time recalculation | Changing tip % or reassigning an item must update totals immediately | Low-Medium | Users expect instant feedback, not a "calculate" button |
| Clear all / start over | Users need to reset between bills without refreshing the page | Low | One-click reset of all state |
| Equal split fallback | Some users don't care about per-item accuracy and just want N-way equal | Low | Should co-exist with itemized mode |

**Confidence: MEDIUM** — These match the pattern across all major bill-splitting apps consistently. The specific UX details (preset tip buttons, inline name entry) come from training data on Splitwise, Tricount, and similar products.

---

## Differentiators

Features that set the product apart. Not universally expected, but valued when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Save/load bills (local storage) | Users return to check totals or reopen same session; avoids re-entry | Medium | Requires serialization, history list UI |
| Named bill history | "Last Friday's dinner" vs anonymous entries in history | Low | Just a name field on the bill |
| Proportional tax/tip split | Split tax and tip proportional to each person's subtotal, not equal — more accurate | Medium | Equal split is simpler but unfair when items vary in price; proportional is the "correct" math |
| Itemized receipt view | Show each person exactly which items they're paying for, not just their dollar total | Low-Medium | Builds trust in the calculation |
| Copy-to-clipboard summary | One button to copy "Alice: $24.50, Bob: $18.00" for pasting into a group chat | Low | Very high utility for the share-with-friends use case |
| Shareable URL / link | Encode the bill state in a URL so one person can share the full breakdown | High | Requires URL encoding of state; complex for client-side only; out of scope given no backend |
| Rounding strategy choice | Choose how to handle fractional cent rounding (round up, round nearest, absorb in one person) | Medium | Users notice when amounts don't add up to the exact bill total |
| Item quantity field | "3x beers at $8 each" rather than manually entering $24 | Low | Quality-of-life improvement for common patterns |
| Unassigned item warning | Visual indicator when items haven't been assigned to anyone | Low | Prevents silent errors in the output |
| Dark mode | Aesthetic preference, increasingly expected | Low | Pure CSS, low effort, but still a differentiator for this category |
| Venmo/payment app deep links | "Pay Alice $24.50" button opens Venmo with amount pre-filled | Medium | Venmo supports URL scheme; requires knowing recipient's Venmo handle — adds friction |

**Confidence: MEDIUM** — Proportional tax/tip splitting, copy-to-clipboard, and rounding handling are validated patterns from real-world reviews of Splitwise and similar apps. Shareable URL pattern is standard but complex for client-side-only apps.

---

## Anti-Features

Features to explicitly NOT build in this project scope.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| User accounts / authentication | Adds backend complexity that conflicts with the "client-side only" requirement; also adds friction at point of use | Client-side local storage for persistence |
| Debt tracking over time ("who owes who") | Splitwise's core product; this app is per-bill, not per-relationship; building this requires a data model change | Scope to single-bill calculation only |
| Push notifications / reminders | Requires backend, service workers, notification permissions; far out of scope | N/A — no ongoing debt tracking |
| Multi-currency support | Adds significant complexity to calculation and display; restaurant bills are single-currency | Assume single currency throughout |
| Receipt photo scanning / OCR | Impressive but high complexity; depends on third-party OCR APIs which contradicts client-side-only | Manual item entry is the scope |
| Splitting by percentage (not by item) | This is a different mental model; per-item assignment is the value proposition of this app | Stick to itemized model with equal-split fallback |
| Social features (friend lists, activity feed) | Out of scope; adds backend requirements | Not applicable |
| In-app messaging | Requires backend; adds no value to the core calculation task | Copy-to-clipboard serves the "share result" need |
| Venmo/payment integration (sending money) | Requires OAuth, API keys, backend token handling — incompatible with client-side-only | Deep link to payment apps (open the app with amount) is acceptable; actual payment is not |
| Export to PDF/spreadsheet | Low demand for this use case; adds library weight | Copy-to-clipboard is sufficient |

**Confidence: HIGH** — These are explicitly excluded by the project's "client-side only" constraint or conflict with the stated core value proposition. No external verification needed.

---

## Feature Dependencies

```
Add participants → Assign items to people
  (Can't assign without people to assign to)

Add items → Assign items to people
  (Can't assign without items to assign)

Assign items to people → Per-person breakdown
  (Breakdown calculation requires assignments)

Per-person breakdown → Copy-to-clipboard summary
  (Nothing to copy without calculated totals)

Per-person breakdown → Itemized receipt view
  (Receipt view is a display variant of the breakdown)

Bill data model → Save to local storage
  (Must have a serializable bill structure before persisting)

Save to local storage → View past splits / history
  (History requires save to exist first)

Proportional tip/tax split → Per-person breakdown
  (Breakdown depends on which split strategy is chosen)

Tip calculation → Per-person breakdown
  (Tip portion must be computed before totals are final)

Tax handling → Per-person breakdown
  (Tax portion must be computed before totals are final)
```

---

## MVP Recommendation

The MVP must deliver the complete happy path: enter people, enter items, assign items, add tip and tax, see who owes what.

**Prioritize for MVP:**
1. Add participants (names only)
2. Add line items with name + price
3. Assign items to one person or split equally among selected people
4. Tip calculation with preset buttons (15%, 18%, 20%) and custom input
5. Tax calculation as percentage or flat dollar amount
6. Per-person breakdown showing subtotal + tax share + tip share + total
7. Proportional tax/tip split (not equal) — this is the correct math and not much harder to implement; equal split leads to user complaints about accuracy
8. Unassigned item warning (prevents silent errors)
9. Real-time recalculation (not a "Calculate" button — feels dated)

**Defer to Post-MVP:**
- Save to local storage / history: real value but not needed for first use
- Copy-to-clipboard summary: one line of code, add it early in post-MVP
- Dark mode: no user impact on correctness
- Item quantity field: convenience only
- Named bill history with labels: nice but not core
- Itemized receipt view per person: useful but the totals are sufficient for MVP

**Skip entirely (out of scope):**
- Shareable URL encoding (complex, marginal value without backend)
- Venmo deep links (adds UI complexity for uncommon use)
- Equal split mode as a separate "mode" — just allow assigning all people to an item

---

## UX Patterns from the Domain

These are not features but UX conventions users expect based on existing apps. Violating them creates friction.

**Confidence: MEDIUM** (training knowledge of Splitwise, Tricount, Divvy UX)

| Pattern | Why It Matters |
|---------|---------------|
| Show running total as items are added | Users want to verify the entered total matches the paper receipt |
| Tip % buttons above custom input | Preset buttons are tapped 80%+ of the time; custom should be secondary |
| Assignment uses checkboxes or multi-tap, not drag-and-drop | Drag-and-drop is fragile on mobile; tap-to-toggle is standard |
| Amounts displayed to 2 decimal places consistently | $8 should display as $8.00; inconsistency looks like a bug |
| Rounding displayed, not hidden | If cents don't add up perfectly, show where the rounding went — don't silently absorb it |
| Person totals sum to bill total | Users will verify this; any discrepancy (even $0.01) destroys trust |

---

## Competitive Positioning

This app occupies a specific niche: **single-occasion restaurant bill splitting, no account required, mobile-first**. The closest competitors are:

- **Splitwise** — focused on ongoing group debt tracking, not per-bill itemized splitting. Requires account. Overkill for one dinner.
- **Tricount** — closer to this scope (trip expenses), but not restaurant-item-specific. Requires creating a "group."
- **Tab (formerly Divvy)** — itemized receipt splitting via photo scan. Account required. iOS app, not web.
- **billr / Billsplit** — various web-based calculators exist but typically lack itemized assignment + proportional tax/tip.

The gap this app fills: **no-signup, itemized, proportional tax/tip, mobile web**. This combination is genuinely underserved by the existing landscape.

**Confidence: LOW** — Competitive positioning drawn entirely from training data (cutoff Jan 2025). The competitive landscape may have changed. Validate before using this as a marketing argument.

---

## Sources

- Training knowledge of Splitwise, Tricount, Tab/Divvy, Settle Up, and bill-splitting web calculator apps (cutoff Jan 2025) — MEDIUM confidence
- Project context provided by orchestrator — HIGH confidence
- No WebSearch or WebFetch available for this research session; external source verification was not possible
