const logger = require("../utils/logger");


module.exports = async function response(client, request, target, result) {
  try {
    const response = await client.say(target, result);
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
