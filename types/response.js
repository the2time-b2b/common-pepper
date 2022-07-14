class Response {
  #request = null;
  #target = null;
  #commandResponse = null;


  /**
   * A response state for a particular user request on a target channel.
   * @param {string} request - Raw request send by the user.
   * @param {string} target - Channel where the request was invoked.
   * @param {string} commandResponse - Bot response for the user request.
   */
  constructor(request, target, commandResponse) {
    this.#request = request;
    this.#target = target;
    this.#commandResponse = commandResponse;
  }



  /**
   * @typedef {Object} ResponseItem - Response state corresponding to a
   * particular request made by the a user.
   * @property {string} request - Raw request send by the user.
   * @property {string} target - Channel where the request was invoked.
   * @property {string} commandResponse - Bot response for the user request.
   */

  /**
   * Returns a response state corresponding to a particular request made by the
   * a user.
   * @returns {ResponseItem}
   */
  getResponseState() {
    return {
      request: this.#request,
      target: this.#target,
      commandResponse: this.#commandResponse
    };
  }
}


module.exports = Response;
