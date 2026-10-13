import { dialPosition, formatLux, lightFit, smoothLux, tierForLux } from './light';

test('lux to tier uses GrowSpot bands', () => {
  expect(tierForLux(100)).toBe('too_dark');
  expect(tierForLux(270)).toBe('low');
  expect(tierForLux(799)).toBe('low');
  expect(tierForLux(800)).toBe('medium');
  expect(tierForLux(1600)).toBe('high');
  expect(tierForLux(10799)).toBe('high');
  expect(tierForLux(10800)).toBe('very_high');
});

test('light fit', () => {
  const range = { min: 'medium', best: 'high', max: 'high' } as const;
  expect(lightFit('too_dark', range)).toBe('too_dark');
  expect(lightFit('low', range)).toBe('too_dark');
  expect(lightFit('medium', range)).toBe('ok');
  expect(lightFit('high', range)).toBe('ideal');
  expect(lightFit('very_high', range)).toBe('too_bright');
});

test('dial is logarithmic and clamped', () => {
  expect(dialPosition(1)).toBe(0);
  expect(dialPosition(10)).toBe(0);
  expect(dialPosition(1000)).toBeCloseTo(0.5);
  expect(dialPosition(1e6)).toBe(1);
});

test('smoothing moves part of the way in log space', () => {
  expect(smoothLux(null, 500)).toBe(500);
  expect(smoothLux(100, 10000, 0.5)).toBeCloseTo(1000);
  expect(smoothLux(100, 0)).toBe(0);
});

test('formatLux', () => {
  expect(formatLux(42.4)).toBe('42');
  expect(formatLux(354)).toBe('350');
  expect(formatLux(12_400)).toBe('12k');
});
