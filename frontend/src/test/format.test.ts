import { describe, expect, it } from 'vitest';

import { formatCurrency, formatQuantity } from '@/utils/format';

describe('formatCurrency', () => {
  it('formats a positive number with Rs. prefix', () => {
    expect(formatCurrency(200000)).toBe('Rs. 2,00,000');
  });

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toBe('Rs. 0');
  });

  it('handles string input', () => {
    expect(formatCurrency('1350')).toBe('Rs. 1,350');
  });

  it('falls back gracefully on invalid input', () => {
    expect(formatCurrency('not-a-number')).toBe('Rs. 0');
  });
});

describe('formatQuantity', () => {
  it('formats whole numbers without decimals', () => {
    expect(formatQuantity(15)).toBe('15');
  });

  it('trims unnecessary decimal noise', () => {
    expect(formatQuantity(1333.333333)).toBe('1,333.33');
  });
});
