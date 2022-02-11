require("dotenv").config();
const tmi = require("tmi.js");

const Channel = require("./channel");
const logger = require("../utils/logger");


class Client extends tmi.client {
  SEND_INTERVAL = process.env.SEND_INTERVAL || "30";
  DUPMSG_CHAR = process.env.DUPMSG_CHAR;
  /**
   * Send a response to a particular channel.
   * @param {string} channel - Recipient channel.
   * @param {string} message - A response message.
   * @description This overridden method provides an additional functionaility
   * of bypassing the message duplication filter and prevents intentional or
   * unintentional global cooldown due to fast chat message invocation rates.
   */
  say(channel, message) {
    let user;
    if (Channel.checkChannel(channel.substring(1))) {
      user = new Channel(channel.substring(1));
    }
    else user = Channel.currentMessageState(channel.substring(1));

    const nodeEnv = process.env.NODE_ENV || "dev";
    const dupMsgChar = this.DUPMSG_CHAR;
    const sendInterval = parseInt(this.SEND_INTERVAL);
    const lastSent = user.messageLastSent;

    /*
    * Prevents intentional/unintentional global cooldown.
    * DUPMSG_STATUS initially set to null for first bot's message after reset
    */
    const diff = lastSent ? ((Date.now() - lastSent) / 1000) : sendInterval;
    if (diff >= sendInterval) {
      // Circumvents Twitch's duplicate message filter
      if (message === user.recentMessage && nodeEnv !== "dev") {
        message += ` ${String.fromCodePoint(...JSON.parse(dupMsgChar))}`;
      }

      Channel.nextMessageState(user.username, message, Date.now());

      if (["dev", "test"].includes(nodeEnv)) logger.info({ channel, message });
      else super.say(channel, message);
    }
  }
}


module.exports = Client;
