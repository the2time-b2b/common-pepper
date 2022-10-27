const commands = require("./helper");
const Command = require("./command");


/**
 * Execute a command requested by the end user.
 * @param {import("tmi.js").ChatUserstate} context Meta data of the user who
 * invoked the command.
 * @param {Array<string>} request An array of split user command request to be
 * further processed.
 * @returns {string} Status of the command.
 */
module.exports = function(context, request) {
  if (!Array.isArray(request)) throw new TypeError("request must be an Array");
  request.forEach(element => {
    if (typeof element !== "string") {
      throw new TypeError("Each element in the request must be a string.");
    }
  });

  /** @type {typeof Command} */
  const command = commands[request[0].substring(process.env.PREFIX.length)];

  if (command) {
    if (!(command.prototype instanceof Command))
      throw new TypeError(`The command is not of a ${Command.name} type.`);

    return command.exec(context, request.splice(1));
  }

  return "@" + context["display-name"] + ", enter a valid command.";
};
