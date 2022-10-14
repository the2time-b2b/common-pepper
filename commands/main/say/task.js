module.exports = class Task {
  #name = null;
  #totalWaitInterval = null;
  #channel = null;
  #taskMessage = null;

  /**
   * Task which invokes a bot response based on specific atrributes.
   * @param {string} name A unique name for the task.
   * @param {number} interval A valid interval in which the task in invoked for
   * every interval cycle.
   * @param {string} channel A username of a Twitch channel where the task is to
   *  be invoked in.
   * @param {string} message The message to be send at every interval and on the
   * specified channel.
   */
  constructor(name, interval, channel, message) {
    this.#name = name;
    this.#totalWaitInterval = interval;
    this.#channel = channel;
    this.#taskMessage = message;
  }

  get name() { return this.#name; }
  get interval() { return this.#totalWaitInterval; }
  get channel() { return this.#channel; }
  get message() { return this.#taskMessage; }


  /**
   * Returns a task whose 'stringified' version is compatible with the schema
   * for each task of the local database.
   * @returns {import("./typedefs").DBTask} Objects whose 'stringified' version
   * is in accordance to the task schema of the local database.
   */
  getDBStructuredRecord() {
    const structure = {};

    if (this.#totalWaitInterval) {
      structure["totalWaitInterval"] = this.#totalWaitInterval;
    }
    if (this.#channel) {
      structure["channel"] = this.#channel;
    }
    if (this.#taskMessage) {
      structure["taskMessage"] = this.#taskMessage;
    }

    return structure;
  }
};
