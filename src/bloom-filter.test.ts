import { describe, expect, it } from 'vitest';

import { BitArray } from './bit-array.js';
import { BloomFilter, type BloomFilterOptions, type HashPair } from './bloom-filter.js';

/**
 * Deterministic two-hash function for strings so tests can reason about
 * exactly which bits end up set instead of depending on real hash output.
 */
function stringHash(value: string): HashPair {
  let h1 = 0;
  let h2 = 0;

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);

    h1 = (h1 * 31 + code) | 0;
    h2 = (h2 * 17 + code) | 0;
  }

  return [h1, h2];
}

describe('BloomFilter()', () => {
  it('throws RangeError when numHashes is 0', () => {
    expect(() => new BloomFilter<string>({ size: 256, numHashes: 0, hash: stringHash })).toThrow(RangeError);
  });

  it('throws RangeError when numHashes is negative', () => {
    expect(() => new BloomFilter<string>({ size: 256, numHashes: -1, hash: stringHash })).toThrow(RangeError);
  });

  it('throws TypeError when hash is not a function', () => {
    expect(
      () =>
        new BloomFilter<string>({
          size: 256,
          numHashes: 4,
          hash: 'not-a-function' as unknown as (value: string) => HashPair,
        }),
    ).toThrow(TypeError);
  });

  it('throws RangeError when size is 0', () => {
    expect(() => new BloomFilter<string>({ size: 0, numHashes: 4, hash: stringHash })).toThrow(RangeError);
  });

  it('throws TypeError when neither size nor storage is provided', () => {
    expect(
      () => new BloomFilter<string>({ numHashes: 4, hash: stringHash } as unknown as BloomFilterOptions<string>),
    ).toThrow(TypeError);
  });

  it('throws TypeError when storage is not a BitArray instance', () => {
    expect(
      () =>
        new BloomFilter<string>({
          storage: {} as unknown as BitArray,
          numHashes: 4,
          hash: stringHash,
        }),
    ).toThrow(TypeError);
  });

  it('constructs with an existing BitArray via options.storage', () => {
    const storage = new BitArray(256);
    const filter = new BloomFilter<string>({ storage, numHashes: 4, hash: stringHash });

    filter.add('foo');

    expect(filter.has('foo')).toEqual(true);
    expect(filter.has('never-added')).toEqual(false);
  });

  it('shares the provided storage BitArray, so external mutations are visible to the filter', () => {
    const storage = new BitArray(256);
    const filter = new BloomFilter<string>({ storage, numHashes: 4, hash: stringHash });

    for (const index of [0, 1, 2, 3]) {
      storage.set(index);
    }

    expect(filter.fillRatio).toEqual(4 / 256);
  });

  it('reset() clears the shared external storage passed in via options.storage', () => {
    const storage = new BitArray(256);
    const filter = new BloomFilter<string>({ storage, numHashes: 4, hash: stringHash });

    filter.add('foo');
    filter.reset();

    expect(storage.popcount()).toEqual(0);
  });

  it('has() returns false for a value that was never added', () => {
    const filter = new BloomFilter<string>({ size: 256, numHashes: 4, hash: stringHash });

    expect(filter.has('never-added')).toEqual(false);
  });

  it('has() returns true for a value after it is added', () => {
    const filter = new BloomFilter<string>({ size: 256, numHashes: 4, hash: stringHash });

    filter.add('foo');

    expect(filter.has('foo')).toEqual(true);
  });

  it('never produces a false negative for multiple added values', () => {
    const filter = new BloomFilter<string>({ size: 256, numHashes: 4, hash: stringHash });
    const values = ['foo', 'bar', 'baz', 'quux', 'hello', 'world'];

    for (const value of values) {
      filter.add(value);
    }

    for (const value of values) {
      expect(filter.has(value)).toEqual(true);
    }
  });

  it('add() is idempotent', () => {
    const filter = new BloomFilter<string>({ size: 256, numHashes: 4, hash: stringHash });

    filter.add('foo');
    filter.add('foo');

    expect(filter.has('foo')).toEqual(true);
    expect(filter.fillRatio).toEqual(4 / 256);
  });

  it('derives indices via double hashing: index_i = (hash1 + i * hash2) mod size', () => {
    const filter = new BloomFilter<string>({
      size: 10,
      numHashes: 3,
      hash: () => [2, 3],
    });

    // indices: (2 + 0*3) % 10 = 2, (2 + 1*3) % 10 = 5, (2 + 2*3) % 10 = 8
    filter.add('foo');

    expect(filter.fillRatio).toEqual(3 / 10);
  });

  it('normalizes negative hash values into a valid, positive bit range', () => {
    const filter = new BloomFilter<string>({
      size: 7,
      numHashes: 3,
      hash: () => [-3, 5],
    });

    // indices: ((-3 + 0*5) % 7 + 7) % 7 = 4, ((-3 + 5) % 7 + 7) % 7 = 2, ((-3 + 10) % 7 + 7) % 7 = 0
    filter.add('foo');

    expect(filter.has('foo')).toEqual(true);
    expect(filter.fillRatio).toEqual(3 / 7);
  });

  it('can report a false positive when unrelated values hash to the same bits', () => {
    const hashes = new Map<string, HashPair>([
      ['a', [1, 4]],
      ['collider', [1, 4]],
    ]);
    const filter = new BloomFilter<string>({
      size: 20,
      numHashes: 2,
      hash: (value) => hashes.get(value)!,
    });

    filter.add('a');

    // 'collider' was never added, but it shares both derived bits with 'a'.
    expect(filter.has('collider')).toEqual(true);
  });

  it('has() returns false when only some of the derived bits are set', () => {
    const hashes = new Map<string, HashPair>([
      ['a', [1, 4]], // indices: 1, 5
      ['b', [1, 7]], // indices: 1, 8
    ]);
    const filter = new BloomFilter<string>({
      size: 20,
      numHashes: 2,
      hash: (value) => hashes.get(value)!,
    });

    filter.add('a');

    // Shares index 1 with 'a', but index 8 was never set.
    expect(filter.has('b')).toEqual(false);
  });

  describe('reset()', () => {
    it('clears all set bits', () => {
      const filter = new BloomFilter<string>({ size: 256, numHashes: 4, hash: stringHash });

      filter.add('foo');
      filter.add('bar');
      filter.reset();

      expect(filter.fillRatio).toEqual(0);
    });

    it('makes previously added values report as absent', () => {
      const filter = new BloomFilter<string>({ size: 256, numHashes: 4, hash: stringHash });

      filter.add('foo');
      filter.reset();

      expect(filter.has('foo')).toEqual(false);
    });
  });

  describe('fillRatio', () => {
    it('is 0 for a freshly created filter', () => {
      const filter = new BloomFilter<string>({ size: 256, numHashes: 4, hash: stringHash });

      expect(filter.fillRatio).toEqual(0);
    });

    it('rises as values are added', () => {
      const filter = new BloomFilter<string>({ size: 256, numHashes: 4, hash: stringHash });

      expect(filter.fillRatio).toEqual(0);

      filter.add('foo');

      const afterOne = filter.fillRatio;

      expect(afterOne).toBeGreaterThan(0);

      filter.add('bar');

      expect(filter.fillRatio).toBeGreaterThanOrEqual(afterOne);
    });
  });

  it('Identifies itself in Object.toString()', () => {
    const filter = new BloomFilter<string>({ size: 256, numHashes: 4, hash: stringHash });

    expect(Object.prototype.toString.call(filter)).toEqual('[object BloomFilter]');
  });

  describe('optimal()', () => {
    it('returns a BloomFilter instance', () => {
      const filter = BloomFilter.optimal<string>(1000, 0.01, stringHash);

      expect(filter).toBeInstanceOf(BloomFilter);
    });

    it('computes size following size = ceil(-n * ln(p) / ln(2)^2)', () => {
      // For n=1000, p=0.01: size = ceil(9585.058...) = 9586.
      const filter = BloomFilter.optimal<string>(1000, 0.01, () => [5, 0]);

      // h2 = 0 collapses every derived index to the same bit (5 mod size),
      // so after a single add(), fillRatio == 1 / size regardless of numHashes.
      filter.add('anything');

      expect(filter.fillRatio).toEqual(1 / 9586);
    });

    it('computes numHashes following numHashes = ceil((size / n) * ln(2))', () => {
      // For n=1000, p=0.01: size = 9586, so numHashes = ceil(6.646...) = 7.
      const filter = BloomFilter.optimal<string>(1000, 0.01, () => [0, 1]);

      // h1 = 0, h2 = 1 makes the derived indices 0..numHashes-1, which are all
      // distinct since numHashes is far smaller than size, so popcount after a
      // single add() equals numHashes exactly.
      filter.add('anything');

      expect(filter.fillRatio * 9586).toEqual(7);
    });

    it('derives a larger size and more hashes for a stricter false-positive rate', () => {
      // n=100, p=0.1 => size=480, numHashes=4.
      const looser = BloomFilter.optimal<string>(100, 0.1, () => [0, 1]);

      looser.add('anything');

      expect(looser.fillRatio * 480).toEqual(4);

      // n=10_000, p=0.001 => size=143776, numHashes=10.
      const stricter = BloomFilter.optimal<string>(10_000, 0.001, () => [0, 1]);

      stricter.add('anything');

      expect(stricter.fillRatio * 143_776).toEqual(10);
    });

    it('produces a filter that behaves correctly with real-world hash input', () => {
      const filter = BloomFilter.optimal<string>(1000, 0.01, stringHash);

      filter.add('foo');

      expect(filter.has('foo')).toEqual(true);
      expect(filter.has('never-added')).toEqual(false);
    });
  });
});
