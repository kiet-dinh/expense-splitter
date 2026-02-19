import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Person, Item, ItemAssignment, TipSplitMode, TaxMode, TaxSplitMode } from './billStore'

export const CURRENT_SCHEMA_VERSION = 1

export interface SavedSplit {
  id: string
  name: string
  savedAt: string       // ISO 8601
  schemaVersion: number
  people: Person[]
  items: Item[]
  assignments: ItemAssignment[]
  tipPercent: number
  tipSplitMode: TipSplitMode
  taxMode: TaxMode
  taxValue: number
  taxSplitMode: TaxSplitMode
}

interface HistoryState {
  savedSplits: SavedSplit[]
  saveSplit:   (data: Omit<SavedSplit, 'id' | 'savedAt' | 'schemaVersion'>) => void
  deleteSplit: (id: string) => void
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      savedSplits: [],

      saveSplit: (data) =>
        set((s) => ({
          savedSplits: [
            {
              id: crypto.randomUUID(),
              savedAt: new Date().toISOString(),
              schemaVersion: CURRENT_SCHEMA_VERSION,
              ...data,
            },
            ...s.savedSplits,
          ],
        })),

      deleteSplit: (id) =>
        set((s) => ({
          savedSplits: s.savedSplits.filter((split) => split.id !== id),
        })),
    }),
    {
      name: 'bill-splitter-history',
      storage: createJSONStorage(() => localStorage),
      version: CURRENT_SCHEMA_VERSION,
      partialize: (state) => ({ savedSplits: state.savedSplits }),
      migrate: (persistedState, _version) => {
        // v1 -> future: add migrations here as schemaVersion increments
        return persistedState as HistoryState
      },
    }
  )
)
