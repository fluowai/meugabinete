import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('combina classes e resolve conflitos do Tailwind', () => {
    const shouldHide = false;
    expect(cn('px-2', shouldHide && 'hidden', 'px-4')).toBe('px-4');
  });
});
