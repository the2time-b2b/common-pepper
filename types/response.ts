/**
 * A response state for a particular user request on a target channel.
 */
export default class BotResponse {
  /** Raw request send by the user. */
  #request: string;

  /** Channel where the request was invoked. */
  #target: string;

  /** Bot response for the user request. */
  #response: string;

  /** Indicate whether the response is duplicate of the one previously sent. */
  #isDuplicate = false;

  /** Number of times the response has been resent. */
  resendCount = 0;


  /**
   * @param request - Raw request send by the user.
   * @param target - Channel where the request was invoked.
   * @param response - Bot response for the user request.
   */
  constructor(request: string, target: string, response: string) {
    const paramTypes = [typeof request, typeof target, typeof response];
    paramTypes.forEach(paramType => {
      if (paramType === "string") return;
      if (request === null) return; // Cases where no explicit user requests.

      const typeError = new TypeError("Supplied parameter must be a string.");
      if (process.env.NODE_ENV === "test") console.error(typeError);
      throw typeError;
    });

    this.#request = request;
    this.#target = target;
    this.#response = response;
  }


  /**
   * Raw request send by the user.
   * @readonly
   */
  get request(): string { return this.#request; }

  /**
   * Channel where the request was invoked.
   * @readonly
   */
  get target(): string { return `#${this.#target}`; }

  /**
   * Channel where the request was invoked.
   * @readonly
   */
  get response(): string {
    if (!this.#isDuplicate) return this.#response;

    const dupMsgChar = process.env.DUPMSG_CHAR;
    if (!dupMsgChar) {
      throw new Error("Environment variable 'DUPMSG_CHAR' is not set.");
    }

    const bypassChar = ` ${String.fromCodePoint(...JSON.parse(dupMsgChar))}`;
    return this.#response + bypassChar;
  }


  /**
   * Control when message duplication filter should be bypassed.
   * @param isActive Indicate whether the current response should bypass the
   * message duplication filter.
   */
  activateDuplicationFilterByass(isActive: boolean): void {
    if (isActive) {
      if (!this.#isDuplicate) this.#isDuplicate = !this.#isDuplicate;
    }
    else {
      if (this.#isDuplicate) this.#isDuplicate = !this.#isDuplicate;
    }
  }
}
