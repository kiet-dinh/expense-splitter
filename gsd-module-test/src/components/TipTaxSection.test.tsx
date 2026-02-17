// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TipTaxSection } from './TipTaxSection'
import { useBillStore } from '../store/billStore'

afterEach(cleanup)

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

describe('TipTaxSection', () => {
  it('renders tip preset buttons (15%, 18%, 20%)', () => {
    render(<TipTaxSection />)
    expect(screen.getByText('15%')).toBeInTheDocument()
    expect(screen.getByText('18%')).toBeInTheDocument()
    expect(screen.getByText('20%')).toBeInTheDocument()
  })

  it('clicking 20% preset sets tipPercent to 20 in store', async () => {
    const user = userEvent.setup()
    render(<TipTaxSection />)

    await user.click(screen.getByText('20%'))

    const { tipPercent } = useBillStore.getState()
    expect(tipPercent).toBe(20)
  })

  it('clicking 15% preset sets tipPercent to 15 in store', async () => {
    const user = userEvent.setup()
    render(<TipTaxSection />)

    await user.click(screen.getByText('15%'))

    const { tipPercent } = useBillStore.getState()
    expect(tipPercent).toBe(15)
  })

  it('custom tip input overrides preset on blur', async () => {
    const user = userEvent.setup()
    render(<TipTaxSection />)

    const customInput = screen.getByPlaceholderText('e.g. 12.5')
    await user.click(customInput)
    await user.type(customInput, '12.5')
    await user.tab()

    const { tipPercent } = useBillStore.getState()
    expect(tipPercent).toBe(12.5)
  })

  it('tip split mode toggle switches from equal to proportional', async () => {
    const user = userEvent.setup()
    render(<TipTaxSection />)

    // Two "Proportional" buttons exist (tip and tax), scope to tip split group
    const tipSplitGroup = screen.getByRole('group', { name: 'Tip split mode' })
    const proportionalButton = tipSplitGroup.querySelectorAll('button')[1]!
    await user.click(proportionalButton)

    const { tipSplitMode } = useBillStore.getState()
    expect(tipSplitMode).toBe('proportional')
  })

  it('tip split mode toggle switches back to equal', async () => {
    const user = userEvent.setup()
    useBillStore.setState({ tipSplitMode: 'proportional' })
    render(<TipTaxSection />)

    // Find tip split group and click Equal
    const tipSplitGroup = screen.getByRole('group', { name: 'Tip split mode' })
    const equalButton = tipSplitGroup.querySelector('button')!
    await user.click(equalButton)

    const { tipSplitMode } = useBillStore.getState()
    expect(tipSplitMode).toBe('equal')
  })

  it('tax mode toggle switches to percentage', async () => {
    const user = userEvent.setup()
    render(<TipTaxSection />)

    await user.click(screen.getByText('Percentage'))

    const { taxMode } = useBillStore.getState()
    expect(taxMode).toBe('percent')
  })

  it('tax mode toggle switches back to dollar amount', async () => {
    const user = userEvent.setup()
    useBillStore.setState({ taxMode: 'percent' })
    render(<TipTaxSection />)

    await user.click(screen.getByText('Dollar Amount'))

    const { taxMode } = useBillStore.getState()
    expect(taxMode).toBe('amount')
  })

  it('entering tax dollar amount stores correct cents in store', async () => {
    const user = userEvent.setup()
    render(<TipTaxSection />)

    const taxInput = screen.getByPlaceholderText('0.00')
    await user.click(taxInput)
    await user.type(taxInput, '5.00')
    await user.tab()

    const { taxValue } = useBillStore.getState()
    expect(taxValue).toBe(500) // $5.00 = 500 cents
  })

  it('entering tax percentage stores correct number in store', async () => {
    const user = userEvent.setup()
    render(<TipTaxSection />)

    await user.click(screen.getByText('Percentage'))
    const taxInput = screen.getByPlaceholderText('0.0')
    await user.click(taxInput)
    await user.type(taxInput, '8.5')
    await user.tab()

    const { taxValue } = useBillStore.getState()
    expect(taxValue).toBe(8.5)
  })

  it('tax split mode toggle switches to proportional', async () => {
    const user = userEvent.setup()
    render(<TipTaxSection />)

    const taxSplitGroup = screen.getByRole('group', { name: 'Tax split mode' })
    const proportionalButton = taxSplitGroup.querySelectorAll('button')[1]!
    await user.click(proportionalButton)

    const { taxSplitMode } = useBillStore.getState()
    expect(taxSplitMode).toBe('proportional')
  })

  it('switching tax mode resets taxValue to 0', async () => {
    const user = userEvent.setup()
    useBillStore.setState({ taxValue: 500, taxMode: 'amount' })
    render(<TipTaxSection />)

    await user.click(screen.getByText('Percentage'))

    const { taxValue } = useBillStore.getState()
    expect(taxValue).toBe(0)
  })
})
