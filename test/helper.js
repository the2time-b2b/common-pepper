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
   * @param {import("../types/response")} responseState Current state of a
   * response.
   */
    say: (responseState) => {
      expect(responseState.target).toBe(expectedTarget);
      expect(responseState.response).toBe(expectedResponse);
    }
  };
}


module.exports = { toBe };
