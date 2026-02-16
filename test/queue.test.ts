import { describe, expect, it } from 'vitest';

import { Queue } from '../src/queue.js';

describe('Queue()', () => {
  describe('constructor()', () => {
    it('No input creates an empty Queue', () => {
      const queue = new Queue();

      expect(queue.size).toEqual(0);
    });

    it('Accepts another Queue as input', () => {
      const queue1 = new Queue();

      queue1.push(1);

      const queue2 = new Queue(queue1);

      expect(queue2.size).toEqual(queue1.size);
    });

    it('Accepts an iterable as input', () => {
      const queue = new Queue([1, 2, 3]);

      expect(queue.size).toEqual(3);
    });
  });

  it('push()', () => {
    const queue = new Queue([true]);

    queue.push(false);

    expect(queue.size).toEqual(2);
  });

  it('pop()', () => {
    const queue = new Queue([1, 2, 3]);

    expect(queue.pop()).toEqual(1);
    expect(queue.size).toEqual(2);
  });

  it('front()', () => {
    expect(new Queue([1, 2, 3]).front()).toEqual(1);
    expect(new Queue().front()).toBeUndefined();
  });

  it('back()', () => {
    expect(new Queue([1, 2, 3]).back()).toEqual(3);
    expect(new Queue().back()).toBeUndefined();
  });

  it('empty()', () => {
    const queue = new Queue();

    expect(queue.empty()).toEqual(true);

    queue.push(1);

    expect(queue.empty()).toEqual(false);
  });

  it('clone()', () => {
    const queue1 = new Queue([1, 2, 3]);
    const queue2 = queue1.clone();

    expect(queue2).toBeInstanceOf(Queue);

    expect(queue1.size).toEqual(queue2.size);

    queue1.pop();

    expect(queue1.size).not.toEqual(queue2.size);
  });

  it('swap()', () => {
    const queue1 = new Queue<number>();
    const queue2 = new Queue<number>([1, 2, 3, 4, 5]);

    queue2.swap(queue1);

    expect([...queue2]).toEqual([]);

    expect([...queue1]).toEqual([1, 2, 3, 4, 5]);
  });

  it('clear()', () => {
    const queue = new Queue<number>([1, 2, 3]);

    expect(queue.size).toBe(3);

    queue.clear();

    expect(queue.size).toBe(0);
  });

  it('Is iterable', () => {
    const queue = new Queue([1, 2, 3]);

    // This consumes the queue.
    expect([...queue]).toEqual([1, 2, 3]);

    // Queue is empty now.
    expect(queue.front()).toBeUndefined();
    expect(queue.size).toEqual(0);
  });

  it('Identifies itself in Object.toString()', () => {
    expect(Object.prototype.toString.call(new Queue())).toEqual('[object Queue]');
  });
});
