import { describe, expect, it } from 'vitest';

import { Pair } from '../src/pair.js';

describe('Pair()', () => {
  it('Relates two items', () => {
    expect(new Pair(1, 2)).toEqual(
      expect.objectContaining({
        first: 1,
        second: 2,
      }),
    );
  });

  it('Pair.of()', () => {
    expect(Pair.of(1, 2)).toEqual(
      expect.objectContaining({
        first: 1,
        second: 2,
      }),
    );
  });

  it('swap()', () => {
    expect(Pair.of(1, 2).swap()).toEqual(
      expect.objectContaining({
        first: 2,
        second: 1,
      }),
    );
  });

  it('toTuple()', () => {
    expect(new Pair(1, 2).toTuple()).toEqual([1, 2]);
  });

  it('equals()', () => {
    const pair1 = new Pair(1, 2);
    const pair2 = new Pair(1, 2);

    expect(pair1.equals(pair2)).toBeTruthy();
    expect(
      pair1.equals(
        pair2,
        (f1, f2) => {
          return f1 === f2;
        },
        (s1, s2) => {
          return s1 === s2;
        },
      ),
    ).toBeTruthy();
  });

  it('Identifies itself in Object.toString()', () => {
    expect(Object.prototype.toString.call(new Pair(1, 2))).toEqual('[object Pair]');
  });
});
