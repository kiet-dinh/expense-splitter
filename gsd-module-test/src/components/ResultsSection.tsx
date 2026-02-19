import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/shallow'
import { centsToDollars } from '../engine/math'
import { useBillStore } from '../store/billStore'
import { useHistoryStore } from '../store/historyStore'
import { computeResults } from '../store/computeResults'
import { formatSummary } from '../engine/formatSummary'
import { computeItemizedBreakdown } from '../engine/itemizedBreakdown'

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

  const [copied, setCopied] = useState(false)
  const [expandedPeople, setExpandedPeople] = useState<Set<string>>(new Set())
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveName, setSaveName] = useState('')

  const { saveSplit } = useHistoryStore(useShallow((s) => ({ saveSplit: s.saveSplit })))

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

  const itemizedBreakdown = useMemo(
    () => computeItemizedBreakdown(people, items, assignments),
    [people, items, assignments]
  )

  const handleCopy = async () => {
    const summary = formatSummary(results, items, assignments)
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: alert the summary for manual copy
      alert(`Copy failed. Here's the summary:\n\n${summary}`)
    }
  }

  const handleSave = () => {
    const trimmedName = saveName.trim()
    if (trimmedName.length === 0) return
    const s = useBillStore.getState()
    try {
      saveSplit({
        name: trimmedName,
        people: s.people,
        items: s.items,
        assignments: s.assignments,
        tipPercent: s.tipPercent,
        tipSplitMode: s.tipSplitMode,
        taxMode: s.taxMode,
        taxValue: s.taxValue,
        taxSplitMode: s.taxSplitMode,
      })
      setSaveName('')
      setShowSaveDialog(false)
    } catch {
      alert('Could not save: browser storage is full.')
    }
  }

  const toggleExpanded = (personId: string) => {
    setExpandedPeople((prev) => {
      const next = new Set(prev)
      if (next.has(personId)) {
        next.delete(personId)
      } else {
        next.add(personId)
      }
      return next
    })
  }

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Results</h2>
        {people.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              aria-label="Save this split"
            >
              Save Split
            </button>
            <button
              onClick={handleCopy}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={copied ? 'Copied to clipboard' : 'Copy summary to clipboard'}
            >
              {copied ? 'Copied!' : 'Copy Summary'}
            </button>
          </div>
        )}
      </div>

      {showSaveDialog && (
        <div className="mb-4 flex gap-2 items-center" role="form" aria-label="Save split">
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSaveDialog(false) }}
            placeholder="Name this split (e.g. Friday dinner)"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={saveName.trim().length === 0}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 focus:outline-none"
            aria-label="Confirm save"
          >
            Save
          </button>
          <button
            onClick={() => { setShowSaveDialog(false); setSaveName('') }}
            className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none"
            aria-label="Cancel save"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Unassigned items warning */}
      {unassignedItems.length > 0 && (
        <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700" role="alert">
          {unassignedItems.length} item{unassignedItems.length > 1 ? 's' : ''} unassigned
          {' '}&mdash; ${centsToDollars(unassignedTotal)} not included in totals
        </div>
      )}

      {/* Per-person breakdown */}
      <div className="space-y-3 mb-6">
        {results.perPerson.map((person) => {
          const personItems = itemizedBreakdown.find(
            (b) => b.personId === person.personId
          )?.items ?? []
          const isExpanded = expandedPeople.has(person.personId)

          return (
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

              {/* Itemized breakdown toggle */}
              {personItems.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => toggleExpanded(person.personId)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium focus:outline-none"
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Hide' : 'Show'} itemized details for ${person.name}`}
                  >
                    {isExpanded ? 'Hide details' : 'Show details'}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 space-y-1.5" role="region" aria-label={`Itemized breakdown for ${person.name}`}>
                      {personItems.map((item) => (
                        <div
                          key={item.itemId}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-gray-700 truncate">
                              {item.itemName}
                            </span>
                            {item.splitNote && (
                              <span className="text-xs text-gray-500 shrink-0">
                                ({item.splitNote})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {item.theirShareCents !== item.fullPriceCents && (
                              <span className="text-xs text-gray-400">
                                ${centsToDollars(item.fullPriceCents)}
                              </span>
                            )}
                            <span className="text-gray-900 font-medium">
                              ${centsToDollars(item.theirShareCents)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
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
