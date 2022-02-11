const entities = require("./context");
const { testFunctionCallStatus } = require("./helper");


describe("Message handler should", () => {
  describe("be able to ", () => {
    it("respond if a prefixed messages is received", () => {
      const { context, self } = entities.user;
      const msg = `${process.env.PREFIX}testCmd test message from the user`;

      testFunctionCallStatus(context, msg, self, "toBeCalled");
    });

    it("ignores messages with no prefix", () => {
      const { context, self } = entities.user;
      const msg = "testCmd test message from the user";

      testFunctionCallStatus(context, msg, self, "notToBeCalled");
    });

    test("replace multiple whitespaces with a single whitespace", () => {
      const { context, self } = entities.user;
      const expectedMsg = `${process.env.PREFIX}testCmd test message from user`;
      let actualMessage = `${process.env.PREFIX}testCmd             `;
      actualMessage += "test         message from         user             ";

      testFunctionCallStatus(
        context, actualMessage, self, "toBeCalled", expectedMsg
      );
    });

    it("ignore messages from bot's own request", () => {
      const { context, self } = entities.bot;
      const msg = `${process.env.PREFIX}testCmd test message from the bot`;

      testFunctionCallStatus(context, msg, self, "notToBeCalled");
    });
  });
});
