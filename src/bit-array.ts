/**
 * Fixed-size bit array backed by an unsigned typed array, used as dense storage
 * for structures like Bloom filters where individual bits need to be
 * set/tested without the overhead of a boolean array (8x smaller).
 */
export class BitArray implements Iterable<boolean> {
  readonly #storage: Uint8Array | Uint16Array | Uint32Array;

  /**
   * Number of bits to shift a bit index to get the storage item index.
   */
  readonly #shift: number;

  /**
   * Bit mask for a bit index within its storage item.
   */
  readonly #mask: number;

  /**
   * Number of addressable bits in the array.
   * May be less than the number of bits allocated in the underlying storage.
   */
  #size: number;

  /**
   * `input` is either the number of addressable bits (rounded up internally to
   * a whole number of storage items) or an existing typed array to use as
   * backing storage directly - the array is not copied, so external mutation
   * of it, or reuse of the same array across multiple `BitArray`s, is shared
   * state.
   *
   * Choosing `Uint8Array`/`Uint16Array`/`Uint32Array` storage is a
   * memory-density trade-off only, not a CPU one - JS bitwise operators
   * coerce all operands to `Int32` regardless of the typed array's element
   * width. Total bytes used is the same either way (1 bit always costs 1/8
   * byte); what changes is how many storage items that's split across.
   * `Uint32Array` (the default for a numeric `size`) uses the fewest
   * elements, which means less per-element overhead. `Uint8Array` gives the
   * finest granularity, which matters when handing the storage off to
   * byte-oriented interop - serialization, `Buffer`/network transfer, etc.
   * `Uint16Array` is a middle ground, useful mainly to match an existing
   * 16-bit-oriented format.
   *
   * @example
   * ```ts
   * new BitArray(1000);              // 1000 bits, rounds up to 1024 (32 items)
   * new BitArray(new Uint8Array(4)); // bring your own storage, 32 bits
   * ```
   */
  constructor(input: number | Uint8Array | Uint16Array | Uint32Array) {
    if (typeof input === 'number') {
      if (!Number.isInteger(input) || input < 1) {
        throw new RangeError(`size must be a positive integer, got ${input}`);
      }

      this.#storage = new Uint32Array(Math.ceil(input / 32));
      this.#size = input;
    } else if (input instanceof Uint8Array || input instanceof Uint16Array || input instanceof Uint32Array) {
      if (input.length < 1) {
        throw new RangeError(`storage must have at least one element, got length ${input.length}`);
      }

      this.#storage = input;
      this.#size = this.storageSize;
    } else {
      throw new TypeError(`Invalid input type for BitArray constructor: ${typeof input}`);
    }

    const bitsPerItem = this.#storage.BYTES_PER_ELEMENT * 8;

    this.#shift = Math.log2(bitsPerItem); // always 3, 4, or 5 - exact, no float risk
    this.#mask = bitsPerItem - 1;
  }

  /**
   * Returns the number of addressable bits in the array.
   */
  get size(): number {
    return this.#size;
  }

  /**
   * Returns the number of bits allocated in the underlying storage.
   *
   * This is not the same as `size`, which is the number of addressable bits.
   */
  get storageSize(): number {
    return this.#storage.length * this.#storage.BYTES_PER_ELEMENT * 8;
  }

  /**
   * Returns the underlying typed array backing this `BitArray`, without
   * copying it - useful for byte-oriented interop (serialization,
   * `Buffer`/network transfer, etc.) that needs direct access to the bytes.
   *
   * Mutating the returned array mutates this `BitArray` directly.
   */
  get storage(): Uint8Array | Uint16Array | Uint32Array {
    return this.#storage;
  }

