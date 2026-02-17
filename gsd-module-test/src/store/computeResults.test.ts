import { describe, it, expect } from 'vitest'
import { computeResults } from './computeResults'
import type { Person, Item, ItemAssignment } from './billStore'

// Helpers
const person = (id: string, name: string): Person => ({ id, name })
const item = (id: string, name: string, priceCents: number): Item => ({ id, name, priceCents })

describe('computeResults - empty people', () => {
  it('returns all zeros when people array is empty', () => {
    const result = computeResults([], [], [], 0, 'equal', 'amount', 0, 'equal')
    expect(result.subtotalCents).toBe(0)
    expect(result.tipCents).toBe(0)
    expect(result.taxCents).toBe(0)
    expect(result.grandTotalCents).toBe(0)
    expect(result.perPerson).toHaveLength(0)
    expect(result.grandTotalCheck).toBe(0)
  })
})

describe('computeResults - single assignment', () => {
  it('assigns single item to one person with correct subtotal', () => {
    const people = [person('a', 'Alice')]
    const items = [item('i1', 'Burger', 1200)]
    const assignments: ItemAssignment[] = [{ itemId: 'i1', assignment: { mode: 'single', personId: 'a' } }]
    const result = computeResults(people, items, assignments, 0, 'equal', 'amount', 0, 'equal')
    expect(result.subtotalCents).toBe(1200)
    expect(result.tipCents).toBe(0)
    expect(result.taxCents).toBe(0)
    expect(result.perPerson[0].subtotalCents).toBe(1200)
    expect(result.grandTotalCheck).toBe(0)
  })
})

describe('computeResults - equal split', () => {
  it('splits one item between 2 people equally and shares sum to item price', () => {
    const people = [person('a', 'Alice'), person('b', 'Bob')]
    const items = [item('i1', 'Pizza', 1000)]
    const assignments: ItemAssignment[] = [{ itemId: 'i1', assignment: { mode: 'equal', personIds: ['a', 'b'] } }]
    const result = computeResults(people, items, assignments, 0, 'equal', 'amount', 0, 'equal')
    expect(result.perPerson[0].subtotalCents + result.perPerson[1].subtotalCents).toBe(1000)
    expect(result.grandTotalCheck).toBe(0)
  })

  it('splits an odd-cent item between 2 people using LRM (one gets extra cent)', () => {
    const people = [person('a', 'Alice'), person('b', 'Bob')]
    const items = [item('i1', 'Coffee', 301)]
    const assignments: ItemAssignment[] = [{ itemId: 'i1', assignment: { mode: 'equal', personIds: ['a', 'b'] } }]
    const result = computeResults(people, items, assignments, 0, 'equal', 'amount', 0, 'equal')
    // 301 split between 2: 151 and 150
    expect(result.perPerson[0].subtotalCents + result.perPerson[1].subtotalCents).toBe(301)
    expect(result.grandTotalCheck).toBe(0)
  })
})

describe('computeResults - custom portions', () => {
  it('distributes item with 2:1 custom portions correctly', () => {
    const people = [person('a', 'Alice'), person('b', 'Bob')]
    const items = [item('i1', 'Steak', 900)]
    const assignments: ItemAssignment[] = [{
      itemId: 'i1',
      assignment: { mode: 'custom', portions: [{ personId: 'a', weight: 2 }, { personId: 'b', weight: 1 }] },
    }]
    const result = computeResults(people, items, assignments, 0, 'equal', 'amount', 0, 'equal')
    // 900 with weights [2, 1]: Alice gets 600, Bob gets 300
    expect(result.perPerson[0].subtotalCents).toBe(600)
    expect(result.perPerson[1].subtotalCents).toBe(300)
    expect(result.grandTotalCheck).toBe(0)
  })
})

describe('computeResults - everyone mode', () => {
  it('distributes item across all people with everyone mode', () => {
    const people = [person('a', 'Alice'), person('b', 'Bob'), person('c', 'Carol')]
    const items = [item('i1', 'Appetizer', 600)]
    const assignments: ItemAssignment[] = [{ itemId: 'i1', assignment: { mode: 'everyone' } }]
    const result = computeResults(people, items, assignments, 0, 'equal', 'amount', 0, 'equal')
    expect(result.subtotalCents).toBe(600)
    const total = result.perPerson.reduce((s, p) => s + p.subtotalCents, 0)
    expect(total).toBe(600)
    expect(result.grandTotalCheck).toBe(0)
  })
})

describe('computeResults - unassigned items', () => {
  it('excludes unassigned items from subtotals', () => {
    const people = [person('a', 'Alice')]
    const items = [item('i1', 'Water', 200)]
    const assignments: ItemAssignment[] = [{ itemId: 'i1', assignment: { mode: 'unassigned' } }]
    const result = computeResults(people, items, assignments, 0, 'equal', 'amount', 0, 'equal')
    expect(result.subtotalCents).toBe(0)
    expect(result.perPerson[0].subtotalCents).toBe(0)
    expect(result.grandTotalCheck).toBe(0)
  })

  it('excludes items with no assignment entry from subtotals', () => {
    const people = [person('a', 'Alice')]
    const items = [item('i1', 'Water', 200)]
    const assignments: ItemAssignment[] = []
    const result = computeResults(people, items, assignments, 0, 'equal', 'amount', 0, 'equal')
    expect(result.subtotalCents).toBe(0)
    expect(result.grandTotalCheck).toBe(0)
  })
})

