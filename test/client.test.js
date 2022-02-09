const {
  bypassDuplicateMessageFilter, configProps
} = require("../common-pepper");
const { mimicMessageEventByBot } = require("./helper");


// Dummy options
const opts = {
  identity: {
    username: "",
    password: ""
  },
  channels: []
};
const client = new bypassDuplicateMessageFilter(opts);
const message = `${configProps.PREFIX}testCmd same message from the user`;
const channel = "#sven_snusberg";
const filterByPassChar = "\udb40\udc00";
const infoLog = jest.spyOn(console, "info");

beforeEach(() => {
  configProps.PREFIX = process.env.PREFIX;
  configProps.SEND_INTERVAL = process.env.SEND_INTERVAL || "30";
  configProps.SEND_INTERVAL = parseInt(configProps.SEND_INTERVAL);
  configProps.DUPMSG_CHAR = process.env.DUPMSG_CHAR;
  configProps.LAST_SENT = Date.now();
  configProps.DUPMSG_STATUS = null;

  jest.clearAllMocks();
});

describe("circumvent message duplication filter where,", () => {
  it("it responds to initial user request unaltered", () => {
    client.say(channel, message);
    expect(infoLog).toHaveBeenCalledWith({ channel, message });
  });

  it("it circumvents the next immediate user request", () => {
    // Set SEND_INTERVAL to 0; chat cooldown prevention interferes with test
    mimicMessageEventByBot(true);
    configProps.SEND_INTERVAL = 0;

    client.say(channel, message);
    expect(infoLog).toHaveBeenCalledWith({
      channel, message: `${message} ${filterByPassChar}`
    });
  });
});


describe("watch the set SEND_INTERVAL value and respond if", () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  it("elapsed time is more than set value except for initial request", () => {
    // In seconds
    configProps.SEND_INTERVAL = 20;
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
});
