import { describe, expect, it } from 'bun:test';
import { convertDistanceTextToKm } from './distance';

describe('convertDistanceTextToKm', () => {
  it('returns kilometers when text already in km', () => {
    expect(convertDistanceTextToKm('12.5 km')).toBeCloseTo(12.5);
  });

  it('converts miles to kilometers', () => {
    expect(convertDistanceTextToKm('10 mi')).toBeCloseTo(16.0934);
  });

  it('throws when text cannot be parsed', () => {
    expect(() => convertDistanceTextToKm('unknown unit')).toThrow('Unable to parse distance');
  });
});
