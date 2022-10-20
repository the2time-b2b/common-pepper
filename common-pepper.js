require("dotenv").config();

const Client = require("./types/client");
const { Channel } = require("./types/channel");
const Response = require("./types/response");

const execCmd = require("./lib/command");
const clientResponse = require("./lib/response");
const { opts } = require("./config");
const logger = require("./utils/logger");


// Create a client with our options
const client = new Client(opts);


// Initialize each channel.
opts.channels.forEach(channel => {
  const nonPrefixedUsername = channel.substring(1);
  const isChannelStateTracked = Channel.checkChannel(nonPrefixedUsername);
  if (!isChannelStateTracked) new Channel(client, nonPrefixedUsername);
});


client.on("message", function() {
  const [channel, context, message, self] = arguments;

  const nonPrefixedUsername = channel.substring(1);
  const isUserStateTracked = Channel.checkChannel(nonPrefixedUsername);
  if (!isUserStateTracked) {
    throw new Error(`Channel state doesn't exist for ${nonPrefixedUsername}.`);
  }

  try {
    onMessageHandler(
      client, channel, context, message, self
    );
  }
  catch (err) {
    logger.info("* Command could not be executed: " + message);
    console.error(err);
    return;
  }
});


/**
 * Handle user requests.
 * @param {import("./types/client")} client - Bot's instance.
 * @param {string} target - A '#' prefiex username of the channel where the
 * command/message * originated from.
 * @param {import("tmi.js").CommonUserstate} context - The chat state of the
 * user who sent the command/message.
 * @param {string} msg - The command/message on the target channel.
 * @param {boolean} self - Flag that specifies whether command/message orignated
 * from the current bot's instance.

 */
function onMessageHandler(client, target, context, msg, self) {
  const channel = target.substring(1);
  if (self) return; // Ignore messages from the handler's bot (client) instance.

  if (process.env.NODE_ENV !== "test") {
    const username = context["display-name"].toLowerCase();
    const endUser = process.env.USERNAME.toLowerCase();
    if (username !== endUser) {
      logger.info(`\n* Environment variable 'USERNAME' is set to ${endUser}.`);
      logger.info(`* ${username} has no privilege to execute any command.`);
      return;
    }
  }

  // Ignore non-prefixed messages
  const prefix = process.env.PREFIX;
  const prefixLength = prefix.length;
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
  const responseState = new Response(request.join(" "), channel, botResponse);

  /*
    Note: Introduction of response queues breaks current message handler
    test as 'say' member function is called seperately every set interval.
  */
  // TODO: Alter test to reflect the changes due to response queues.
  if (process.env.NODE_ENV === "test") {
    clientResponse(client, null, responseState);
    return;
  }

  const responseQueue = Channel.getResponseQueue(channel);
  responseQueue.enquqe(responseState);
}


function onConnectedHandler(addr, port) {
  logger.info(`* Connected to ${addr}:${port}`);
}


client.on("connected", onConnectedHandler);
if (process.env.NODE_ENV !== "test") {
  client.connect().catch(err => console.error(err));
}


if (process.env.NODE_ENV === "test") module.exports = onMessageHandler;
