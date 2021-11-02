const commands = require(".");


module.exports.execCmd = function(context, request) {
  try {
    const command = commands[request[0].substring(process.env.PREFIX.length)];

    if (command) {
      if (request.length === 2 && request[1] === "help") {
        if (command.help) {
          return `${context["display-name"]}, ${command.help}`;
        }
      }
      else if (request.length === 2 && request[1] === "usage") {
        if (command.usage) {
          return `${context["display-name"]}, ${command.usage}`;
        }
      }

      return command.exec(context, request.splice(1));
    }

    return false;
  }
  catch (err) {
    console.error(err);
    return false;
  }
};
