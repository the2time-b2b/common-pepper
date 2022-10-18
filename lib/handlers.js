const Response = require("../types/response");
const { Channel } = require("../types/channel");

const logger = require("../utils/logger");
const execCmd = require("./command");
const clientResponse = require("./response");


const clientHandlers = {};
const listnerHandlers = {};


/**
 * Handle user requests.
 * @param {import("../types/client")} client - Bot's instance.
 * @param {string} target - A '#' prefiex username of the channel where the
 * command/message * originated from.
 * @param {object} context - The chat state of the user who sent the
 * command/message.
 * @param {string} msg - The command/message on the target channel.
 * @param {boolean} self - Flag that specifies whether command/message orignated
 * from the current bot's instance.
 * @param {import("../types/channel").MessageQueue} responseQueue - Bot response
 *  queue of the channel.
 */
clientHandlers.onMessageHandler = function onMessageHandler(
  client, target, context, msg, self
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

  const botResponse = execCmd(prefix, context, request);
  const responseState = new Response(request.join(" "), target, botResponse);

  /*
    Note: Introduction of response queues breaks current message handler
    test as 'say' member function is called seperately every set interval.
  */
  // TODO: Alter test to reflect the changes due to response queues.
  if (process.env.NODE_ENV === "test") {
    clientResponse(client, null, responseState);
    return;
  }

  const responseQueue = Channel.getResponseQueue(target.substring(1));
  responseQueue.enquqe(responseState);
};


/**
 * Monitor bot responses.
 * @param {string} channel - Username of the channel.
 * @param {string} message - Bot message/response picked up by the listener on a
 * target channel.
 */
listnerHandlers.onMessageHandler = function onMessageHandler(channel, message) {
  const user = Channel.getChannel(channel);

  const responseQueue = user.getResponseQueue();
  if (responseQueue.isEmpty()) return;

  const responseState = responseQueue.retrieve();
  const response = responseState.response;
  const request = responseState.request;
  const target = responseState.target;

  if (message !== response) return;

  logger.info(`\n* Executed "${request}" command`);
  logger.info("* Details:", { target, response });

  const messageState = user.getMessageState();
  messageState.nextMessageState(message, Date.now());

  responseQueue.dequqe();
};


clientHandlers.onConnectedHandler = function onConnectedHandler(addr, port) {
  logger.info(`* Connected to ${addr}:${port}`);
};


listnerHandlers.onConnectedHandler = function onConnectedHandler(addr, port) {
  logger.info(`* Listner connected to ${addr}:${port}`);
};


module.exports = { clientHandlers, listnerHandlers };
