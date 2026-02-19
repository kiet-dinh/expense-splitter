// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HistorySection } from './HistorySection'
import { useHistoryStore } from '../store/historyStore'
import { useBillStore } from '../store/billStore'

beforeEach(() => {
  localStorage.clear()
  useHistoryStore.setState({ savedSplits: [] })
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

afterEach(cleanup)

function seedSplit(name: string, people = [] as { id: string; name: string }[]) {
  useHistoryStore.getState().saveSplit({
    name,
    people,
    items: [],
    assignments: [],
    tipPercent: 0,
    tipSplitMode: 'equal',
    taxMode: 'amount',
    taxValue: 0,
    taxSplitMode: 'equal',
  })
}

describe('HistorySection', () => {
  it('shows "No saved splits yet" when history is empty', () => {
    render(<HistorySection />)
    expect(screen.getByText('No saved splits yet')).toBeInTheDocument()
  })

  it('shows saved split name when history has entries', () => {
    seedSplit('Friday dinner')
    render(<HistorySection />)
    expect(screen.getByText('Friday dinner')).toBeInTheDocument()
  })

  it('shows saved date for each entry', () => {
    seedSplit('Date test')
    render(<HistorySection />)
    const split = useHistoryStore.getState().savedSplits[0]
    const formatted = new Date(split.savedAt).toLocaleDateString()
    expect(screen.getByText(formatted)).toBeInTheDocument()
  })

  it('clicking Delete removes the entry', async () => {
    seedSplit('Dinner')
    render(<HistorySection />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.queryByText('Dinner')).not.toBeInTheDocument()
  })

  it('clicking Load calls useBillStore.setState with the split data', async () => {
    const spy = vi.spyOn(useBillStore, 'setState')
    seedSplit('Alice split', [{ id: 'p1', name: 'Alice' }])
    render(<HistorySection />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Load' }))
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('clicking Load on an entry when bill has data shows confirm dialog', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    useBillStore.setState({ people: [{ id: 'x', name: 'Bob' }] })
    seedSplit('Some split')
    render(<HistorySection />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Load' }))
    expect(confirmSpy).toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('clicking Load when confirm returns false does not update bill store', async () => {
    useBillStore.setState({ people: [{ id: 'x', name: 'Bob' }] })
    seedSplit('Some split')
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const spy = vi.spyOn(useBillStore, 'setState')
    render(<HistorySection />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Load' }))
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
    vi.restoreAllMocks()
  })
})
