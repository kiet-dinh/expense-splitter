import { useId, useState } from 'react'
import { useShallow } from 'zustand/shallow'
import { useBillStore } from '../store/billStore'

// PEOPLE-04: quick-add from previous splits — deferred to Phase 4 (requires localStorage)

export function PeopleSection() {
  const { people, addPerson, removePerson } = useBillStore(
    useShallow((s) => ({
      people: s.people,
      addPerson: s.addPerson,
      removePerson: s.removePerson,
    }))
  )

  const [nameInput, setNameInput] = useState('')
  const inputId = useId()

  const isDuplicate =
    nameInput.trim().length > 0 &&
    people.some(
      (p) => p.name.toLowerCase() === nameInput.trim().toLowerCase()
    )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (nameInput.trim().length === 0) return
    addPerson(nameInput.trim())
    setNameInput('')
  }

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">People</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-1">
        <div className="flex gap-2">
          <label htmlFor={inputId} className="sr-only">
            Person name
          </label>
          <input
            id={inputId}
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter a name"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add
          </button>
        </div>

        {isDuplicate && (
          <p className="text-sm text-amber-600" role="status">
            Name already added
          </p>
        )}
      </form>

      {people.length > 0 && (
        <ul className="mt-4 space-y-2">
          {people.map((person) => (
            <li
              key={person.id}
              className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
            >
              <span className="text-sm text-gray-800">{person.name}</span>
              <button
                onClick={() => removePerson(person.id)}
                className="text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
