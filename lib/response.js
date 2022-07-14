const logger = require("../utils/logger");


/**
     * @typedef {Object} State
     * @property {string} recentMessage - The latest message sent to the channel
     *  by the bot
     * @property {number} messageLastSent - Epox time of the latest message sent
     * by the bot.
     * @property {number} filterBypassInterval - Interval in seconds, below
     * which special character is appended at the end of the bot's response to
     * bypass twitch's message duplication filter.
     */

/**
 * Bot response to a target channel.
 * @param {import("../types/client")} client - Bot's instance.
 * @param {State} messageState - Current state of the message of the target
 * channel.
 * @param {string} target - Recipient channel.
 * @param {string} result - Response message.
 */
module.exports = async function response(client, target, messageState, result) {
  try {
    const response = await client.say(target, result, messageState);
    if (process.env.NODE_ENV === "dev") {
      logger.info(response);
    }
  }
  catch (err) {
    if (err.name !== "sendIntervalError") {
      console.error(err);
    }
  }
};
