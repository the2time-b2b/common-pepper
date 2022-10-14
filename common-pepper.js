require("dotenv").config();

const Client = require("./types/client");
const { Channel } = require("./types/channel");
const handlers = require("./lib/handlers");
const { opts } = require("./config");
const logger = require("./utils/logger");



// Create a client with our options
const client = new Client(opts);
const listner = new Client(opts);

// Initialize each channel.
opts.channels.forEach(channel => {
  new Channel(client, channel.substring(1));
});

client.on("message", function() {
  if (listner.readyState() !== "OPEN") {
    console.error("Listener is not connected.");
    return;
  }

  const [channel, context, message, self] = arguments;

  const user = Channel.getChannel(channel.substring(1));
  if (!user) return;

  const responseQueue = user.getResponseQueue();

  try {
    handlers.clientHandlers.onMessageHandler(
      client, channel, context, message, self, responseQueue
    );
  }
  catch (err) {
    logger.info("* Command could not be executed: " + message);
    console.error(err);
    return;
  }
});

listner.on("message", function() {
  // eslint-disable-next-line no-unused-vars
  const [channel, context, response] = arguments;

  const username = String(context.username).toLowerCase();
  if (!(username === process.env.BOT_USERNAME)) return;

  const user = Channel.getChannel(channel.substring(1));
  if (!user) return;

  handlers.listnerHandlers.onMessageHandler(user, response);
});


client.on("connected", handlers.clientHandlers.onConnectedHandler);
listner.on("connected", handlers.listnerHandlers.onConnectedHandler);

client.connect().catch(err => console.error(err));
listner.connect().catch(err => console.error(err));
