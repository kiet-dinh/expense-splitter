import { useId, useState } from 'react'
import { useShallow } from 'zustand/shallow'
import { dollarsToCents, centsToDollars } from '../engine/math'
import { useBillStore } from '../store/billStore'
import type { Assignment } from '../store/billStore'

type AssignMode = 'single' | 'equal' | 'custom' | 'everyone'

interface ItemRowProps {
  itemId: string
  itemName: string
  priceCents: number
  currentAssignment: Assignment
}

function ItemRow({ itemId, itemName, priceCents, currentAssignment }: ItemRowProps) {
  const { people, setAssignment } = useBillStore(
    useShallow((s) => ({
      people: s.people,
      setAssignment: s.setAssignment,
    }))
  )

  // Derive initial mode from current assignment
  function deriveMode(asgn: Assignment): AssignMode {
    if (asgn.mode === 'single') return 'single'
    if (asgn.mode === 'equal') return 'equal'
    if (asgn.mode === 'custom') return 'custom'
    if (asgn.mode === 'everyone') return 'everyone'
    return 'single'
  }

  const [mode, setMode] = useState<AssignMode>(() => deriveMode(currentAssignment))

  // Single mode state
  const [selectedPersonId, setSelectedPersonId] = useState<string>(() => {
    if (currentAssignment.mode === 'single') return currentAssignment.personId
    return people[0]?.id ?? ''
  })

  // Equal mode state
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => {
    if (currentAssignment.mode === 'equal') return new Set(currentAssignment.personIds)
    return new Set<string>()
  })

  // Custom mode state: string inputs while editing, stored as cents
  const [customInputs, setCustomInputs] = useState<Record<string, string>>(() => {
    if (currentAssignment.mode === 'custom') {
      const result: Record<string, string> = {}
      for (const portion of currentAssignment.portions) {
        result[portion.personId] = centsToDollars(portion.weight)
      }
      return result
    }
    return {}
  })

  const baseId = useId()

  function handleModeChange(newMode: AssignMode) {
    setMode(newMode)
    // When switching modes, update the store to unassigned (incomplete state)
    // Except for modes that are immediately complete
    if (newMode === 'single') {
      const pid = people[0]?.id
      if (pid) {
        setSelectedPersonId(pid)
        setAssignment(itemId, { mode: 'single', personId: pid })
      } else {
        setAssignment(itemId, { mode: 'unassigned' })
      }
    } else if (newMode === 'everyone') {
      setAssignment(itemId, { mode: 'everyone' })
    } else if (newMode === 'equal') {
      setCheckedIds(new Set())
      setAssignment(itemId, { mode: 'unassigned' })
    } else if (newMode === 'custom') {
      setCustomInputs({})
      setAssignment(itemId, { mode: 'unassigned' })
    }
  }

  function handleSinglePersonChange(personId: string) {
    setSelectedPersonId(personId)
    setAssignment(itemId, { mode: 'single', personId })
  }

  function handleEqualCheckChange(personId: string, checked: boolean) {
    const next = new Set(checkedIds)
    if (checked) {
      next.add(personId)
    } else {
      next.delete(personId)
    }
    setCheckedIds(next)
    const personIds = Array.from(next)
    if (personIds.length > 0) {
      setAssignment(itemId, { mode: 'equal', personIds })
    } else {
      setAssignment(itemId, { mode: 'unassigned' })
    }
  }

  function handleCustomBlur(personId: string) {
    const portions = people
      .map((p) => ({
        personId: p.id,
        weight: dollarsToCents(customInputs[p.id] ?? ''),
      }))
      .filter((portion) => portion.weight > 0)
    if (portions.length > 0) {
      setAssignment(itemId, { mode: 'custom', portions })
    } else {
      setAssignment(itemId, { mode: 'unassigned' })
    }
    // Keep the displayed value but ignore unused personId param
    void personId
  }

  function handleEveryoneClick() {
    setAssignment(itemId, { mode: 'everyone' })
  }

  const modeButtonClass = (m: AssignMode) =>
    `px-3 py-1 text-sm font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
      mode === m
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      {/* Item header */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-gray-900">{itemName}</span>
        <span className="text-sm text-gray-600">${centsToDollars(priceCents)}</span>
      </div>

      {/* Mode selector */}
      <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label={`Assignment mode for ${itemName}`}>
        <button
          type="button"
          className={modeButtonClass('single')}
          onClick={() => handleModeChange('single')}
          aria-pressed={mode === 'single'}
        >
          One Person
        </button>
        <button
          type="button"
          className={modeButtonClass('equal')}
          onClick={() => handleModeChange('equal')}
          aria-pressed={mode === 'equal'}
        >
          Split Equal
        </button>
        <button
          type="button"
          className={modeButtonClass('custom')}
          onClick={() => handleModeChange('custom')}
          aria-pressed={mode === 'custom'}
        >
          Custom
        </button>
        <button
          type="button"
          className={modeButtonClass('everyone')}
          onClick={() => handleModeChange('everyone')}
          aria-pressed={mode === 'everyone'}
        >
          Everyone
        </button>
      </div>

      {/* Mode-specific UI */}
      {mode === 'single' && (
        <div>
          <label htmlFor={`${baseId}-single`} className="block text-sm text-gray-600 mb-1">
            Assign to
          </label>
          <select
            id={`${baseId}-single`}
            value={selectedPersonId}
            onChange={(e) => handleSinglePersonChange(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {mode === 'equal' && (
        <fieldset>
          <legend className="text-sm text-gray-600 mb-1">Split equally between</legend>
          <div className="flex flex-wrap gap-2">
            {people.map((p) => (
              <label key={p.id} className="flex items-center gap-1 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={checkedIds.has(p.id)}
                  onChange={(e) => handleEqualCheckChange(p.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                {p.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {mode === 'custom' && (
        <fieldset>
          <legend className="text-sm text-gray-600 mb-1">Custom amounts</legend>
          <div className="flex flex-col gap-2">
            {people.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <label htmlFor={`${baseId}-custom-${p.id}`} className="text-sm text-gray-700 w-24 truncate">
                  {p.name}
                </label>
                <input
                  id={`${baseId}-custom-${p.id}`}
                  type="text"
                  inputMode="decimal"
                  value={customInputs[p.id] ?? ''}
                  onChange={(e) =>
                    setCustomInputs((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                  onBlur={() => handleCustomBlur(p.id)}
                  placeholder="0.00"
                  className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </fieldset>
      )}

      {mode === 'everyone' && (
        <div>
          <button
            type="button"
            onClick={handleEveryoneClick}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Assign to Everyone
          </button>
        </div>
      )}
    </div>
  )
}

export function AssignSection() {
  const { items, people, assignments } = useBillStore(
    useShallow((s) => ({
      items: s.items,
      people: s.people,
      assignments: s.assignments,
    }))
  )

  if (items.length === 0 || people.length === 0) {
    return (
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Assign Items</h2>
        <p className="text-sm text-gray-500">Add people and items first</p>
      </section>
    )
  }

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Assign Items</h2>
      <div className="space-y-3">
        {items.map((item) => {
          const asgn = assignments.find((a) => a.itemId === item.id)?.assignment ?? { mode: 'unassigned' as const }
          return (
            <ItemRow
              key={item.id}
              itemId={item.id}
              itemName={item.name}
              priceCents={item.priceCents}
              currentAssignment={asgn}
            />
          )
        })}
      </div>
    </section>
  )
}
