module.exports = class Command {
  /**
   * Main command execution function
   * @param {import("tmi.js").CommonUserstate} context Meta data of the user who
   *  invoked the command.
   * @param {Array<string>} request User request that contains attributable
   * information on how the bot response is to be invoked.
   * @returns {string} Status of the executed command to be sent back to the
   * user who invoked it.
   */
  // eslint-disable-next-line no-unused-vars
  static exec(context, request) {
    throw new Error("The function 'exec' has not been defined.");
  }
};
