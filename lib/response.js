const logger = require("../utils/logger");


/**
 * Bot response to a target channel.
 * @param {import("../types/client")} client - Bot's instance.
 * @param {import("../types/channel").MessageState} messageState - Current
 * state of the message of the target channel.
 * @param {import("../types/response")} responseState - Current state of a
 * Response.
 */
module.exports =
  async function sendResponse(client, messageState, responseState) {
    try {
      const responseStatus = await client.say(responseState, messageState);

      if (process.env.NODE_ENV === "dev") {
        logger.info();
        if (responseState.request) {
          logger.info(`* Executed "${responseState.request}" command`);
        }

        logger.info("* Details:", {
          target: responseStatus[0], response: responseStatus[1]
        });

        messageState.nextMessageState(responseState.response, Date.now());
      }
    }
    catch (err) {
      if (err.name !== "sendIntervalError") {
        console.error(err);
      }
    }
  };
