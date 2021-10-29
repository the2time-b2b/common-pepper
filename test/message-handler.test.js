const { onMessageHandler, configProps } = require("../common-pepper");
const entities = require("./context");


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
      const msg = `${configProps.PREFIX}command test message from the user`;
      const args = [context, msg, self];

      testFunctionCallStatus(msg, args, "toBeCalled");
    });

    it("ignores messages with no prefix", () => {
      const { context, self } = entities.user;
      const msg = "command test message from the user";
      const args = [context, msg, self];

      testFunctionCallStatus(msg, args, "notToBeCalled");
    });

    test("replace multiple whitespaces with a single whitespace", () => {
      const { context, self } = entities.user;
      const expectedMsg = `${configProps.PREFIX}command test message from user`;
      let actualMessage = `${configProps.PREFIX}command             `;
      actualMessage += "test         message from         user             ";
      const args = [context, actualMessage, self];

      testFunctionCallStatus(expectedMsg, args, "toBeCalled");
    });

    it("ignore messages from bot's own request", () => {
      const { context, self } = entities.bot;
      const msg = `${configProps.PREFIX}command test message from the bot`;
      const args = [context, msg, self];

      testFunctionCallStatus(msg, args, "notToBeCalled");
    });
  });


  describe("circumvent message duplication filter where,", () => {
    const user = entities.user;
    const msg = `${configProps.PREFIX}command same message from the user`;
    const filterByPassChar = "\udb40\udc00";
    const args = [user.context, msg, user.self];

    it("it responds to initial user request unaltered", () => {
      testFunctionCallStatus(msg, args, "toBeCalled");
    });


    it("it circumvents the next immediate user request", () => {
      // Set SEND_INTERVAL to 0; chat cooldown prevention interferes with test
      mimicMessageEventByBot(true);
      configProps.SEND_INTERVAL = 0;

      testFunctionCallStatus(`${msg} ${filterByPassChar}`, args, "toBeCalled");
    });
  });


  describe("watch the set SEND_INTERVAL value and", () => {
    const user = entities.user;
    const msg = `${configProps.PREFIX}command same message from the user`;
    const args = [user.context, msg, user.self];

    const initialTimeElapsed = 5; // In sec
    const finalTimeElapsed = 15; // In sec
    configProps.SEND_INTERVAL = 20; // In sec
    jest.useFakeTimers();

    it("it should respond for every initial user request", () => {
      testFunctionCallStatus(msg, args, "toBeCalled");
    });

    jest.advanceTimersByTime(initialTimeElapsed * 1000);

    it("it should not respond if elapsed time is less than set value", () => {
      mimicMessageEventByBot();

      testFunctionCallStatus(msg, args, "notToBeCalled");
    });

    jest.advanceTimersByTime(finalTimeElapsed * 1000);

    it("it should respond if elapsed time is greater than set value", () => {
      testFunctionCallStatus(msg, args, "toBeCalled");
    });

    jest.useRealTimers();
  });
});


function toBe(expectedTarget, expectedResponse) {
  return {
    say: (target, response) => {
      expect(target).toBe(expectedTarget);
      expect(response).toBe(expectedResponse);
    }
  };
}


function mimicMessageEventByBot(circumvented = false) {
  if (!circumvented) {
    configProps.DUPMSG_STATUS = "0";
  }
  else {
    configProps.DUPMSG_STATUS = "1";
  }
}


function testFunctionCallStatus(msg, args, type) {
  const target = "#sven_snusberg";

  const client = toBe(target, msg);
  const say = jest.spyOn(client, "say");

  onMessageHandler(client, target, ...args);

  if (type === "toBeCalled") expect(say).toBeCalled();
  if (type === "notToBeCalled") expect(say).not.toBeCalled();
}
