const { configProps } = require("../common-pepper");
const entities = require("./context");
const { mimicMessageEventByBot, testFunctionCallStatus } = require("./helper");


describe("Message handler should", () => {
  beforeEach(() => {
    configProps.PREFIX = process.env.PREFIX;
    configProps.SEND_INTERVAL = process.env.SEND_INTERVAL || "30";
    configProps.SEND_INTERVAL = parseInt(configProps.SEND_INTERVAL);
    configProps.DUPMSG_CHAR = process.env.DUPMSG_CHAR;
    configProps.LAST_SENT = Date.now();
    configProps.DUPMSG_STATUS = null;
  });


  describe("be able to ", () => {
    it("respond if a prefixed messages is received", () => {
      const { context, self } = entities.user;
      const msg = `${configProps.PREFIX}testCmd test message from the user`;

      testFunctionCallStatus(context, msg, self, "toBeCalled");
    });

    it("ignores messages with no prefix", () => {
      const { context, self } = entities.user;
      const msg = "testCmd test message from the user";

      testFunctionCallStatus(context, msg, self, "notToBeCalled");
    });

    test("replace multiple whitespaces with a single whitespace", () => {
      const { context, self } = entities.user;
      const expectedMsg = `${configProps.PREFIX}testCmd test message from user`;
      let actualMessage = `${configProps.PREFIX}testCmd             `;
      actualMessage += "test         message from         user             ";

      testFunctionCallStatus(
        context, actualMessage, self, "toBeCalled", expectedMsg
      );
    });

    it("ignore messages from bot's own request", () => {
      const { context, self } = entities.bot;
      const msg = `${configProps.PREFIX}testCmd test message from the bot`;

      testFunctionCallStatus(context, msg, self, "notToBeCalled");
    });
  });


  describe("circumvent message duplication filter where,", () => {
    const user = entities.user;
    const msg = `${configProps.PREFIX}testCmd same message from the user`;
    const filterByPassChar = "\udb40\udc00";

    it("it responds to initial user request unaltered", () => {
      testFunctionCallStatus(user.context, msg, user.self, "toBeCalled");
    });


    it("it circumvents the next immediate user request", () => {
      // Set SEND_INTERVAL to 0; chat cooldown prevention interferes with test
      mimicMessageEventByBot(true);
      configProps.SEND_INTERVAL = 0;

      testFunctionCallStatus(
        user.context, msg, user.self, "toBeCalled", `${msg} ${filterByPassChar}`
      );
    });
  });


  describe("watch the set SEND_INTERVAL value and", () => {
    const user = entities.user;
    const msg = `${configProps.PREFIX}testCmd same message from the user`;

    const initialTimeElapsed = 5; // In sec
    const finalTimeElapsed = 15; // In sec

    beforeEach(() => configProps.SEND_INTERVAL = 20); // In sec
    jest.useFakeTimers();

    it("it should respond for every initial user request", () => {
      testFunctionCallStatus(user.context, msg, user.self, "toBeCalled");
    });

    jest.advanceTimersByTime(initialTimeElapsed * 1000);

    it("it should not respond if elapsed time is less than set value", () => {
      mimicMessageEventByBot();

      testFunctionCallStatus(user.context, msg, user.self, "notToBeCalled");
    });

    jest.advanceTimersByTime(finalTimeElapsed * 1000);

    it("it should respond if elapsed time is greater than set value", () => {
      testFunctionCallStatus(user.context, msg, user.self, "toBeCalled");
    });

    jest.useRealTimers();
  });
});
