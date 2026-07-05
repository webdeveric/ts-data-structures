import { BitArray } from './bit-array.js';

/**
 * A [hash1, hash2] pair used to derive `numHashes` bit indices via double hashing.
 */
export type HashPair = readonly [hash1: number, hash2: number];

export type BloomFilterOptions<Type> = {
  numHashes: number;
  hash: (value: Type) => HashPair;
} & (
  | {
      size: number;
    }
  | {
      storage: BitArray;
    }
);

/**
 * Probabilistic set membership structure. Trades exactness for space:
 * `add` is O(k), `has` is O(k) with no false negatives but a tunable
 * false-positive rate, and storage is a fixed-size bit array regardless
 * of how many elements are added.
 *
 * Uses the Kirsch-Mitzenmacher double-hashing technique to derive all
 * `numHashes` indices from a single two-part hash, avoiding the need
 * for k independent hash functions.
 *
 * @example
 * ```ts
 * const filter = new BloomFilter<string>({
 *   size: 1024,
 *   numHashes: 4,
 *   hash: stringHash,
 * });
 * filter.add('foo');
 * filter.has('foo'); // true
 * filter.has('bar'); // false (or true, at the configured false-positive rate)
 * ```
 *
 * @see {@link https://en.wikipedia.org/wiki/Bloom_filter}
 */
export class BloomFilter<Type> {
  readonly #storage: BitArray;

  readonly #numHashes: number;

  readonly #hash: (value: Type) => HashPair;

  constructor(options: BloomFilterOptions<Type>) {
    if (!Number.isInteger(options.numHashes) || options.numHashes <= 0) {
      throw new RangeError(`numHashes must be a positive integer, got ${options.numHashes}`);
    }

    if (typeof options.hash !== 'function') {
      throw new TypeError('hash must be a function');
    }

    if ('size' in options) {
      this.#storage = new BitArray(options.size);
    } else if ('storage' in options && options.storage instanceof BitArray) {
      this.#storage = options.storage;
    } else {
      throw new TypeError('BloomFilter must be constructed with either a size or a storage BitArray');
    }

    this.#numHashes = options.numHashes;
    this.#hash = options.hash;
  }

  /**
   * Derives the optimal `size` and `numHashes` for a given expected workload.
   *
   * @example
   * ```ts
   * const filter = BloomFilter.optimal(10_000, 0.05, yourHashFunction);
   * ```
   */
  static optimal<Type>(
    expectedItems: number,
    falsePositiveRate: number,
    hash: (value: Type) => HashPair,
  ): BloomFilter<Type> {
    const size = Math.ceil((-expectedItems * Math.log(falsePositiveRate)) / Math.log(2) ** 2);
    const numHashes = Math.ceil((size / expectedItems) * Math.log(2));

    return new BloomFilter({ size, numHashes, hash });
  }

  /**
   * Derives the `numHashes` bit indices for `value` using double hashing:
   * index_i = hash1 + i * hash2 (mod size). This simulates `numHashes`
   * independent hash functions from just two hash values.
   */
  *#indices(value: Type): Generator<number> {
    const [hash1, hash2] = this.#hash(value);
    const size = this.#storage.size;

    for (let i = 0; i < this.#numHashes; i++) {
      // hash1 + i * hash2 can go negative (hash values are signed 32-bit),
      // so % alone can return a negative result in JS. The double-mod
      // pattern ((x % n) + n) % n normalizes it back into [0, n).
      yield (((hash1 + i * hash2) % size) + size) % size;
    }
  }

  /**
   * Adds `value` to the filter by setting its derived bits.
   */
  add(value: Type): void {
    for (const index of this.#indices(value)) {
      this.#storage.set(index);
    }
  }

  /**
   * Tests whether `value` may be in the filter.
   *
   * - `false` is definitive (never in the set);
   * - `true` is probabilistic (may be a false positive).
   */
  has(value: Type): boolean {
    for (const index of this.#indices(value)) {
      if (!this.#storage.test(index)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Clears the filter by resetting the underlying bit array.
   */
  reset(): void {
    this.#storage.reset();
  }

  /**
   * Fraction of bits currently set (0-1); rises with false-positive rate as the filter fills.
   */
  get fillRatio(): number {
    return this.#storage.popcount() / this.#storage.size;
  }

  get [Symbol.toStringTag](): string {
    return 'BloomFilter';
  }
}
