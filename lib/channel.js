/**
 * Track the messaging state for each of the channel in which the bot resides.
 */
class Channel {
  static #channels = {};

  #username = null;
  #recentMessage = null;
  #messageLastSent = null;
  #filterBypassInterval = 30; // Default message duplication cooldown period.

  constructor(username) {
    this.#username = username;
    Channel.#channels[this.#username] = this;
  }


  /**
   * Get the current instance of a particular channel.
   * @param {string} username - Username of associated with the channel.
   * @returns {object} - Current instance of a particular channel
   */
  static getChannel(username) {
    return Channel.#channels[username];
  }


  /**
   * Update the current instance of a particular channel.
   * @param {object} newMessageState - Modified version of the current channel
   * instance.
   * @param {string} username - Username of associated with the channel.
   * @description This does not modify the instance in place but in fact
   * completely replaces the entire instance with a new updated version.
   */
  static changeMessageState(newMessageState, username) {
    Channel.#channels[username] = newMessageState;
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


  /**
   * Get the state of the current message that is to be sent for a particular
   * channel.
   * @param {string} username - Username of associated with the channel.
   * @returns {object} The current message state to be sent of a specified
   * channel.
   */
  currentMessageState() {
    return {
      username: this.#username,
      recentMessage: this.#recentMessage,
      messageLastSent: this.#messageLastSent,
      filterBypassInterval: this.#filterBypassInterval
    };
  }


  /**
   * Change how the next message must be sent on a particular channel.
   * @param {string} recentMessage - The previous message on the channel.
   * @param {number} messageLastSent - Epox time of the previous message sent.
   */
  nextMessageState(recentMessage, messageLastSent) {
    this.#recentMessage = recentMessage;
    this.#messageLastSent = messageLastSent;
    Channel.changeMessageState(this, this.#username);
  }
}


module.exports = Channel;
