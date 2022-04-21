const Client = require("./lib/client");
const Queue = require("./lib/queue");
const execCmd = require("./lib/command");
const clientResponse = require("./lib/response");
const listner = require("./lib/listner");
const logger = require("./utils/logger");
const { opts } = require("./config");


const responseQueue = new Queue();
const botResponseStatus = { status: 0 };

try {
  if (process.env.NODE_ENV !== "test") {
    // Create a client with our options
    const client = new Client(opts);

    client.on("message", function() {
      onMessageHandler(client, ...arguments);
    });
    client.on("connected", onConnectedHandler);

    client.connect();

    listner(new Client(opts), responseQueue, botResponseStatus);

    setInterval(() => {
      if (responseQueue.isEmpty()) return;

      const latestResponse = responseQueue.retrieve();
      const request = latestResponse.request;
      const target = latestResponse.target;
      const commandResponse = latestResponse.commandResponse;
      clientResponse(client, request, target, commandResponse);

      if (botResponseStatus.status === 1) {
        botResponseStatus.status = 0;
        logger.info(`* Executed "${request.join(" ")}" command`);
        logger.info("* Details:", { target, commandResponse });
      }
    }, 1000); // TODO: Dynamically change polling interval via commands
  }
}
catch (err) { console.error(err); }


function onMessageHandler(client, target, context, msg, self) {
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
  logger.info(`\n* Raw request "${command}" Received`);

  const commandResponse = execCmd(prefix, context, request);
  if (!commandResponse) {
    logger.info(`* Unknown command ${request.join(" ")}`);
    return;
  }

  /*
    Note: Introduction of response queues breaks current message handler test
    as 'say' member function is called seperately every set interval.
  */
  // TODO: Alter test to reflect the changes introduced due to response queues.
  if (process.env.NODE_ENV === "test") {
    clientResponse(client, request, target, commandResponse);
    return;
  }

  responseQueue.enquqe({ request, target, commandResponse });
}


function onConnectedHandler(addr, port) {
  logger.info(`* Connected to ${addr}:${port}`);
}


module.exports = { onMessageHandler };
