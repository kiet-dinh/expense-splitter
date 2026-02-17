import { useId, useState } from 'react'
import { useShallow } from 'zustand/shallow'
import { centsToDollars, dollarsToCents } from '../engine/math'
import { useBillStore } from '../store/billStore'

export function ItemSection() {
  const { items, addItem, updateItem, removeItem } = useBillStore(
    useShallow((s) => ({
      items: s.items,
      addItem: s.addItem,
      updateItem: s.updateItem,
      removeItem: s.removeItem,
    }))
  )

  // Add form state
  const [nameInput, setNameInput] = useState('')
  const [priceInput, setPriceInput] = useState('')

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')

  const nameInputId = useId()
  const priceInputId = useId()

  const subtotalCents = items.reduce((sum, item) => sum + item.priceCents, 0)

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (nameInput.trim().length === 0) return
    const cents = dollarsToCents(priceInput)
    if (cents === 0) return
    addItem(nameInput.trim(), cents)
    setNameInput('')
    setPriceInput('')
  }

  function startEdit(id: string, name: string, priceCents: number) {
    setEditingId(id)
    setEditName(name)
    setEditPrice(centsToDollars(priceCents))
  }

  function commitEdit(id: string) {
    const name = editName.trim()
    if (name.length === 0) {
      cancelEdit()
      return
    }
    updateItem(id, {
      name,
      priceCents: dollarsToCents(editPrice),
    })
    setEditingId(null)
    setEditName('')
    setEditPrice('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditPrice('')
  }

  function handleEditKeyDown(
    e: React.KeyboardEvent,
    id: string
  ) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit(id)
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Items</h2>

      {/* Add form */}
      <form onSubmit={handleAddSubmit} className="flex flex-wrap gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor={nameInputId} className="sr-only">
            Item name
          </label>
          <input
            id={nameInputId}
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Item name"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={priceInputId} className="sr-only">
            Price
          </label>
          <input
            id={priceInputId}
            type="text"
            inputMode="decimal"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            placeholder="0.00"
            className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Item
        </button>
      </form>

      {/* Item list */}
      {items.length > 0 && (
        <ul className="mt-4 space-y-2">
          {items.map((item) =>
            editingId === item.id ? (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-2 rounded-md bg-blue-50 px-3 py-2"
                onBlur={(e) => {
                  // Only commit when focus leaves the entire edit row
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    commitEdit(item.id)
                  }
                }}
              >
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => handleEditKeyDown(e, item.id)}
                  aria-label="Edit item name"
                  className="flex-1 rounded border border-blue-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                <input
                  type="text"
                  inputMode="decimal"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  onKeyDown={(e) => handleEditKeyDown(e, item.id)}
                  aria-label="Edit item price"
                  className="w-24 rounded border border-blue-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </li>
            ) : (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
                onDoubleClick={() =>
                  startEdit(item.id, item.name, item.priceCents)
                }
              >
                <span className="flex-1 text-sm text-gray-800">
                  {item.name}
                </span>
                <span className="mr-4 text-sm text-gray-600">
                  ${centsToDollars(item.priceCents)}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      startEdit(item.id, item.name, item.priceCents)
                    }
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      {/* Running subtotal — always present in DOM for aria-live */}
      <div
        aria-live="polite"
        className="mt-4 text-right text-sm font-bold text-gray-900"
      >
        Subtotal: ${centsToDollars(subtotalCents)}
      </div>
    </section>
  )
}
