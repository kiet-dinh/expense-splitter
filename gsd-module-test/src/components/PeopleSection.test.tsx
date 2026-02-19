// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useBillStore } from '../store/billStore'
import { useHistoryStore } from '../store/historyStore'
import { PeopleSection } from './PeopleSection'

afterEach(() => {
  cleanup()
})

beforeEach(() => {
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
  localStorage.clear()
  useHistoryStore.setState({ savedSplits: [] })
})

function seedHistory(names: string[]) {
  useHistoryStore.getState().saveSplit({
    name: 'Test',
    people: names.map((n, i) => ({ id: String(i), name: n })),
    items: [],
    assignments: [],
    tipPercent: 0,
    tipSplitMode: 'equal',
    taxMode: 'amount',
    taxValue: 0,
    taxSplitMode: 'equal',
  })
}

describe('PeopleSection', () => {
  it('renders an input and add button', () => {
    render(<PeopleSection />)
    expect(screen.getByPlaceholderText('Enter a name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument()
  })

  it('adds a person when name is typed and add is clicked', async () => {
    const user = userEvent.setup()
    render(<PeopleSection />)

    await user.type(screen.getByPlaceholderText('Enter a name'), 'Alice')
    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('clears the input field after adding a person', async () => {
    const user = userEvent.setup()
    render(<PeopleSection />)

    const input = screen.getByPlaceholderText('Enter a name')
    await user.type(input, 'Alice')
    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(input).toHaveValue('')
  })

  it('shows duplicate warning when typing an existing name (case-insensitive)', async () => {
    const user = userEvent.setup()
    useBillStore.setState({
      people: [{ id: 'person-1', name: 'Alice' }],
    })
    render(<PeopleSection />)

    await user.type(screen.getByPlaceholderText('Enter a name'), 'alice')

    expect(screen.getByText('Name already added')).toBeInTheDocument()
  })

  it('removes duplicate warning when input changes to non-duplicate', async () => {
    const user = userEvent.setup()
    useBillStore.setState({
      people: [{ id: 'person-1', name: 'Alice' }],
    })
    render(<PeopleSection />)

    const input = screen.getByPlaceholderText('Enter a name')
    await user.type(input, 'alice')
    expect(screen.getByText('Name already added')).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, 'Bob')
    expect(screen.queryByText('Name already added')).not.toBeInTheDocument()
  })

  it('removes a person when remove button is clicked', async () => {
    const user = userEvent.setup()
    useBillStore.setState({
      people: [{ id: 'person-1', name: 'Alice' }],
    })
    render(<PeopleSection />)

    expect(screen.getByText('Alice')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /remove/i }))
    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
  })

  it('does not add a person with an empty name', async () => {
    const user = userEvent.setup()
    render(<PeopleSection />)

    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(useBillStore.getState().people).toHaveLength(0)
  })

  it('does not add a person with a whitespace-only name', async () => {
    const user = userEvent.setup()
    render(<PeopleSection />)

    await user.type(screen.getByPlaceholderText('Enter a name'), '   ')
    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(useBillStore.getState().people).toHaveLength(0)
  })

  describe('PEOPLE-04 suggestion chips', () => {
    it('shows no suggestion chips when history is empty', () => {
      render(<PeopleSection />)
      expect(screen.queryByLabelText(/Add .* from previous split/)).not.toBeInTheDocument()
    })

    it('shows suggestion chips for names in history not already in bill', () => {
      seedHistory(['Alice', 'Bob'])
      render(<PeopleSection />)
      expect(screen.getByRole('button', { name: 'Add Alice from previous split' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add Bob from previous split' })).toBeInTheDocument()
    })

    it('does not show chip for name already in current bill (case-insensitive)', () => {
      seedHistory(['Alice'])
      useBillStore.setState({ people: [{ id: 'p1', name: 'Alice' }] })
      render(<PeopleSection />)
      expect(screen.queryByRole('button', { name: 'Add Alice from previous split' })).not.toBeInTheDocument()
    })

    it('clicking a suggestion chip adds the person to the bill', async () => {
      const user = userEvent.setup()
      seedHistory(['Alice'])
      render(<PeopleSection />)
      await user.click(screen.getByRole('button', { name: 'Add Alice from previous split' }))
      expect(useBillStore.getState().people.some((p) => p.name === 'Alice')).toBe(true)
    })

    it('chip disappears after clicking it (person now in bill)', async () => {
      const user = userEvent.setup()
      seedHistory(['Alice'])
      render(<PeopleSection />)
      await user.click(screen.getByRole('button', { name: 'Add Alice from previous split' }))
      expect(screen.queryByRole('button', { name: 'Add Alice from previous split' })).not.toBeInTheDocument()
    })
  })
})
