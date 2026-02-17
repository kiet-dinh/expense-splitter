// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useBillStore } from '../store/billStore'
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
})

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
})
