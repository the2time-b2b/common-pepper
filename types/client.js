const tmi = require("tmi.js");


module.exports = class Client extends tmi.Client {
  /**
   * Cooldown period between two consecutive bot responses.
   * @type {number}
  */
  #messageInterval = 30;


  /**
   * @param {import("tmi.js").Options} opts
   * - Client connection options.
   * - docs: https://tmijs.com/#guide-options
   */
  constructor(opts) {
    super(opts);

    const messageInterval = process.env.MESSAGE_INTERVAL;
    if (!messageInterval) {
      const error = new Error();
      error.message = "Environment variable 'MESSAGE_INTERVAL' is not defined";
      throw error;
    }

    const parsedMessageInterval = parseInt(messageInterval);
    if (isNaN(parsedMessageInterval)) {
      const error = new Error();
      error.message = "Environment variable 'MESSAGE_INTERVAL' is not a number";
      throw error;
    }
    this.#messageInterval = parsedMessageInterval;
  }


  /**
   * Send a response to a particular channel.
   * @param {string} channel - Recipient channel.
   * @param {import("../types/response")} responseState - Current state of a
   * Response.
   * @param {import("../types/channel").MessageState} messageState
   * @returns {Promise<[string]>}
   * - Resolves on message sent and returns [channel] on production.
   * - Resolves and returns [channel, message] on test/dev.
   * @description This overridden method provides an additional functionaility
   * of bypassing the message duplication filter and prevents intentional or
   * unintentional global cooldown due to fast chat message invocation rates.
   */
  say(responseState, messageState) {
    const nodeEnv = process.env.NODE_ENV || "dev";
    const messageInterval = this.#messageInterval;
    const lastSent = messageState.messageLastSent;
    const bypassInterval = messageState.filterBypassInterval;


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

      if (nodeEnv === "live") {
        responseState.resendCount++;
        return super.say(responseState.target, responseState.response);
      }
    }

    return new Promise((resolve, reject) => {
      if (elapsed < messageInterval) {
        const error = new Error();
        error.name = "messageIntervalError";
        error.message = "Message is being sent too quickly.";

        reject(error);
      }

      responseState.resendCount++;
      resolve([responseState.target, responseState.response]); // For dev/test
    });
  }


  /**
   * Change the rate at which the message in sent on every channel, in seconds.
   * @param {number} seconds Number of seconds to wait before sending next
   * consecutive message.
   */
  changeMessageInterval(seconds) {
    this.#messageInterval = seconds;
  }
};
