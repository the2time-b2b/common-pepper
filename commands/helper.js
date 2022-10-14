const commands = require(".");


module.exports.execCmd = function(context, request) {
  const command = commands[request[0].substring(process.env.PREFIX.length)];

  if (command) {
    if (request.length === 2) {
      if (command[request[1]]) {
        return `${context["display-name"]}, ${command[request[1]]}`;
      }
    }

    if (!(command.exec instanceof Function)) {
      const message = "Cannot handle user commands. Missing exec function.";
      throw new TypeError(message);
    }

    return command.exec(context, request.splice(1));
  }

  return false;
};
