import type { Room } from '@/db/types';

import { checkSpot, effectiveLight } from './spot';

const room: Room = {
  id: 'r',
  name: 'Bathroom',
  icon: 'bathtub',
  lightTier: 'medium',
  lightLux: null,
  growLight: false,
  humidity: null,
  warmth: null,
  draught: false,
  outdoor: false,
  sortOrder: 0,
  createdAt: 0,
  updatedAt: 0,
};
const fern = {
  humidity: 'high',
  minTempC: 15,
  light: { min: 'low', best: 'medium', max: 'high' },
} as const;
const cactus = {
  humidity: 'low',
  minTempC: 5,
  light: { min: 'high', best: 'very_high', max: 'very_high' },
} as const;
const opts = { lows: null, month: 6, unit: 'C' as const };

test('a grow light counts as at least bright light', () => {
  expect(effectiveLight({ lightTier: 'low', growLight: true })).toBe('high');
  expect(effectiveLight({ lightTier: null, growLight: true })).toBe('high');
  expect(effectiveLight({ lightTier: 'very_high', growLight: true })).toBe('very_high');
  expect(effectiveLight({ lightTier: 'low', growLight: false })).toBe('low');
});

test('nothing to say about a room with no conditions set', () => {
  expect(checkSpot(fern, room, opts)).toEqual([]);
});

test('humidity, warmth and draughts', () => {
  const dryCool = { ...room, humidity: 'dry', warmth: 'cool', draught: true } as Room;
  expect(checkSpot(fern, dryCool, opts).map((c) => c.icon)).toEqual([
    'drop-half',
    'thermometer-cold',
    'wind',
  ]);
  expect(checkSpot(cactus, { ...room, humidity: 'humid' }, opts)[0].icon).toBe('drop-half');
  expect(checkSpot(cactus, { ...room, humidity: 'dry' }, opts)).toEqual([
    { icon: 'check-circle', tone: 'good', text: 'Bathroom suits it well.' },
  ]);
});

test('outdoor plants follow the local season', () => {
  const patio = { ...room, name: 'Patio', outdoor: true } as Room;
  const lows = [-2, -1, 2, 6, 10, 14, 17, 16, 12, 7, 2, -1];
  expect(checkSpot(fern, patio, { ...opts, lows, month: 6 })[0].tone).toBe('good');
  expect(checkSpot(fern, patio, { ...opts, lows, month: 7 })[0].text).toMatch(/next month/);
  const now = checkSpot(fern, patio, { ...opts, lows, month: 9 })[0];
  expect(now.urgent).toBe(true);
  expect(now.text).toMatch(/bring it inside/);
  // Without a shared area: a general rule.
  expect(checkSpot(fern, patio, opts)[0].text).toMatch(/Settings/);
});
