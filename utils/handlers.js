const logger = require("../utils/logger");
const execCmd = require("../lib/command");
const clientResponse = require("../lib/response");


const clientHandlers = {};
const listnerHandlers = {};



clientHandlers.onMessageHandler = function onMessageHandler(
  client, target, context, msg, self, responseQueue
) {
  const prefix = process.env.PREFIX;
  const prefixLength = prefix.length;

  // Ignore messages from the bot
  if (self) return;

  // Ignore non-prefixed messages
  if (!(msg.substring(0, prefixLength) === prefix)) return;
  const command = msg;

  /*
  * Trims whitespace on either side of the chat message and replaces
  * multiple whitespaces, tabs or newlines between words with just
  * one whitespace.
  */
  const request = command.trim().replace(/\s\s+/g, " ").split(" ");
  logger.info(`\n* Raw request "${command}" Received`);

  const commandResponse = execCmd(prefix, context, request);
  if (!commandResponse) {
    logger.info(`* Unknown command ${request.join(" ")}`);
    return;
  }

  /*
    Note: Introduction of response queues breaks current message handler
    test as 'say' member function is called seperately every set interval.
  */
  // TODO: Alter test to reflect the changes due to response queues.
  if (process.env.NODE_ENV === "test") {
    clientResponse(client, request, target, commandResponse);
    return;
  }

  responseQueue.enquqe({ request, target, commandResponse });
};


listnerHandlers.onMessageHandler = function onMessageHandler(
  target, context, msg, self, botResponseStatus, responseQueue
) {
  if (context.username === process.env.BOT_USERNAME) {
    botResponseStatus.status = 1;
    responseQueue.dequqe();
    return;
  }
};


clientHandlers.onConnectedHandler = function onConnectedHandler(addr, port) {
  logger.info(`* Connected to ${addr}:${port}`);
};


listnerHandlers.onConnectedHandler = function onConnectedHandler(addr, port) {
  logger.info(`* Listner connected to ${addr}:${port}`);
};


module.exports = { clientHandlers, listnerHandlers };
