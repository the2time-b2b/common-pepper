class Response {
  #request = null;
  #target = null;
  #response = null;


  /**
   * A response state for a particular user request on a target channel.
   * @param {string} request - Raw request send by the user.
   * @param {string} target - Channel where the request was invoked.
   * @param {string} response - Bot response for the user request.
   */
  constructor(request, target, response) {
    this.#request = request;
    this.#target = target;
    this.#response = response;
  }



  /**
   * @typedef {Object} ResponseItem - Response state corresponding to a
   * particular request made by the a user.
   * @property {string} request - Raw request send by the user.
   * @property {string} target - Channel where the request was invoked.
   * @property {string} response - Bot response for the user request.
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
      response: this.#response
    };
  }
}


module.exports = Response;
