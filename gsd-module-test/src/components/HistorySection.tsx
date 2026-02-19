import { useShallow } from 'zustand/shallow'
import { useHistoryStore } from '../store/historyStore'
import type { SavedSplit } from '../store/historyStore'
import { useBillStore } from '../store/billStore'

export function HistorySection() {
  const { savedSplits, deleteSplit } = useHistoryStore(
    useShallow((s) => ({ savedSplits: s.savedSplits, deleteSplit: s.deleteSplit }))
  )

  function handleLoad(split: SavedSplit) {
    const s = useBillStore.getState()
    const hasBillData = s.people.length > 0 || s.items.length > 0
    if (hasBillData) {
      const confirmed = window.confirm('Loading this split will replace your current bill. Continue?')
      if (!confirmed) return
    }
    useBillStore.setState({
      people: split.people,
      items: split.items,
      assignments: split.assignments,
      tipPercent: split.tipPercent,
      tipSplitMode: split.tipSplitMode,
      taxMode: split.taxMode,
      taxValue: split.taxValue,
      taxSplitMode: split.taxSplitMode,
    })
  }

  if (savedSplits.length === 0) {
    return (
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">History</h2>
        <p>No saved splits yet</p>
      </section>
    )
  }

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">History</h2>
      <ul className="space-y-2">
        {savedSplits.map((split) => (
          <li
            key={split.id}
            className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
          >
            <div>
              <span>{split.name}</span>
              <span className="ml-2 text-sm text-gray-500">
                {new Date(split.savedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none"
                onClick={() => handleLoad(split)}
              >
                Load
              </button>
              <button
                className="text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none"
                onClick={() => deleteSplit(split.id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
