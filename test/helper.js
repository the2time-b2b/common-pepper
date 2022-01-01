const { onMessageHandler, configProps } = require("../common-pepper");


/**
 * Custom Jest matcher containing `expect`-`toBe` pairs to check if the bot
 * response in the specified target channel is what you expect.
 * @param {string} expectedTarget Expected target channel in the format
 * `#<channel>`.
 * @param {string} expectedResponse Expected bot response.
 */
function toBe(expectedTarget, expectedResponse) {
  return {
    /**
   * Override the client object's `say` method.
   * @param {string} target Target channel in the format `#<channel>`.
   * @param {string} response Bot response.
   */
    say: (target, response) => {
      expect(target).toBe(expectedTarget);
      expect(response).toBe(expectedResponse);
    }
  };
}


/**
* Mimic an 'on message' event triggered by the bot itself to change the state of
* DUPMSG_STATUS from null to either '0' or '1'.
* @param {boolean} [circumvented=false] Response circumvents message duplication
* filter.
*/
function mimicMessageEventByBot(circumvented = false) {
  if (!circumvented) {
    configProps.DUPMSG_STATUS = "0";
  }
  else {
    configProps.DUPMSG_STATUS = "1";
  }
}


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


module.exports = {
  toBe,
  mimicMessageEventByBot,
  testFunctionCallStatus
};
