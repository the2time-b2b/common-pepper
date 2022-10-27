/**
 * @template T
 */
class Queue {
  /**
   * An array of items respresented as a queue.
   * @type {Array<T>}
   */
  #queue = [];

  /**
   * Function to be invoked before an item is enqueued.
   * @type {Function}
   */
  #beforeEnqueueCallback = null;

  /**
   * Function to be invoked after an item is dequeued.
   * @type {Function}
   */
  #afterDequeueCallback = null;


  /**
   * Inserts an item of a specific type to the queue.
   * @param {T} item An item to be inserted at the last in a queue.
   */
  enqueue(item) {
    if (!item) throw new Error("An item to be enqueue is missing.");
    if (this.#beforeEnqueueCallback) this.#beforeEnqueueCallback();
    this.#queue.push(item);
  }


  /**
   * Removes the first item from the queue.
   */
  dequeue() {
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
  retrieve() {
    if (this.#queue.length > 0) return this.#queue[0];
    throw new Error("Cannot retrieve an item from an empty queue.");
  }


  /**
   * Checks if the the queue is empty.
   * @returns {Boolean}
   */
  isEmpty() {
    if (this.#queue.length === 0) return true;
    return false;
  }


  /**
   * Perform an operation before a queue the item is enqueued.
   * @param {Function} callback Function to be executed before enqueue.
   */
  beforeEnqueue(callback) {
    if (!(callback instanceof Function))
      throw new Error("Callback is not a function");
    this.#beforeEnqueueCallback = callback;
  }


  /**
   * Perform an operation after a queue the item is dequeued.
   * @param {Function} callback Function to be executed after dequeue.
   */
  afterDequeue(callback) {
    if (!(callback instanceof Function))
      throw new Error("Callback is not a function");
    this.#afterDequeueCallback = callback;
  }
}


module.exports = Queue;
