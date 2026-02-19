import type { Person, Item, ItemAssignment, Assignment } from '../store/billStore'
import { distribute } from './math'

export interface PersonItemizedEntry {
  itemId: string
  itemName: string
  fullPriceCents: number
  theirShareCents: number
  splitNote: string | null
}

export interface PersonItemizedBreakdown {
  personId: string
  name: string
  items: PersonItemizedEntry[]
}

/**
 * Compute itemized breakdown showing exactly which items each person owes.
 * Returns an array of breakdowns, one per person, in the same order as the input people array.
 */
export function computeItemizedBreakdown(
  people: Person[],
  items: Item[],
  assignments: ItemAssignment[]
): PersonItemizedBreakdown[] {
  const assignmentMap = new Map(assignments.map((a) => [a.itemId, a.assignment]))

  return people.map((person) => {
    const personItems: PersonItemizedEntry[] = []

    for (const item of items) {
      const asgn = assignmentMap.get(item.id)
      if (!asgn || asgn.mode === 'unassigned') continue

      const entry = computeItemEntry(item, asgn, person, people)
      if (entry) {
        personItems.push(entry)
      }
    }

    return {
      personId: person.id,
      name: person.name,
      items: personItems,
    }
  })
}

function computeItemEntry(
  item: Item,
  asgn: Assignment,
  person: Person,
  allPeople: Person[]
): PersonItemizedEntry | null {
  switch (asgn.mode) {
    case 'single':
      if (asgn.personId === person.id) {
        return {
          itemId: item.id,
          itemName: item.name,
          fullPriceCents: item.priceCents,
          theirShareCents: item.priceCents,
          splitNote: null,
        }
      }
      return null

    case 'everyone': {
      const weights = allPeople.map(() => 1)
      const shares = distribute(item.priceCents, weights)
      const personIndex = allPeople.findIndex((p) => p.id === person.id)
      if (personIndex === -1) return null

      return {
        itemId: item.id,
        itemName: item.name,
        fullPriceCents: item.priceCents,
        theirShareCents: shares[personIndex],
        splitNote: `split ${allPeople.length} ways`,
      }
    }

    case 'equal': {
      const count = asgn.personIds.length
      if (!asgn.personIds.includes(person.id)) return null

      const weights = asgn.personIds.map(() => 1)
      const shares = distribute(item.priceCents, weights)
      const personIndex = asgn.personIds.indexOf(person.id)

      return {
        itemId: item.id,
        itemName: item.name,
        fullPriceCents: item.priceCents,
        theirShareCents: shares[personIndex],
        splitNote: `split ${count} ways`,
      }
    }

    case 'custom': {
      const portion = asgn.portions.find((p) => p.personId === person.id)
      if (!portion) return null

      const weights = asgn.portions.map((p) => p.weight)
      const shares = distribute(item.priceCents, weights)
      const personIndex = asgn.portions.findIndex((p) => p.personId === person.id)
      const totalWeight = weights.reduce((a, b) => a + b, 0)

      return {
        itemId: item.id,
        itemName: item.name,
        fullPriceCents: item.priceCents,
        theirShareCents: shares[personIndex],
        splitNote: `${portion.weight}/${totalWeight} share`,
      }
    }

    default:
      return null
  }
}
