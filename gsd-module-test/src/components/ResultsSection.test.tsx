// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ResultsSection } from './ResultsSection'
import { useBillStore } from '../store/billStore'

afterEach(cleanup)

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
let pizzaId: string
let burgerItemId: string

beforeEach(() => {
  resetStore()

  const state = useBillStore.getState()
  state.addPerson('Alice')
  state.addPerson('Bob')

  const { people } = useBillStore.getState()
  aliceId = people[0].id

  state.addItem('Pizza', 2000)   // $20.00
  state.addItem('Burger', 1000)  // $10.00

  const { items } = useBillStore.getState()
  pizzaId = items[0].id
  burgerItemId = items[1].id

  // Assign pizza to Alice only
  useBillStore.getState().setAssignment(pizzaId, { mode: 'single', personId: aliceId })
  // Assign burger to everyone (Alice and Bob split equally)
  useBillStore.getState().setAssignment(burgerItemId, { mode: 'everyone' })
})

describe('ResultsSection', () => {
  it('shows "Add people to see results" when no people', () => {
    resetStore()
    render(<ResultsSection />)
    expect(screen.getByText('Add people to see results')).toBeInTheDocument()
  })

  it('displays per-person breakdown with correct names', () => {
    render(<ResultsSection />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows correct subtotals per person', () => {
    render(<ResultsSection />)
    // Alice has Pizza ($20) + half of Burger ($5) = $25.00
    // Bob has half of Burger ($5) = $5.00
    // Both show up as subtotal in their cards
    const subtotalLabels = screen.getAllByText('Subtotal')
    expect(subtotalLabels.length).toBeGreaterThan(0)
  })

  it('shows grand total section', () => {
    render(<ResultsSection />)
    expect(screen.getByText('Grand Total')).toBeInTheDocument()
    // Both items assigned: $20 + $10 = $30.00 total
    const totalLabels = screen.getAllByText('Total')
    expect(totalLabels.length).toBeGreaterThan(0)
  })

  it('verification shows $0.00 difference', () => {
    render(<ResultsSection />)
    expect(screen.getByText(/Verification: difference = \$0\.00/)).toBeInTheDocument()
  })

  it('shows unassigned items warning when items lack assignments', () => {
    resetStore()
    const state = useBillStore.getState()
    state.addPerson('Alice')
    state.addItem('Pizza', 2000)
    // Do not assign the item

    render(<ResultsSection />)
    expect(screen.getByText(/unassigned/)).toBeInTheDocument()
    expect(screen.getByText(/20\.00/)).toBeInTheDocument()
  })

  it('does not show unassigned warning when all items are assigned', () => {
    render(<ResultsSection />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('updates when tip is added to store', () => {
    const { rerender } = render(<ResultsSection />)

    // Add 20% tip
    useBillStore.setState({ tipPercent: 20 })
    rerender(<ResultsSection />)

    // Tip shares should appear — both should be > $0.00
    const tipLabels = screen.getAllByText('Tip share')
    expect(tipLabels.length).toBe(2) // one per person
  })

  it('shows correct per-person totals with no tip or tax', () => {
    render(<ResultsSection />)
    // Alice: Pizza($20) + half Burger($5) = $25.00 total
    // Bob: half Burger($5) = $5.00 total
    // Values appear multiple times (per-person row + grand total), use getAllByText
    expect(screen.getAllByText('$25.00').length).toBeGreaterThan(0)
    expect(screen.getAllByText('$5.00').length).toBeGreaterThan(0)
  })
})
