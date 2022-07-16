const logger = require("../utils/logger");


/**
 * Bot response to a target channel.
 * @param {import("../types/client")} client - Bot's instance.
 * @param {import("../types/channel").MessageState} messageState - Current
 * state of the message of the target channel.
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
