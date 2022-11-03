import dotenv from "dotenv";
dotenv.config();

import * as Channel from "./types/channel";
import Client from "./types/client";
import BotResponse from "./types/response";

import type { ChatUserstate } from "tmi.js";

import * as logger from "./utils/logger";
import executeCommand from "./commands";
import { opts } from "./config/";
import clientResponse from "./lib/response";


// Create a client with our options
const client = new Client(opts);


// Initialize each channel.
if (!(opts.channels)) throw new Error("Channels are not specified.");
opts.channels.forEach((channel: string) => {
  const nonPrefixedUsername = channel.substring(1);
  const isChannelTracked = Channel.default.checkChannel(nonPrefixedUsername);
  if (!isChannelTracked) new Channel.default(client, nonPrefixedUsername);
});


client.on("message", function(
  channel: string, context: ChatUserstate, message: string, self: boolean
) {
  const nonPrefixedUsername = channel.substring(1);
  const isUserStateTracked = Channel.default.checkChannel(nonPrefixedUsername);
  if (!isUserStateTracked) {
    throw new Error(`Channel state doesn't exist for ${nonPrefixedUsername}.`);
  }

  try {
    onMessageHandler(client, channel, context, message, self);
  }
  catch (err: unknown) {
    logger.info("* Command could not be executed: " + message);
    console.error(err);
    return;
  }
});


/**
 * Handle user requests.
 * @description Leading and trailing whitespaces are already pre-trimmed by the
 * incoming requests.
 * @param client Bot's instance.
 * @param target A '#' prefiex username of the channel where the command/message
 * originated from.
 * @param context The chat state of the user who sent the command/message.
 * @param request The command/message on the target channel.
 * @param self Flag that specifies whether command/message orignated from the
 * current bot's instance.
 */
function onMessageHandler(
  client: Client,
  target: string,
  context: ChatUserstate,
  request: string,
  self: boolean
): void {
  const channel = target.substring(1);
  if (self) return; // Ignore messages from the handler's bot (client) instance.

  // Ignore request that are not command (non-prefixed messages).
  const prefix = process.env.PREFIX;
  if (!prefix) throw new Error("Environment variable 'PREFIX' is not set.");

  const prefixLength = prefix.length;
  if (!(request.substring(0, prefixLength) === prefix)) return;

  if (process.env.NODE_ENV !== "test") {
    const endUser = process.env.USERNAME;
    if (!endUser) {
      throw new Error("Environment variable 'USERNAME' is not set.");
    }

    if (context["display-name"] === undefined) {
      throw new Error("display name was not supplied.");
    }
    const username = context["display-name"].toLowerCase();

    if (username !== endUser.toLowerCase()) {
      logger.info(`\n* Environment variable 'USERNAME' is set to ${endUser}.`);
      logger.info(`* ${username} has no privilege to execute any command.`);
      return;
    }

    logger.info(`\n* Raw request "${request}" Received`);
  }

  /*
  * Trims whitespace on either side of the chat message and replaces
  * multiple whitespaces, tabs or newlines between words with just
  * one whitespace.
  */
  const splitModifiedRequest = request.trim().replace(/\s\s+/g, " ").split(" ");
  const modifiedRequest = splitModifiedRequest.join(" ");

  const botResponse = executeCommand(context, splitModifiedRequest);
  const responseState = new BotResponse(modifiedRequest, channel, botResponse);

  /*
    Note: Introduction of response queues breaks current message handler
    test as 'say' member function is called seperately every set interval.
  */
  // TODO: Alter test to reflect the changes due to response queues.
  if (process.env.NODE_ENV === "test") {
    const messageState = new Channel.MessageState();
    clientResponse(client, messageState, responseState);
    return;
  }

  const responseQueue = Channel.default.getResponseQueue(channel);
  responseQueue.enqueue(responseState);
}


client.on("connected", function(address: string, port: number): void {
  logger.info(`* Connected to ${address}:${port}`);
});


if (process.env.NODE_ENV !== "test") {
  client.connect().catch((err: unknown) => console.error(err));
}


if (process.env.NODE_ENV === "test") module.exports = onMessageHandler;
