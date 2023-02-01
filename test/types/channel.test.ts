import Client from "../../types/client";
import Queue from "../../types/queue";
import {
  default as Channel, MessageState, responseManager
} from "../../types/channel";

import data from "./test-sets/channel";


jest.mock("../../types/queue");
const MockedQueue = Queue as jest.MockedClass<typeof Queue>;

jest.mock("../../types/client");

beforeEach(() => {
  Channel.clearChannels();
  MockedQueue.mockClear();
});


describe("when creating a channel", () => {
  const client = new Client({});

  test("does not accept invalid usernames", () => {
    data.invalidUsernames.forEach(invalidUsername => {
      expect(() => new Channel(client, invalidUsername)).toThrow(
        "Invalid username: '" + String(invalidUsername) + "'. " +
        "Channel's username should contain 4-25 characters which includes " +
        "alphanumerics and underscores only."
      );
    });
  });

  test("cannot create a channel that already exists", () => {
    const mockConnect = jest.spyOn(Client.prototype, "connect");
    const spitAddress = "irc-ws.chat.twitch.tv";
    const spitPort = 443;
    mockConnect.mockResolvedValue([spitAddress, spitPort]);

    const username = "test_user";
    new Channel(client, username);

    expect(() => new Channel(client, username))
      .toThrow(`'${username}' state already exists.`);
  });

  describe("lister initiates a connection to a channel", () => {
    const mockConnect = jest.spyOn(Client.prototype, "connect");

    beforeEach(() => mockConnect.mockClear());

    test("and is accepted", () => {
      const spitAddress = "irc-ws.chat.twitch.tv";
      const spitPort = 443;

      mockConnect.mockResolvedValue([spitAddress, spitPort]);

      const username = "test_user";
      new Channel(client, username);
      expect(mockConnect).toBeCalledTimes(1);
      expect(mockConnect.mock.results[0].value)
        .resolves.toStrictEqual([spitAddress, spitPort]);
    });

    test("but is rejected", () => {
      const rejectMessage = "connection rejected.";
      const mockConnect = jest.spyOn(Client.prototype, "connect");
      mockConnect.mockRejectedValue(rejectMessage);

      const username = "test_user";
      new Channel(client, username);
      expect(mockConnect).toBeCalledTimes(1);
      expect(mockConnect.mock.results[0].value)
        .rejects.toStrictEqual(rejectMessage);
    });
  });
});


