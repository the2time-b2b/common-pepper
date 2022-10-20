require("dotenv").config();

const Client = require("../types/client");
const Response = require("../types/response");
const MessageState = require("../types/channel").MessageState;


const client = new Client({}); // Dummy options
const testMessageState = new MessageState();

beforeEach(() => {
  client.changeMessageInterval(0); // Preset interval interferes with test.
  testMessageState.nextMessageState(null, null);
  jest.clearAllMocks();
});

describe("For consecutive responses, circumvent duplication filter,", () => {
  const response = "Some response";

  it(
    "if bot sends the same response with elapsed time < bypass interval",
    async() => {
      await testClientResponse(response);

      await testClientResponse(response, true);
    });
});


describe("For consecutive responses, do not circumvent duplication filter",
  () => {
    const response = "Some response";
    const differentResponse = "Some other response";

    it(
      "if bot sends the different response with elapsed time < bypass interval",
      async() => {
        await testClientResponse(response);

        await testClientResponse(differentResponse);
      });

    it(
      "if bot sends the same response when elapsed time > bypass interval",
      async() => {
        jest.useFakeTimers();

        await testClientResponse(response);

        jest.advanceTimersByTime(31000); // Advances to 30 secs.

        await testClientResponse(response);

        jest.useRealTimers();
      });
  });


describe("watch the set SEND_INTERVAL value and respond if", () => {
  const message = `${process.env.PREFIX}testCmd same message from the user`;
  beforeAll(() => { jest.useFakeTimers(); });

  it("elapsed time is more than set value for consecutive request", async() => {
    client.changeMessageInterval(20);

    await testClientResponse(message);

    jest.advanceTimersByTime(5000); // Advances to 5 secs.

    await testClientResponse(message, false, true);

    jest.advanceTimersByTime(15000); // Advances to 20 secs.

    /**
     * Response is circumvented as the elapsed time is less than the default
     * filter bypass interval of a channel.
     */
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
    const username = channel.substring(1);
    const responseState = new Response(null, username, message);
    response = await client.say(responseState, testMessageState);
    testMessageState.nextMessageState(message, Date.now());
  }
  catch (err) {
    if (rejection) {
      expect(err.name).toBe("messageIntervalError");
      return;
    }
  }

  expect(response).toHaveLength(2);
  const [returnedChannel, returnedMessage] = response;
  expect(returnedChannel).toBe(channel);
  expect(returnedMessage)
    .toBe(circumvented ? `${message} ${filterByPassChar}` : message);
}
