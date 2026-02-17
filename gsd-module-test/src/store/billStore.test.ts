import { describe, it, expect, beforeEach } from 'vitest'
import { useBillStore } from './billStore'

const defaultState = {
  people: [],
  items: [],
  assignments: [],
  tipPercent: 0,
  tipSplitMode: 'equal' as const,
  taxMode: 'amount' as const,
  taxValue: 0,
  taxSplitMode: 'equal' as const,
}

describe('billStore - addPerson', () => {
  beforeEach(() => {
    useBillStore.setState(defaultState)
  })

  it('adds a person with a unique id and trimmed name', () => {
    useBillStore.getState().addPerson('  Alice  ')
    const { people } = useBillStore.getState()
    expect(people).toHaveLength(1)
    expect(people[0].name).toBe('Alice')
    expect(people[0].id).toBeTruthy()
  })

  it('adding two people generates two different ids', () => {
    useBillStore.getState().addPerson('Alice')
    useBillStore.getState().addPerson('Bob')
    const { people } = useBillStore.getState()
    expect(people).toHaveLength(2)
    expect(people[0].id).not.toBe(people[1].id)
  })
})

describe('billStore - removePerson', () => {
  beforeEach(() => {
    useBillStore.setState(defaultState)
  })

  it('removes the person from the people array', () => {
    useBillStore.getState().addPerson('Alice')
    const { people } = useBillStore.getState()
    useBillStore.getState().removePerson(people[0].id)
    expect(useBillStore.getState().people).toHaveLength(0)
  })

  it('cascades: single assignment becomes unassigned when person is removed', () => {
    useBillStore.getState().addPerson('Alice')
    const aliceId = useBillStore.getState().people[0].id
    useBillStore.getState().addItem('Burger', 1200)
    const itemId = useBillStore.getState().items[0].id
    useBillStore.getState().setAssignment(itemId, { mode: 'single', personId: aliceId })
    useBillStore.getState().removePerson(aliceId)
    const { assignments } = useBillStore.getState()
    expect(assignments.find((a) => a.itemId === itemId)?.assignment.mode).toBe('unassigned')
  })

  it('cascades: equal assignment filters out removed person; empty list becomes unassigned', () => {
    useBillStore.getState().addPerson('Alice')
    useBillStore.getState().addPerson('Bob')
    const [alice, _bob] = useBillStore.getState().people
    void _bob  // only Alice used in this part of the test
    useBillStore.getState().addItem('Pizza', 2000)
    const itemId = useBillStore.getState().items[0].id
    // Only Alice — removing her should set to unassigned
    useBillStore.getState().setAssignment(itemId, { mode: 'equal', personIds: [alice.id] })
    useBillStore.getState().removePerson(alice.id)
    const asgn = useBillStore.getState().assignments.find((a) => a.itemId === itemId)?.assignment
    expect(asgn?.mode).toBe('unassigned')
    // Reset: both Alice and Bob, remove Bob — Alice still present
    useBillStore.setState(defaultState)
    useBillStore.getState().addPerson('Alice')
    useBillStore.getState().addPerson('Bob')
    const [alice2, bob2] = useBillStore.getState().people
    useBillStore.getState().addItem('Pizza', 2000)
    const itemId2 = useBillStore.getState().items[0].id
    useBillStore.getState().setAssignment(itemId2, { mode: 'equal', personIds: [alice2.id, bob2.id] })
    useBillStore.getState().removePerson(bob2.id)
    const asgn2 = useBillStore.getState().assignments.find((a) => a.itemId === itemId2)?.assignment
    expect(asgn2?.mode).toBe('equal')
    if (asgn2?.mode === 'equal') {
      expect(asgn2.personIds).toEqual([alice2.id])
    }
  })

  it('cascades: custom assignment filters out removed person; empty list becomes unassigned', () => {
    useBillStore.getState().addPerson('Alice')
    const aliceId = useBillStore.getState().people[0].id
    useBillStore.getState().addItem('Salad', 800)
    const itemId = useBillStore.getState().items[0].id
    useBillStore.getState().setAssignment(itemId, {
      mode: 'custom',
      portions: [{ personId: aliceId, weight: 1 }],
    })
    useBillStore.getState().removePerson(aliceId)
    const asgn = useBillStore.getState().assignments.find((a) => a.itemId === itemId)?.assignment
    expect(asgn?.mode).toBe('unassigned')
  })

  it('cascades: everyone assignment is unchanged when a person is removed (still everyone)', () => {
    useBillStore.getState().addPerson('Alice')
    useBillStore.getState().addPerson('Bob')
    const aliceId = useBillStore.getState().people[0].id
    useBillStore.getState().addItem('Drinks', 600)
    const itemId = useBillStore.getState().items[0].id
    useBillStore.getState().setAssignment(itemId, { mode: 'everyone' })
    useBillStore.getState().removePerson(aliceId)
    const asgn = useBillStore.getState().assignments.find((a) => a.itemId === itemId)?.assignment
    expect(asgn?.mode).toBe('everyone')
  })
})

