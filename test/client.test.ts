import Client from "../types/client";
import Response from "../types/response";
import { MessageState } from "../types/channel";


// Method say always to return Promise<string[]> instead of Promise<[string]>.
const mockSay = jest.fn();
mockSay.mockImplementation(
  (channel: string, message: string): Promise<string[]> => {
    return new Promise((resolve) => {
      resolve([channel, message]);
    });
  });
Client.prototype.say = mockSay;


beforeEach(() => { jest.clearAllMocks(); });


describe("messge interval", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    messageState.recentMessage = null;
    messageState.messageLastSent = null;
  });

  const request = "test request";
  const target = "#test_target";
  const response = "test response";

  const responseState = new Response(request, target.substring(1), response);
  const messageState: MessageState = {
    messageLastSent: null,
    recentMessage: null
  };

  test("is not a number, then error is thrown", () => {
    process.env.MESSAGE_INTERVAL = "ten";
    expect(() => new Client({}))
      .toThrow("Environment variable 'MESSAGE_INTERVAL' not a number");
  });

  test("defaults to 30 seconds", async() => {
    process.env.MESSAGE_INTERVAL = "";
    const client = new Client({});

    client.send(responseState, messageState, 0);
    messageState.messageLastSent = Date.now();
    expect(mockSay).toBeCalledTimes(1);

    expect(() => client.send(responseState, messageState, 0))
      .rejects.toThrow("Message is being sent too quickly.");
    expect(mockSay).toBeCalledTimes(1);


    jest.advanceTimersByTime(30000); // Advances to 30 secs.
    client.send(responseState, messageState, 0);
    expect(mockSay).toBeCalledTimes(2);
  });

  test("can be changed using changeMessageInterval function", async() => {
    const client = new Client({});

    const bypassInterval = 0;
    const messageInterval = 0;

    expect(mockSay).not.toBeCalled();

    client.changeMessageInterval(messageInterval);
    client.send(responseState, messageState, bypassInterval);
    messageState.messageLastSent = Date.now();
    expect(mockSay).toBeCalledTimes(1);

    client.changeMessageInterval(10);

    expect(() => client.send(responseState, messageState, bypassInterval))
      .rejects.toThrow("Message is being sent too quickly.");
    expect(mockSay).toBeCalledTimes(1);

    jest.advanceTimersByTime(10000);

    client.send(responseState, messageState, bypassInterval);
    messageState.messageLastSent = Date.now();
    expect(mockSay).toBeCalledTimes(2);

    client.changeMessageInterval(20);

    expect(() => client.send(responseState, messageState, bypassInterval))
      .rejects.toThrow("Message is being sent too quickly.");
    expect(mockSay).toBeCalledTimes(2);

    jest.advanceTimersByTime(10000);

    expect(() => client.send(responseState, messageState, bypassInterval))
      .rejects.toThrow("Message is being sent too quickly.");
    expect(mockSay).toBeCalledTimes(2);

    jest.advanceTimersByTime(10000);

    client.send(responseState, messageState, bypassInterval);
    messageState.messageLastSent = Date.now();
    expect(mockSay).toBeCalledTimes(3);
  });

  afterAll(() => jest.useRealTimers());
});


describe("when a response is sent", () => {
  beforeEach(() => {
    messageState.recentMessage = null;
    messageState.messageLastSent = null;

    responseState = new Response(request, target.substring(1), response);
  });

  const client = new Client({});

  const request = "test request";
  const target = "#test_target";
  const response = "test response";
  let responseState = new Response(request, target.substring(1), response);

  const messageState: MessageState = {
    messageLastSent: null,
    recentMessage: null
  };


  test("method say is invoked", async() => {
    client.changeMessageInterval(0);

    const bypassInterval = 0;

    client.send(responseState, messageState, bypassInterval);
    expect(mockSay).toBeCalled();
    expect(mockSay).toBeCalledTimes(1);
  });

  test("response's resend count increments by 1", () => {
    client.changeMessageInterval(0);

    const bypassInterval = 0;

    expect(responseState.resendCount).toBe(0);

    client.send(responseState, messageState, bypassInterval);
    expect(mockSay).toBeCalledTimes(1);
    expect(responseState.resendCount).toBe(1);
    messageState.messageLastSent = Date.now();

    client.send(responseState, messageState, bypassInterval);
    expect(mockSay).toBeCalledTimes(2);
    expect(responseState.resendCount).toBe(2);
    messageState.messageLastSent = Date.now();

    // Checking for proper functionality when manually incremented.
    responseState.resendCount++;

    client.send(responseState, messageState, bypassInterval);
    expect(mockSay).toBeCalledTimes(3);
    expect(responseState.resendCount).toBe(4);
    messageState.messageLastSent = Date.now();
  });

  describe("for two consecutive responses with the same respone", () => {
    test("circumvent filter if time elapsed <= bypass interval", async() => {
      client.changeMessageInterval(0);

      const filterByPassChar = "\udb40\udc00";
      const bypassInterval = 30;

      let result;
      let sayCalls = 0;

      result = await client
        .send(responseState, messageState, bypassInterval);
      messageState.recentMessage = response;
      messageState.messageLastSent = Date.now();
      testResponse(result, ++sayCalls, target, response);

      result = await client.send(responseState, messageState, bypassInterval);
      testResponse(
        result,
        ++sayCalls,
        target,
        `${response} ${filterByPassChar}`
      );
    });
  });

  describe("do not circumvent filter when the bot sends", () => {
    client.changeMessageInterval(0);

    const differentResponse = "some other response";
    const bypassInterval = 30;

    it("different response when elapsed time <= bypass interval", async() => {
      let result;
      let sayCalls = 0;

      result = await client.send(responseState, messageState, bypassInterval);
      messageState.recentMessage = response;
      messageState.messageLastSent = Date.now();
      testResponse(result, ++sayCalls, target, response);

      const differentResponseState =
        new Response(request, target.substring(1), differentResponse);
      result = await client
        .send(differentResponseState, messageState, bypassInterval);
      testResponse(result, ++sayCalls, target, differentResponse);
    });

    it("same response after elapsed time > bypass interval", async() => {
      jest.useFakeTimers();

      let result;
      let sayCalls = 0;

      result = await client.send(responseState, messageState, bypassInterval);
      messageState.recentMessage = response;
      messageState.messageLastSent = Date.now();
      testResponse(result, ++sayCalls, target, response);

      jest.advanceTimersByTime(31000); // Advances to 30 secs.

      const differentResponseState =
        new Response(request, target.substring(1), response);
      result = await client
        .send(differentResponseState, messageState, bypassInterval);
      testResponse(result, ++sayCalls, target, response);

      jest.useRealTimers();
    });
  });
});


function testResponse(
  response: Array<string>,
  sayCalls: number,
  expectedTarget: string,
  expectedResponse: string
): void {
  expect(response).toHaveLength(2);
  expect(mockSay).toBeCalledTimes(sayCalls);
  expect(response[0]).toBe(expectedTarget);
  expect(response[1]).toBe(expectedResponse);
}
