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
    const messageBypassCharCodes: unknown = JSON.parse(dupMsgChar);
    if (!(messageBypassCharCodes instanceof Array)) {
      throw new Error("Duplicate message character source has an invalid form");
    }

    const validCharacter = ((lol: unknown[]): lol is Array<number> => {
      lol.forEach((ele) => {
        if (typeof ele !== "number" || isNaN(ele)) return false;
        return true;
      });
      return true;
    })(messageBypassCharCodes);

    if (!validCharacter)
      throw new Error("Duplicate message character code malformed");

    const bypassChar = ` ${String.fromCodePoint(...messageBypassCharCodes)}`;
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
