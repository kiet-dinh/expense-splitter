import { create } from 'zustand'

// --- Data model types ---

export interface Person {
  id: string      // crypto.randomUUID()
  name: string
}

export interface Item {
  id: string      // crypto.randomUUID()
  name: string
  priceCents: number  // integer cents — never decimal
}

// Assignment: discriminated union on mode
export type Assignment =
  | { mode: 'unassigned' }
  | { mode: 'single';    personId: string }
  | { mode: 'equal';     personIds: string[] }
  | { mode: 'everyone' }
  | { mode: 'custom';    portions: { personId: string; weight: number }[] }

export interface ItemAssignment {
  itemId: string
  assignment: Assignment
}

export type TipSplitMode = 'equal' | 'proportional'
export type TaxMode      = 'amount' | 'percent'
export type TaxSplitMode = 'equal' | 'proportional'

// --- Store state + actions ---

interface BillState {
  people:      Person[]
  items:       Item[]
  assignments: ItemAssignment[]

  // Tip
  tipPercent:    number        // e.g. 15 for 15%; 0 = no tip
  tipSplitMode:  TipSplitMode

  // Tax
  taxMode:       TaxMode
  taxValue:      number        // cents (if taxMode==='amount') OR percent (if taxMode==='percent')
  taxSplitMode:  TaxSplitMode

  // --- Actions ---

  // People
  addPerson:    (name: string) => void
  removePerson: (id: string)   => void

  // Items
  addItem:    (name: string, priceCents: number) => void
  updateItem: (id: string, changes: Partial<Pick<Item, 'name' | 'priceCents'>>) => void
  removeItem: (id: string) => void

  // Assignments
  setAssignment: (itemId: string, assignment: Assignment) => void

  // Tip/Tax
  setTipPercent:   (percent: number)    => void
  setTipSplitMode: (mode: TipSplitMode) => void
  setTaxMode:      (mode: TaxMode)      => void
  setTaxValue:     (value: number)      => void
  setTaxSplitMode: (mode: TaxSplitMode) => void
}

export const useBillStore = create<BillState>()((set) => ({
  people:      [],
  items:       [],
  assignments: [],
  tipPercent:   0,
  tipSplitMode: 'equal',
  taxMode:      'amount',
  taxValue:     0,
  taxSplitMode: 'equal',

  addPerson: (name) =>
    set((s) => ({
      people: [...s.people, { id: crypto.randomUUID(), name: name.trim() }],
    })),

  removePerson: (id) =>
    set((s) => ({
      people: s.people.filter((p) => p.id !== id),
      // Clean up assignments referencing the removed person
      assignments: s.assignments.map((a) => {
        if (a.assignment.mode === 'single' && a.assignment.personId === id) {
          return { ...a, assignment: { mode: 'unassigned' } as Assignment }
        }
        if (a.assignment.mode === 'equal') {
          const personIds = a.assignment.personIds.filter((pid) => pid !== id)
          return personIds.length === 0
            ? { ...a, assignment: { mode: 'unassigned' } as Assignment }
            : { ...a, assignment: { mode: 'equal', personIds } as Assignment }
        }
        if (a.assignment.mode === 'custom') {
          const portions = a.assignment.portions.filter((p) => p.personId !== id)
          return portions.length === 0
            ? { ...a, assignment: { mode: 'unassigned' } as Assignment }
            : { ...a, assignment: { mode: 'custom', portions } as Assignment }
        }
        return a
      }),
    })),

  addItem: (name, priceCents) =>
    set((s) => ({
      items: [...s.items, { id: crypto.randomUUID(), name, priceCents }],
    })),

  updateItem: (id, changes) =>
    set((s) => ({
      items: s.items.map((item) =>
        item.id === id ? { ...item, ...changes } : item
      ),
    })),

  removeItem: (id) =>
    set((s) => ({
      items:       s.items.filter((item) => item.id !== id),
      assignments: s.assignments.filter((a) => a.itemId !== id),
    })),

  setAssignment: (itemId, assignment) =>
    set((s) => {
      const exists = s.assignments.find((a) => a.itemId === itemId)
      return exists
        ? {
            assignments: s.assignments.map((a) =>
              a.itemId === itemId ? { ...a, assignment } : a
            ),
          }
        : { assignments: [...s.assignments, { itemId, assignment }] }
    }),

  setTipPercent:   (percent) => set({ tipPercent: percent }),
  setTipSplitMode: (mode)    => set({ tipSplitMode: mode }),
  setTaxMode:      (mode)    => set({ taxMode: mode }),
  setTaxValue:     (value)   => set({ taxValue: value }),
  setTaxSplitMode: (mode)    => set({ taxSplitMode: mode }),
}))