describe("after a channel is created", () => {
  const client = new Client({});

  test("you can get the username of the channel", () => {
    const username = "test_user";
    const channel = new Channel(client, username);

    expect(channel.username).toBe(username);
  });

  test("the message state has proper default values", () => {
    const defaultMessageState: MessageState = {
      recentMessage: null,
      messageLastSent: null
    };

    const username = "test_user";
    const channel = new Channel(client, username);

    const messageState = channel.getMessageState();
    expect(messageState).toStrictEqual(defaultMessageState);
  });

  test("the message state can be changed", () => {
    const username = "test_user";
    const channel = new Channel(client, username);

    const firstRecentMessage = "test message 1";
    const firstMessageLastSent = Date.now();
    const firstMessageState: MessageState = {
      recentMessage: firstRecentMessage,
      messageLastSent: firstMessageLastSent
    };

    channel.nextMessageState(firstRecentMessage, firstMessageLastSent);
    const firstChannelMessageState = channel.getMessageState();
    expect(firstChannelMessageState).toStrictEqual(firstMessageState);

    const nextRecentMessage = "test message 2";
    const nextMessageLastSent = Date.now();
    const nextMessageState: MessageState = {
      recentMessage: nextRecentMessage,
      messageLastSent: nextMessageLastSent
    };

    channel.nextMessageState(nextRecentMessage, nextMessageLastSent);
    const nextChannelMessageState = channel.getMessageState();
    expect(nextChannelMessageState).toStrictEqual(nextMessageState);
  });

  test("response queue gets initalized", () => {
    const username = "test_user";
    const channel = new Channel(client, username);
    const queue = channel.getResponseQueue();
    expect(queue).toBe(MockedQueue.mock.instances[0]);
  });

  test("check to see if the listner exists", () => {
    const username = "test_user";
    const getChannelsSpy = jest.spyOn(Client.prototype, "getChannels");
    getChannelsSpy.mockReturnValue(["#" + username]);
    const channel = new Channel(client, username);

    expect(channel.checkListner()).toStrictEqual(true);
    getChannelsSpy.mockRestore();
  });

  test("access every tracked channels", () => {
    const usernames = [
      "justintv1", "justintv2", "justintv3", "justintv4", "justintv5"
    ];
    const channels: Array<Channel> = [];
    usernames.forEach(username => {
      channels.push(new Channel(client, username));
    });

    for (let i = 0; i < usernames.length; i++) {
      expect(Channel.getChannel(usernames[i])).toBe(channels[i]);
    }
  });

  test("throw an error is an untracked channels are accessed", () => {
    const trackedUsernames = [
      "justintv1", "justintv2", "justintv3", "justintv4", "justintv5"
    ];
    const untrackedUsernames = [
      "justintv6", "justintv7", "justintv8", "justintv9", "justintv10"
    ];

    const channels: Array<Channel> = [];
    trackedUsernames.forEach(username => {
      channels.push(new Channel(client, username));
    });

    for (let i = 0; i < untrackedUsernames.length; i++) {
      const username = untrackedUsernames[i];
      expect(() => Channel.getChannel(username))
        .toThrow(`The channel '${username}' has not been initialized.`);
    }
  });

  test("test existance of all tracked channels", () => {
    const trackedUsernames = [
      "justintv1", "justintv2", "justintv3", "justintv4", "justintv5"
    ];
    const untrackedUsernames = [
      "justintv6", "justintv7", "justintv8", "justintv9", "justintv10"
    ];

    const channels: Array<Channel> = [];
    trackedUsernames.forEach(username => {
      channels.push(new Channel(client, username));
    });

    for (let i = 0; i < trackedUsernames.length; i++) {
      const username = trackedUsernames[i];
      expect(Channel.checkChannel(username)).toBeTruthy();
    }
    for (let i = 0; i < untrackedUsernames.length; i++) {
      const username = untrackedUsernames[i];
      expect(Channel.checkChannel(username)).toBeFalsy();
    }
  });

  test("can remove every channel", () => {
    const usernames = [
      "justintv1", "justintv2", "justintv3", "justintv4", "justintv5"
    ];
    const channels: Array<Channel> = [];
    usernames.forEach(username => {
      channels.push(new Channel(client, username));
    });

    for (let i = 0; i < usernames.length; i++) {
      expect(Channel.checkChannel(usernames[i])).toBeTruthy();
      expect(Channel.getChannel(usernames[i])).toBe(channels[i]);
    }

    Channel.clearChannels();

    for (let i = 0; i < usernames.length; i++) {
      expect(Channel.checkChannel(usernames[i])).toBeFalsy();
      expect(() => Channel.getChannel(usernames[i]))
        .toThrow(`The channel '${usernames[i]}' has not been initialized.`);
    }
  });

  test("retrieve the response queue of a channel", () => {
    const username = "test_user123";
    new Channel(client, username);
    const initializedQueue = MockedQueue.mock.instances[0];
    const retrievedQueue = Channel.getResponseQueue(username);

    expect(retrievedQueue).toBe(initializedQueue);
  });

  test("assigned callbacks for before enqueue and after dequeue", () => {
    const mockBeforeEnqueue = jest.fn();
    const mockAfterDequeue = jest.fn();

    MockedQueue.prototype.beforeEnqueue = mockBeforeEnqueue;
    MockedQueue.prototype.afterDequeue = mockAfterDequeue;

    expect(mockBeforeEnqueue).not.toBeCalled();
    expect(mockAfterDequeue).not.toBeCalled();

    const username = "test_user123";
    new Channel(client, username);

    expect(mockBeforeEnqueue).toBeCalledTimes(1);
    expect(mockBeforeEnqueue).toBeCalledWith(expect.any(Function));

    expect(mockAfterDequeue).toBeCalledTimes(1);
    expect(mockAfterDequeue).toBeCalledWith(expect.any(Function));
  });
});


