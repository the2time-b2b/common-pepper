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

beforeEach(() => {
  client.SEND_INTERVAL = 0; // Preset cooldown prevention interferes with test.

  Channel.clearChannels();
  jest.clearAllMocks();
});

describe("circumvent message duplication filter where bypass interval,", () => {
  const message = `${process.env.PREFIX}testCmd same message from the user`;

  it("is greater than the elapsed time for consecutive requests", async() => {
    await testClientResponse(message);

    await testClientResponse(message, true);
  });

  it("is lesser than the elapsed time for consecutive requests", async() => {
    jest.useFakeTimers(message);

    await testClientResponse(message);

    jest.advanceTimersByTime(31000); // Advances to 30 secs.

    await testClientResponse(message);

    jest.useRealTimers(message);
  });
});


describe("do not circumvent message duplication filter", () => {
  let message = `${process.env.PREFIX}testCmd same message from the user`;

  it("for different requests", async() => {
    await testClientResponse(message);

    message = `${process.env.PREFIX}testCmd different message from the user`;
    await testClientResponse(message);
  });
});


describe("watch the set SEND_INTERVAL value and respond if", () => {
  const message = `${process.env.PREFIX}testCmd same message from the user`;
  beforeAll(() => { jest.useFakeTimers(); });

  it("elapsed time is more than set value for consecutive request", async() => {
    client.SEND_INTERVAL = 20;

    await testClientResponse(message);

    jest.advanceTimersByTime(5000); // Advances to 5 secs.

    await testClientResponse(message, false, true);

    jest.advanceTimersByTime(15000); // Advances to 20 secs.

    await testClientResponse(message, true);
  });

  afterAll(() => jest.useRealTimers());
});


/**
 * Test the client instance response.
 * @param {string} message - A response message.
 * @param {boolean} [circumvented=false] - Expect a duplication filter
 * circumvented response.
 * @param {boolean} [rejection=false] - Test for promise rejections.
 */
async function testClientResponse(
  message, circumvented = false, rejection = false
) {
  const channel = "#sven_snusberg";
  const filterByPassChar = "\udb40\udc00";

  let response;

  try {
    response = await client.say(channel, message);
  }
  catch (err) {
    if (rejection) {
      expect(err.name).toBe("sendIntervalError");
      return;
    }
  }

  expect(response).toHaveLength(2);
  const [returnedChannel, returnedMessage] = response;
  expect(returnedChannel).toBe(channel);
  expect(returnedMessage)
    .toBe(circumvented ? `${message} ${filterByPassChar}` : message);
}
