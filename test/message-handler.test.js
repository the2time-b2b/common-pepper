const { configProps } = require("../common-pepper");
const entities = require("./context");
const { testFunctionCallStatus } = require("./helper");


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
});
