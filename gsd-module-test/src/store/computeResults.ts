import { distribute } from '../engine/math'
import type { Person, Item, ItemAssignment, TipSplitMode, TaxMode, TaxSplitMode } from './billStore'

export interface PersonResult {
  personId:      string
  name:          string
  subtotalCents: number
  tipCents:      number
  taxCents:      number
  totalCents:    number
}

export interface BillResults {
  subtotalCents:   number
  tipCents:        number
  taxCents:        number
  grandTotalCents: number
  perPerson:       PersonResult[]
  grandTotalCheck: number   // should always be 0: grandTotal - sum(person.total)
}

export function computeResults(
  people: Person[],
  items: Item[],
  assignments: ItemAssignment[],
  tipPercent: number,
  tipSplitMode: TipSplitMode,
  taxMode: TaxMode,
  taxValue: number,
  taxSplitMode: TaxSplitMode,
): BillResults {
  if (people.length === 0) {
    return { subtotalCents: 0, tipCents: 0, taxCents: 0, grandTotalCents: 0, perPerson: [], grandTotalCheck: 0 }
  }

  // 1. Per-person item subtotals
  const personSubtotals = new Map<string, number>(people.map((p) => [p.id, 0]))

  for (const item of items) {
    const asgn = assignments.find((a) => a.itemId === item.id)?.assignment ?? { mode: 'unassigned' as const }

    if (asgn.mode === 'unassigned') continue

    if (asgn.mode === 'single') {
      const cur = personSubtotals.get(asgn.personId) ?? 0
      personSubtotals.set(asgn.personId, cur + item.priceCents)
    }
    else if (asgn.mode === 'everyone') {
      const shares = distribute(item.priceCents, people.map(() => 1))
      people.forEach((p, i) => {
        personSubtotals.set(p.id, (personSubtotals.get(p.id) ?? 0) + shares[i])
      })
    }
    else if (asgn.mode === 'equal') {
      const recipients = asgn.personIds
      const shares = distribute(item.priceCents, recipients.map(() => 1))
      recipients.forEach((pid, i) => {
        personSubtotals.set(pid, (personSubtotals.get(pid) ?? 0) + shares[i])
      })
    }
    else if (asgn.mode === 'custom') {
      const { portions } = asgn
      const shares = distribute(item.priceCents, portions.map((p) => p.weight))
      portions.forEach(({ personId }, i) => {
        personSubtotals.set(personId, (personSubtotals.get(personId) ?? 0) + shares[i])
      })
    }
  }

  // subtotalCents = sum of assigned item amounts (unassigned items excluded)
  const subtotalCents = Array.from(personSubtotals.values()).reduce((a, b) => a + b, 0)

  // 2. Tip
  const tipCents = Math.round(subtotalCents * tipPercent / 100)
  const tipWeights = tipSplitMode === 'proportional'
    ? people.map((p) => personSubtotals.get(p.id) ?? 0)
    : people.map(() => 1)
  // Guard: if all weights zero, fall back to equal distribution (prevents NaN)
  const safeTipWeights = tipWeights.every((w) => w === 0) ? people.map(() => 1) : tipWeights
  const tipShares = distribute(tipCents, safeTipWeights)

  // 3. Tax
  const taxCents = taxMode === 'amount'
    ? taxValue
    : Math.round(subtotalCents * taxValue / 100)
  const taxWeights = taxSplitMode === 'proportional'
    ? people.map((p) => personSubtotals.get(p.id) ?? 0)
    : people.map(() => 1)
  // Guard: if all weights zero, fall back to equal distribution
  const safeTaxWeights = taxWeights.every((w) => w === 0) ? people.map(() => 1) : taxWeights
  const taxShares = distribute(taxCents, safeTaxWeights)

  // 4. Per-person results
  const grandTotalCents = subtotalCents + tipCents + taxCents
  const perPerson: PersonResult[] = people.map((p, i) => {
    const sub = personSubtotals.get(p.id) ?? 0
    const tip = tipShares[i]
    const tax = taxShares[i]
    return {
      personId:      p.id,
      name:          p.name,
      subtotalCents: sub,
      tipCents:      tip,
      taxCents:      tax,
      totalCents:    sub + tip + tax,
    }
  })

  const grandTotalCheck = grandTotalCents - perPerson.reduce((a, r) => a + r.totalCents, 0)

  return { subtotalCents, tipCents, taxCents, grandTotalCents, perPerson, grandTotalCheck }
}
