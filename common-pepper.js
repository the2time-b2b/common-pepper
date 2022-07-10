require("dotenv").config();

const Client = require("./lib/client");
const Queue = require("./lib/queue");
const clientResponse = require("./lib/response");
const { clientHandlers, listnerHandlers } = require("./utils/handlers");
const logger = require("./utils/logger");
const { opts } = require("./config");


const responseQueue = new Queue();
const botResponseStatus = { status: 0 };


try {
  if (process.env.NODE_ENV !== "test") {
    // Create a client with our options
    const client = new Client(opts);
    const listner = new Client(opts);

    client.on("message", function() {
      if (listner.readyState() !== "OPEN") {
        console.error("Listener is not connected.");
        return;
      }

      clientHandlers.onMessageHandler(
        client, ...arguments, responseQueue
      );
    });
    listner.on("message", function() {
      listnerHandlers.onMessageHandler(
        ...arguments, botResponseStatus, responseQueue
      );
    });

    client.on("connected", clientHandlers.onConnectedHandler);
    listner.on("connected", listnerHandlers.onConnectedHandler);


    client.connect().catch(err => console.error(err));
    listner.connect().catch(err => console.error(err));


    setInterval(() => {
      if (responseQueue.isEmpty()) return;

      const latestResponse = responseQueue.retrieve();
      const request = latestResponse.request;
      const target = latestResponse.target;
      const commandResponse = latestResponse.commandResponse;
      clientResponse(client, request, target, commandResponse);

      if (process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "test") {
        botResponseStatus.status = 1;
        responseQueue.dequqe();
      }

      if (botResponseStatus.status === 1) {
        botResponseStatus.status = 0;
        logger.info(`\n* Executed "${request.join(" ")}" command`);
        logger.info("* Details:", { target, commandResponse });
      }
    }, 5000); // TODO: Dynamically change polling interval via commands
  }
}
catch (err) { console.error(err); }
