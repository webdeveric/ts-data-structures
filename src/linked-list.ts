/**
 * @internal
 */
class Node<Value> {
  value: Value;

  next: Node<Value> | null;

  constructor(value: Value, next: Node<Value> | null = null) {
    this.value = value;
    this.next = next;
  }
}

/**
 * @see https://en.wikipedia.org/wiki/Linked_list
 */
export class LinkedList<Item> {
  #head: Node<Item> | null = null;

  #size: number = 0;

  constructor(items?: Iterable<Item>) {
    if (items) {
      const { head, size } = this.#createNodeChain(items);

      this.#head = head;
      this.#size = size;
    }
  }

  get size(): number {
    return this.#size;
  }

  clear(): this {
    this.#head = null;
    this.#size = 0;

    return this;
  }

  *[Symbol.iterator](): Generator<Item> {
    let current = this.#head;

    while (current) {
      yield current.value;
      current = current.next;
    }
  }

  values(): Iterable<Item> {
    return this[Symbol.iterator]();
  }

  /**
   * Get an iterator for the LinkedList that returns a `[position, item]` tuple.
   */
  *entries(): Generator<[position: number, item: Item]> {
    let position = 0;

    for (const item of this) {
      yield [position++, item];
    }
  }

  get [Symbol.toStringTag](): string {
    return 'LinkedList';
  }

  clone(): LinkedList<Item> {
    return new LinkedList<Item>(this);
  }

  #createNodeChain(items: Iterable<Item>): {
    head: Node<Item> | null;
    tail: Node<Item> | null;
    size: number;
  } {
    let head: Node<Item> | null = null;
    let size = 0;

    const tail = Iterator.from(items).reduce<Node<Item> | null>((previousNode, item) => {
      const currentNode = new Node(item);

      if (head === null) {
        head = currentNode;
      }

      if (previousNode) {
        previousNode.next = currentNode;
      }

      ++size;

      return currentNode;
    }, null);

    return {
      head,
      tail,
      size,
    };
  }

  /**
   * Get the first node.
   */
  front(): Node<Item> | null {
    return this.#head;
  }

  /**
   * Get the last node.
   */
  back(): Node<Item> | null {
    let current = this.#head;

    if (current) {
      while (current.next !== null) {
        current = current.next;
      }
    }

    return current;
  }

  /**
   * Add an item to the end of the list.
   */
  push(...items: [Item, ...Item[]]): number {
    const { head, size } = this.#createNodeChain(items);

    const lastNode = this.back();

    if (lastNode) {
      lastNode.next = head;
    } else {
      this.#head = head;
    }

    return (this.#size += size);
  }

  /**
   * Remove the last item from the list and return it.
   */
  pop(): Item | undefined {
    if (this.#head) {
      let previous: Node<Item> | null = null;
      let current = this.#head;

      while (current.next !== null) {
        previous = current;
        current = current.next;
      }

      if (this.#head === current) {
        this.#head = null;
      }

      if (previous?.next === current) {
        previous.next = null;
      }

      --this.#size;

      return current.value;
    }

    return undefined;
  }

  /**
   * Remove the first item from the list and return it.
   */
  shift(): Item | undefined {
    if (this.#head) {
      const { value, next } = this.#head;

      this.#head = next;

      --this.#size;

      return value;
    }
  }

  /**
   * Add one or more items to the start of the list.
   */
  unshift(...items: [Item, ...Item[]]): number {
    const { head, tail, size } = this.#createNodeChain(items);

    if (tail) {
      tail.next = this.#head;
    }

    if (head) {
      this.#head = head;
    }

    return (this.#size += size);
  }

  some(callback: (item: Item) => boolean): boolean {
    for (const item of this) {
      if (callback(item)) {
        return true;
      }
    }

    return false;
  }

  every(callback: (item: Item) => boolean): boolean {
    for (const item of this) {
      if (!callback(item)) {
        return false;
      }
    }

    return true;
  }
}
