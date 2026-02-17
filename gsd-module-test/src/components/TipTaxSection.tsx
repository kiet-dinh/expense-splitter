import { useState } from 'react'
import { useShallow } from 'zustand/shallow'
import { dollarsToCents, centsToDollars } from '../engine/math'
import { useBillStore } from '../store/billStore'
import type { TipSplitMode, TaxMode, TaxSplitMode } from '../store/billStore'

const TIP_PRESETS = [15, 18, 20]

export function TipTaxSection() {
  const {
    tipPercent,
    tipSplitMode,
    taxMode,
    taxValue,
    taxSplitMode,
    setTipPercent,
    setTipSplitMode,
    setTaxMode,
    setTaxValue,
    setTaxSplitMode,
  } = useBillStore(
    useShallow((s) => ({
      tipPercent: s.tipPercent,
      tipSplitMode: s.tipSplitMode,
      taxMode: s.taxMode,
      taxValue: s.taxValue,
      taxSplitMode: s.taxSplitMode,
      setTipPercent: s.setTipPercent,
      setTipSplitMode: s.setTipSplitMode,
      setTaxMode: s.setTaxMode,
      setTaxValue: s.setTaxValue,
      setTaxSplitMode: s.setTaxSplitMode,
    }))
  )

  // Custom tip input: string state while typing
  const [customTipInput, setCustomTipInput] = useState('')

  // Tax value input: string state while typing
  const [taxInput, setTaxInput] = useState(() => {
    if (taxMode === 'amount') {
      return taxValue > 0 ? centsToDollars(taxValue) : ''
    }
    return taxValue > 0 ? String(taxValue) : ''
  })

  function handlePresetClick(preset: number) {
    setTipPercent(preset)
    setCustomTipInput('')
  }

  function handleCustomTipBlur() {
    const val = parseFloat(customTipInput)
    if (!isNaN(val) && val >= 0) {
      setTipPercent(val)
    } else if (customTipInput === '') {
      // Do not reset if empty — keep current value
    }
  }

  function handleTaxModeChange(mode: TaxMode) {
    setTaxMode(mode)
    setTaxValue(0)
    setTaxInput('')
  }

  function handleTaxInputBlur() {
    if (taxMode === 'amount') {
      const cents = dollarsToCents(taxInput)
      setTaxValue(cents)
    } else {
      const val = parseFloat(taxInput)
      if (!isNaN(val) && val >= 0) {
        setTaxValue(val)
      }
    }
  }

  const splitModeButtonClass = (current: string, target: string) =>
    `px-3 py-1 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
      current === target
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Tip &amp; Tax</h2>

      {/* Tip subsection */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Tip</h3>

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="Tip presets">
          {TIP_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handlePresetClick(preset)}
              aria-pressed={tipPercent === preset && customTipInput === ''}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                tipPercent === preset && customTipInput === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {preset}%
            </button>
          ))}
        </div>

        {/* Custom tip input */}
        <div className="flex items-center gap-2 mb-3">
          <label htmlFor="custom-tip" className="text-sm text-gray-600">
            Custom:
          </label>
          <input
            id="custom-tip"
            type="text"
            inputMode="decimal"
            value={customTipInput}
            onChange={(e) => setCustomTipInput(e.target.value)}
            onBlur={handleCustomTipBlur}
            placeholder="e.g. 12.5"
            className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-500">%</span>
        </div>

        {/* Tip split mode toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Split:</span>
          <div className="flex gap-1" role="group" aria-label="Tip split mode">
            {(['equal', 'proportional'] as TipSplitMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setTipSplitMode(m)}
                aria-pressed={tipSplitMode === m}
                className={splitModeButtonClass(tipSplitMode, m)}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tax subsection */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Tax</h3>

        {/* Tax mode toggle */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-600">Mode:</span>
          <div className="flex gap-1" role="group" aria-label="Tax mode">
            <button
              type="button"
              onClick={() => handleTaxModeChange('amount')}
              aria-pressed={taxMode === 'amount'}
              className={splitModeButtonClass(taxMode, 'amount')}
            >
              Dollar Amount
            </button>
            <button
              type="button"
              onClick={() => handleTaxModeChange('percent')}
              aria-pressed={taxMode === 'percent'}
              className={splitModeButtonClass(taxMode, 'percent')}
            >
              Percentage
            </button>
          </div>
        </div>

        {/* Tax value input */}
        <div className="flex items-center gap-2 mb-3">
          <label htmlFor="tax-value" className="text-sm text-gray-600">
            {taxMode === 'amount' ? 'Amount ($):' : 'Rate (%):'}
          </label>
          <input
            id="tax-value"
            type="text"
            inputMode="decimal"
            value={taxInput}
            onChange={(e) => setTaxInput(e.target.value)}
            onBlur={handleTaxInputBlur}
            placeholder={taxMode === 'amount' ? '0.00' : '0.0'}
            className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Tax split mode toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Split:</span>
          <div className="flex gap-1" role="group" aria-label="Tax split mode">
            {(['equal', 'proportional'] as TaxSplitMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setTaxSplitMode(m)}
                aria-pressed={taxSplitMode === m}
                className={splitModeButtonClass(taxSplitMode, m)}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
