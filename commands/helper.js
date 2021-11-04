const commands = require(".");


module.exports.execCmd = function(context, request) {
  try {
    const command = commands[request[0].substring(process.env.PREFIX.length)];

    if (command) {
      if (request.length === 2) {
        if (command[request[1]]) {
          return `${context["display-name"]}, ${command[request[1]]}`;
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
