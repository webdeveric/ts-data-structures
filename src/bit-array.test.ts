import { describe, expect, it } from 'vitest';

import { BitArray } from './bit-array.js';

describe('BitArray()', () => {
  describe('constructor()', () => {
    it('Stores the requested size', () => {
      const bits = new BitArray(64);

      expect(bits.size).toEqual(64);
    });

    it('May have additional allocated storage that will remain unused', () => {
      const bits = new BitArray(100);

      expect(bits.size).toEqual(100);

      expect(bits.storageSize).toEqual(128); // 4 items * 32 bits = 128 bits
    });

    it('Allocates a full item for a size of 1', () => {
      const bits = new BitArray(1);

      bits.set(0);

      expect(bits.test(0)).toEqual(true);
    });

    it('throws RangeError for a negative size', () => {
      expect(() => new BitArray(-5)).toThrow(RangeError);
    });

    it('throws RangeError for a size of 0', () => {
      expect(() => new BitArray(0)).toThrow(RangeError);
    });

    it('throws RangeError for a fractional size', () => {
      expect(() => new BitArray(1.5)).toThrow(RangeError);
    });

    it('throws TypeError for an invalid input type', () => {
      expect(() => new BitArray('invalid' as any)).toThrow(TypeError);
    });

    it('throws RangeError for a zero-length typed array', () => {
      expect(() => new BitArray(new Uint8Array(0))).toThrow(RangeError);
    });
  });

  it('supports Uint8Array-backed storage', () => {
    const storage = new Uint8Array(4);
    const bits = new BitArray(storage);

    bits.set(10);

    expect(bits.test(10)).toEqual(true);
    expect(bits.test(11)).toEqual(false);
  });

  it('supports Uint16Array-backed storage', () => {
    const storage = new Uint16Array(4);
    const bits = new BitArray(storage);

    bits.set(35);
    bits.unset(35);

    expect(bits.test(35)).toEqual(false);
  });

  describe('storage', () => {
    it('returns the underlying typed array instance passed to the constructor', () => {
      const storage = new Uint8Array(4);
      const bits = new BitArray(storage);

      expect(bits.storage).toBe(storage);
    });

    it('defaults to Uint32Array-backed storage when constructed with a size', () => {
      const bits = new BitArray(64);

      expect(bits.storage).toBeInstanceOf(Uint32Array);
    });

    it('reflects mutations made directly on the returned array', () => {
      const bits = new BitArray(64);

      bits.storage[0] = 0b101; // 5

      expect(bits.test(0)).toEqual(true);
      expect(bits.test(1)).toEqual(false);
      expect(bits.test(2)).toEqual(true);
    });

    it('exposes mutations made through set() on the returned array', () => {
      const bits = new BitArray(new Uint8Array(1));

      bits.set(3);

      expect(bits.storage[0]).toEqual(0b1000);
    });
  });

  it('set()', () => {
    const bits = new BitArray(64);

    bits.set(10);

    expect(bits.test(10)).toEqual(true);
  });

  it('set() does not affect neighboring bits', () => {
    const bits = new BitArray(64);

    bits.set(10);

    expect(bits.test(9)).toEqual(false);
    expect(bits.test(11)).toEqual(false);
  });

  it('unset()', () => {
    const bits = new BitArray(64);

    bits.set(10);
    bits.unset(10);

    expect(bits.test(10)).toEqual(false);
  });

  it('unset() does not affect neighboring bits', () => {
    const bits = new BitArray(64);

    bits.set(9);
    bits.set(10);
    bits.set(11);
    bits.unset(10);

    expect(bits.test(9)).toEqual(true);
    expect(bits.test(10)).toEqual(false);
    expect(bits.test(11)).toEqual(true);
  });

  it('test() on an untouched bit returns false', () => {
    const bits = new BitArray(64);

    expect(bits.test(0)).toEqual(false);
  });

  it('test() throws RangeError when index is out of bounds', () => {
    const bits = new BitArray(64);

    expect(() => bits.test(100)).toThrow(RangeError);
  });

  it('throws RangeError for a NaN index', () => {
    const bits = new BitArray(64);

    expect(() => bits.set(Number.NaN)).toThrow(RangeError);
  });

  it('throws RangeError for a fractional index', () => {
    const bits = new BitArray(64);

    expect(() => bits.test(3.5)).toThrow(RangeError);
  });

  it('throws RangeError for a negative index', () => {
    const bits = new BitArray(64);

    expect(() => bits.set(-1)).toThrow(RangeError);
  });

  describe('toggle()', () => {
    it('sets an unset bit', () => {
      const bits = new BitArray(64);

      bits.toggle(10);

      expect(bits.test(10)).toEqual(true);
    });

    it('clears a set bit', () => {
      const bits = new BitArray(64);

      bits.toggle(10);
      bits.toggle(10);

      expect(bits.test(10)).toEqual(false);
    });

    it('does not affect neighboring bits', () => {
      const bits = new BitArray(64);

      bits.toggle(10);

      expect(bits.test(9)).toEqual(false);
      expect(bits.test(11)).toEqual(false);
    });
  });

  describe('clone()', () => {
    it('is independent of the original', () => {
      const bits = new BitArray(64);

      bits.set(10);

      const copy = bits.clone();

      copy.set(20);
      bits.set(30);

      expect(copy.test(10)).toEqual(true);
      expect(copy.test(20)).toEqual(true);
      expect(copy.test(30)).toEqual(false);

      expect(bits.test(10)).toEqual(true);
      expect(bits.test(20)).toEqual(false);
      expect(bits.test(30)).toEqual(true);
    });

    it('preserves size when it differs from storageSize', () => {
      const bits = new BitArray(100);

      const copy = bits.clone();

      expect(copy.size).toEqual(100);
      expect(copy.storageSize).toEqual(128);
    });

    it('preserves the backing storage width', () => {
      const bits = new BitArray(new Uint8Array(4));

      const copy = bits.clone();

      expect(copy.storageSize).toEqual(32);
    });
  });

  describe('and()', () => {
    it('keeps only bits set in both arrays', () => {
      const bitsA = new BitArray(64);

      bitsA.set(1);
      bitsA.set(2);

      const bitsB = new BitArray(64);

      bitsB.set(2);
      bitsB.set(3);

      bitsA.and(bitsB);

      expect(bitsA.test(1)).toEqual(false);
      expect(bitsA.test(2)).toEqual(true);
      expect(bitsA.test(3)).toEqual(false);
    });

    it('throws TypeError when storage types differ', () => {
      const bitsA = new BitArray(new Uint8Array(1));
      const bitsB = new BitArray(new Uint32Array(1));

      expect(() => bitsA.and(bitsB)).toThrow(TypeError);
    });

    it('throws RangeError when storage lengths differ', () => {
      const bitsA = new BitArray(new Uint8Array(1));
      const bitsB = new BitArray(new Uint8Array(2));

      expect(() => bitsA.and(bitsB)).toThrow(RangeError);
    });
  });

  describe('or()', () => {
    it('sets bits present in either array', () => {
      const bitsA = new BitArray(64);

      bitsA.set(1);
      bitsA.set(2);

      const bitsB = new BitArray(64);

      bitsB.set(2);
      bitsB.set(3);

      bitsA.or(bitsB);

      expect(bitsA.test(1)).toEqual(true);
      expect(bitsA.test(2)).toEqual(true);
      expect(bitsA.test(3)).toEqual(true);
    });

    it('throws TypeError when storage types differ', () => {
      const bitsA = new BitArray(new Uint8Array(1));
      const bitsB = new BitArray(new Uint32Array(1));

      expect(() => bitsA.or(bitsB)).toThrow(TypeError);
    });

    it('throws RangeError when storage lengths differ', () => {
      const bitsA = new BitArray(new Uint8Array(1));
      const bitsB = new BitArray(new Uint8Array(2));

      expect(() => bitsA.or(bitsB)).toThrow(RangeError);
    });
  });

  describe('xor()', () => {
    it('sets bits present in exactly one array', () => {
      const bitsA = new BitArray(64);

      bitsA.set(1);
      bitsA.set(2);

      const bitsB = new BitArray(64);

      bitsB.set(2);
      bitsB.set(3);

      bitsA.xor(bitsB);

      expect(bitsA.test(1)).toEqual(true);
      expect(bitsA.test(2)).toEqual(false);
      expect(bitsA.test(3)).toEqual(true);
    });

    it('throws TypeError when storage types differ', () => {
      const bitsA = new BitArray(new Uint8Array(1));
      const bitsB = new BitArray(new Uint32Array(1));

      expect(() => bitsA.xor(bitsB)).toThrow(TypeError);
    });

    it('throws RangeError when storage lengths differ', () => {
      const bitsA = new BitArray(new Uint8Array(1));
      const bitsB = new BitArray(new Uint8Array(2));

      expect(() => bitsA.xor(bitsB)).toThrow(RangeError);
    });
  });

  it('reset()', () => {
    const bits = new BitArray(64);

    bits.set(1);
    bits.set(33);
    bits.reset();

    expect(bits.test(1)).toEqual(false);
    expect(bits.test(33)).toEqual(false);
    expect(bits.popcount()).toEqual(0);
  });

  describe('popcount()', () => {
    it('Is 0 for a freshly created array', () => {
      const bits = new BitArray(64);

      expect(bits.popcount()).toEqual(0);
    });

    it('Counts set bits within a single item', () => {
      const bits = new BitArray(32);

      bits.set(0);
      bits.set(1);
      bits.set(31);

      expect(bits.popcount()).toEqual(3);
    });

    it('Counts set bits across multiple items', () => {
      const bits = new BitArray(100);

      bits.set(0);
      bits.set(31);
      bits.set(32);
      bits.set(99);

      expect(bits.popcount()).toEqual(4);
    });

    it('Decreases after unset()', () => {
      const bits = new BitArray(64);

      bits.set(5);
      bits.set(40);

      expect(bits.popcount()).toEqual(2);

      bits.unset(5);

      expect(bits.popcount()).toEqual(1);
    });

    it('Counts bits for non-32-bit-item storage (Uint8Array-backed)', () => {
      const bits = new BitArray(new Uint8Array(4));

      bits.set(0);
      bits.set(7);
      bits.set(15);

      expect(bits.popcount()).toEqual(3);
    });
  });

  it('Identifies itself in Object.toString()', () => {
    expect(Object.prototype.toString.call(new BitArray(8))).toEqual('[object BitArray]');
  });

  describe('[Symbol.iterator]()', () => {
    it('yields false for every bit on a fresh array', () => {
      const bits = new BitArray(8);

      expect([...bits]).toEqual([false, false, false, false, false, false, false, false]);
    });

    it('yields true at set indices, in order', () => {
      const bits = new BitArray(8);

      bits.set(1);
      bits.set(4);

      expect([...bits]).toEqual([false, true, false, false, true, false, false, false]);
    });

    it('does not drain the array', () => {
      const bits = new BitArray(4);

      bits.set(2);

      expect([...bits]).toEqual([false, false, true, false]);
      expect([...bits]).toEqual([false, false, true, false]);
      expect(bits.test(2)).toEqual(true);
    });
  });
});
