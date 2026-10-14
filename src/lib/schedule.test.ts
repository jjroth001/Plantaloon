import { addDays, daysBetween } from './dates';
import {
  describeDue,
  endOfWinter,
  intervalOn,
  isWinter,
  nextDue,
  suggestLongerInterval,
  potSizeFactor,
  potSizeFor,
  suggestedWaterDays,
  type DueInput,
} from './schedule';

const care = { winterFactor: 2, fertilizeInWinter: false };

function input(overrides: Partial<DueInput>): DueInput {
  return {
    task: 'water',
    intervalDays: 7,
    care,
    hemisphere: 'north',
    lastDone: null,
    lastSkip: null,
    addedOn: '2031-06-01',
    ...overrides,
  };
}

describe('dates', () => {
  test('addDays crosses months, years and DST changes by calendar day', () => {
    expect(addDays('2031-01-31', 1)).toBe('2031-02-01');
    expect(addDays('2031-12-30', 3)).toBe('2032-01-02');
    expect(addDays('2031-03-08', 2)).toBe('2031-03-10');
    expect(addDays('2031-11-01', 2)).toBe('2031-11-03');
  });

  test('daysBetween is signed', () => {
    expect(daysBetween('2031-06-01', '2031-06-08')).toBe(7);
    expect(daysBetween('2031-06-08', '2031-06-01')).toBe(-7);
    expect(daysBetween('2031-02-27', '2031-03-01')).toBe(2);
  });
});

describe('seasons', () => {
  test('winter months per hemisphere', () => {
    expect(isWinter('2031-12-15', 'north')).toBe(true);
    expect(isWinter('2031-02-28', 'north')).toBe(true);
    expect(isWinter('2031-03-01', 'north')).toBe(false);
    expect(isWinter('2031-12-15', 'south')).toBe(false);
    expect(isWinter('2031-07-01', 'south')).toBe(true);
  });

  test('endOfWinter jumps to spring, or keeps a non-winter date', () => {
    expect(endOfWinter('2031-11-20', 'north')).toBe('2032-03-01');
    expect(endOfWinter('2031-01-20', 'north')).toBe('2031-03-01');
    expect(endOfWinter('2031-06-20', 'north')).toBe('2031-06-20');
    expect(endOfWinter('2031-06-20', 'south')).toBe('2031-09-01');
  });

  test('watering slows in winter; feeding interval does not change', () => {
    expect(intervalOn('water', 7, '2031-06-01', care, 'north')).toBe(7);
    expect(intervalOn('water', 7, '2031-12-01', care, 'north')).toBe(14);
    expect(intervalOn('water', 7, '2031-12-01', { ...care, winterFactor: 1 }, 'north')).toBe(7);
    expect(intervalOn('fertilize', 14, '2031-12-01', care, 'north')).toBe(14);
  });
});

describe('nextDue', () => {
  test('a new plant with no history: water on day one, feed after one interval', () => {
    expect(nextDue(input({}))).toBe('2031-06-01');
    expect(nextDue(input({ task: 'fertilize', intervalDays: 14 }))).toBe('2031-06-15');
  });

  test('last done + interval', () => {
    expect(nextDue(input({ lastDone: '2031-06-10' }))).toBe('2031-06-17');
  });

  test('winter watering uses the longer interval', () => {
    expect(nextDue(input({ lastDone: '2031-12-10' }))).toBe('2031-12-24');
  });

  test('a skip pushes the next check out from the skip day', () => {
    expect(
      nextDue(input({ lastDone: '2031-06-10', lastSkip: { on: '2031-06-17', days: 2 } })),
    ).toBe('2031-06-19');
  });

  test('feeding pauses over winter unless the profile says otherwise', () => {
    const feed = input({ task: 'fertilize', intervalDays: 30, lastDone: '2031-10-15' });
    expect(nextDue(feed)).toBe('2032-03-01');
    expect(nextDue({ ...feed, care: { ...care, fertilizeInWinter: true } })).toBe('2031-11-14');
    expect(nextDue({ ...feed, hemisphere: 'south' })).toBe('2031-11-14');
  });
});

describe('suggestions', () => {
  test('pot size nudges the starting interval', () => {
    expect(suggestedWaterDays(10, 's')).toBe(8);
    expect(suggestedWaterDays(10, 'm')).toBe(10);
    expect(suggestedWaterDays(10, 'l')).toBe(13);
    expect(suggestedWaterDays(1, 's')).toBe(1);
  });

  test('plants in the ground are watered less often, whatever the pot fields say', () => {
    expect(suggestedWaterDays(10, 's', 'terracotta', 9, true)).toBe(15);
    expect(suggestedWaterDays(10, 'l', 'plastic', null, true)).toBe(15);
  });

  test('three skips in a row suggest a longer interval', () => {
    expect(suggestLongerInterval(7, 2)).toBeNull();
    expect(suggestLongerInterval(7, 3)).toBe(9);
    expect(suggestLongerInterval(2, 3)).toBe(3);
    expect(suggestLongerInterval(90, 5)).toBeNull();
  });

  test('describeDue', () => {
    expect(describeDue(0)).toBe('Today');
    expect(describeDue(1)).toBe('Tomorrow');
    expect(describeDue(4)).toBe('In 4 days');
    expect(describeDue(-1)).toBe('1 day late');
    expect(describeDue(-3)).toBe('3 days late');
  });
});

describe('pot diameter', () => {
  test('bigger pots stay damp longer, gently and within limits', () => {
    const f = (cm: number) => Math.round(potSizeFactor('m', cm) * 100) / 100;
    expect(f(8)).toBeCloseTo(0.69, 2);
    expect(f(10)).toBeCloseTo(0.78, 2);
    expect(f(15)).toBe(1);
    expect(f(20)).toBeCloseTo(1.19, 2);
    expect(f(30)).toBeCloseTo(1.52, 2);
    expect(f(3)).toBe(0.6);
    expect(f(80)).toBe(1.6);
  });

  test('a typed diameter overrides the quick pick in the suggestion', () => {
    expect(suggestedWaterDays(10, 's', 'plastic', 30)).toBe(15);
    expect(suggestedWaterDays(10, 'l', 'plastic', null)).toBe(13);
    expect(potSizeFor(9)).toBe('s');
    expect(potSizeFor(18)).toBe('m');
    expect(potSizeFor(28)).toBe('l');
  });
});
