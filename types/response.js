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
  #response = null;

  /**
   * Indicate whether the current response to be sent is duplicate of the
   * response that was previously sent.
   * @type {boolean}
   */
  #isDuplicate = false;

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

    this.#response = response;
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

  /**
   * Channel where the request was invoked.
   * @readonly
   */
  get response() {
    if (!this.#isDuplicate) return this.#response;

    const dupMsgChar = process.env.DUPMSG_CHAR;
    const bypassChar = ` ${String.fromCodePoint(...JSON.parse(dupMsgChar))}`;
    return this.#response + bypassChar;
  }

  activateDuplicationFilterByass(isActive) {
    if (isActive) {
      if (!this.#isDuplicate) this.#isDuplicate = !this.#isDuplicate;
    }
    else {
      if (this.#isDuplicate) this.#isDuplicate = !this.#isDuplicate;
    }
  }
}


module.exports = Response;
