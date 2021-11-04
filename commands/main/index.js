const ping = {
  help: "Checks if the bot is connected.",
  usage: `"${process.env.PREFIX}ping" FailFish`,
  exec: function() {
    return "R) 7";
  }
};


module.exports = {
  ping,
  ...require("./say")
};
