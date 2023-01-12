export default class Queue<Item> {
  /** An array of items respresented as a queue. */
  #queue: Array<Item> = [];

  /** Function to be invoked before an item is enqueued. */
  #beforeEnqueueCallback: (() => void) | null = null;

  /** Function to be invoked after an item is dequeued. */
  #afterDequeueCallback: (() => void) | null = null;


  /**
    * Retrieve the queue itself.
    * @returns {Array<Item>} Returns the queue of the instance in it's raw
    * format of an array of items of a particular type.
    */
  getQueue(): Array<Item> {
    return this.#queue;
  }


  /**
    * Inserts an item of a specific type to the queue.
    * @param {T} item An item to be inserted at the last in a queue.
    */
  enqueue(item: Item): void {
    if (this.#beforeEnqueueCallback) this.#beforeEnqueueCallback();
    this.#queue.push(item);
  }


  /** Removes the first item from the queue. */
  dequeue(): void {
    if (this.#queue.length > 0) {
      this.#queue.shift();
      if (this.#afterDequeueCallback) this.#afterDequeueCallback();
    }
    else throw new Error("Attempting to dequeue an empty queue.");
  }


  /**
    * Retrieve an item of a specific type from the queue.
    * @returns {T} First item from the queue.
    */
  retrieve(): Item {
    if (this.#queue.length > 0) return this.#queue[0];
    throw new Error("Cannot retrieve an item from an empty queue.");
  }


  /** Checks if the the queue is empty. */
  isEmpty(): boolean {
    if (this.#queue.length === 0) return true;
    return false;
  }


  /** Perform an operation before a queue the item is enqueued. */
  beforeEnqueue(callback: () => void): void {
    this.#beforeEnqueueCallback = callback;
  }


  /** Perform an operation after a queue the item is dequeued. */
  afterDequeue(callback: () => void): void {
    this.#afterDequeueCallback = callback;
  }
}