  /**
   * Returns the number of bits per item in the underlying storage.
   */
  #bitsPerItem(): number {
    return this.#storage.BYTES_PER_ELEMENT * 8;
  }

  /**
   * Asserts that the given bit index is valid.
   */
  #assertValidBitIndex(bitIndex: unknown): asserts bitIndex is number {
    if (typeof bitIndex !== 'number' || !Number.isInteger(bitIndex) || bitIndex < 0 || bitIndex >= this.#size) {
      throw new RangeError(`Bit index ${bitIndex} out of bounds (size: ${this.#size})`);
    }
  }

  /**
   * Storage item index containing `bitIndex`.
   */
  #itemIndex(bitIndex: number): number {
    return bitIndex >>> this.#shift;
  }

  /**
   * Single-bit mask for `bitIndex` within its storage item.
   */
  #bitMask(bitIndex: number): number {
    return 1 << (bitIndex & this.#mask);
  }

  /**
   * Sets the bit at `bitIndex` to 1.
   */
  set(bitIndex: number): void {
    this.#assertValidBitIndex(bitIndex);

    this.#storage[this.#itemIndex(bitIndex)] |= this.#bitMask(bitIndex);
  }

  /**
   * Clears the bit at `bitIndex` back to 0.
   */
  unset(bitIndex: number): void {
    this.#assertValidBitIndex(bitIndex);

    this.#storage[this.#itemIndex(bitIndex)] &= ~this.#bitMask(bitIndex);
  }

  /**
   * Toggles the bit at `bitIndex`.
   */
  toggle(bitIndex: number): void {
    this.#assertValidBitIndex(bitIndex);

    this.#storage[this.#itemIndex(bitIndex)] ^= this.#bitMask(bitIndex);
  }

  /**
   * Test if the bit at `bitIndex` is set (1 not 0).
   */
  test(bitIndex: number): boolean {
    this.#assertValidBitIndex(bitIndex);

    return (this.#storage[this.#itemIndex(bitIndex)] & this.#bitMask(bitIndex)) !== 0;
  }

  /**
   * Create an independent copy: a new `BitArray` with its own storage (of the
   * same concrete type) and the same `size`. Unlike passing a typed array
   * into the constructor, this does not alias the original storage.
   *
   * @example
   * ```ts
   * const original = new BitArray(64);
   * const copy = original.clone();
   * copy.set(0); // does not affect `original`
   * ```
   */
  clone(): BitArray {
    const copy = new BitArray(this.#storage.slice());

    // Preserve the original size, which may be less than the storage size
    copy.#size = this.#size;

    return copy;
  }

  /**
   * Clears all bits back to 0, reusing the existing allocation.
   */
  reset(): void {
    this.#storage.fill(0);
  }

  /**
   * Population count: total number of set bits across the whole array.
   */
  popcount(): number {
    let count = 0;

    const itemBits = this.#bitsPerItem();

    for (const item of this.#storage) {
      let bitsInItem = item;

      if (itemBits === 32) {
        // Classic SWAR (SIMD within a register) popcount: sums bits in
        // parallel across the 32-bit item in log2(32) = 5 steps instead
        // of checking each of the 32 bits individually.

        // Step 1: replace each pair of bits with the count of set bits in that pair (0-2).
        bitsInItem -= (bitsInItem >>> 1) & 0x55555555;
        // Step 2: sum adjacent pairs into 4-bit nibbles (counts 0-4).
        bitsInItem = (bitsInItem & 0x33333333) + ((bitsInItem >>> 2) & 0x33333333);
        // Step 3: sum adjacent nibbles into byte-sized counts (0-8), masked to prevent carry bleed between bytes.
        bitsInItem = (bitsInItem + (bitsInItem >>> 4)) & 0x0f0f0f0f;
        // Step 4: multiplying by 0x01010101 sums all 4 bytes into the top byte; shift it down to read the total.
        count += (bitsInItem * 0x01010101) >>> 24;
      } else {
        while (bitsInItem !== 0) {
          count += bitsInItem & 1;
          bitsInItem >>>= 1;
        }
      }
    }

    return count;
  }

  /**
   * Asserts that `other` has the same backing storage type and length as this array.
   *
   * @throws {TypeError} if the backing storage types differ.
   * @throws {RangeError} if the backing storage lengths differ.
   */
  #assertCompatible(other: BitArray, operation: string): void {
    if (this.#storage.constructor !== other.#storage.constructor) {
      throw new TypeError(`BitArrays must have the same backing storage type for ${operation}`);
    }

    if (this.#storage.length !== other.#storage.length) {
      throw new RangeError(`BitArrays must be the same size for ${operation}`);
    }
  }

  /**
   * Bitwise AND with another BitArray.
   *
   * @example
   * ```ts
   * const a = new BitArray(64);
   * a.set(1);
   * a.set(2);
   *
   * const b = new BitArray(64);
   * b.set(2);
   * b.set(3);
   *
   * a.and(b); // `a` now has only bit 2 set
   * ```
   *
   * @throws {TypeError} if the two BitArrays have different backing storage types.
   * @throws {RangeError} if the two BitArrays are not the same size.
   */
  and(other: BitArray): this {
    this.#assertCompatible(other, 'AND');

    for (let i = 0; i < this.#storage.length; i++) {
      this.#storage[i] &= other.#storage[i];
    }

    return this;
  }

  /**
   * Bitwise OR with another BitArray.
   *
   * @example
   * ```ts
   * const a = new BitArray(64);
   * a.set(1);
   * a.set(2);
   *
   * const b = new BitArray(64);
   * b.set(2);
   * b.set(3);
   *
   * a.or(b); // `a` now has bits 1, 2, and 3 set
   * ```
   *
   * @throws {TypeError} if the two BitArrays have different backing storage types.
   * @throws {RangeError} if the two BitArrays are not the same size.
   */
  or(other: BitArray): this {
    this.#assertCompatible(other, 'OR');

    for (let i = 0; i < this.#storage.length; i++) {
      this.#storage[i] |= other.#storage[i];
    }

    return this;
  }

  /**
   * Bitwise XOR (exclusive OR) with another BitArray.
   *
   * @example
   * ```ts
   * const a = new BitArray(64);
   * a.set(1);
   * a.set(2);
   *
   * const b = new BitArray(64);
   * b.set(2);
   * b.set(3);
   *
   * a.xor(b); // `a` now has bits 1 and 3 set, bit 2 cleared
   * ```
   *
   * @throws {TypeError} if the two BitArrays have different backing storage types.
   * @throws {RangeError} if the two BitArrays are not the same size.
   */
  xor(other: BitArray): this {
    this.#assertCompatible(other, 'XOR');

    for (let i = 0; i < this.#storage.length; i++) {
      this.#storage[i] ^= other.#storage[i];
    }

    return this;
  }

  /**
   * Iterates each bit in index order, yielding `true` for set bits and
   * `false` for unset bits.
   */
  *[Symbol.iterator](): Generator<boolean> {
    for (let i = 0; i < this.#size; i++) {
      yield this.test(i);
    }
  }

  /**
   * Returns a string tag for `Object.prototype.toString.call()`.
   */
  get [Symbol.toStringTag](): string {
    return 'BitArray';
  }
}
