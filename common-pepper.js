const Client = require("./lib/client");
const { opts } = require("./config");
const logger = require("./utils/logger");
const { execCmd } = require("./commands/helper");


try {
  if (process.env.NODE_ENV !== "test") {
    // Create a client with our options
    const client = new Client(opts);

    client.on("message", function() {
      onMessageHandler(client, ...arguments);
    });
    client.on("connected", onConnectedHandler);

    client.connect();
  }
}
catch (err) { console.error(err); }


async function onMessageHandler(client, target, context, msg, self) {
  const nodeEnv = process.env.NODE_ENV || "dev";
  const prefix = process.env.PREFIX;
  const prefixLength = prefix.length;

  // Ignore messages from the bot
  if (self) return;

  // Ignore non-prefixed messages
  if (!(msg.substring(0, prefixLength) === prefix)) return;
  const command = msg;

  /*
  *Trims whitespace on either side of the chat message and replaces multiple
  *whitespaces, tabs or newlines between words with just one whitespace
  */
  const request = command.trim().replace(/\s\s+/g, " ").split(" ");

  // Command with name testCmd reserved for test only.
  const response = (request[0] === `${prefix}testCmd` && nodeEnv === "test")
    ? request.join(" ")
    : execCmd(context, request);

  logger.info(`\n* Raw request "${command}" Received`);

  if (response) {
    try {
      const [channel, message] = await client.say(target, response);
      logger.info(`* Executed "${request.join(" ")}" command`);
      logger.info("* Details:", { channel, message });
    }
    catch (err) {
      if (err.name !== "sendIntervalError") {
        console.error(err);
      }
    }

  }
  else logger.info(`* Unknown command ${request.join(" ")}`);
}


function onConnectedHandler(addr, port) {
  logger.info(`* Connected to ${addr}:${port}`);
}


module.exports = { onMessageHandler };
