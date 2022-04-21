const { execCmd } = require("../commands/helper");

// Command with name testCmd reserved for test only.

function command(prefix, context, request) {
  const nodeEnv = process.env.NODE_ENV || "dev";
  const response = (request[0] === `${prefix}testCmd` && nodeEnv === "test")
    ? request.join(" ")
    : execCmd(context, request);

  return response;
}


module.exports = command;
