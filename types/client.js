const tmi = require("tmi.js");

const CustomError = require("../utils/error");


class Client extends tmi.client {
  constructor(opts) {
    super(opts);
    this.SEND_INTERVAL = process.env.SEND_INTERVAL || "30";
    this.DUPMSG_CHAR = process.env.DUPMSG_CHAR;
  }


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
   * Send a response to a particular channel.
   * @param {string} channel - Recipient channel.
   * @param {string} message - Response message.
   * @param {State} messageState - Current state of the message of the target
   * channel.
   * @returns {Promise<[string]>}
   * - Resolves on message sent and returns [channel] on production.
   * - Resolves and returns [channel, message] on test/dev.
   * @description This overridden method provides an additional functionaility
   * of bypassing the message duplication filter and prevents intentional or
   * unintentional global cooldown due to fast chat message invocation rates.
   */
  say(channel, message, messageState) {
    const nodeEnv = process.env.NODE_ENV || "dev";
    const dupMsgChar = this.DUPMSG_CHAR;
    const sendInterval = parseInt(this.SEND_INTERVAL);
    const lastSent = messageState.messageLastSent;
    const bypassInterval = messageState.filterBypassInterval;

    /*
    * Prevents intentional/unintentional global cooldown.
    * DUPMSG_STATUS initially set to null for first bot's message after reset
    */
    const elapsed = lastSent ? ((Date.now() - lastSent) / 1000) : sendInterval;

    if (elapsed >= sendInterval) {
      // Circumvents Twitch's duplicate message filter
      if (
        elapsed <= bypassInterval
        && message === messageState.recentMessage
        && nodeEnv !== "dev"
      ) {
        message += ` ${String.fromCodePoint(...JSON.parse(dupMsgChar))}`;
      }

      if (nodeEnv === "live") return super.say(channel, message);
    }

    return new Promise((resolve, reject) => {
      if (elapsed < sendInterval) {
        reject(new CustomError.sendIntervalError(channel));
      }
      resolve([channel, message]); // For dev/test
    });
  }
}


module.exports = Client;
