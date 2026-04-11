import { parseMaskedSelectors } from '../../src/cli';

describe('parseMaskedSelectors', () => {
  test('U1: single --mask flag returns single selector', () => {
    expect(parseMaskedSelectors(['--mask', '.btn'])).toStrictEqual(['.btn']);
  });

  test('U2: multiple --mask flags return all selectors', () => {
    expect(parseMaskedSelectors(['--mask', '.btn', '--mask', '#panel'])).toStrictEqual(['.btn', '#panel']);
  });

  test('U3: empty argv returns empty array', () => {
    expect(parseMaskedSelectors([])).toStrictEqual([]);
  });

  test('U4: dangling --mask with no value returns empty array', () => {
    expect(parseMaskedSelectors(['--mask'])).toStrictEqual([]);
  });

  test('U5: whitespace around selector is trimmed', () => {
    expect(parseMaskedSelectors(['--mask', '  .btn  '])).toStrictEqual(['.btn']);
  });

  test('U6: empty string value is excluded', () => {
    expect(parseMaskedSelectors(['--mask', ''])).toStrictEqual([]);
  });

  test('U7: unrelated flags before --mask are ignored', () => {
    expect(parseMaskedSelectors(['--other', 'val', '--mask', '.x'])).toStrictEqual(['.x']);
  });

  test('U8: whitespace-only value is excluded', () => {
    expect(parseMaskedSelectors(['--mask', '   '])).toStrictEqual([]);
  });
});
