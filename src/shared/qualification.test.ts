import { describe, expect, it } from 'vitest';
import { QUALIFICATION_PA_PER_GAME, isQualified, minimumQualifyingPa } from './qualification';

describe('qualification', () => {
  it('exposes a single 1.58 PA-per-game ratio', () => {
    expect(QUALIFICATION_PA_PER_GAME).toBe(1.58);
  });

  it('scales the minimum with the number of team games', () => {
    expect(minimumQualifyingPa(24)).toBeCloseTo(37.92);
    expect(minimumQualifyingPa(10)).toBeCloseTo(15.8);
    expect(minimumQualifyingPa(0)).toBe(0);
  });

  it('qualifies players at or above the threshold, and not below it', () => {
    // 10 team games -> 15.8 PA needed.
    expect(isQualified({ pa: 16 }, 10)).toBe(true);
    expect(isQualified({ pa: 15.8 }, 10)).toBe(true);
    expect(isQualified({ pa: 15 }, 10)).toBe(false);
    expect(isQualified({ pa: 0 }, 10)).toBe(false);
  });
});
