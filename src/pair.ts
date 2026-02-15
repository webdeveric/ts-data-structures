export class Pair<First, Second> {
  constructor(
    public readonly first: First,
    public readonly second: Second,
  ) {}

  /**
   * Create a new `Pair`
   */
  static of<First, Second>(first: First, second: Second): Pair<First, Second> {
    return new Pair(first, second);
  }

  /**
   * Create a new `Pair` with `first` and `second` swapped.
   */
  swap(): Pair<Second, First> {
    return new Pair(this.second, this.first);
  }

  /**
   * Identify itself in `Object.toString()`
   */
  get [Symbol.toStringTag](): string {
    return 'Pair';
  }

  /**
   * Check if equal to another `Pair`.
   */
  equals(
    other: Pair<First, Second>,
    firstEq: (first1: First, first2: First) => boolean = Object.is,
    secondEq: (second1: Second, second2: Second) => boolean = Object.is,
  ): boolean {
    return firstEq(this.first, other.first) && secondEq(this.second, other.second);
  }

  /**
   * Get a tuple containing the items.
   */
  toTuple(): readonly [first: First, second: Second] {
    return [this.first, this.second];
  }
}