describe('billStore - item actions', () => {
  beforeEach(() => {
    useBillStore.setState(defaultState)
  })

  it('addItem creates an item with a unique id and correct priceCents', () => {
    useBillStore.getState().addItem('Soda', 299)
    const { items } = useBillStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('Soda')
    expect(items[0].priceCents).toBe(299)
    expect(items[0].id).toBeTruthy()
  })

  it('updateItem merges name and priceCents changes', () => {
    useBillStore.getState().addItem('Soup', 500)
    const itemId = useBillStore.getState().items[0].id
    useBillStore.getState().updateItem(itemId, { name: 'Chowder', priceCents: 750 })
    const item = useBillStore.getState().items[0]
    expect(item.name).toBe('Chowder')
    expect(item.priceCents).toBe(750)
  })

  it('removeItem removes the item and its assignment entry', () => {
    useBillStore.getState().addPerson('Alice')
    const aliceId = useBillStore.getState().people[0].id
    useBillStore.getState().addItem('Fries', 300)
    const itemId = useBillStore.getState().items[0].id
    useBillStore.getState().setAssignment(itemId, { mode: 'single', personId: aliceId })
    useBillStore.getState().removeItem(itemId)
    expect(useBillStore.getState().items).toHaveLength(0)
    expect(useBillStore.getState().assignments.find((a) => a.itemId === itemId)).toBeUndefined()
  })
})

describe('billStore - setAssignment', () => {
  beforeEach(() => {
    useBillStore.setState(defaultState)
  })

  it('creates a new assignment entry if none exists', () => {
    useBillStore.getState().addItem('Steak', 3000)
    const itemId = useBillStore.getState().items[0].id
    useBillStore.getState().setAssignment(itemId, { mode: 'everyone' })
    const { assignments } = useBillStore.getState()
    expect(assignments).toHaveLength(1)
    expect(assignments[0].assignment.mode).toBe('everyone')
  })

  it('updates an existing assignment entry (upsert)', () => {
    useBillStore.getState().addItem('Steak', 3000)
    const itemId = useBillStore.getState().items[0].id
    useBillStore.getState().setAssignment(itemId, { mode: 'everyone' })
    useBillStore.getState().setAssignment(itemId, { mode: 'unassigned' })
    const { assignments } = useBillStore.getState()
    expect(assignments).toHaveLength(1)
    expect(assignments[0].assignment.mode).toBe('unassigned')
  })
})

describe('billStore - tip and tax setters', () => {
  beforeEach(() => {
    useBillStore.setState(defaultState)
  })

  it('setTipPercent updates tipPercent', () => {
    useBillStore.getState().setTipPercent(20)
    expect(useBillStore.getState().tipPercent).toBe(20)
  })

  it('setTipSplitMode updates tipSplitMode', () => {
    useBillStore.getState().setTipSplitMode('proportional')
    expect(useBillStore.getState().tipSplitMode).toBe('proportional')
  })

  it('setTaxMode updates taxMode', () => {
    useBillStore.getState().setTaxMode('percent')
    expect(useBillStore.getState().taxMode).toBe('percent')
  })

  it('setTaxValue updates taxValue', () => {
    useBillStore.getState().setTaxValue(850)
    expect(useBillStore.getState().taxValue).toBe(850)
  })

  it('setTaxSplitMode updates taxSplitMode', () => {
    useBillStore.getState().setTaxSplitMode('proportional')
    expect(useBillStore.getState().taxSplitMode).toBe('proportional')
  })
})
