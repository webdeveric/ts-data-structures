import { describe, expect, it } from 'vitest';

import { LinkedList } from '../src/linked-list.js';

describe('LinkedList()', () => {
  it('Starts out empty', () => {
    const list = new LinkedList();

    expect(list.size).toEqual(0);
  });

  it('push()', () => {
    const list = new LinkedList<number>([1]);

    list.push(2);

    list.push(3, 4, 5);

    expect([...list]).toEqual([1, 2, 3, 4, 5]);
  });

  it('pop()', () => {
    const list = new LinkedList<string>();

    list.push('a', 'b');

    expect(list.size).toEqual(2);
    expect(list.pop()).toEqual('b');
    expect(list.size).toEqual(1);
    expect(list.pop()).toEqual('a');
    expect(list.size).toEqual(0);
    expect(list.pop()).toEqual(undefined);
  });

  it('shift()', () => {
    const list = new LinkedList<number>([1, 2]);

    expect(list.shift()).toEqual(1);
    expect([...list]).toEqual([2]);

    expect(new LinkedList<number>().shift()).toBeUndefined();
  });

  it('unshift()', () => {
    const list = new LinkedList<number>([1, 2]);

    expect(list.unshift(0)).toEqual(3);
    // @ts-expect-error
    expect(list.unshift()).toEqual(3);
    expect(list.unshift(-2, -1)).toEqual(5);
    expect([...list]).toEqual([-2, -1, 0, 1, 2]);
  });

  it('front()', () => {
    const list = new LinkedList<number>([1, 2]);

    expect(list.front()).toEqual(expect.objectContaining({ value: 1 }));
  });

  it('back()', () => {
    const list = new LinkedList<number>([1, 2]);

    expect(list.back()).toEqual(expect.objectContaining({ value: 2 }));
  });

  it('some()', () => {
    const list = new LinkedList<number>([1, 2]);

    expect(list.some((x) => x === 2)).toBeTruthy();
    expect(list.some((x) => x === 3)).toBeFalsy();
  });

  it('every()', () => {
    const list = new LinkedList<number>([1, 2]);

    expect(list.every((x) => x > 0)).toBeTruthy();
    expect(list.every((x) => x < 0)).toBeFalsy();
  });

  it('clone()', () => {
    const list1 = new LinkedList<number>([1, 2, 3]);
    const list2 = list1.clone();

    expect(list2).toBeInstanceOf(LinkedList);

    expect([...list1]).toEqual([...list2]);

    list1.pop();

    expect(list1.size).not.toEqual(list2.size);
  });

  it('clear()', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    expect(list.size).toBe(3);

    list.clear();

    expect(list.size).toBe(0);
  });

  it('Is iterable', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    expect([...list]).toEqual([1, 2, 3]);
  });

  it('values()', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    expect([...list.values()]).toEqual([1, 2, 3]);
  });

  it('entries()', () => {
    const list = new LinkedList<number>([1, 2, 3]);

    expect([...list.entries()]).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
  });

  it('Identifies itself in Object.toString()', () => {
    expect(Object.prototype.toString.call(new LinkedList())).toEqual('[object LinkedList]');
  });
});
