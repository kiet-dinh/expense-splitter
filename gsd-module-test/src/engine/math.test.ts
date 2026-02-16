import { describe, it, expect } from 'vitest'
import { distribute, dollarsToCents, centsToDollars } from './math'

// =========================================================
// distribute(totalCents: number, weights: number[]): number[]
// Largest-remainder (Hamilton) method — zero residual guarantee
// =========================================================

describe('distribute', () => {
  it('splits 1000 cents three equal ways: [334, 333, 333]', () => {
    const result = distribute(1000, [1, 1, 1])
    expect(result).toEqual([334, 333, 333])
    expect(result.reduce((a, b) => a + b, 0)).toBe(1000)
  })

  it('sum always equals totalCents — equal weights', () => {
    const result = distribute(1000, [1, 1, 1])
    expect(result.reduce((a, b) => a + b, 0)).toBe(1000)
  })

  it('splits proportionally to weights and sums exactly', () => {
    // $15.00 split by weights 3000, 2500, 2000 (represents bill amounts)
    const result = distribute(1500, [3000, 2500, 2000])
    expect(result.reduce((a, b) => a + b, 0)).toBe(1500)
    // Proportions: 3000/7500=40%, 2500/7500=33.33%, 2000/7500=26.67%
    // Raw: 600, 500, 400 — all exact, no remainder needed
    expect(result).toEqual([600, 500, 400])
  })

  it('returns zero array when totalCents is 0', () => {
    expect(distribute(0, [1, 1, 1])).toEqual([0, 0, 0])
  })

  it('returns single share for single recipient', () => {
    expect(distribute(333, [1])).toEqual([333])
  })

  it('splits 100 cents equally two ways: [50, 50]', () => {
    expect(distribute(100, [1, 1])).toEqual([50, 50])
  })

  it('distributes single cent to first recipient when only one cent available', () => {
    // distribute(1, [1,1,1]): each raw share = 0.333, floor = 0, all remainders equal
    // tiebreak: lower index wins — index 0 gets the extra cent
    const result = distribute(1, [1, 1, 1])
    expect(result).toEqual([1, 0, 0])
    expect(result.reduce((a, b) => a + b, 0)).toBe(1)
  })

  it('returns empty array for empty weights', () => {
    expect(distribute(1000, [])).toEqual([])
  })

  it('lower index wins tiebreak when remainders are equal', () => {
    // distribute(2, [1,1,1]): floor=0, remainders all 0.666
    // first two indices get the extra cents
    const result = distribute(2, [1, 1, 1])
    expect(result).toEqual([1, 1, 0])
    expect(result.reduce((a, b) => a + b, 0)).toBe(2)
  })

  it('sum equals totalCents for real bill scenario — $10 split 3 ways', () => {
    // Phase 1 Success Criteria #1
    const result = distribute(1000, [1, 1, 1])
    expect(result.reduce((a, b) => a + b, 0)).toBe(1000)
  })

  it('zero residual for proportional tip distribution', () => {
    // Phase 1 Success Criteria #2
    // Three diners with bills of $30.00, $25.00, $20.00 — split a $7.50 tip proportionally
    const result = distribute(750, [3000, 2500, 2000])
    expect(result.reduce((a, b) => a + b, 0)).toBe(750)
  })
})

// =========================================================
// dollarsToCents(input: string): number
// String-split approach — no floating-point multiplication
// =========================================================

describe('dollarsToCents', () => {
  it('converts "10.00" to 1000', () => {
    expect(dollarsToCents('10.00')).toBe(1000)
  })

  it('converts "33.33" to 3333 — no floating-point error', () => {
    // parseFloat("33.33") * 100 = 3332.9999999... — this must NOT happen
    expect(dollarsToCents('33.33')).toBe(3333)
  })

  it('converts "10" (no decimal) to 1000', () => {
    expect(dollarsToCents('10')).toBe(1000)
  })

  it('converts "10.5" (one decimal place) to 1050', () => {
    expect(dollarsToCents('10.5')).toBe(1050)
  })

  it('strips dollar sign: "$10.00" → 1000', () => {
    expect(dollarsToCents('$10.00')).toBe(1000)
  })

  it('converts "0.99" to 99', () => {
    expect(dollarsToCents('0.99')).toBe(99)
  })

  it('converts "0.01" to 1', () => {
    expect(dollarsToCents('0.01')).toBe(1)
  })

  it('converts "0.00" to 0', () => {
    expect(dollarsToCents('0.00')).toBe(0)
  })

  it('converts "100" to 10000', () => {
    expect(dollarsToCents('100')).toBe(10000)
  })

  it('converts "99.99" to 9999', () => {
    expect(dollarsToCents('99.99')).toBe(9999)
  })
})

// =========================================================
// centsToDollars(cents: number): string
// Display formatting — integer cents to "X.XX" string
// =========================================================

describe('centsToDollars', () => {
  it('converts 1000 to "10.00"', () => {
    expect(centsToDollars(1000)).toBe('10.00')
  })

  it('converts 333 to "3.33"', () => {
    expect(centsToDollars(333)).toBe('3.33')
  })

  it('converts 1 to "0.01"', () => {
    expect(centsToDollars(1)).toBe('0.01')
  })

  it('converts 0 to "0.00"', () => {
    expect(centsToDollars(0)).toBe('0.00')
  })

  it('converts 9999 to "99.99"', () => {
    expect(centsToDollars(9999)).toBe('99.99')
  })

  it('converts 10000 to "100.00"', () => {
    expect(centsToDollars(10000)).toBe('100.00')
  })

  it('round-trips: dollarsToCents then centsToDollars returns original string', () => {
    expect(centsToDollars(dollarsToCents('33.33'))).toBe('33.33')
    expect(centsToDollars(dollarsToCents('10.00'))).toBe('10.00')
    expect(centsToDollars(dollarsToCents('0.99'))).toBe('0.99')
    expect(centsToDollars(dollarsToCents('100'))).toBe('100.00')
  })
})
