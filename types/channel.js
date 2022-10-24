const Client = require("./client");
const Queue = require("./queue");

const clientResponse = require("../lib/response");
const logger = require("../utils/logger");
const { opts } = require("../config");


/**
 * Monitor and manage the state of each channel in which the bot resides.
 */
class Channel {
  /**
   * Stores all instantiated channels.
   * @type {{[username: string]: Channel}}
   */
  static #channels = {};


  /**
   * A unique listner on a channel to manage responses sent by the bot on chat.
   * @type {Client}
   */
  #listner = new Client({ ...opts, channels: [] });

  /**
   * Username of the channel.
   * @type {string}
   * @private
   */
  #username = null;

  /**
   *  Bot response queue of the channel.
   * @type {Queue}
   * @private
   */
  #responseQueue = new Queue();

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
   * A unique interval ID which identifies the timer created by the setInterval
   * method invocation.
   * @type {number}
   */
  #setIntervalID = null;


  /**
   * Monitor and manage the state of each channel in which the bot resides.
   * @param {import("../types/client")} client - Bot's instance.
   * @param {string} username - Username of the channel.
   * @param {number} [resendLimit=3] -  Number of resends before the response is
   * dequeued automatically.
   */
  constructor(client, username, resendLimit) {
    const isChannelExists = Channel.checkChannel(username);
    if (isChannelExists) throw new Error(`'${username}' state already exists.`);

    this.#username = username;
    if (resendLimit) this.#resendLimit;

    /**
     * Orderly manage multiple bot responses on a channel.
     * The queue is polled every set interval and is activated or deactivated
     * based on the presence of atleast one response in a queue.
     */
    const beforeEnqueueCallback = function() {
      if (this.#responseQueue.isEmpty()) {
        const pollingInterval = 5000;
        this.#setIntervalID = setInterval(
          () => {
            try {
              responseQueueManager(this, client, this.#resendLimit);
            }
            catch (err) {
              if (!(err instanceof Error)) throw new Error("Unhandled error.");

              const responseState = this.#responseQueue.retrieve();
              const request = responseState.request;
              const target = responseState.target;
              const response = responseState.response;
              logger.info(`\n* Could not execute "${request}" command`);
              logger.info("* Details:", { target, response });
              console.error(err.message);
            }
          },
          pollingInterval
        );
      }
    };
    this.#responseQueue.beforeEnqueue(beforeEnqueueCallback.bind(this));

    const afterDequeueCallback = function() {
      if (this.#responseQueue.isEmpty()) {
        clearInterval(this.#setIntervalID);
        this.#setIntervalID = null;
      }
    };
    this.#responseQueue.afterDequeue(afterDequeueCallback.bind(this));

    this.#listner = new Client({ ...opts, channels: [username] });
    const onListenHandler = this.#onListenHandler.bind(this);
    this.#listner.on("message", onListenHandler);

    this.#listner.on("connected", (addr, port) => {
      logger.info(`* Listner connected on ${username} to ${addr}:${port}`);
    });
    this.#listner.on("join", (channel) => {
      const nonPrefixedUsername = channel.substring(1);
      if (nonPrefixedUsername !== this.#username)
        throw new Error("Channel should and can have only one unique Listner.");
    });
    if (process.env.NODE_ENV !== "test") {
      this.#listner.connect().catch(err => console.error(err));
    }

    Channel.#channels[this.#username] = this;
  }


  /**
   * The username of a channel.
   */
  get username() { return this.#username; }


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
   * @returns {Queue} - Response queue.
   */
  static getResponseQueue(channel) {
    const user = Channel.getChannel(channel);
    return user.getResponseQueue();
  }


  /**
   * Monitor bot responses.
   * @param {string} channel Username of the channel.
   * @param {import("tmi.js").CommonUserstate} context Meta data of the user who
   * message picked up by the listner.
   * @param {string} message Bot message/response picked up by the listener on a
   * target channel.
   */
  #onListenHandler(channel, context, message) {
    const listenedUsername = String(context["display-name"]).toLowerCase();
    if (!(listenedUsername === process.env.USERNAME)) return;

    if (this.#responseQueue.isEmpty()) return;
    const responseState = this.#responseQueue.retrieve();
    const response = responseState.response;
    const request = responseState.request;
    const target = responseState.target;

    if (channel !== target) {
      const msg = `Response intended for ${target} was targeted to ${channel}`;
      throw new Error(msg);
    }

    if (message !== response) return;

    logger.info(`\n* Executed "${request}" command`);
    logger.info("* Details:", { target, response });

    const messageState = this.getMessageState();
    messageState.nextMessageState(message, Date.now());

    this.#responseQueue.dequeue();
  }


  /**
   * Check if a listner exists on the channel.
   * @returns {Boolean} The status of the existance of listner in the channel.
   */
  checkListner() {
    const [channel] = this.#listner.getChannels();
    const username = channel.substring(1);
    if (username === this.#username) return true;
    return false;
  }


  /**
   * Get the current message state of the channel.
   * @returns {MessageState} - Current message state of the channel.
   */
  getMessageState() { return this.#messageState; }


  /**
   * Returns the bot's response queues for a this channel.
   * @returns {Queue} - Response queue.
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
   * Enables the retrieval and processing of the channel's response queue.
   * @description The retrieval and processing of the channel's response queue
   * is done with the help of the setInterval() method where the response queue
   * is polled every set interval, in ms.
   * @param {import("../types/channel").Channel} channelState - Current state of
   * a channel.
   * @param {import("../types/client")} client - Bot's instance.
   * @param {number} resendLimit -  Number of times a response resent before it
   * is removed from the queue automatically.
   * @returns {number} - An interval ID which uniquely identifies the timer
   * created by the call to setInterval().
   */
function responseQueueManager(channelState, client, resendLimit) {
  const responseQueue = channelState.getResponseQueue();
  if (responseQueue.isEmpty()) return;

  let responseState = responseQueue.retrieve();


  if (responseState.resendCount > resendLimit) {
    responseQueue.dequeue();
    if (responseQueue.isEmpty()) return;
    responseState = responseQueue.retrieve();
  }

  const isListnerExists = channelState.checkListner();
  if (!isListnerExists) {
    throw new Error(`Listner not connected to ${channelState.username}`);
  }

  /**
   * During dev/test environment, the command response would not be sent to
   * twitch IRC server. Therefore, listner would not be able to pick up any
   * of the bot's response.
   */
  clientResponse(client, channelState.getMessageState(), responseState);
  if (!(process.env.NODE_ENV === "live")) {
    responseQueue.dequeue();
  }
}


module.exports = { Channel, MessageState };
