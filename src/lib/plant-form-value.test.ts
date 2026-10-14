import type { Room } from '@/db/types';

import { sectionSummary, type PlantFormValue } from '@/lib/plant-form-value';
import { spotSummary } from '@/lib/plant-form-value';

const room = (id: string, name: string, outdoor = false) =>
  ({ id, name, outdoor, lightTier: 'medium', growLight: false, draught: false }) as Room;
const rooms = [room('k', 'Kitchen'), room('g', 'Garden', true)];
const value: PlantFormValue = {
  nickname: '',
  roomId: 'k',
  potSize: 'm',
  potDrainage: true,
  potMaterial: 'terracotta',
  potDiameter: '',
  inGround: false,
  potMates: [],
  water: { enabled: true, intervalDays: 7 },
  fertilize: { enabled: true, intervalDays: 30 },
  extras: [{ task: 'repot', label: null, intervalDays: 730 }],
};
const context = { rooms, unit: 'cm' as const, plants: [], name: 'Pothos' };

test('closed folds summarise their section in a line', () => {
  expect(sectionSummary('name', value, context)).toBe('Pothos · Kitchen');
  expect(sectionSummary('pot', value, context)).toBe('Medium, terracotta');
  expect(sectionSummary('pot', { ...value, potDiameter: '14', potDrainage: false }, context)).toBe(
    '14 cm wide, terracotta · no drainage',
  );
  expect(sectionSummary('pot', { ...value, roomId: 'g', inGround: true }, context)).toBe(
    'Planted in the ground',
  );
  expect(sectionSummary('care', value, context)).toBe('Water every week · feed every month');
  expect(sectionSummary('extras', value, context)).toBe('Repot every 2 years');
  expect(sectionSummary('extras', { ...value, extras: [] }, context)).toBe('None');
});

test('a spot summary says what differs from the room', () => {
  const same = { light: null, lux: null, growLight: null, draught: null, nearHeater: false };
  expect(spotSummary(same, rooms[0])).toBe('Same as Kitchen');
  expect(spotSummary({ ...same, light: 'high', nearHeater: true }, rooms[0])).toBe(
    'Bright, indirect · near a heater',
  );
});
