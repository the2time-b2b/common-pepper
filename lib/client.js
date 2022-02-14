require("dotenv").config();
const tmi = require("tmi.js");

const Channel = require("./channel");
const CustomError = require("../utils/error");


class Client extends tmi.client {
  constructor() {
    super();
    this.SEND_INTERVAL = process.env.SEND_INTERVAL || "30";
    this.DUPMSG_CHAR = process.env.DUPMSG_CHAR;
  }
  /**
   * Send a response to a particular channel.
   * @param {string} channel - Recipient channel.
   * @param {string} message - A response message.
   * @description This overridden method provides an additional functionaility
   * of bypassing the message duplication filter and prevents intentional or
   * unintentional global cooldown due to fast chat message invocation rates.
   */
  say(channel, message) {
    if (Channel.checkChannel(channel.substring(1))) {
      new Channel(channel.substring(1));
    }
    const user = Channel.currentMessageState(channel.substring(1));

    const nodeEnv = process.env.NODE_ENV || "dev";
    const dupMsgChar = this.DUPMSG_CHAR;
    const sendInterval = parseInt(this.SEND_INTERVAL);
    const lastSent = user.messageLastSent;
    const bypassInterval = user.filterBypassInterval;

    /*
    * Prevents intentional/unintentional global cooldown.
    * DUPMSG_STATUS initially set to null for first bot's message after reset
    */
    const elapsed = lastSent ? ((Date.now() - lastSent) / 1000) : sendInterval;

    if (elapsed >= sendInterval) {
      // Circumvents Twitch's duplicate message filter
      if (
        elapsed <= bypassInterval
        && message === user.recentMessage
        && nodeEnv !== "dev"
      ) {
        message += ` ${String.fromCodePoint(...JSON.parse(dupMsgChar))}`;
      }

      Channel.nextMessageState(user.username, message, Date.now());

      if (nodeEnv === "live") return super.say(channel, message);
    }

    return new Promise((resolve, reject) => {
      if (elapsed < sendInterval) {
        reject(new CustomError.sendIntervalError(channel));
      }
      resolve([channel, message]); // For dev/test
    });
  }
}


module.exports = Client;
