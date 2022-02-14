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
  Channel.clearChannels();
  jest.clearAllMocks();
});

describe("circumvent message duplication filter where bypass interval,", () => {
  // Set SEND_INTERVAL to 0; chat cooldown prevention interferes with test
  client.SEND_INTERVAL = 0;

  it("is greater than the elapsed time for consecutive requests", async() => {
    await testClientResponse();

    await testClientResponse(true);
  });

  it("is lesser than the elapsed time for consecutive requests", async() => {
    jest.useFakeTimers();

    await testClientResponse();

    jest.advanceTimersByTime(31000); // Advances to 30 secs.

    await testClientResponse();

    jest.useRealTimers();
  });
});


describe("watch the set SEND_INTERVAL value and respond if", () => {
  beforeAll(() => { jest.useFakeTimers(); client.SEND_INTERVAL = 20; });

  it("elapsed time is more than set value for consecutive request", async() => {
    await testClientResponse();

    jest.advanceTimersByTime(5000); // Advances to 5 secs.

    await testClientResponse(false, true);

    jest.advanceTimersByTime(15000); // Advances to 20 secs.

    await testClientResponse(true);
  });

  afterAll(() => jest.useRealTimers());
});


/**
 * Test the client instance response.
 * @param {boolean} [circumvented=false] - Expect a duplication filter
 * circumvented response.
 * @param {boolean} [rejection=false] - Test for promise rejections.
 */
async function testClientResponse(circumvented = false, rejection = false) {
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
