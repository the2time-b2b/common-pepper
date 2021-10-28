require("dotenv").config();
const tmi = require("tmi.js");

const { opts } = require("./config");
const logger = require("./utils/logger");


const configProps = {
  PREFIX: process.env.PREFIX,
  SEND_INTERVAL: parseInt(process.env.SEND_INTERVAL) || 30,
  DUPMSG_CHAR: process.env.DUPMSG_CHAR,
  LAST_SENT: Date.now(),
  DUPMSG_STATUS: null // Set to null to indicate first bot message after reset
};


try {
  if (process.env.NODE_ENV !== "test") {
    // Create a client with our options
    const client = new tmi.client(opts);

    client.on("message", function () {
      onMessageHandler(client, ...arguments);
    });
    client.on("connected", onConnectedHandler);

    client.connect();
  }
}
catch (err) { console.error(err); }


function onMessageHandler(client, target, context, msg, self) {
  const prefix = configProps.PREFIX;
  const prefixLength = prefix.length;
  const dupMsgStatus = configProps.DUPMSG_STATUS;
  const dupMsgChar = configProps.DUPMSG_CHAR;
  const lastSent = configProps.LAST_SENT;
  const sendInterval = configProps.SEND_INTERVAL;

  // Ignore messages from the bot
  if (self) {
    configProps.DUPMSG_STATUS = dupMsgStatus === "1" ? "0" : "1";
    return;
  }

  // Ignore non-prefixed messages
  if (!(msg.substring(0, prefixLength) === prefix)) return;

  /*
  * Prevents intentional/unintentional global cooldown
  * DUPMSG_STATUS initially set to null for first bot's message after reset
  */
  const diff = ((Date.now() - lastSent) / 1000);
  if ((diff < sendInterval) && dupMsgStatus) return;

  /*
  *Trims whitespace on either side of the chat message and replaces multiple
  *whitespaces, tabs or newlines between words with just one whitespace
  */
  const request = msg.trim().replace(/\s\s+/g, " ").split(" ");
  let response = request.join(" ");

  // Circumvents Twitch's duplicate message filter
  if (dupMsgStatus === "1") {
    response = response + ` ${String.fromCodePoint(...JSON.parse(dupMsgChar))}`;
  }

  logger.info(`* Raw request "${msg}" Received`);
  logger.info(`* Executed "${request.join(" ")}" command`);

  if (request) {
    if (["live", "test"].includes(process.env.NODE_ENV)) {
      client.say(target, response);
      configProps.LAST_SENT = Date.now();
    }
    else if (process.env.NODE_ENV === "dev") {
      logger.info({ target, response });
      configProps.LAST_SENT = Date.now();
    }
  } else logger.info(`* Unknown command ${request.join(" ")}`);
}


function onConnectedHandler(addr, port) {
  logger.info(`* Connected to ${addr}:${port}`);
}


module.exports = { onMessageHandler, configProps };
