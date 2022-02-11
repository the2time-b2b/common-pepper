/**
 * Track the messaging state for each of the channel in which the bot resides.
 */
class Channel {
  static #channels = {};

  #recentMessage = null;
  #messageLastSent = null;

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
      recentMessage: Channel.#channels[username].recentMessage,
      messageLastSent: Channel.#channels[username].messageLastSent,
    };
  }


  /**
   * Change how the next message must be sent on a particular channel.
   * @param {string} username - Username of associated with the channel.
   * @param {string} recentMessage - The previous message on the channel.
   * @param {number} messageLastSent - Epox time of the previous message sent.
   */
  static nextMessageState(username, recentMessage, messageLastSent) {
    Channel.#channels[username].recentMessage = recentMessage;
    Channel.#channels[username].messageLastSent = messageLastSent;
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
