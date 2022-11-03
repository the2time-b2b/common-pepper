import * as logger from "../utils/logger";

import type Client from "../types/client";
import type { MessageState } from "../types/channel";
import type BotResponse from "../types/response";


/**
 * Bot response to a target channel.
 * @param client Bot's instance.
 * @param messageState Current state of the message of the target channel.
 * @param responseState Current state of a Response.
 */

export default async function sendResponse(
  client: Client, messageState: MessageState, responseState: BotResponse
): Promise<void> {
  try {
    const responseStatus = await client.send(responseState, messageState);

    if (process.env.NODE_ENV === "dev") {
      logger.info();
      if (responseState.request) {
        logger.info(`* Executed "${responseState.request}" command`);
      }

      logger.info("* Details:", JSON.stringify(
        { target: responseStatus[0], response: responseStatus[1] }
      ));

      messageState.nextMessageState(responseState.response, Date.now());
    }
  }
  catch (err: unknown) {
    if (!(err instanceof Error)) throw err;
    if (err.name !== "sendIntervalError") {
      console.error(err);
    }
  }
}
