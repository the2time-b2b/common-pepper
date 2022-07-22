const Queue = require("../types/queue");
const logger = require("../utils/logger");
const clientResponse = require("../lib/response");


/**
 * Monitor and manage the state of each channel in which the bot resides.
 * @class
 * @constructor
 */
class Channel {
  static #channels = {};


  /**
   * The unique ID for the setInterval on each channel.
   * @type {number}
   * @private
   */
  #setIntervalID = null;

  /**
   * Username of the channel.
   * @type {ResponsstringeQueue}
   * @private
   */
  #username = null;

  /**
   *  Bot response queue of the channel.
   * @type {ResponseQueue}
   * @private
   */
  #responseQueue = null;

  /**
   * Bot response queue of the channel.
   * @type {MessageState}
   * @private
   */
  #messageState = new MessageState();


  /**
   * @param {import("../types/client")} client - Bot's instance.
   * @param {string} username - Username of the channel.
   */
  constructor(client, username) {
    this.#username = username;
    this.#responseQueue = new ResponseQueue(this, client);

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
    if (!channel) logger.info(`Not deployed on the channel - ${channel}`);
    return channel;
  }


  /**
   * Check if the channel exists on the current instance of the server.
   * @param {string} username - Username of associated with the channel.
   * @returns {boolean} Boolean flag indicating the existance of the channel
   * with the given username.
   */
  static checkChannel(username) {
    if (!Object.keys(Channel.#channels).includes(username)) return true;
    return false;
  }


  /**
   * Clears all channel instances on the server.
   */
  static clearChannels() {
    Channel.#channels = {};
  }


  /**
   * Change how the next message must be sent on a particular channel.
   * @param {string} recentMessage - The previous message on the channel.
   * @param {number} messageLastSent - Epox time of the previous message sent.
   */
  nextMessageState(recentMessage, messageLastSent) {
    this.#messageState.recentMessage = recentMessage;
    this.#messageState.messageLastSent = messageLastSent;
  }


  /**
   * Returns the bot's response queues for a this channel.
   * @returns {ResponseQueue} - Response queue.
   */
  getResponseQueue() {
    return this.#responseQueue;
  }


  /**
   * Enables the retrieval and processing of the channel's response queue.
   * @param {import("../types/client")} client - Bot's instance.
   */
  enableQueueManager(client) {
    this.#setIntervalID = setInterval(() => {
      if (this.#responseQueue.isEmpty()) return;

      const latestQueuedResponse = this.#responseQueue.retrieve();
      const responseState = latestQueuedResponse.getResponseState();
      const request = responseState.request;
      const target = responseState.target;
      const response = responseState.response;

      clientResponse(client, target, this.#messageState, response);

      /**
       * During dev/test environment, the command response would not be sent to
       * twitch IRC server. Therefore, listner would not be able to pick up any
       * of the bot's response.
       */
      if (process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "test") {
        logger.info(`\n* Executed "${request.join(" ")}" command`);
        logger.info("* Details:", { target, response });
        this.nextMessageState(response, Date.now());
        this.#responseQueue.dequqe();
      }
    }, 5000); // TODO: Dynamically change polling interval via commands
  }


  /**
   * Disables the retrieval and processing of the channel's response queue.
   */
  disableQueueManager() {
    clearInterval(this.#setIntervalID);
    this.#setIntervalID = null;
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
     * @public
     */
  recentMessage = null;
  /**
   * Epox time of the latest message sent by the bot.
   * @type {number}
   * @public
   */
  messageLastSent = null;
  /**
   * Default message duplication cooldown period.
   * @type {number}
   * @public
   */
  filterBypassInterval = 30;
}


/**
 * Orderly manage multiple bot responses to be sent to a channel.
 */
class ResponseQueue extends Queue {
  /**
   * State of a particular channel.
   * @type {Channel}
   * @private
   */
  #channel = null;

  /**
   * Bot's instance.
   * @type {import("../types/client")}
   * @private
   */
  #client = null;


  /**
   * @param {Channel} channel - State of a particular channel.
   * @param {import("../types/client")} client - Bot's instance.
   */
  constructor(channel, client) {
    super();
    this.#channel = channel;
    this.#client = client;
  }


  /**
   * Insert multiple bot responses in a queue awaiting to be sent to a channel.
   * @param {import("./response")} item - Bot response instance.
   * @description Enables the channel's queue manager if there are more than one
   * responses in a queue.
   */
  enquqe(item) {
    if (this.isEmpty()) this.#channel.enableQueueManager(this.#client);
    super.enquqe(item);
  }


  /**
   * Removes responses from the queue.
   * @description
   * - Usually occurs when the response is received to a channel.
   * - This also disables the channel's queue manager if there are no responses
   * in a queue.
   */
  dequqe() {
    super.dequqe();
    if (this.isEmpty()) this.#channel.disableQueueManager();
  }


  /**
   * Retrieves a bot response instance.
   * @returns {import("./response")}
   */
  retrieve() {
    return super.retrieve();
  }
}


module.exports = { Channel, MessageState, ResponseQueue };
