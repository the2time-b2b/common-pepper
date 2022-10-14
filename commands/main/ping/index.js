const Command = require("../../command");


class Ping extends Command {
  /**
   * A sinple bot response to ensure that it is connected on the channel where
   * the command is invoked.
   * @param {import("tmi.js").CommonUserstate} context Meta data of the user who
   *  invoked the command.
   * @param {Array<string>} request User request that contains attributable
   * information on how the bot response is to be invoked.
   * @returns {string} Status of the executed command to be sent back to the
   * user who invoked it.
   */
  static exec(context, request) {
    const additionalRequest = request[0]; // Ignore the rest.
    if (additionalRequest === "help") {
      return "Checks if the bot is connected.";
    }
    if (additionalRequest === "usage") {
      return `"${process.env.PREFIX}ping" FailFish`;
    }

    return "R) 7";
  }
}


module.exports = Ping;
