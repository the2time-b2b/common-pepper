import Queue from "../../types/queue";


describe("in a queue", () => {
  test("item is successfully inserted after enqueue", () => {
    const queue = new Queue();
    const item = {};

    const rawQueue = queue.getQueue();
    expect(rawQueue.length).toBe(0);
    queue.enqueue(item);
    expect(rawQueue[0]).toBe(item);
    expect(rawQueue.length).toBe(1);
  });

  test("item is successfully removed after dequeue", () => {
    const queue = new Queue();
    const rawQueue = queue.getQueue();
    const item = {};
    rawQueue[0] = item;

    expect(rawQueue.length).toBe(1);
    expect(rawQueue[0]).toBe(item);
    queue.dequeue();
    expect(rawQueue.length).toBe(0);
  });

  test("you cannot dequeue an item from an empty queue", () => {
    const queue = new Queue();

    expect(() => queue.dequeue())
      .toThrow("Attempting to dequeue an empty queue.");
  });

  test("an item can be retrieved", () => {
    const queue = new Queue();
    const rawQueue = queue.getQueue();
    const item = {};
    rawQueue[0] = item;

    expect(queue.retrieve()).toBe(item);
  });

  test("you cannot retrieve an item from an empty queue", () => {
    const queue = new Queue();

    expect(() => queue.retrieve())
      .toThrow("Cannot retrieve an item from an empty queue.");
  });

  test("you can check if a queue is empty", () => {
    const queue = new Queue();

    expect(queue.isEmpty()).toBeTruthy();
  });
});


describe("during either enqueue or dequeue of items in a queue", () => {
  test("middleware before an item is enqueued is called", () => {
    const queue = new Queue();
    const rawQueue = queue.getQueue();

    const mockFn = jest.fn();
    // Make sure item is not inserted before the middleware is exeuted.
    mockFn.mockImplementation(() => {
      expect(rawQueue.length).toBe(0);
    });

    queue.beforeEnqueue(mockFn);

    expect(mockFn).not.toBeCalled();
    queue.enqueue({});
    expect(mockFn).toBeCalledTimes(1);
  });

  test("middleware after an item is dequeued is called", () => {
    const queue = new Queue();
    const rawQueue = queue.getQueue();
    rawQueue[0] = {};

    const mockFn = jest.fn();
    // Make sure item is removed before the middleware is exeuted.
    mockFn.mockImplementation(() => {
      expect(rawQueue.length).toBe(0);
    });

    queue.afterDequeue(mockFn);

    expect(mockFn).not.toBeCalled();
    queue.dequeue();
    expect(mockFn).toBeCalledTimes(1);
  });
});

