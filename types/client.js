const tmi = require("tmi.js");

const CustomError = require("../utils/error");


/**
 * @class
 * @extends tmi.Client
 * @constructor
 * @member {number} SEND_INTERVAL - Cooldown period between two consecutive
 * bot responses.
 * @member {string} DUPMSG_CHAR - Character appended to bot's response to bypass
 * twitch's duplicate message filter.
 */
class Client extends tmi.Client {
  /**
   * @param {param} opts
   * - Client connection options.
   * - docs: https://tmijs.com/#guide-options
   */
  constructor(opts) {
    super(opts);
    this.SEND_INTERVAL = process.env.SEND_INTERVAL || "30";
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
      const duplicateResponseFrequencyLimit = elapsed <= bypassInterval;
      const isDuplicate = responseState.response === messageState.recentMessage;
      const isDevEnv = nodeEnv !== "dev";
      if (duplicateResponseFrequencyLimit && isDuplicate && isDevEnv) {
        responseState.activateDuplicationFilterByass(true);
      }
      else responseState.activateDuplicationFilterByass(false);

      if (nodeEnv === "live") {
        responseState.resends++;
        return super.say(responseState.target, responseState.response);
      }
    }

    return new Promise((resolve, reject) => {
      if (elapsed < sendInterval) {
        reject(new CustomError.sendIntervalError(responseState.target));
      }

      responseState.resends++;
      resolve([responseState.target, responseState.response]); // For dev/test
    });
  }
}


module.exports = Client;