describe('computeResults - tip calculation', () => {
  it('calculates 20% proportional tip distributed by person subtotals', () => {
    const people = [person('a', 'Alice'), person('b', 'Bob')]
    const items = [
      item('i1', 'Entree A', 2000),
      item('i2', 'Entree B', 1000),
    ]
    const assignments: ItemAssignment[] = [
      { itemId: 'i1', assignment: { mode: 'single', personId: 'a' } },
      { itemId: 'i2', assignment: { mode: 'single', personId: 'b' } },
    ]
    const result = computeResults(people, items, assignments, 20, 'proportional', 'amount', 0, 'equal')
    // subtotal = 3000, tip = 600
    expect(result.subtotalCents).toBe(3000)
    expect(result.tipCents).toBe(600)
    // Alice has 2000, Bob has 1000; proportional split of 600: Alice 400, Bob 200
    expect(result.perPerson[0].tipCents).toBe(400)
    expect(result.perPerson[1].tipCents).toBe(200)
    expect(result.grandTotalCheck).toBe(0)
  })

  it('calculates 18% equal tip distributed uniformly', () => {
    const people = [person('a', 'Alice'), person('b', 'Bob')]
    const items = [
      item('i1', 'Entree A', 2000),
      item('i2', 'Entree B', 1000),
    ]
    const assignments: ItemAssignment[] = [
      { itemId: 'i1', assignment: { mode: 'single', personId: 'a' } },
      { itemId: 'i2', assignment: { mode: 'single', personId: 'b' } },
    ]
    const result = computeResults(people, items, assignments, 18, 'equal', 'amount', 0, 'equal')
    // subtotal = 3000, tip = Math.round(3000 * 18 / 100) = 540; split equally = 270 each
    expect(result.tipCents).toBe(540)
    expect(result.perPerson[0].tipCents).toBe(270)
    expect(result.perPerson[1].tipCents).toBe(270)
    expect(result.grandTotalCheck).toBe(0)
  })
})

describe('computeResults - tax calculation', () => {
  it('distributes a dollar-amount tax correctly (equal split)', () => {
    const people = [person('a', 'Alice'), person('b', 'Bob')]
    const items = [item('i1', 'Shared', 1000)]
    const assignments: ItemAssignment[] = [{ itemId: 'i1', assignment: { mode: 'equal', personIds: ['a', 'b'] } }]
    const result = computeResults(people, items, assignments, 0, 'equal', 'amount', 200, 'equal')
    // tax = 200 cents, split equally = 100 each
    expect(result.taxCents).toBe(200)
    expect(result.perPerson[0].taxCents).toBe(100)
    expect(result.perPerson[1].taxCents).toBe(100)
    expect(result.grandTotalCheck).toBe(0)
  })

  it('computes and distributes percentage tax correctly', () => {
    const people = [person('a', 'Alice'), person('b', 'Bob')]
    const items = [item('i1', 'Shared', 2000)]
    const assignments: ItemAssignment[] = [{ itemId: 'i1', assignment: { mode: 'equal', personIds: ['a', 'b'] } }]
    // 10% tax on 2000 = 200 cents; split equally = 100 each
    const result = computeResults(people, items, assignments, 0, 'equal', 'percent', 10, 'equal')
    expect(result.taxCents).toBe(200)
    expect(result.perPerson[0].taxCents).toBe(100)
    expect(result.perPerson[1].taxCents).toBe(100)
    expect(result.grandTotalCheck).toBe(0)
  })
})

describe('computeResults - edge cases', () => {
  it('falls back to equal distribution when all subtotals are zero with proportional tip (no NaN)', () => {
    const people = [person('a', 'Alice'), person('b', 'Bob')]
    const items = [item('i1', 'Water', 200)]
    // Item unassigned — all subtotals are 0
    const assignments: ItemAssignment[] = [{ itemId: 'i1', assignment: { mode: 'unassigned' } }]
    const result = computeResults(people, items, assignments, 20, 'proportional', 'amount', 0, 'equal')
    // tip should be 0 (subtotal is 0), not NaN
    expect(result.tipCents).toBe(0)
    expect(isNaN(result.perPerson[0].tipCents)).toBe(false)
    expect(isNaN(result.perPerson[1].tipCents)).toBe(false)
    expect(result.grandTotalCheck).toBe(0)
  })

  it('grandTotalCheck is always 0 across multiple items and people', () => {
    const people = [person('a', 'Alice'), person('b', 'Bob'), person('c', 'Carol')]
    const items = [
      item('i1', 'Appetizer', 999),
      item('i2', 'Entree A', 1499),
      item('i3', 'Entree B', 2000),
      item('i4', 'Dessert', 701),
    ]
    const assignments: ItemAssignment[] = [
      { itemId: 'i1', assignment: { mode: 'everyone' } },
      { itemId: 'i2', assignment: { mode: 'single', personId: 'a' } },
      { itemId: 'i3', assignment: { mode: 'equal', personIds: ['b', 'c'] } },
      { itemId: 'i4', assignment: { mode: 'custom', portions: [{ personId: 'a', weight: 2 }, { personId: 'b', weight: 1 }] } },
    ]
    const result = computeResults(people, items, assignments, 18, 'proportional', 'percent', 8, 'proportional')
    expect(result.grandTotalCheck).toBe(0)
  })
})
