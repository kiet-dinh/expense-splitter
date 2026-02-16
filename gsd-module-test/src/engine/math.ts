/**
 * Calculation Engine — Pure TypeScript, zero React dependencies.
 * All monetary values represented as integer cents.
 */

/**
 * Splits totalCents proportionally to weights using the largest-remainder
 * (Hamilton) method. Guarantees the returned allocations sum to exactly
 * totalCents (zero residual).
 *
 * Tiebreaker: when remainders are equal, lower index gets the extra cent
 * (stable, deterministic).
 */
export function distribute(totalCents: number, weights: number[]): number[] {
  if (weights.length === 0) return []

  const weightSum = weights.reduce((a, b) => a + b, 0)

  if (weightSum === 0 || totalCents === 0) {
    return weights.map(() => 0)
  }

  // Compute raw (fractional) shares and floor each one
  const rawShares = weights.map((w) => (w / weightSum) * totalCents)
  const floored = rawShares.map((s) => Math.floor(s))
  const remainders = rawShares.map((s, i) => s - floored[i])

  // How many extra cents need to be distributed?
  const residual = totalCents - floored.reduce((a, b) => a + b, 0)

  // Sort indices by remainder descending; tiebreak by index ascending (lower wins)
  const sortedIndices = weights
    .map((_, i) => i)
    .sort((a, b) => {
      const diff = remainders[b] - remainders[a]
      return diff !== 0 ? diff : a - b
    })

  // Award one extra cent to the top `residual` indices
  const result = [...floored]
  for (let i = 0; i < residual; i++) {
    result[sortedIndices[i]] += 1
  }

  return result
}

/**
 * Parses a dollar string to integer cents WITHOUT floating-point multiplication.
 * Splits on the decimal point and combines dollars * 100 + cents.
 *
 * Handles: "10", "10.5", "10.50", "$10.00", "0.99"
 */
export function dollarsToCents(input: string): number {
  // Strip all non-numeric characters except the decimal point
  const cleaned = input.replace(/[^0-9.]/g, '')

  const parts = cleaned.split('.')

  const dollars = parseInt(parts[0] || '0', 10)

  if (parts.length === 1) {
    // No decimal point — whole dollars only
    return dollars * 100
  }

  // Normalise cents: pad to 2 digits or truncate to 2 digits
  const centsStr = (parts[1] + '0').slice(0, 2)
  const cents = parseInt(centsStr, 10)

  return dollars * 100 + cents
}

/**
 * Formats integer cents to a display string with 2 decimal places.
 * Example: 1000 → "10.00", 333 → "3.33"
 *
 * Division by 100 is intentional here — this is output formatting only,
 * not a computation that will be stored or used in further arithmetic.
 */
export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2)
}
