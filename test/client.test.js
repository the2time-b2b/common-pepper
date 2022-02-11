const Client = require("../lib/client");
const Channel = require("../lib/channel");


// Dummy options
const opts = {
  identity: {
    username: "",
    password: ""
  },
  channels: []
};
const client = new Client(opts);
const message = `${process.env.PREFIX}testCmd same message from the user`;
const channel = "#sven_snusberg";
const filterByPassChar = "\udb40\udc00";

beforeEach(() => {
  client.SEND_INTERVAL = process.env.SEND_INTERVAL || "30";
  client.SEND_INTERVAL = parseInt(client.SEND_INTERVAL);
  client.DUPMSG_CHAR = process.env.DUPMSG_CHAR;

  Channel.clearChannels();
  jest.clearAllMocks();
});

describe("circumvent message duplication filter where,", () => {
  it("it circumvents the alternate user requests", async() => {

    testClientResponse(channel, message);

    // Set SEND_INTERVAL to 0; chat cooldown prevention interferes with test
    client.SEND_INTERVAL = 0;

    testClientResponse(channel, message, true);
  });
});


describe("watch the set SEND_INTERVAL value and respond if", () => {
  beforeAll(() => jest.useFakeTimers());

  it("elapsed time is more than set value except for initial request", () => {
    // In seconds
    client.SEND_INTERVAL = 20;
    const initialTimeElapsed = 5;
    const finalTimeElapsed = 15;

    testClientResponse(channel, message);

    jest.advanceTimersByTime(initialTimeElapsed * 1000); // Advances to 5 secs.

    testClientResponse(channel, message, true);

    jest.advanceTimersByTime(finalTimeElapsed * 1000); // Advances to 20 secs.

    testClientResponse(channel, message, `${message} ${filterByPassChar}`);
  });

  afterAll(() => jest.useRealTimers());
});


/**
 * Test the client instance response.
 * @param {string} channel - Recipient channel.
 * @param {string} message - A response message.
 * @param {boolean} circumvented - Expect a duplication filter circumvented
 * response.
 */
function testClientResponse(channel, message, circumvented = false) {
  client.say(channel, message)
    .then(response => {
      expect(response).toHaveLength(2);
      const [returnedChannel, returnedMessage] = response;
      expect(returnedChannel).toBe(channel);
      expect(returnedMessage)
        .toBe(circumvented ? `${message} ${filterByPassChar}` : message);
    })
    .catch(err => expect(err.name).toBe("sendIntervalError"));
}
