/**
 * @internal
 */
class Node<Value> {
  value: Value;

  next: Node<Value> | null;

  prev: Node<Value> | null;

  constructor(value: Value, next: Node<Value> | null = null, prev: Node<Value> | null = null) {
    this.value = value;
    this.next = next;
    this.prev = prev;
  }
}

/**
 * @see https://en.wikipedia.org/wiki/Linked_list
 */
export class DoublyLinkedList<Item> {
  // First node
  #head: Node<Item> | null = null;

  // Last node
  #tail: Node<Item> | null = null;

  #size: number = 0;

  constructor(items?: Iterable<Item>) {
    if (items) {
      for (const item of items) {
        this.push(item);
      }
    }
  }

  get size(): number {
    return this.#size;
  }

  clear(): this {
    this.#head = null;
    this.#tail = null;
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
    return 'DoublyLinkedList';
  }

  clone(): DoublyLinkedList<Item> {
    return new DoublyLinkedList<Item>(this);
  }

  /**
   * Create a chain of `Node` objects.
   *
   * The `head` and `tail` will point to the same `Node` if there is only one item passed to this function.
   */
  #createNodeChain(items: Iterable<Item>): {
    head: Node<Item> | null;
    tail: Node<Item> | null;
    size: number;
  } {
    let head: Node<Item> | null = null;
    let size = 0;

    const tail = Iterator.from(items).reduce<Node<Item> | null>((previousNode, item) => {
      const currentNode = new Node(item, null, previousNode);

      if (head === null) {
        head = currentNode;
      }

      // Doubly link the nodes.
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
   * Add one or more items to the end of the list.
   */
  push(...items: [Item, ...Item[]]): number {
    const { head, tail, size } = this.#createNodeChain(items);

    // Empty list
    if (this.#head === null && this.#tail === null) {
      this.#head = head;
      this.#tail = tail;
    }

    if (this.#tail && head) {
      // Current tail joins with the new node
      this.#tail.next = head;
      // New node chain joins with current tail node.
      head.prev = this.#tail;
    }

    // Set new tail
    this.#tail = tail;

    return (this.#size += size);
  }

  /**
   * Remove the last item from the list and return it.
   */
  pop(): Item | undefined {
    if (this.#tail !== null) {
      const node = this.#tail;

      // Only one item since `head` and `tail` point to the same `Node`.
      if (this.#head === this.#tail) {
        this.#head = null;
        this.#tail = null;
      } else {
        this.#tail = node.prev;
      }

      --this.#size;

      return node.value;
    }
  }

  /**
   * Remove the first item from the list and return it.
   */
  shift(): Item | undefined {
    if (this.#head) {
      const node = this.#head;

      // Only one item since `head` and `tail` point to the same `Node`.
      if (this.#head === this.#tail) {
        this.#head = null;
        this.#tail = null;
      } else {
        this.#head = node.next;
      }

      --this.#size;

      return node.value;
    }
  }

  /**
   * Add one or more items to the start of the list.
   */
  unshift(...items: [Item, ...Item[]]): number {
    const { head, tail, size } = this.#createNodeChain(items);

    if (tail) {
      if (this.#head) {
        this.#head.prev = tail;
      }

      tail.next = this.#head;
    }

    if (head) {
      this.#head = head;
    }

    if (this.#tail === null) {
      this.#tail = tail;
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
