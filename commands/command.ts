import type { ChatUserstate } from "tmi.js";


export default interface Command {
  /**
   * Main command execution function
   * @param context Meta data of the user who invoked the command.
   * @param request User request that contains attributable information on how
   * the bot response is to be invoked.
   * @returns {string} Status of the executed command to be sent back to the
   * user who invoked it.
   */
  exec(context: ChatUserstate, request: Array<string>): string;
}
