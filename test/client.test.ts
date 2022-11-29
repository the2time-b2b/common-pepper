import Client from "../types/client";
import Response from "../types/response";
import { MessageState } from "../types/channel";


const client = new Client({}); // Dummy options
const testMessageState: MessageState = {
  messageLastSent: null,
  recentMessage: null
};

beforeEach(() => {
  client.changeMessageInterval(0); // Preset interval interferes with test.
  testMessageState.messageLastSent = null;
  testMessageState.recentMessage = null;
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
 * @param message - A response message.
 * @param circumvented - Expect a duplication filter circumvented
 * response.
 * @param rejection - Test for promise rejections.
 */
async function testClientResponse(
  message: string, circumvented = false, rejection = false
): Promise<void> {
  const channel = "#sven_snusberg";
  const filterByPassChar = "\udb40\udc00";

  let response: Array<string> = [];
  try {
    const username = channel.substring(1);
    const responseState = new Response("", username, message);
    response = await client.send(responseState, testMessageState, 30);
    testMessageState.recentMessage = message;
    testMessageState.messageLastSent = Date.now();
  }
  catch (err: unknown) {
    if (rejection) {
      if (!(err instanceof Error)) throw err;
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
