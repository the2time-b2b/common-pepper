const Queue = require("../types/queue");
const logger = require("../utils/logger");
const clientResponse = require("../lib/response");


class Channel {
  static #channels = {};

  #username = null; // Username of the channel.
  #responseQueue = new Queue(); // Bot response queue of the channel.
  // #botResponseStatus = false; // Status of the latest message.
  #setIntervalID = null; // The unique ID for the setInterval on each channel.
  // TODO: Feature to change filterBypassInterval.
  #messageState = new MessageState();


  /**
   * Monitor and manage the state of each channel in which the bot resides.
   * @param {import("../types/client")} client - Bot's instance.
   * @param {string} username - Username of the channel.
   */
  constructor(client, username) {
    this.#username = username;
    Channel.#channels[this.#username] = this;
    this.enableQueueManager(client);
  }


  /**
   * Get the current instance of a particular channel.
   * @param {string} username - Username of the channel.
   * @returns {Channel)} - Current instance of a particular channel with the
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
    this.#messageState.changeMessageState(recentMessage, messageLastSent);
  }


  /**
   * Returns the bot's response queues for a this channel.
   * @returns {import("../types/queue")} - Response queue.
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
      const messageState = this.#messageState.getMessageState();

      clientResponse(client, target, messageState, response);

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
 */
class MessageState {
  #recentMessage = null; // The latest message sent to the channel by the bot.
  #messageLastSent = null; // Epox time of the latest message sent by the bot.
  #filterBypassInterval = 30; // Default message duplication cooldown period.


  /**
   * @typedef {Object} State
   * @property {string} recentMessage - The latest message sent to the channel
   *  by the bot
   * @property {number} messageLastSent - Epox time of the latest message sent
   * by the bot.
   * @property {number} filterBypassInterval - Interval in seconds, below which
   * special character is appended at the end of the bot's response to bypass
   * twitch's message duplication filter.
   */

  /**
   * Get the state of the current message that is to be sent for a particular
   * channel.
   * @param {string} username - Username of associated with the channel.
   * @returns {State} The current message state to be sent of a specified
   * channel.
   */
  getMessageState() {
    return {
      recentMessage: this.#recentMessage,
      messageLastSent: this.#messageLastSent,
      filterBypassInterval: this.#filterBypassInterval
    };
  }


  /**
   * Change how the next message must be sent on a particular channel.
   * @param {string} recentMessage - The latest message sent to the channel by
   * the bot.
   * @param {number} messageLastSent - Epox time of the latest message sent by
   * the bot.
   */
  changeMessageState(recentMessage, messageLastSent) {
    this.#recentMessage = recentMessage;
    this.#messageLastSent = messageLastSent;
  }


  // TODO: Feature to change filterBypassInterval.
}


module.exports = { Channel, MessageState };
