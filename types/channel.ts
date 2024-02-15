import Client from "./client";
import Queue from "./queue";

import type { ChatUserstate } from "tmi.js";
import type BotResponse from "./response";

import * as logger from "../utils/logger";
import { opts } from "../config/index";


/** Monitor and manage the state of each channel in which the bot resides. */
class Channel {
  /** Stores all instantiated channels. */
  static #channels: { [username: string]: Channel } = {};


  /** A unique listner on a channel to manage responses sent by the bot. */
  #listner: Client = new Client({ ...opts, channels: [] });

  /** Username of the channel. */
  #username: string;

  /** Bot response queue of the channel. */
  #responseQueue = new Queue<BotResponse>();

  /** Message duplication cooldown period. */
  #bypassInterval = 30;

  /** Interval in which the response queue is polled. */
  #pollingInterval = 1000;

  /** Current message state of a channel. */
  #messageState: MessageState = {
    recentMessage: null,
    messageLastSent: null
  };

  /**
   * A unique interval ID which identifies the timer created by the setInterval
   * method invocation.
   */
  #setIntervalID: ReturnType<typeof setInterval> | null = null;

  /** Number of resends before automatic dequeue. */
  #resendLimit = 3;


  /**
   * Monitor and manage the state of each channel in which the bot resides.
   * @param client Bot's instance.
   * @param username Username of the channel.
   * @param resendLimit  Number of resends before the response is dequeued
   * automatically.
   */
  constructor(
    client: Client,
    username: string,
    resendLimit?: number,
    pollingInterval?: number
  ) {
    if (client.readyState() !== "OPEN") {
      client.connect();
    }

    const isValidUsername = username.match(/^[a-zA-Z0-9_]{4,25}$/);
    if (!isValidUsername) throw new Error(
      "Invalid username: '" + username + "'. " +
      "Channel's username should contain 4-25 characters which includes " +
      "alphanumerics and underscores only."
    );

    const isChannelExists = Channel.checkChannel(username);
    if (isChannelExists) throw new Error(`'${username}' state already exists.`);

    this.#username = username;
    if (resendLimit) this.#resendLimit;
    if (pollingInterval) this.#pollingInterval;

    /**
     * Orderly manage multiple bot responses on a channel.
     * The queue is polled every set interval and is activated or deactivated
     * based on the presence of atleast one response in a queue.
     */
    const beforeEnqueueCallback = function(this: Channel): void {
      if (!this.#responseQueue.isEmpty()) return;
      this.#setIntervalID = setInterval(
        () => {
          try {
            responseManager(
              this, client, this.#bypassInterval, this.#resendLimit
            );
          }
          catch (err: unknown) {
            if (!(err instanceof Error)) throw new Error("Unhandled error.");

            const responseState = this.#responseQueue.retrieve();
            const request = responseState.request;
            const target = responseState.target;
            const response = responseState.response;
            logger.info(`\n* Could not execute "${request}" command`);
            logger.info("* Details:", JSON.stringify({ target, response }));
            console.error(err.message);
          }
        },
        this.#pollingInterval
      );
    };
    this.#responseQueue.beforeEnqueue(beforeEnqueueCallback.bind(this));

    const afterDequeueCallback = function(this: Channel): void {
      if (this.#responseQueue.isEmpty()) {
        if (!(this.#setIntervalID)) {
          throw new Error("Private variable #setIntervalID is not set");
        }
        clearInterval(this.#setIntervalID);
        this.#setIntervalID = null;
      }
    };
    this.#responseQueue.afterDequeue(afterDequeueCallback.bind(this));

    this.#listner = new Client({ ...opts, channels: [username] });
    this.#listner.on("message", Channel.onListenHandler);

    this.#listner.on("connected", (addr: string, port: number) => {
      logger.info(`* Listner connected on ${username} to ${addr}:${port}`);
    });
    this.#listner.on("join", (channel: string) => {
      const nonPrefixedUsername = channel.substring(1);
      if (nonPrefixedUsername !== this.#username)
        throw new Error("Channel should and can have only one unique listner.");
    });
    this.#listner.connect().catch((err: unknown) => {
      if (process.env.NODE_ENV !== "test") {
        console.error("Listener cannot join channel: " + this.#username);
        console.error(err);
      }
    });

    Channel.#channels[this.#username] = this;
  }


  /** The username of a channel. */
  get username(): string { return this.#username; }


  /**
   * Get the current instance of a particular channel.
   * @param username Username of the channel given username.
   */
  static getChannel(username: string): Channel {
    const channel = Channel.#channels[username];
    if (!channel) {
      throw new Error(`The channel '${username}' has not been initialized.`);
    }
    return channel;
  }


  /**
   * Check if the channel exists on the current instance of the server.
   * @param username - Username of associated with the channel.
   */
  static checkChannel(username: string): boolean {
    if (Object.keys(Channel.#channels).includes(username)) return true;
    return false;
  }


  /** Clears all channel instances on the server. */
  static clearChannels(): void {
    Channel.#channels = {};
  }


  /**
   * Returns the bot's response queues for a channel.
   * @param channel - Username of the channel.
   */
  static getResponseQueue(channel: string): Queue<BotResponse> {
    const user = Channel.getChannel(channel);
    return user.getResponseQueue();
  }


  /**
   * Monitor bot responses.
   * @param username Username of the channel.
   * @param context Meta data of the user who message picked up by the listner.
   * @param message Bot message picked up by the listener on a target channel.
   */
  static onListenHandler(
    username: string, context: ChatUserstate, message: string
  ): void {
    const listenedUsername = String(context["display-name"]).toLowerCase();
    if (!(listenedUsername === process.env.USERNAME)) return;

    const user = Channel.getChannel(username.substring(1));
    const responseQueue = user.getResponseQueue();
    if (responseQueue.isEmpty()) return;
    const responseState = responseQueue.retrieve();
    const response = responseState.response;
    const request = responseState.request;
    const target = responseState.target;

    if (username !== target) {
      const msg = `Response intended for ${target} was targeted to ${username}`;
      throw new Error(msg);
    }

    if (message !== response) return;

    logger.info(`\n* Executed "${request}" command`);
    logger.info("* Details:", JSON.stringify({ target, response }));

    user.nextMessageState(message, Date.now());

    responseQueue.dequeue();
  }


  /** Check if a listner has joined a channel in twitch.tv. */
  checkListner(): boolean {
    const listners = this.#listner.getChannels();
    if (listners.length === 0) return false;

    const [channel] = listners;
    const username = channel.substring(1);
    if (username === this.#username) return true;
    return false;
  }


  /** Get the current message state of the channel. */
  getMessageState(): MessageState { return this.#messageState; }


  /**
   * Change how the next message must be sent on a particular channel.
   * @param recentMessage - The last message on the channel.
   * @param messageLastSent - Epox time of the previous message sent.
   */
  nextMessageState(recentMessage: string, messageLastSent: number): void {
    const messageState = this.getMessageState();

    messageState.recentMessage = recentMessage;
    messageState.messageLastSent = messageLastSent;
  }


  /** Returns the bot's response queues for a this channel. */
  getResponseQueue(): Queue<BotResponse> {
    return this.#responseQueue;
  }
}


/**
   * Enables the retrieval and processing of the channel's response queue.
   * @description The retrieval and processing of the channel's response queue
   * is done with the help of the setInterval() method where the response queue
   * is polled every set interval, in ms.
   * @param channel Current state of a channel.
   * @param client Bot's instance.
   * @param bypassInterval  Message duplication cooldown period.
   * @param resendLimit  Number of times a response resent before it is removed
   * from the queue automatically.
   */
export async function responseManager(
  channel: Channel, client: Client, bypassInterval: number, resendLimit: number
): Promise<void> {
  const responseQueue = channel.getResponseQueue();
  if (responseQueue.isEmpty()) {
    throw new Error("Cannot handle responses from an empty queue.");
  }

  let responseState = responseQueue.retrieve();
  if (responseState.resendCount > resendLimit) {
    responseQueue.dequeue();
    if (responseQueue.isEmpty()) return;
    responseState = responseQueue.retrieve();
  }

  const isListnerExists = channel.checkListner();
  if (!isListnerExists) {
    throw new Error(`Listner not connected to ${channel.username}`);
  }

  /**
   * During dev/test environment, the command response would not be sent to
   * twitch IRC server. Therefore, listner would not be able to pick up any
   * of the bot's response.
   */
  const messageState = channel.getMessageState();

  let response;
  
  try {
    response = await client.send(responseState, messageState, bypassInterval);

    if (process.env.NODE_ENV !== "live") {
      logger.info("\n* Details:", JSON.stringify(
        { target: response[0], response: response[1] }
      ));

      if (responseState.request) {
        logger.info(`* Executed "${responseState.request}" command`);
      }

      messageState.recentMessage = responseState.response;
      messageState.messageLastSent = Date.now();

      responseQueue.dequeue();
    }
  }
  catch (err: unknown) {
    console.log(err);
    
    if (!(err instanceof Error)) throw err;
    if (err.name !== "sendIntervalError") console.error(err);
  }

}


/** Hold a bot's latest message state for a particular channel. */
export type MessageState = {
  /** The latest message sent to the channel by the bot. */
  recentMessage: string | null,
  /** Epox time of the latest message sent by the bot. */
  messageLastSent: number | null
};


export default Channel;