describe("the response queue manager is invoked", () => {
  const client = new Client({});

  const sendSpy = jest.spyOn(Client.prototype, "send");
  const isEmptySpy = jest.spyOn(MockedQueue.prototype, "isEmpty");
  const queueRetrieveSpy = jest.spyOn(MockedQueue.prototype, "retrieve");
  const dequeueSpy = jest.spyOn(MockedQueue.prototype, "dequeue");
  const checkListnerSpy = jest.spyOn(Channel.prototype, "checkListner");
  const getMessageStateSpy = jest.spyOn(Channel.prototype, "getMessageState");
  const loggerSpy = jest.spyOn(console, "info");

  beforeEach(() => {
    isEmptySpy.mockClear();
    queueRetrieveSpy.mockClear();
    dequeueSpy.mockClear();
    checkListnerSpy.mockClear();
    loggerSpy.mockClear();
    getMessageStateSpy.mockClear();
  });

  const target = "#justintv";
  const response = "test response";
  sendSpy.mockResolvedValue([target, response]);

  test("and the response is sent successfully", async() => {
    jest.useFakeTimers();

    const username = "test_user123";
    const channel = new Channel(client, username);
    const messageState = channel.getMessageState();
    getMessageStateSpy.mockClear();

    isEmptySpy.mockReturnValue(false);
    queueRetrieveSpy.mockReturnValue({ resendCount: 0, response });
    checkListnerSpy.mockReturnValueOnce(true);

    expect(sendSpy).not.toBeCalled();
    expect(getMessageStateSpy).not.toBeCalled();
    expect(queueRetrieveSpy).not.toBeCalled();
    expect(dequeueSpy).not.toBeCalled();
    expect(messageState.messageLastSent).toBe(null);
    expect(messageState.recentMessage).toBe(null);

    await responseManager(channel, client, 30, 3);

    const messageStateReturns = getMessageStateSpy.mock.results;
    const lastMessageState: MessageState =
      messageStateReturns[messageStateReturns.length - 1].value;
    expect(sendSpy).toBeCalled();
    expect(getMessageStateSpy).toBeCalledTimes(1);
    expect(loggerSpy).toBeCalledWith("\n* Details:", JSON.stringify(
      { target, response }
    ));
    expect(lastMessageState.recentMessage).toBe(response);
    expect(lastMessageState.messageLastSent).toBe(Date.now());
    expect(queueRetrieveSpy).toBeCalledTimes(1);
    expect(dequeueSpy).toBeCalledTimes(1);

    jest.useFakeTimers();
  });

  test("but throws an error if invoked while the queue is empty", () => {
    const username = "test_user123";
    const channel = new Channel(client, username);

    isEmptySpy.mockReturnValue(true);

    expect(() => responseManager(channel, client, 30, 3))
      .rejects.toThrow("Cannot handle responses from an empty queue.");
  });

  test("but the listner is not connected", () => {
    const username = "test_user123";
    const channel = new Channel(client, username);


    isEmptySpy.mockReturnValue(false);
    queueRetrieveSpy.mockReturnValue({ resendCount: 0 });
    checkListnerSpy.mockReturnValueOnce(false);

    expect(() => responseManager(channel, client, 30, 3))
      .rejects.toThrow(`Listner not connected to ${channel.username}`);
  });

  describe("the current response resend count > channel's resend limit", () => {
    test("response is discarded and next response is retrieved", async() => {
      const username = "test_user123";
      const resendCount = 5;
      const channel = new Channel(client, username, resendCount);

      queueRetrieveSpy
        .mockReturnValueOnce({ resendCount: resendCount + 1 })
        .mockReturnValueOnce({ resendCount: 0 });
      isEmptySpy.mockReturnValue(false);
      checkListnerSpy.mockReturnValueOnce(true);

      expect(queueRetrieveSpy).not.toBeCalled();
      expect(dequeueSpy).not.toBeCalled();

      await responseManager(channel, client, 30, resendCount);

      expect(queueRetrieveSpy).toBeCalledTimes(2);
      expect(dequeueSpy).toBeCalledTimes(2);
    });

    test("response is discarded but the response queue is empty", async() => {
      const username = "test_user123";
      const resendCount = 5;
      const channel = new Channel(client, username, resendCount);

      isEmptySpy
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);
      queueRetrieveSpy.mockReturnValue({ resendCount: resendCount + 1 });
      checkListnerSpy.mockReturnValueOnce(true);

      isEmptySpy.mockReturnValue(true);
      expect(queueRetrieveSpy).not.toBeCalled();
      expect(dequeueSpy).not.toBeCalled();

      await responseManager(channel, client, 30, resendCount);

      expect(queueRetrieveSpy).toBeCalledTimes(1);
      expect(dequeueSpy).toBeCalledTimes(1);
    });
  });
});


