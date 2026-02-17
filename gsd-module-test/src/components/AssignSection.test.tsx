// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AssignSection } from './AssignSection'
import { useBillStore } from '../store/billStore'

afterEach(cleanup)

// Helper to reset store state between tests
function resetStore() {
  useBillStore.setState({
    people: [],
    items: [],
    assignments: [],
    tipPercent: 0,
    tipSplitMode: 'equal',
    taxMode: 'amount',
    taxValue: 0,
    taxSplitMode: 'equal',
  })
}

let aliceId: string
let bobId: string
let pizzaId: string

beforeEach(() => {
  resetStore()
  const state = useBillStore.getState()

  state.addPerson('Alice')
  state.addPerson('Bob')

  const { people } = useBillStore.getState()
  aliceId = people[0].id
  bobId = people[1].id

  state.addItem('Pizza', 1000)
  const { items } = useBillStore.getState()
  pizzaId = items[0].id
})

describe('AssignSection', () => {
  it('shows "Add people and items first" when store is empty', () => {
    resetStore()
    render(<AssignSection />)
    expect(screen.getByText('Add people and items first')).toBeInTheDocument()
  })

  it('shows "Add people and items first" when there are no people', () => {
    useBillStore.setState({ people: [] })
    render(<AssignSection />)
    expect(screen.getByText('Add people and items first')).toBeInTheDocument()
  })

  it('shows "Add people and items first" when there are no items', () => {
    useBillStore.setState({ items: [] })
    render(<AssignSection />)
    expect(screen.getByText('Add people and items first')).toBeInTheDocument()
  })

  it('displays item name and price', () => {
    render(<AssignSection />)
    expect(screen.getByText('Pizza')).toBeInTheDocument()
    expect(screen.getByText('$10.00')).toBeInTheDocument()
  })

  it('single mode: selecting a person updates the assignment in the store', async () => {
    const user = userEvent.setup()
    render(<AssignSection />)

    // Single mode is default — select Bob
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, bobId)

    const { assignments } = useBillStore.getState()
    const asgn = assignments.find((a) => a.itemId === pizzaId)
    expect(asgn?.assignment).toEqual({ mode: 'single', personId: bobId })
  })

  it('equal mode: checking two people stores both personIds', async () => {
    const user = userEvent.setup()
    render(<AssignSection />)

    // Switch to equal mode
    await user.click(screen.getByText('Split Equal'))

    // Check both Alice and Bob
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0]) // Alice
    await user.click(checkboxes[1]) // Bob

    const { assignments } = useBillStore.getState()
    const asgn = assignments.find((a) => a.itemId === pizzaId)
    expect(asgn?.assignment.mode).toBe('equal')
    if (asgn?.assignment.mode === 'equal') {
      expect(asgn.assignment.personIds).toContain(aliceId)
      expect(asgn.assignment.personIds).toContain(bobId)
    }
  })

  it('everyone mode: clicking button stores assignment as mode "everyone"', async () => {
    const user = userEvent.setup()
    render(<AssignSection />)

    // Switch to everyone mode
    await user.click(screen.getByText('Everyone'))
    await user.click(screen.getByText('Assign to Everyone'))

    const { assignments } = useBillStore.getState()
    const asgn = assignments.find((a) => a.itemId === pizzaId)
    expect(asgn?.assignment).toEqual({ mode: 'everyone' })
  })

  it('custom mode: entering dollar weights stores correct portions', async () => {
    const user = userEvent.setup()
    render(<AssignSection />)

    // Switch to custom mode
    await user.click(screen.getByText('Custom'))

    // Enter amounts for Alice and Bob
    const inputs = screen.getAllByPlaceholderText('0.00')
    await user.click(inputs[0])
    await user.type(inputs[0], '5.00')
    await user.tab() // triggers blur on Alice's input

    await user.click(inputs[1])
    await user.type(inputs[1], '3.00')
    await user.tab() // triggers blur on Bob's input

    const { assignments } = useBillStore.getState()
    const asgn = assignments.find((a) => a.itemId === pizzaId)
    expect(asgn?.assignment.mode).toBe('custom')
    if (asgn?.assignment.mode === 'custom') {
      expect(asgn.assignment.portions.length).toBeGreaterThan(0)
      const alicePortion = asgn.assignment.portions.find((p) => p.personId === aliceId)
      expect(alicePortion?.weight).toBe(500) // $5.00 = 500 cents
    }
  })

  it('switching modes updates the store assignment', async () => {
    const user = userEvent.setup()
    render(<AssignSection />)

    // Assign to Alice in single mode first
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, aliceId)

    let { assignments } = useBillStore.getState()
    expect(assignments.find((a) => a.itemId === pizzaId)?.assignment.mode).toBe('single')

    // Switch to everyone mode
    await user.click(screen.getByText('Everyone'))

    assignments = useBillStore.getState().assignments
    // After switching to everyone mode but before clicking "Assign to Everyone",
    // the mode switch itself sets it to everyone
    const asgn = assignments.find((a) => a.itemId === pizzaId)
    expect(asgn?.assignment.mode).toBe('everyone')
  })
})
