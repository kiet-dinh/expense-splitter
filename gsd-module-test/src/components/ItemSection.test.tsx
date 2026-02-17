// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useBillStore } from '../store/billStore'
import { ItemSection } from './ItemSection'

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

describe('ItemSection', () => {
  it('renders name input, price input, and add button', () => {
    render(<ItemSection />)
    expect(screen.getByPlaceholderText('Item name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument()
  })

  it('adds an item when name and price are provided', async () => {
    const user = userEvent.setup()
    render(<ItemSection />)

    await user.type(screen.getByPlaceholderText('Item name'), 'Pizza')
    await user.type(screen.getByPlaceholderText('0.00'), '12.50')
    await user.click(screen.getByRole('button', { name: /add item/i }))

    expect(screen.getByText('Pizza')).toBeInTheDocument()
    expect(screen.getByText('$12.50')).toBeInTheDocument()
  })

  it('clears both input fields after adding an item', async () => {
    const user = userEvent.setup()
    render(<ItemSection />)

    const nameInput = screen.getByPlaceholderText('Item name')
    const priceInput = screen.getByPlaceholderText('0.00')

    await user.type(nameInput, 'Pizza')
    await user.type(priceInput, '12.50')
    await user.click(screen.getByRole('button', { name: /add item/i }))

    expect(nameInput).toHaveValue('')
    expect(priceInput).toHaveValue('')
  })

  it('updates subtotal when an item is added', async () => {
    const user = userEvent.setup()
    render(<ItemSection />)

    // Subtotal starts at 0
    expect(screen.getByText('Subtotal: $0.00')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText('Item name'), 'Burger')
    await user.type(screen.getByPlaceholderText('0.00'), '10.00')
    await user.click(screen.getByRole('button', { name: /add item/i }))

    expect(screen.getByText('Subtotal: $10.00')).toBeInTheDocument()
  })

  it('removes item from list and updates subtotal when delete is clicked', async () => {
    const user = userEvent.setup()
    useBillStore.setState({
      items: [{ id: 'item-1', name: 'Salad', priceCents: 800 }],
    })
    render(<ItemSection />)

    expect(screen.getByText('Salad')).toBeInTheDocument()
    expect(screen.getByText('Subtotal: $8.00')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(screen.queryByText('Salad')).not.toBeInTheDocument()
    expect(screen.getByText('Subtotal: $0.00')).toBeInTheDocument()
  })

  it('enters edit mode and updates name on Enter', async () => {
    const user = userEvent.setup()
    useBillStore.setState({
      items: [{ id: 'item-1', name: 'Burger', priceCents: 1000 }],
    })
    render(<ItemSection />)

    await user.click(screen.getByRole('button', { name: /edit/i }))

    const editNameInput = screen.getByLabelText('Edit item name')
    expect(editNameInput).toBeInTheDocument()

    await user.clear(editNameInput)
    await user.type(editNameInput, 'Cheeseburger')
    await user.keyboard('{Enter}')

    expect(screen.getByText('Cheeseburger')).toBeInTheDocument()
  })

  it('enters edit mode and updates price on Enter', async () => {
    const user = userEvent.setup()
    useBillStore.setState({
      items: [{ id: 'item-1', name: 'Fries', priceCents: 300 }],
    })
    render(<ItemSection />)

    await user.click(screen.getByRole('button', { name: /edit/i }))

    const editPriceInput = screen.getByLabelText('Edit item price')
    await user.click(editPriceInput)
    await user.clear(editPriceInput)
    await user.type(editPriceInput, '5.00')
    await user.keyboard('{Enter}')

    expect(useBillStore.getState().items[0].priceCents).toBe(500)
  })

  it('does not add an item with an empty name', async () => {
    const user = userEvent.setup()
    render(<ItemSection />)

    await user.type(screen.getByPlaceholderText('0.00'), '5.00')
    await user.click(screen.getByRole('button', { name: /add item/i }))

    expect(useBillStore.getState().items).toHaveLength(0)
  })

  it('subtotal is always present in DOM at mount time', () => {
    render(<ItemSection />)
    expect(screen.getByText('Subtotal: $0.00')).toBeInTheDocument()
  })
})
