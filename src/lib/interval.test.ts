import {
  describeInterval,
  INTERVAL_MAX,
  INTERVAL_PRESETS,
  shortInterval,
  unitFor,
} from './interval';

test('intervals read naturally', () => {
  expect(describeInterval(1)).toBe('Every day');
  expect(describeInterval(10)).toBe('Every 10 days');
  expect(describeInterval(7)).toBe('Every week');
  expect(describeInterval(14)).toBe('Every 2 weeks');
  expect(describeInterval(30)).toBe('Every month');
  expect(describeInterval(90)).toBe('Every 3 months');
  expect(describeInterval(365)).toBe('Every year');
  expect(describeInterval(1095)).toBe('Every 3 years');
  expect(shortInterval(1460)).toBe('4 years');
  expect(shortInterval(3)).toBe('3 days');
});

test('the most natural unit is picked', () => {
  expect(unitFor(730)).toBe('year');
  expect(unitFor(180)).toBe('month');
  expect(unitFor(28)).toBe('week');
  expect(unitFor(45)).toBe('day');
});

test('every quick pick is allowed, and repotting goes from 6 months to 4 years', () => {
  for (const [kind, presets] of Object.entries(INTERVAL_PRESETS)) {
    for (const days of presets) expect(days).toBeLessThanOrEqual(INTERVAL_MAX[kind as 'water']);
  }
  expect(INTERVAL_PRESETS.repot).toEqual([180, 365, 730, 1095, 1460]);
});
