const { onMessageHandler } = require("../common-pepper");
const entities = require("./context");
const { toBe } = require("./helper");


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

    it("ignores unknown commands", () => {
      const { context, self } = entities.user;
      const msg = "someRandomCommand test message from the user";

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


/**
 * Check if the bot responds to user's request.
 * @param {Object} context Metadata about the entity who initiated the request.
 * @param {string} cmd User request.
 * @param {boolean} self Indicates whether request is bot initiated.
 * @param {("toBeCalled" | "notToBeCalled")} type {typeValues} Expect `say`
 * method to be called or not.
 * @param {string} response Expected bot response.
 */
function testFunctionCallStatus(context, cmd, self, type, response = null) {
  const target = "#sven_snusberg";

  const client = toBe(target, (response ? response : cmd));
  const say = jest.spyOn(client, "say");

  onMessageHandler(client, target, context, cmd, self);

  if (type === "toBeCalled") expect(say).toBeCalled();
  if (type === "notToBeCalled") expect(say).not.toBeCalled();
}
