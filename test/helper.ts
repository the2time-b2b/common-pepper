import Response from "../types/response";


/**
 * Custom Jest matcher containing `expect`-`toBe` pairs to check if the bot
 * response in the specified target channel is what you expect.
 * @param target Expected target channel in the format `#<channel>`.
 * @param response Expected bot response.
 * @param request Expected bot request.
 */
export function toBe(
  target: string, response: string | null, request: string | null
): object {
  return {
    /**
   * Override the client object's `say` method.
   * @param responseState Current state of a response.
   */
    say: (responseState: Response): void => {
      expect(responseState.target).toBe(target);
      expect(responseState.response).toBe(response);

      if (request) expect(responseState.request).toBe(request);
    }
  };
}
