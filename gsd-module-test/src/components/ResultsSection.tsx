import { useMemo } from 'react'
import { useShallow } from 'zustand/shallow'
import { centsToDollars } from '../engine/math'
import { useBillStore } from '../store/billStore'
import { computeResults } from '../store/computeResults'

export function ResultsSection() {
  const {
    people,
    items,
    assignments,
    tipPercent,
    tipSplitMode,
    taxMode,
    taxValue,
    taxSplitMode,
  } = useBillStore(
    useShallow((s) => ({
      people: s.people,
      items: s.items,
      assignments: s.assignments,
      tipPercent: s.tipPercent,
      tipSplitMode: s.tipSplitMode,
      taxMode: s.taxMode,
      taxValue: s.taxValue,
      taxSplitMode: s.taxSplitMode,
    }))
  )

  const results = useMemo(
    () =>
      computeResults(
        people,
        items,
        assignments,
        tipPercent,
        tipSplitMode,
        taxMode,
        taxValue,
        taxSplitMode
      ),
    [people, items, assignments, tipPercent, tipSplitMode, taxMode, taxValue, taxSplitMode]
  )

  // Count unassigned items
  const unassignedItems = items.filter((item) => {
    const asgn = assignments.find((a) => a.itemId === item.id)?.assignment
    return !asgn || asgn.mode === 'unassigned'
  })
  const unassignedTotal = unassignedItems.reduce((sum, item) => sum + item.priceCents, 0)

  if (people.length === 0) {
    return (
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Results</h2>
        <p className="text-sm text-gray-500">Add people to see results</p>
      </section>
    )
  }

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Results</h2>

      {/* Unassigned items warning */}
      {unassignedItems.length > 0 && (
        <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700" role="alert">
          {unassignedItems.length} item{unassignedItems.length > 1 ? 's' : ''} unassigned
          {' '}&mdash; ${centsToDollars(unassignedTotal)} not included in totals
        </div>
      )}

      {/* Per-person breakdown */}
      <div className="space-y-3 mb-6">
        {results.perPerson.map((person) => (
          <div
            key={person.personId}
            className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">{person.name}</span>
              <span className="font-bold text-gray-900">
                ${centsToDollars(person.totalCents)}
              </span>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${centsToDollars(person.subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tip share</span>
                <span>${centsToDollars(person.tipCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax share</span>
                <span>${centsToDollars(person.taxCents)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Grand total summary */}
      <div className="rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 mb-3">
        <div className="font-semibold text-gray-900 mb-2">Grand Total</div>
        <div className="space-y-1 text-sm text-gray-700">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${centsToDollars(results.subtotalCents)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tip</span>
            <span>${centsToDollars(results.tipCents)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>${centsToDollars(results.taxCents)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-300 pt-1 mt-1">
            <span>Total</span>
            <span>${centsToDollars(results.grandTotalCents)}</span>
          </div>
        </div>
      </div>

      {/* Verification line */}
      <div
        className={`text-sm text-right ${
          results.grandTotalCheck === 0
            ? 'text-green-600'
            : 'text-red-600 font-semibold'
        }`}
        role="status"
      >
        Verification: difference = ${centsToDollars(results.grandTotalCheck)}
      </div>
    </section>
  )
}
