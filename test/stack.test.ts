import { describe, expect, it } from 'vitest';

import { Stack } from '../src/stack.js';

describe('Stack()', () => {
  describe('constructor()', () => {
    it('No input creates an empty stack', () => {
      const stack = new Stack();

      expect(stack.size).toEqual(0);
    });

    it('Accepts another Stack as input', () => {
      const stack1 = new Stack();

      stack1.push(1);

      const stack2 = new Stack(stack1);

      expect(stack2.size).toEqual(stack1.size);
    });

    it('Accepts an iterable as input', () => {
      const stack = new Stack([1, 2, 3]);

      expect(stack.size).toEqual(3);
    });
  });

  it('push()', () => {
    const stack = new Stack([true]);

    stack.push(false);

    expect(stack.size).toEqual(2);
  });

  it('pop()', () => {
    const stack = new Stack([1, 2, 3]);

    expect(stack.pop()).toEqual(3);
    expect(stack.size).toEqual(2);
  });

  it('peek()', () => {
    const stack = new Stack([1, 2, 3]);

    expect(stack.peek()).toEqual(3);
    expect(stack.size).toEqual(3);
  });

  it('empty()', () => {
    const stack = new Stack();

    expect(stack.empty()).toEqual(true);

    stack.push(1);

    expect(stack.empty()).toEqual(false);
  });

  it('clone()', () => {
    const stack1 = new Stack([1, 2, 3]);
    const stack2 = stack1.clone();

    expect(stack2).toBeInstanceOf(Stack);

    expect(stack1.size).toEqual(stack2.size);

    stack1.pop();

    expect(stack1.size).not.toEqual(stack2.size);
  });

  it('swap()', () => {
    const stack1 = new Stack<number>();
    const stack2 = new Stack<number>([1, 2, 3, 4, 5]);

    stack2.swap(stack1);

    expect([...stack2]).toEqual([]);

    expect([...stack1]).toEqual([5, 4, 3, 2, 1]);
  });

  it('clear()', () => {
    const stack = new Stack<number>([1, 2, 3]);

    expect(stack.size).toBe(3);

    stack.clear();

    expect(stack.size).toBe(0);
  });

  it('Is iterable', () => {
    const stack = new Stack([1, 2, 3]);

    // This consumes the stack.
    expect([...stack]).toEqual([3, 2, 1]);

    // Stack is empty now.
    expect(stack.peek()).toBeUndefined();
    expect(stack.size).toEqual(0);
  });

  it('entries()', () => {
    const stack = new Stack([1, 2, 3]);

    expect([...stack.entries()]).toEqual([
      [0, 3],
      [1, 2],
      [2, 1],
    ]);
  });

  it('Identifies itself in Object.toString()', () => {
    expect(Object.prototype.toString.call(new Stack())).toEqual('[object Stack]');
  });
});
