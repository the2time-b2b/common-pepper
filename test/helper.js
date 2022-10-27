/**
 * Custom Jest matcher containing `expect`-`toBe` pairs to check if the bot
 * response in the specified target channel is what you expect.
 * @param {string} target Expected target channel in the format
 * `#<channel>`.
 * @param {string} response Expected bot response.
 * @param {string} [request] Expected bot request.
 */
function toBe(target, response, request) {
  return {
    /**
   * Override the client object's `say` method.
   * @param {import("../types/response")} responseState Current state of a
   * response.
   */
    say: (responseState) => {
      expect(responseState.target).toBe(target);
      if (response) expect(responseState.response).toBe(response);
      if (request) expect(responseState.request).toBe(request);
    }
  };
}


module.exports = { toBe };
