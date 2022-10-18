const Queue = require("../types/queue");
const clientResponse = require("../lib/response");


/**
 * Monitor and manage the state of each channel in which the bot resides.
 * @class
 * @constructor
 */
class Channel {
  static #channels = {};


  /**
   * Username of the channel.
   * @type {string}
   * @private
   */
  #username = null;

  /**
   *  Bot response queue of the channel.
   * @type {MessageQueue}
   * @private
   */
  #responseQueue = null;

  /**
   * Current message state of a channel.
   * @type {MessageState}
   * @private
   */
  #messageState = new MessageState();

  /**
   * Number of resends before automatic dequeue.
   * @type {number}
   */
  #resendLimit = 3;


  /**
   * @param {import("../types/client")} client - Bot's instance.
   * @param {string} username - Username of the channel.
   * @param {number} [resendLimit=3] -  Number of resends before the response is
   * dequeued automatically.
   */
  constructor(client, username, resendLimit) {
    this.#username = username;
    if (resendLimit) this.#resendLimit;
    this.#responseQueue = new MessageQueue(() => {
      responseQueueManager(this, client, this.#resendLimit);
    });
    Channel.#channels[this.#username] = this;
  }


  /**
   * Get the current instance of a particular channel.
   * @param {string} username - Username of the channel.
   * @returns {Channel} - Current instance of a particular channel with the
   * given username.
   */
  static getChannel(username) {
    const channel = Channel.#channels[username];
    if (!channel) {
      throw new Error(`The channel '${channel}' has not been initialized.`);
    }
    return channel;
  }


  /**
   * Check if the channel exists on the current instance of the server.
   * @param {string} username - Username of associated with the channel.
   * @returns {boolean} Boolean flag indicating the existance of the channel
   * with the given username.
   */
  static checkChannel(username) {
    if (Object.keys(Channel.#channels).includes(username)) return true;
    return false;
  }


  /**
   * Clears all channel instances on the server.
   */
  static clearChannels() {
    Channel.#channels = {};
  }


  /**
   * Returns the bot's response queues for a channel.
   * @param channel - Username of the channel.
   * @returns {MessageQueue} - Response queue.
   */
  static getResponseQueue(channel) {
    const user = Channel.getChannel(channel);
    return user.getResponseQueue();
  }


  /**
   * Get the current message state of the channel.
   * @returns {MessageState} - Current message state of the channel.
   */
  getMessageState() { return this.#messageState; }


  /**
   * Returns the bot's response queues for a this channel.
   * @returns {MessageQueue} - Response queue.
   */
  getResponseQueue() {
    return this.#responseQueue;
  }
}


/**
   * Hold a bot's latest message state for a particular channel.
   * @class
   * @public
   */
class MessageState {
  /**
     * The latest message sent to the channel by the bot.
     * @type {string}
     */
  #recentMessage = null;

  /**
   * Epox time of the latest message sent by the bot.
   * @type {number}
   */
  #messageLastSent = null;

  /**
   * Default message duplication cooldown period.
   * @type {number}
   */
  #filterBypassInterval = 30;


  /**
   * The latest message sent to the channel by the bot.
   * @readonly
   */
  get recentMessage() {
    return this.#recentMessage;
  }

  /**
   * Epox time of the latest message sent by the bot.
   * @readonly
   */
  get messageLastSent() {
    return this.#messageLastSent;
  }

  /**
   *  Message duplication cooldown period.
   * @readonly
   */
  get filterBypassInterval() {
    return this.#filterBypassInterval;
  }


  /**
   * Change how the next message must be sent on a particular channel.
   * @param {string} recentMessage - The last message on the channel.
   * @param {number} messageLastSent - Epox time of the previous message sent.
   */
  nextMessageState(recentMessage, messageLastSent) {
    this.#recentMessage = recentMessage;
    this.#messageLastSent = messageLastSent;
  }
}


/**
 * Orderly manage multiple bot responses on a channel.
 * @description
 * - The queue is polled every set interval and callback is invoked each cycle.
 * - The poll is activated or deactivated based on the presence of atleast one
 * response in a queue.
 */
class MessageQueue extends Queue {
  /**
   * Function to called every set interval based on the number of response in
   * the queue.
   * @type {Function}
   */
  #callback = null;

  /**
   * A unique interval ID which identifies the timer created by the setInterval
   * method invocation.
   * @type {number}
   */
  #setIntervalID = null;


  /**
   * @param {Function} callback
   * - A callback function to be invoked at every set interval based on the
   * presence of atleast one response in a queue.
   */
  constructor(callback) {
    super();
    this.#callback = callback;
  }


  /**
   * Insert multiple bot responses in a queue.
   * @param {import("./response")} item - Bot response instance.
   * @description Enables the recurring callback invocation if there are more
   * than one response in a queue.
   */
  enquqe(item) {
    // TODO: Dynamically change polling interval via commands
    if (this.isEmpty()) {
      const pollingInterval = 5000;
      this.#setIntervalID = setInterval(this.#callback, pollingInterval);
    }
    super.enquqe(item);
  }


  /**
   * Removes bot responses from the queue.
   * @description Disables the recurring callback invocation if there are no
   * response in the queue.
   */
  dequqe() {
    super.dequqe();
    if (this.isEmpty()) {
      clearInterval(this.#setIntervalID);
      this.#setIntervalID = null;
    }
  }


  /**
   * Retrieves a bot response instance.
   * @returns {import("./response")}
   */
  retrieve() {
    return super.retrieve();
  }
}


/**
   * Enables the retrieval and processing of the channel's response queue.
   * @description The retrieval and processing of the channel's response queue
   * is done with the help of the setInterval() method where the response queue
   * is polled every set interval, in ms.
   * @param {import("../types/channel").Channel} channel - Bot's instance.
   * @param {import("../types/client")} client - Bot's instance.
   * @param {number} resendLimit -  Number of times a response resent before it
   * is removed from the queue automatically.
   * @returns {number} - An interval ID which uniquely identifies the timer
   * created by the call to setInterval().
   */
function responseQueueManager(channel, client, resendLimit) {
  const responseQueue = channel.getResponseQueue();
  if (responseQueue.isEmpty()) return;

  let responseState = responseQueue.retrieve();

  if (responseState.resendCount > resendLimit) {
    responseQueue.dequqe();
    if (responseQueue.isEmpty()) return;
    responseState = responseQueue.retrieve();
  }

  /**
   * During dev/test environment, the command response would not be sent to
   * twitch IRC server. Therefore, listner would not be able to pick up any
   * of the bot's response.
   */
  clientResponse(client, channel.getMessageState(), responseState);

  if (!(process.env.NODE_ENV === "live")) {
    responseQueue.dequqe();
  }
}


module.exports = { Channel, MessageState, MessageQueue };
