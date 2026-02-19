import { describe, it, expect } from 'vitest'
import { computeItemizedBreakdown } from './itemizedBreakdown'
import type { Person, Item, ItemAssignment } from '../store/billStore'

describe('computeItemizedBreakdown', () => {
  const people: Person[] = [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
    { id: 'p3', name: 'Carol' },
  ]

  const items: Item[] = [
    { id: 'i1', name: 'Burger', priceCents: 1200 },
    { id: 'i2', name: 'Fries', priceCents: 500 },
    { id: 'i3', name: 'Salad', priceCents: 900 },
    { id: 'i4', name: 'Drinks', priceCents: 600 },
  ]

  it('handles single person assignment', () => {
    const assignments: ItemAssignment[] = [
      { itemId: 'i1', assignment: { mode: 'single', personId: 'p1' } },
    ]

    const result = computeItemizedBreakdown(people, items.slice(0, 1), assignments)

    expect(result).toHaveLength(3)
    expect(result[0].items).toHaveLength(1)
    expect(result[0].items[0]).toEqual({
      itemId: 'i1',
      itemName: 'Burger',
      fullPriceCents: 1200,
      theirShareCents: 1200,
      splitNote: null,
    })
    expect(result[1].items).toHaveLength(0)
    expect(result[2].items).toHaveLength(0)
  })

  it('handles everyone split equally', () => {
    const assignments: ItemAssignment[] = [
      { itemId: 'i1', assignment: { mode: 'everyone' } },
    ]

    const result = computeItemizedBreakdown(people, items.slice(0, 1), assignments)

    // $12.00 split 3 ways: 400, 400, 400
    expect(result[0].items[0].theirShareCents).toBe(400)
    expect(result[0].items[0].splitNote).toBe('split 3 ways')
    expect(result[1].items[0].theirShareCents).toBe(400)
    expect(result[2].items[0].theirShareCents).toBe(400)
  })

  it('handles everyone split with rounding (largest remainder)', () => {
    const assignments: ItemAssignment[] = [
      { itemId: 'i2', assignment: { mode: 'everyone' } }, // $5.00 = 500 cents
    ]

    const result = computeItemizedBreakdown(people, items.slice(1, 2), assignments)

    // $5.00 split 3 ways: 167, 167, 166 (first two get extra cent)
    expect(result[0].items[0].theirShareCents).toBe(167)
    expect(result[1].items[0].theirShareCents).toBe(167)
    expect(result[2].items[0].theirShareCents).toBe(166)
  })

  it('handles equal split between subset of people', () => {
    const assignments: ItemAssignment[] = [
      { itemId: 'i1', assignment: { mode: 'equal', personIds: ['p1', 'p2'] } },
    ]

    const result = computeItemizedBreakdown(people, items.slice(0, 1), assignments)

    // $12.00 split 2 ways: 600, 600
    expect(result[0].items).toHaveLength(1)
    expect(result[0].items[0].theirShareCents).toBe(600)
    expect(result[0].items[0].splitNote).toBe('split 2 ways')
    expect(result[1].items).toHaveLength(1)
    expect(result[1].items[0].theirShareCents).toBe(600)
    expect(result[2].items).toHaveLength(0) // Carol not included
  })

  it('handles custom portion split', () => {
    const assignments: ItemAssignment[] = [
      {
        itemId: 'i1',
        assignment: {
          mode: 'custom',
          portions: [
            { personId: 'p1', weight: 2 },
            { personId: 'p2', weight: 1 },
          ],
        },
      },
    ]

    const result = computeItemizedBreakdown(people, items.slice(0, 1), assignments)

    // $12.00 split 2:1 ratio (total weight 3)
    // 1200 * 2/3 = 800, 1200 * 1/3 = 400
    expect(result[0].items[0].theirShareCents).toBe(800)
    expect(result[0].items[0].splitNote).toBe('2/3 share')
    expect(result[1].items[0].theirShareCents).toBe(400)
    expect(result[1].items[0].splitNote).toBe('1/3 share')
    expect(result[2].items).toHaveLength(0)
  })

  it('handles unassigned items (excluded from breakdown)', () => {
    const assignments: ItemAssignment[] = [
      { itemId: 'i1', assignment: { mode: 'unassigned' } },
    ]

    const result = computeItemizedBreakdown(people, items.slice(0, 1), assignments)

    expect(result[0].items).toHaveLength(0)
    expect(result[1].items).toHaveLength(0)
    expect(result[2].items).toHaveLength(0)
  })

  it('handles missing assignment (treated as unassigned)', () => {
    const assignments: ItemAssignment[] = []

    const result = computeItemizedBreakdown(people, items.slice(0, 1), assignments)

    expect(result[0].items).toHaveLength(0)
  })

  it('handles mixed assignment types', () => {
    const assignments: ItemAssignment[] = [
      { itemId: 'i1', assignment: { mode: 'single', personId: 'p1' } }, // Alice: $12.00
      { itemId: 'i2', assignment: { mode: 'equal', personIds: ['p1', 'p2'] } }, // Alice/Bob: $2.50 each
      { itemId: 'i3', assignment: { mode: 'everyone' } }, // All: $3.00 each
    ]

    const result = computeItemizedBreakdown(people, items.slice(0, 3), assignments)

    // Alice: Burger ($12) + Fries half ($2.50) + Salad third ($3)
    expect(result[0].items).toHaveLength(3)
    expect(result[0].items[0].itemName).toBe('Burger')
    expect(result[0].items[0].theirShareCents).toBe(1200)
    expect(result[0].items[1].itemName).toBe('Fries')
    expect(result[0].items[1].theirShareCents).toBe(250)
    expect(result[0].items[2].itemName).toBe('Salad')
    expect(result[0].items[2].theirShareCents).toBe(300)

    // Bob: Fries half ($2.50) + Salad third ($3)
    expect(result[1].items).toHaveLength(2)

    // Carol: Salad third ($3) only
    expect(result[2].items).toHaveLength(1)
    expect(result[2].items[0].itemName).toBe('Salad')
  })

  it('returns people in same order as input', () => {
    const assignments: ItemAssignment[] = []

    const result = computeItemizedBreakdown(people, [], assignments)

    expect(result[0].personId).toBe('p1')
    expect(result[0].name).toBe('Alice')
    expect(result[1].personId).toBe('p2')
    expect(result[1].name).toBe('Bob')
    expect(result[2].personId).toBe('p3')
    expect(result[2].name).toBe('Carol')
  })

  it('handles empty people array', () => {
    const result = computeItemizedBreakdown([], items, [])
    expect(result).toHaveLength(0)
  })

  it('handles empty items array', () => {
    const result = computeItemizedBreakdown(people, [], [])

    expect(result).toHaveLength(3)
    expect(result[0].items).toHaveLength(0)
    expect(result[1].items).toHaveLength(0)
    expect(result[2].items).toHaveLength(0)
  })
})
