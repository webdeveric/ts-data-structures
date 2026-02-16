import { describe, expect, it } from 'vitest';

import { DoublyLinkedList } from '../src/doubly-linked-list.js';

describe('DoublyLinkedList()', () => {
  it('Starts out empty', () => {
    const list = new DoublyLinkedList();

    expect(list.size).toEqual(0);
  });

  it('push()', () => {
    const list = new DoublyLinkedList<number>([1]);

    list.push(2);

    list.push(3, 4, 5);

    // @ts-expect-error test calling push with no arguments
    expect(list.push()).toEqual(5);

    expect([...list]).toEqual([1, 2, 3, 4, 5]);
  });

  it('pop()', () => {
    const list = new DoublyLinkedList<string>();

    list.push('a', 'b');

    expect(list.size).toEqual(2);
    expect(list.pop()).toEqual('b');
    expect(list.size).toEqual(1);
    expect(list.pop()).toEqual('a');
    expect(list.size).toEqual(0);
    expect(list.pop()).toEqual(undefined);
  });

  it('shift()', () => {
    const list = new DoublyLinkedList<number>([1, 2]);

    expect(list.shift()).toEqual(1);
    expect([...list]).toEqual([2]);
    expect(list.shift()).toEqual(2);
    expect(list.size).toEqual(0);

    expect(new DoublyLinkedList<number>().shift()).toBeUndefined();
  });

  it('unshift()', () => {
    const list = new DoublyLinkedList<number>();

    expect(list.unshift(0, 1, 2)).toEqual(3);
    // @ts-expect-error test calling unshift with no arguments
    expect(list.unshift()).toEqual(3);
    expect(list.unshift(-2, -1)).toEqual(5);
    expect([...list]).toEqual([-2, -1, 0, 1, 2]);
  });

  it('some()', () => {
    const list = new DoublyLinkedList<number>([1, 2]);

    expect(list.some((value) => value === 2)).toBeTruthy();
    expect(list.some((value) => value === 3)).toBeFalsy();
  });

  it('every()', () => {
    const list = new DoublyLinkedList<number>([1, 2]);

    expect(list.every((value) => value > 0)).toBeTruthy();
    expect(list.every((value) => value < 0)).toBeFalsy();
  });

  it('clone()', () => {
    const list1 = new DoublyLinkedList<number>([1, 2, 3]);
    const list2 = list1.clone();

    expect(list2).toBeInstanceOf(DoublyLinkedList);

    expect([...list1]).toEqual([...list2]);

    list1.pop();

    expect(list1.size).not.toEqual(list2.size);
  });

  it('clear()', () => {
    const list = new DoublyLinkedList<number>([1, 2, 3]);

    expect(list.size).toBe(3);

    list.clear();

    expect(list.size).toBe(0);
  });

  it('Is iterable', () => {
    const list = new DoublyLinkedList<number>([1, 2, 3]);

    expect([...list]).toEqual([1, 2, 3]);
  });

  it('values()', () => {
    const list = new DoublyLinkedList<number>([1, 2, 3]);

    expect([...list.values()]).toEqual([1, 2, 3]);
  });

  it('entries()', () => {
    const list = new DoublyLinkedList<number>([1, 2, 3]);

    expect([...list.entries()]).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
  });

  it('Identifies itself in Object.toString()', () => {
    expect(Object.prototype.toString.call(new DoublyLinkedList())).toEqual('[object DoublyLinkedList]');
  });
});
