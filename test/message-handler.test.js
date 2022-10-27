require("dotenv").config();

const onMessageHandler = require("../common-pepper");

const entities = require("./context");
const { toBe } = require("./helper");


describe("Message handler should", () => {
  describe("be able to ", () => {
    it("respond if a prefixed messages is received", () => {
      const { context, self } = entities.user;
      const msg = `${process.env.PREFIX}ping`;
      const response = "R) 7";

      testFunctionCall(context, msg, self, "toBeCalled", response);
    });

    it("ignores messages with no prefix", () => {
      const { context, self } = entities.user;
      const msg = "testCmd test message from the user";

      testFunctionCall(context, msg, self, "notToBeCalled");
    });

    it("ignores unknown commands", () => {
      const { context, self } = entities.user;
      const msg = "someRandomCommand test message from the user";

      testFunctionCall(context, msg, self, "notToBeCalled");
    });

    test("replace multiple whitespaces with a single whitespace", () => {
      const { context, self } = entities.user;
      const response = `@${context["display-name"]}, enter a valid command.`;
      const expectedRequest = `${process.env.PREFIX}testCmd user test message`;
      let request = `${process.env.PREFIX}testCmd             `;
      request += "user             test message                     ";

      testFunctionCall(
        context, request, self, "toBeCalled", response, expectedRequest
      );
    });

    it("ignore messages from bot's own request", () => {
      const { context, self } = entities.bot;
      const msg = `${process.env.PREFIX}testCmd test message from the bot`;

      testFunctionCall(context, msg, self, "notToBeCalled");
    });
  });
});


/**
 * Check if the bot responds to user's request.
 * @param {import("tmi.js").ChatUserstate} context Metadata about the entity who
 * initiated the request.
 * @param {string} cmd User request.
 * @param {boolean} self Indicates if request was invoked by client instance.
 * @param {("toBeCalled" | "notToBeCalled")} type Expect `say` method belonging
 * to the client instance to be called or not.
 * @param {string} response Expected bot response.
 * @param {string} [request] Expected user request.
 */
function testFunctionCall(context, cmd, self, type, response, request = null) {
  const target = "#sven_snusberg";

  const client = toBe(target, response, request);
  const say = jest.spyOn(client, "say");

  onMessageHandler(client, target, context, cmd, self);

  if (type === "toBeCalled") expect(say).toBeCalled();
  if (type === "notToBeCalled") expect(say).not.toBeCalled();
}
