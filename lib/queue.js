class Queue {
  #queue = [];

  enquqe(item) {
    this.#queue.push(item);
  }


  dequqe() {
    if (this.#queue.length > 0) this.#queue.shift();
    else throw new Error("Attempting to dequeue and empty queue.");
  }


  retrieve() {
    if (this.#queue.length > 0) return this.#queue[0];
    throw new Error("Cannot retrieve an item from an empty queue.");
  }


  isEmpty() {
    if (this.#queue.length === 0) return true;
    return false;
  }
}


module.exports = Queue;
