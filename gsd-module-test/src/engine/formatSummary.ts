import type { Person, Item, ItemAssignment, Assignment } from '../store/billStore'
import type { BillResults } from '../store/computeResults'

/**
 * Generate a formatted text summary of the bill split.
 * Suitable for copying to clipboard and sharing via messaging apps.
 */
export function formatSummary(
  results: BillResults,
  _items: Item[],
  _assignments: ItemAssignment[]
): string {
  const lines: string[] = []

  lines.push('Bill Split Summary')
  lines.push('==================')
  lines.push('')

  // Per-person breakdown
  for (const person of results.perPerson) {
    lines.push(`${person.name}: $${centsToDollars(person.totalCents)}`)
    lines.push(`  Subtotal: $${centsToDollars(person.subtotalCents)}`)
    lines.push(`  Tip: $${centsToDollars(person.tipCents)}`)
    lines.push(`  Tax: $${centsToDollars(person.taxCents)}`)
    lines.push('')
  }

  // Grand total
  lines.push('------------------')
  lines.push(`Grand Total: $${centsToDollars(results.grandTotalCents)}`)

  return lines.join('\n')
}

/**
 * Generate a detailed text summary including itemized breakdown per person.
 * More verbose than formatSummary, includes each person's items.
 */
export function formatDetailedSummary(
  _people: Person[],
  items: Item[],
  assignments: ItemAssignment[],
  results: BillResults
): string {
  const lines: string[] = []

  lines.push('Detailed Bill Split')
  lines.push('===================')
  lines.push('')

  // Build assignment lookup
  const assignmentMap = new Map(assignments.map((a) => [a.itemId, a.assignment]))

  for (const person of results.perPerson) {
    lines.push(`${person.name}`)
    lines.push(`${'-'.repeat(person.name.length)}`)

    // Find this person's items
    const personItems: { name: string; share: number; note: string | null }[] = []

    for (const item of items) {
      const asgn = assignmentMap.get(item.id)
      if (!asgn || asgn.mode === 'unassigned') continue

      const breakdown = getItemBreakdown(item, asgn, person.personId, items, assignments)
      if (breakdown) {
        personItems.push(breakdown)
      }
    }

    if (personItems.length > 0) {
      for (const pi of personItems) {
        const noteStr = pi.note ? ` (${pi.note})` : ''
        lines.push(`  ${pi.name}: $${centsToDollars(pi.share)}${noteStr}`)
      }
    } else {
      lines.push('  (no items assigned)')
    }

    lines.push(`  Subtotal: $${centsToDollars(person.subtotalCents)}`)
    lines.push(`  Tip: $${centsToDollars(person.tipCents)}`)
    lines.push(`  Tax: $${centsToDollars(person.taxCents)}`)
    lines.push(`  Total: $${centsToDollars(person.totalCents)}`)
    lines.push('')
  }

  lines.push('===================')
  lines.push(`Grand Total: $${centsToDollars(results.grandTotalCents)}`)

  return lines.join('\n')
}

/**
 * Helper to get a single person's share of an item with split note.
 */
function getItemBreakdown(
  item: Item,
  asgn: Assignment,
  personId: string,
  allItems: Item[],
  allAssignments: ItemAssignment[]
): { name: string; share: number; note: string | null } | null {
  switch (asgn.mode) {
    case 'single':
      if (asgn.personId === personId) {
        return { name: item.name, share: item.priceCents, note: null }
      }
      return null

    case 'everyone': {
      const personIds = getAllPersonIds(allItems, allAssignments)
      const count = personIds.length
      if (count === 0) return null
      const share = Math.floor(item.priceCents / count)
      const remainder = item.priceCents % count
      const idx = personIds.indexOf(personId)
      const actualShare = share + (idx < remainder ? 1 : 0)
      return {
        name: item.name,
        share: actualShare,
        note: `split ${count} ways`,
      }
    }

    case 'equal': {
      const count = asgn.personIds.length
      if (!asgn.personIds.includes(personId)) return null
      const share = Math.floor(item.priceCents / count)
      const remainder = item.priceCents % count
      const idx = asgn.personIds.indexOf(personId)
      const actualShare = share + (idx < remainder ? 1 : 0)
      return {
        name: item.name,
        share: actualShare,
        note: `split ${count} ways`,
      }
    }

    case 'custom': {
      const portion = asgn.portions.find((p) => p.personId === personId)
      if (!portion) return null
      const totalWeight = asgn.portions.reduce((sum, p) => sum + p.weight, 0)
      const share = Math.floor((item.priceCents * portion.weight) / totalWeight)
      // Note: largest-remainder would adjust, but for summary we show approximate
      return {
        name: item.name,
        share,
        note: `${portion.weight}/${totalWeight} share`,
      }
    }

    default:
      return null
  }
}

function getAllPersonIds(_items: Item[], assignments: ItemAssignment[]): string[] {
  const ids = new Set<string>()
  for (const a of assignments) {
    if (a.assignment.mode === 'single') {
      ids.add(a.assignment.personId)
    } else if (a.assignment.mode === 'equal') {
      a.assignment.personIds.forEach((id) => ids.add(id))
    } else if (a.assignment.mode === 'custom') {
      a.assignment.portions.forEach((p) => ids.add(p.personId))
    }
  }
  return Array.from(ids)
}

function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2)
}
