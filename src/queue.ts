/**
 * First in first out 🇬🇧
 */
export class Queue<Item> implements Iterable<Item> {
  #items: Item[];

  constructor(input?: Iterable<Item>) {
    this.#items = input ? Array.from(input instanceof Queue ? input.#items : input) : [];
  }

  /**
   * Get the number of items in the queue.
   */
  get size(): number {
    return this.#items.length;
  }

  /**
   * Determine if the queue is empty.
   */
  empty(): boolean {
    return this.#items.length === 0;
  }

  /**
   * Get an iterator for the queue.
   *
   * Iterating the queue will drain it.
   */
  *[Symbol.iterator](): Generator<Item> {
    while (this.#items.length) {
      yield this.pop()!;
    }
  }

  /**
   * Identify itself in `Object.toString()`
   */
  get [Symbol.toStringTag](): string {
    return 'Queue';
  }

  /**
   * Exchanges the contents with another queue.
   */
  swap(other: typeof this): void {
    [this.#items, other.#items] = [other.#items, this.#items];
  }

  clone(): Queue<Item> {
    return new Queue(this.#items);
  }

  clear(): this {
    this.#items = [];

    return this;
  }

  /**
   * Add one or more items to the queue and return the new size.
   */
  push(...items: [Item, ...Item[]]): number {
    return this.#items.push(...items);
  }

  /**
   * Get the next item and remove it from the queue
   */
  pop(): Item | undefined {
    return this.#items.shift();
  }

  /**
   * Get the next item and leave it in the queue
   */
  front(): Item | undefined {
    return this.#items.at(0);
  }

  /**
   * Get the last item and leave it in the queue
   */
  back(): Item | undefined {
    return this.#items.at(-1);
  }
}
