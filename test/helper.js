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


module.exports = { toBe };
