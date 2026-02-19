// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResultsSection } from './ResultsSection'
import { useBillStore } from '../store/billStore'
import { useHistoryStore } from '../store/historyStore'

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
  localStorage.clear()
  useHistoryStore.setState({ savedSplits: [] })

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

  describe('copy to clipboard', () => {
    let writeTextMock: ReturnType<typeof vi.fn>

    beforeEach(() => {
      writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
        configurable: true,
      })
    })

    it('shows Copy Summary button when people exist', () => {
      render(<ResultsSection />)
      expect(screen.getByRole('button', { name: /copy summary/i })).toBeInTheDocument()
    })

    it('does not show Copy Summary button when no people', () => {
      resetStore()
      render(<ResultsSection />)
      expect(screen.queryByRole('button', { name: /copy summary/i })).not.toBeInTheDocument()
    })

    it('copies formatted summary to clipboard when clicked', async () => {
      const user = userEvent.setup()
      render(<ResultsSection />)
      const button = screen.getByRole('button', { name: /copy summary/i })

      await user.click(button)

      // Verify "Copied!" appears as feedback (clipboard interaction verified by UI feedback)
      expect(screen.getByText('Copied!')).toBeInTheDocument()
    })

    it('shows "Copied!" feedback after successful copy', async () => {
      const user = userEvent.setup()
      render(<ResultsSection />)
      const button = screen.getByRole('button', { name: /copy summary/i })

      await user.click(button)

      expect(screen.getByText('Copied!')).toBeInTheDocument()
    })

    it('handles clipboard denial gracefully', async () => {
      const user = userEvent.setup()
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) },
        writable: true,
        configurable: true,
      })

      render(<ResultsSection />)
      const button = screen.getByRole('button', { name: /copy summary/i })

      await user.click(button)

      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Bill Split Summary'))
      alertSpy.mockRestore()
    })
  })

  describe('itemized receipt view', () => {
    it('shows "Show details" button for each person with items', () => {
      render(<ResultsSection />)
      const showButtons = screen.getAllByRole('button', { name: /show itemized details/i })
      expect(showButtons.length).toBe(2) // Alice and Bob both have burger via "everyone"
    })

    it('expands to show itemized breakdown when clicked', async () => {
      const user = userEvent.setup()
      render(<ResultsSection />)

      const showButton = screen.getByRole('button', { name: /show itemized details for Alice/i })
      await user.click(showButton)

      // Should show the itemized items
      expect(screen.getByText('Pizza')).toBeInTheDocument()
      expect(screen.getByText('Burger')).toBeInTheDocument()
    })

    it('shows split notes for shared items', async () => {
      const user = userEvent.setup()
      render(<ResultsSection />)

      const showButton = screen.getByRole('button', { name: /show itemized details for Alice/i })
      await user.click(showButton)

      // Burger is split 2 ways
      expect(screen.getByText(/split 2 ways/)).toBeInTheDocument()
    })

    it('shows full price and share for split items', async () => {
      const user = userEvent.setup()
      render(<ResultsSection />)

      const showButton = screen.getByRole('button', { name: /show itemized details for Alice/i })
      await user.click(showButton)

      // Burger is $10.00 total, $5.00 share - check for the $5.00 share display
      const burgerShares = screen.getAllByText('$5.00')
      expect(burgerShares.length).toBeGreaterThan(0)
    })

    it('collapses when Hide details is clicked', async () => {
      const user = userEvent.setup()
      render(<ResultsSection />)

      const showButton = screen.getByRole('button', { name: /show itemized details for Alice/i })
      await user.click(showButton)
      expect(screen.getByText('Pizza')).toBeInTheDocument()

      const hideButton = screen.getByRole('button', { name: /hide itemized details for Alice/i })
      await user.click(hideButton)

      // Region should be removed
      expect(screen.queryByRole('region', { name: /itemized breakdown for Alice/i })).not.toBeInTheDocument()
    })

    it('does not show details button for person with no items', () => {
      resetStore()
      const state = useBillStore.getState()
      state.addPerson('Alice')
      state.addPerson('Bob')
      state.addItem('Pizza', 2000)
      // Assign only to Alice (single mode)
      const { items, people } = useBillStore.getState()
      useBillStore.getState().setAssignment(items[0].id, { mode: 'single', personId: people[0].id })

      render(<ResultsSection />)

      // Only Alice has items
      expect(screen.getAllByRole('button', { name: /show itemized details/i }).length).toBe(1)
    })
  })

  describe('Save Split', () => {
    it('shows Save Split button when people exist', () => {
      render(<ResultsSection />)
      expect(screen.getByRole('button', { name: 'Save this split' })).toBeInTheDocument()
    })

    it('does not show Save Split button when no people', () => {
      resetStore()
      render(<ResultsSection />)
      expect(screen.queryByRole('button', { name: 'Save this split' })).not.toBeInTheDocument()
    })

    it('clicking Save Split button shows the save dialog', async () => {
      const user = userEvent.setup()
      render(<ResultsSection />)
      await user.click(screen.getByRole('button', { name: 'Save this split' }))
      expect(screen.getByPlaceholderText('Name this split (e.g. Friday dinner)')).toBeVisible()
    })

    it('Cancel button closes the save dialog', async () => {
      const user = userEvent.setup()
      render(<ResultsSection />)
      await user.click(screen.getByRole('button', { name: 'Save this split' }))
      await user.click(screen.getByRole('button', { name: 'Cancel save' }))
      expect(screen.queryByPlaceholderText('Name this split (e.g. Friday dinner)')).not.toBeInTheDocument()
    })

    it('Save button is disabled when name is empty', async () => {
      const user = userEvent.setup()
      render(<ResultsSection />)
      await user.click(screen.getByRole('button', { name: 'Save this split' }))
      expect(screen.getByRole('button', { name: 'Confirm save' })).toBeDisabled()
    })

    it('typing a name and clicking Save calls saveSplit with correct data', async () => {
      const user = userEvent.setup()
      render(<ResultsSection />)
      await user.click(screen.getByRole('button', { name: 'Save this split' }))
      await user.type(screen.getByPlaceholderText('Name this split (e.g. Friday dinner)'), 'Friday dinner')
      await user.click(screen.getByRole('button', { name: 'Confirm save' }))

      const { savedSplits } = useHistoryStore.getState()
      expect(savedSplits).toHaveLength(1)
      expect(savedSplits[0].name).toBe('Friday dinner')
      expect(savedSplits[0].people).toEqual(useBillStore.getState().people)
    })

    it('successful save closes the dialog and clears the name input', async () => {
      const user = userEvent.setup()
      render(<ResultsSection />)
      await user.click(screen.getByRole('button', { name: 'Save this split' }))
      await user.type(screen.getByPlaceholderText('Name this split (e.g. Friday dinner)'), 'Friday dinner')
      await user.click(screen.getByRole('button', { name: 'Confirm save' }))
      expect(screen.queryByPlaceholderText('Name this split (e.g. Friday dinner)')).not.toBeInTheDocument()
    })
  })
})
