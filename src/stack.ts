/**
 * Last in first out
 */
export class Stack<Item> implements Iterable<Item> {
  #items: Item[];

  constructor(input?: Iterable<Item>) {
    this.#items = input ? Array.from(input instanceof Stack ? input.#items : input) : [];
  }

  /**
   * Get the number of items in the stack.
   */
  get size(): number {
    return this.#items.length;
  }

  /**
   * Determine if the stack is empty.
   */
  empty(): boolean {
    return this.#items.length === 0;
  }

  /**
   * Get an iterator for the stack.
   *
   * **Iterating the stack will drain it.**
   */
  *[Symbol.iterator](): Generator<Item> {
    while (this.#items.length) {
      yield this.pop()!;
    }
  }

  /**
   * Get an iterator for the stack that returns a `[position, item]` tuple.
   *
   * **Iterating the Stack will drain it.**
   */
  *entries(): Generator<[position: number, item: Item]> {
    let position = 0;

    while (this.#items.length) {
      yield [position++, this.#items.pop()!];
    }
  }

  /**
   * Identify itself in `Object.toString()`
   */
  get [Symbol.toStringTag](): string {
    return 'Stack';
  }

  /**
   * Exchanges the items with another stack.
   */
  swap(other: Stack<Item>): void {
    [this.#items, other.#items] = [other.#items, this.#items];
  }

  /**
   * Create a new `Stack` from this one.
   */
  clone(): Stack<Item> {
    return new Stack(this.#items);
  }

  /**
   * Remove all items from the stack.
   */
  clear(): this {
    this.#items = [];

    return this;
  }

  /**
   * Add one or more items to the stack and return the new size.
   */
  push(...items: [Item, ...Item[]]): number {
    return this.#items.push(...items);
  }

  /**
   * Get the next item and remove it from the stack.
   */
  pop(): Item | undefined {
    return this.#items.pop();
  }

  /**
   * Get the next item and leave it in the stack
   */
  peek(): Item | undefined {
    return this.#items.at(-1);
  }
}