describe("the lister handler is invoked", () => {
  const client = new Client({});
  const request = "test request";
  const response = "test response";
  const target = "#test_user";

  const getResponseQueueSpy = jest.spyOn(Channel.prototype, "getResponseQueue");
  const isEmptySpy = jest.spyOn(MockedQueue.prototype, "isEmpty");
  const queueRetrieveSpy = jest.spyOn(MockedQueue.prototype, "retrieve");
  const loggerSpy = jest.spyOn(console, "info");
  const nextMessageStateSpy = jest.spyOn(Channel.prototype, "nextMessageState");

  afterEach(() => {
    getResponseQueueSpy.mockClear();
    isEmptySpy.mockClear();
    queueRetrieveSpy.mockClear();
    loggerSpy.mockClear();
    nextMessageStateSpy.mockClear();
  });

  test("current item in front of the queue is discarded", () => {
    jest.useFakeTimers();

    const message = "test response";
    const username = "test_user";
    const context = { ["display-name"]: process.env.USERNAME };

    new Channel(client, username);

    isEmptySpy.mockReturnValue(false);
    queueRetrieveSpy.mockReturnValue({ request, response, target });

    Channel.onListenHandler("#" + username, context, message);

    expect(loggerSpy).nthCalledWith(1, `\n* Executed "${request}" command`);
    expect(loggerSpy)
      .nthCalledWith(2, "* Details:", JSON.stringify({ target, response }));
    expect(nextMessageStateSpy).toHaveBeenCalledWith(response, Date.now());

    jest.useFakeTimers();
  });

  test("ignore any entity that is not the authorized bot", () => {
    const message = "test response";
    const username = "test_user";
    const context = { ["display-name"]: String(process.env.USERNAME) + "junk" };

    Channel.onListenHandler("#" + username, context, message);

    expect(getResponseQueueSpy).not.toBeCalled();
  });

  test("return if there is no response in the queue to be dequeued", () => {
    const message = "test response";
    const username = "test_user";
    const context = { ["display-name"]: process.env.USERNAME };

    isEmptySpy.mockReturnValue(true);

    new Channel(client, username);
    Channel.onListenHandler("#" + username, context, message);

    expect(getResponseQueueSpy).toBeCalled();
    expect(queueRetrieveSpy).not.toBeCalled();
  });

  test("unexpectedly response in the wrong channel", () => {
    const message = "test response";
    const username = "test_user123";
    const context = { ["display-name"]: process.env.USERNAME };

    isEmptySpy.mockReturnValue(false);
    queueRetrieveSpy.mockReturnValue({ request, response, target });

    new Channel(client, username);

    expect(() => Channel.onListenHandler("#" + username, context, message))
      .toThrow(`Response intended for ${target} was targeted to #` + username);
  });

  test("mismatch between listened response and response in queue front", () => {
    const message = "different response";
    const username = "test_user";
    const context = { ["display-name"]: process.env.USERNAME };

    isEmptySpy.mockReturnValue(false);
    queueRetrieveSpy.mockReturnValue({ request, response, target });

    new Channel(client, username);
    Channel.onListenHandler("#" + username, context, message);

    expect(queueRetrieveSpy).toBeCalled();
    expect(loggerSpy).not.toBeCalled();
  });
});

