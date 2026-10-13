import { editDistance, normalize, scoreName, search, type Searchable } from './search';

test('normalize strips accents, quotes and punctuation', () => {
  expect(normalize("Epipremnum aureum 'Marble Queen'")).toBe('epipremnum aureum marble queen');
  expect(normalize('× Graptoveria')).toBe('graptoveria');
  expect(normalize('Baby’s Tears')).toBe('baby s tears');
});

test('editDistance counts swaps as one edit', () => {
  expect(editDistance('ficus', 'ficus', 1)).toBe(0);
  expect(editDistance('fcius', 'ficus', 1)).toBe(1);
  expect(editDistance('monstra', 'monstera', 1)).toBe(1);
  expect(editDistance('cat', 'dog', 1)).toBe(2);
});

test('scoreName prefers exact, then prefix, then word, then fuzzy', () => {
  expect(scoreName('snake plant', 'snake plant')).toBe(100);
  expect(scoreName('snake', 'snake plant')).toBe(80);
  expect(scoreName('plant', 'snake plant')).toBe(60);
  expect(scoreName('snak pla', 'snake plant')).toBe(60);
  expect(scoreName('monstra', 'monstera deliciosa')).toBe(30);
  expect(scoreName('zz', 'snake plant')).toBe(0);
});

const items: Searchable[] = [
  {
    id: 'a',
    names: ['golden pothos', 'epipremnum aureum', 'pothos'],
    popular: true,
    cultivar: false,
  },
  {
    id: 'b',
    names: ['marble queen pothos', 'epipremnum aureum marble queen'],
    popular: false,
    cultivar: true,
  },
  { id: 'c', names: ['satin pothos', 'scindapsus pictus'], popular: true, cultivar: false },
  { id: 'd', names: ['potato vine', 'solanum'], popular: false, cultivar: false },
];

test('search ranks popular species above cultivars and finds typos', () => {
  expect(search(items, 'pothos').map((i) => i.id)).toEqual(['a', 'c', 'b']);
  expect(search(items, 'pthos').map((i) => i.id)).toContain('a');
  expect(search(items, 'marble').map((i) => i.id)).toEqual(['b']);
  expect(search(items, '')).toEqual([]);
});
