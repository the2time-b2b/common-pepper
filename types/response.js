/**
 * A response state for a particular user request on a target channel.
 * @class
 * @constructor
 */
class Response {
  /**
   * Raw request send by the user.
   * @type {string}
   */
  #request = null;

  /**
   * Channel where the request was invoked.
   * @type {string}
   */
  #target = null;


  /**
   * Bot response for the user request.
   * @type {string}
   * @public
   */
  response = null;

  /**
   * Number of times the response has been resent.
   * @public
   * @type {number}
   */
  resendCount = 0;


  /**
   * @param {string} request - Raw request send by the user.
   * @param {string} target - Channel where the request was invoked.
   * @param {string} response - Bot response for the user request.
   */
  constructor(request, target, response) {
    this.#request = request;
    this.#target = target;

    this.response = response;
  }


  /**
   * Raw request send by the user.
   * @readonly
   */
  get request() {
    return this.#request;
  }

  /**
   * Channel where the request was invoked.
   * @readonly
   */
  get target() {
    return this.#target;
  }
}


module.exports = Response;
