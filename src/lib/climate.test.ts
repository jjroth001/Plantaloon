import { decodeBase64, describeMonths, outdoorMonths } from './climate';

test('decodeBase64', () => {
  expect(Array.from(decodeBase64('AAEC/w=='))).toEqual([0, 1, 2, 255]);
  expect(Array.from(decodeBase64('aGk='))).toEqual([104, 105]);
});

test('outdoor months and their description', () => {
  const lows = [-5, -4, 0, 5, 10, 14, 17, 16, 12, 6, 1, -3];
  expect(describeMonths(outdoorMonths(lows, 12))).toBe('Jun – Sep');
  expect(describeMonths(outdoorMonths(lows, 15))).toBe('Jul – Aug');
  expect(describeMonths(outdoorMonths(lows, -10))).toBe('All year');
  expect(describeMonths(outdoorMonths(lows, 20))).toBe('Not warm enough');
  // Southern hemisphere: the warm run wraps round the new year.
  const south = [16, 16, 14, 10, 7, 4, 3, 4, 6, 9, 12, 15];
  expect(describeMonths(outdoorMonths(south, 12))).toBe('Nov – Mar');
});
