import { describe, it, expect } from 'vitest'
import { formatDate } from '../../src/controllers/issueController.js'

describe('formatDate', () => {
  it('formats ISO date string to locale format', () => {
    const isoDate = '2024-01-15T10:30:00Z'
    const result = formatDate(isoDate)

    // Should contain date parts (format: DD/MM/YY, HH:MM)
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{2}/)
    expect(result).toMatch(/\d{2}:\d{2}/)
  })

  it('handles dates with different timezones', () => {
    const isoDate = '2024-06-20T14:45:30+02:00'
    const result = formatDate(isoDate)

    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('returns consistent format for various dates', () => {
    const dates = [
      '2024-01-01T00:00:00Z',
      '2024-12-31T23:59:59Z',
      '2024-07-15T12:00:00Z'
    ]

    dates.forEach(date => {
      const result = formatDate(date)
      // Verify it matches expected format pattern
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{2}, \d{2}:\d{2}/)
    })
  })

  it('handles invalid date gracefully', () => {
    const result = formatDate('invalid-date')

    // Should return 'Invalid Date' string representation
    expect(result).toBe('Invalid Date')
  })
})
