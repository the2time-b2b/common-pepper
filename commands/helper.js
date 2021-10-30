const commands = require(".");


module.exports.execCmd = function(context, request) {
  try {
    const command = commands[request[0].substring(process.env.PREFIX.length)];

    if (request.length === 2 && request[1] === "help" && command.help) {
      if (command.help) {
        return `${context["display-name"]}, ${command.help}`;
      }
    }
    else if (request.length === 2 && request[1] === "usage") {
      if (command.usage) {
        return `${context["display-name"]}, ${command.usage}`;
      }
    }

    return command.exec();
  }
  catch (err) {
    console.error(err);
    return false;
  }
};
