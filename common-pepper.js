require("dotenv").config();
const tmi = require("tmi.js");

const { opts } = require("./config");
const logger = require("./utils/logger");
const { execCmd } = require("./commands/helper");


const configProps = {
  PREFIX: process.env.PREFIX,
  SEND_INTERVAL: process.env.SEND_INTERVAL || 30,
  DUPMSG_CHAR: process.env.DUPMSG_CHAR,
  LAST_SENT: Date.now(),
  DUPMSG_STATUS: null // Set to null to indicate first bot message after reset
};


/**
 * Circumvents Twitch's duplicate message filter
 */
class bypassDuplicateMessageFilter extends tmi.client {
  say(channel, message) {
    const nodeEnv = process.env.NODE_ENV || "dev";
    const dupMsgChar = configProps.DUPMSG_CHAR;
    const dupMsgStatus = configProps.DUPMSG_STATUS;
    const lastSent = configProps.LAST_SENT;
    const sendInterval = parseInt(configProps.SEND_INTERVAL);

    if (dupMsgStatus === "1" && nodeEnv !== "dev") {
      message += ` ${String.fromCodePoint(...JSON.parse(dupMsgChar))}`;
    }

    /*
    * Prevents intentional/unintentional global cooldown
    * DUPMSG_STATUS initially set to null for first bot's message after reset
    */
    const diff = ((Date.now() - lastSent) / 1000);
    if ((diff >= sendInterval) || dupMsgStatus === null) {
      if (["dev", "test"].includes(nodeEnv)) logger.info({ channel, message });
      else super.say(channel, message);

      configProps.LAST_SENT = Date.now();
      // TODO: Seperate DUPMSG_STATUS instance on each individual channel.
      configProps.DUPMSG_STATUS = dupMsgStatus === "1" ? "0" : "1";

    }
  }
}


try {
  if (process.env.NODE_ENV !== "test") {
    // Create a client with our options
    const client = new bypassDuplicateMessageFilter(opts);

    client.on("message", function() {
      onMessageHandler(client, ...arguments);
    });
    client.on("connected", onConnectedHandler);

    client.connect();
  }
}
catch (err) { console.error(err); }


function onMessageHandler(client, target, context, msg, self) {
  const nodeEnv = process.env.NODE_ENV || "dev";
  const prefix = configProps.PREFIX;
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
    logger.info(`* Executed "${request.join(" ")}" command`);

    client.say(target, response);
  }
  else logger.info(`* Unknown command ${request.join(" ")}`);
}


function onConnectedHandler(addr, port) {
  logger.info(`* Connected to ${addr}:${port}`);
}


module.exports = {
  bypassDuplicateMessageFilter, onMessageHandler, configProps
};
