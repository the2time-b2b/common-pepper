/**
 * Track the messaging state for each of the channel in which the bot resides.
 */
class Channel {
  static #channels = {};

  previousMessage = null;
  messageLastSent = null;
  duplicateMessageStatus = null;

  constructor(username) {
    this.username = username;
    Channel.#channels[this.username] = this;
  }


  /**
   * Get the state of the current message that is to be sent for a particular
   * channel.
   * @param {string} username - Username of associated with the channel.
   * @returns {object} The current message state to be sent of a specified
   * channel.
   */
  static currentMessageState(username) {
    return {
      username: Channel.#channels[username].username,
      messageLastSent: Channel.#channels[username].messageLastSent,
      duplicateMessageStatus: Channel.#channels[username].duplicateMessageStatus
    };
  }


  /**
   * Change how the next message must be sent on a particular channel.
   * @param {string} username - Username of associated with the channel.
   * @param {string} prevMsg - The previous message on the channel.
   * @param {number} messageLastSent - Epox time of the previous message sent.
   * @param {boolean} dupMsgStatus - Indicates whether or not to bypass
   * duplication filter on the next message event.
   */
  static nextMessageState(username, prevMsg, messageLastSent, dupMsgStatus) {
    Channel.#channels[username].previousMessage = prevMsg;
    Channel.#channels[username].messageLastSent = messageLastSent;
    Channel.#channels[username].duplicateMessageStatus = dupMsgStatus;
  }


  /**
   * Check if the channel exists on the current instance of the server.
   * @param {string} username - Username of associated with the channel.
   * @returns {boolean}
   */
  static checkChannel(username) {
    if (!Object.keys(Channel.#channels).includes(username)) return true;
    return false;
  }

  /**
   * Clears all channel's message state information on the current instance of
   * the server.
   */
  static clearChannels() {
    Channel.#channels = {};
  }
}

module.exports = Channel;
