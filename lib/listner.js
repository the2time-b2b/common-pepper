const logger = require("../utils/logger");


function listner(client, responseQueue, botResponseStatus) {
  client.on("message", function() {
    onMessageHandler(botResponseStatus, responseQueue, ...arguments);
  });
  client.on("connected", onConnectedHandler);
  client.connect();
}


function onMessageHandler(botResponseStatus, responseQueue, target, context) {
  if (context.username === process.env.BOT_USERNAME) {
    botResponseStatus.status = 1;
    responseQueue.dequqe();
    return;
  }
}


function onConnectedHandler(addr, port) {
  logger.info(`* Listner connected to ${addr}:${port}`);
}


module.exports = listner;
