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
const infoLog = jest.spyOn(console, "info");

beforeEach(() => {
  client.SEND_INTERVAL = process.env.SEND_INTERVAL || "30";
  client.SEND_INTERVAL = parseInt(client.SEND_INTERVAL);
  client.DUPMSG_CHAR = process.env.DUPMSG_CHAR;

  Channel.clearChannels();
  jest.clearAllMocks();
});

describe("circumvent message duplication filter where,", () => {
  it("it circumvents the alternate user requests", () => {
    client.say(channel, message);
    expect(infoLog).toHaveBeenCalledWith({ channel, message });

    jest.clearAllMocks();
    // Set SEND_INTERVAL to 0; chat cooldown prevention interferes with test
    client.SEND_INTERVAL = 0;

    client.say(channel, message);
    expect(infoLog).toHaveBeenCalledWith({
      channel, message: `${message} ${filterByPassChar}`
    });
  });
});


describe("watch the set SEND_INTERVAL value and respond if", () => {
  beforeAll(() => jest.useFakeTimers());

  it("elapsed time is more than set value except for initial request", () => {
    // In seconds
    client.SEND_INTERVAL = 20;
    const initialTimeElapsed = 5;
    const finalTimeElapsed = 15;

    client.say(channel, message);
    expect(infoLog).toBeCalledWith({ channel, message });
    jest.clearAllMocks();

    jest.advanceTimersByTime(initialTimeElapsed * 1000); // Advances to 5 secs.

    client.say(channel, message);
    expect(infoLog).not.toBeCalled();
    jest.clearAllMocks();

    jest.advanceTimersByTime(finalTimeElapsed * 1000); // Advances to 20 secs.

    client.say(channel, message);
    expect(infoLog)
      .toBeCalledWith({ channel, message: `${message} ${filterByPassChar}` });
  });

  afterAll(() => jest.useRealTimers());
});
