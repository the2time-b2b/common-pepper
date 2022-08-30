const Queue = require("../types/queue");
const sendClientResponse = require("../lib/response");
const Response = require("../types/response");
const logger = require("../utils/logger");


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
   *  Queue of responses sent by the bot.
   * @type {MessageQueue}
   * @private
   */
  #sentResponseQueue = null;


  /**
   *  Queue of bot responses picked up by the listener that were successfully
   * sent to a channel.
   * @type {MessageQueue}
   * @private
   */
  #listenedResponseQueue = null;

  /**
   * Current message state of a channel.
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
    this.#responseQueue = new MessageQueue(() => {
      responseQueueManager(this, client);
    });
    this.#sentResponseQueue = new MessageQueue();
    this.#listenedResponseQueue = new MessageQueue(() => {
      listenedResponseQueueManager(this);
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
   * Get the current message state of the channel.
   * @returns {MessageState} - Current message state of the channel.
   */
  getMessageState() { return this.#messageState; }


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
   * Returns the bot's response queue for a channel.
   * @returns {MessageQueue} - Response queue.
   */
  getResponseQueue() {
    return this.#responseQueue;
  }


  /**
   * Returns the bot's response queue that have been presumably sent to a
   * channel.
   * @returns {MessageQueue} - Sent response queue.
   */
  getSentResponseQueue() {
    return this.#sentResponseQueue;
  }


  /**
   * Returns the bot's response queue that were successfully picked up by the
   * listener.
   * @returns {MessageQueue} - Response queue picked up by the listener
   */
  getListenedResponseQueue() {
    return this.#listenedResponseQueue;
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
   * @private
   */
  #callback = null;


  /**
   * A unique interval ID which identifies the timer created by the setInterval
   * method invocation.
   * @type {number}
   * @private
   */
  #setIntervalID = null;


  /**
   * @param {Function} [callback]
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
    if (this.#callback && this.isEmpty()) {
      this.#setIntervalID = setInterval(this.#callback, 5000);
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
    if (this.#callback && this.isEmpty()) {
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
   * @param {import("../types/channel").Channel} channel - Current state of a
   * channel.
   * @param {import("../types/client")} client - Bot's instance.
   * @returns {number} - An interval ID which uniquely identifies the timer
   * created by the call to setInterval().
   */
function responseQueueManager(channel, client) {
  const sentResponseQueue = channel.getSentResponseQueue();
  const responseQueue = channel.getResponseQueue();

  if (responseQueue.isEmpty()) return;

  const latestQueuedResponse = responseQueue.retrieve();
  const responseState = latestQueuedResponse.getResponseState();
  const request = responseState.request;
  const target = responseState.target;
  const response = responseState.response;

  sendClientResponse(client, target, channel.getMessageState(), response)
    .then(clientResponse => {
      /**
      * During dev/test environment, the command response would not be sent to
      * twitch IRC server. Therefore, listner would not be able to pick up any
      * of the bot's response.
       */
      if (process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "test") {
        logger.info(`\n* Executed "${request.join(" ")}" command`);
        logger.info("* Details:", { target, response });
        channel.nextMessageState(response, Date.now());
      }

      const sentResponse = new Response(request, target, clientResponse[1]);
      sentResponseQueue.enquqe(sentResponse);
      responseQueue.dequqe();
    });
}

/**
 * Handle responses that were successfully sent to a channel and were picked up
 * by the listener.
 * @param {import("../types/channel").Channel} channel - Current state of a
 * channel.
 */
function listenedResponseQueueManager(channel) {
  const responseQueue = channel.getResponseQueue();
  const sentResponseQueue = channel.getSentResponseQueue();
  const listenedResponseQueue = channel.getListenedResponseQueue();

  if (sentResponseQueue.isEmpty()) return;
  if (listenedResponseQueue.isEmpty()) return;

  let sentResponse = sentResponseQueue.retrieve();
  let listenedResponse = listenedResponseQueue.retrieve();

  sentResponse = sentResponse.getResponseState();
  listenedResponse = listenedResponse.getResponseState();

  const checkTarget = sentResponse.target === listenedResponse.target;
  const checkResponse = sentResponse.response === listenedResponse.response;

  if (checkTarget && checkResponse) {
    sentResponseQueue.dequqe();
    listenedResponseQueue.dequqe();

    logger.info(`\n* Executed "${sentResponse.request.join(" ")}" command`);
    logger.info("* Details:", {
      target: listenedResponse.target, response: listenedResponse.response
    });
    channel.nextMessageState(listenedResponse.response, Date.now());

    return;
  }

  responseQueue.enquqe(sentResponse);
}


module.exports = { Channel, MessageState, MessageQueue };
