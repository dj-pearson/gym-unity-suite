import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'conditional', false && 'not-included');
    expect(result).toBe('base conditional');
  });

  it('should handle undefined and null values', () => {
    const result = cn('base', undefined, null, 'valid');
    expect(result).toBe('base valid');
  });

  it('should merge tailwind classes correctly (last wins)', () => {
    const result = cn('bg-red-500', 'bg-blue-500');
    expect(result).toBe('bg-blue-500');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['class1', 'class2']);
    expect(result).toBe('class1 class2');
  });

  it('should handle object notation', () => {
    const result = cn({
      'active-class': true,
      'inactive-class': false,
    });
    expect(result).toBe('active-class');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle complex combinations', () => {
    const isActive = true;
    const isDisabled = false;
    const result = cn(
      'base-class',
      isActive && 'active',
      isDisabled && 'disabled',
      { 'object-true': true, 'object-false': false },
      ['array-class']
    );
    expect(result).toBe('base-class active object-true array-class');
  });

  it('should properly merge padding classes', () => {
    const result = cn('p-2', 'p-4');
    expect(result).toBe('p-4');
  });

  it('should properly merge margin classes', () => {
    const result = cn('m-2', 'm-4');
    expect(result).toBe('m-4');
  });
});
