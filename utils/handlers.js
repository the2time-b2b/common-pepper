const logger = require("../utils/logger");
const execCmd = require("../lib/command");
const clientResponse = require("../lib/response");
const Response = require("../types/response");


const clientHandlers = {};
const listnerHandlers = {};


/**
 * Handle user requests.
 * @param {import("../types/client"} client - Bot's instance.
 * @param {string} target - A '#' prefiex username of the channel where the
 * command/message * originated from.
 * @param {object} context - The chat state of the user who sent the
 * command/message.
 * @param {string} msg - The command/message on the target channel.
 * @param {boolean} self - Flag that specifies whether command/message orignated
 * from the current bot's instance.
 * @param {import("../types/queue")} responseQueue - Bot response queue of the
 * channel.
 */
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
    clientResponse(client, target, null, commandResponse);
    return;
  }

  const responseState = new Response(request, target, commandResponse);
  responseQueue.enquqe(responseState);
};


/**
 * Monitor bot responses.
 * @param {import("../types/channel").Channel} user - Channel's current state.
 * @param {string} response - Bot response on a target channel.
 */
listnerHandlers.onMessageHandler = function onMessageHandler(user, response) {
  const responseQueue = user.getResponseQueue();
  const latestQueuedResponse = responseQueue.retrieve();
  const responseState = latestQueuedResponse.getResponseState();
  const commandResponse = responseState.response;
  const request = responseState.request;
  const target = responseState.target;


  // Bot and queues responses must match before dequeue.
  const bypassChar = " " + String
    .fromCodePoint(...JSON.parse(process.env.DUPMSG_CHAR));

  if (response.length === (commandResponse.length + bypassChar.length)) {
    if (response.substring(response.length - bypassChar.length) === bypassChar)
      response = response.substring(0, response.length - bypassChar.length);
  }
  if (response !== commandResponse) return;



  logger.info(`\n* Executed "${request.join(" ")}" command`);
  logger.info("* Details:", { target, commandResponse });
  user.nextMessageState(response, Date.now());
  responseQueue.dequqe();
};


clientHandlers.onConnectedHandler = function onConnectedHandler(addr, port) {
  logger.info(`* Connected to ${addr}:${port}`);
};


listnerHandlers.onConnectedHandler = function onConnectedHandler(addr, port) {
  logger.info(`* Listner connected to ${addr}:${port}`);
};


module.exports = { clientHandlers, listnerHandlers };
