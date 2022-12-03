import { Client, Options } from "tmi.js";

import type { MessageState } from "./channel";
import type BotResponse from "./response";


export default class ClientExtension extends Client {
  /**
   * Cooldown period between two consecutive bot responses.
   * @type {number}
  */
  #messageInterval = 30;


  /**
   * @param opts
   * - Client connection options.
   * - docs: https://tmijs.com/#guide-options
   */
  constructor(opts: Options) {
    super(opts);

    const messageInterval = process.env.MESSAGE_INTERVAL;
    if (messageInterval) {
      const parsedMessageInterval = parseInt(messageInterval);
      if (isNaN(parsedMessageInterval)) {
        const error = new Error();
        error.message = "Environment variable 'MESSAGE_INTERVAL' not a number";
        throw error;
      }
      this.#messageInterval = parsedMessageInterval;
    }
  }


  /**
   * Send a response to a particular channel.
   * @param responseState Current state of a bot response.
   * @param messageState Current state of the message of the target channel.
   * @param bypassInterval Message duplication cooldown period.
   * @returns {Promise<[string]>}
   * - Resolves on message sent and returns [channel] on production.
   * - Resolves and returns [channel, message] on test/dev.
   * @description This overridden method provides an additional functionaility
   * of bypassing the message duplication filter and prevents intentional or
   * unintentional global cooldown due to fast chat message invocation rates.
   */
  send(
    responseState: BotResponse,
    messageState: MessageState,
    bypassInterval: number
  ): Promise<string[]> {
    const nodeEnv = process.env.NODE_ENV || "dev";
    const messageInterval = this.#messageInterval;
    const lastSent = messageState.messageLastSent;

    /*
    * Prevents intentional/unintentional global cooldown.
    * DUPMSG_STATUS initially set to null for first bot's message after reset
    */
    const elapsed = lastSent
      ? ((Date.now() - lastSent) / 1000)
      : messageInterval;

    if (elapsed >= messageInterval) {
      // Circumvents Twitch's duplicate message filter
      const duplicateResponseFrequencyLimit = elapsed <= bypassInterval;
      const isDuplicate = responseState.response === messageState.recentMessage;
      const isDevEnv = nodeEnv !== "dev";
      if (duplicateResponseFrequencyLimit && isDuplicate && isDevEnv) {
        responseState.activateDuplicationFilterByass(true);
      }
      else responseState.activateDuplicationFilterByass(false);

      if (nodeEnv !== "dev") {
        responseState.resendCount++;
        return this.say(responseState.target, responseState.response);
      }
    }

    return new Promise((resolve, reject) => {
      if (elapsed < messageInterval) {
        const error = new Error("Message is being sent too quickly.");
        reject(error);
      }

      // For dev
      responseState.resendCount++;
      resolve([responseState.target, responseState.response]); 
    });
  }


  /**
   * Change the rate at which the message in sent on every channel, in seconds.
   * @param seconds Number of seconds to wait before sending next consecutive
   * message.
   */
  changeMessageInterval(seconds: number): void {
    this.#messageInterval = seconds;
  }
}
