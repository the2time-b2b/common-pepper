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
  const nonPrefixedUsername = channel.substring(1);
  const isChannelStateTracked = Channel.checkChannel(nonPrefixedUsername);
  if (!isChannelStateTracked) new Channel(client, nonPrefixedUsername);
});


client.on("message", function() {
  if (listner.readyState() !== "OPEN") {
    throw new Error("Fatal: Listener is not connected.");
  }

  const [channel, context, message, self] = arguments;

  const nonPrefixedUsername = channel.substring(1);
  const isUserStateTracked = Channel.checkChannel(nonPrefixedUsername);
  if (!isUserStateTracked) {
    throw new Error(`Channel state doesn't exist for ${nonPrefixedUsername}.`);
  }

  try {
    handlers.clientHandlers.onMessageHandler(
      client, channel, context, message, self
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
  const nonPrefixedUsername = channel.substring(1);

  const username = String(context.username).toLowerCase();
  if (!(username === process.env.BOT_USERNAME)) return;

  const isUserStateTracked = Channel.checkChannel(nonPrefixedUsername);
  if (!isUserStateTracked) {
    throw new Error(`Channel state doesn't exist for ${nonPrefixedUsername}.`);
  }

  handlers.listnerHandlers.onMessageHandler(nonPrefixedUsername, response);
});


client.on("connected", handlers.clientHandlers.onConnectedHandler);
listner.on("connected", handlers.listnerHandlers.onConnectedHandler);

client.connect().catch(err => console.error(err));
listner.connect().catch(err => console.error(err));
