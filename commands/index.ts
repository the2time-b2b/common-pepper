import type { ChatUserstate } from "tmi.js";

import * as commandList from "./helper";
import Command from "./command";


/**
 * Execute a command requested by the end user.
 * @param channel The channel where the command was invoked.
 * @param context Meta data of the user who invoked the command.
 * @param request An array of split user command request for further processing.
 * @returns Status of the command.
 */
function execute(
  context: ChatUserstate,
  request: Array<string>,
  channel?: string
): string {
  if (!process.env.PREFIX) {
    throw new Error("Environment variable 'PREFIX' is not set.");
  }
  const prefixLength = process.env.PREFIX.length;
  const requestedCommand = request[0].substring(prefixLength);

  interface ICommandList {
    /** Every key corresponds to a defined command. */
    [commandName: string]: Command
  }

  // Note: The name of the every key in 'commandList' object is lost.
  const commands: ICommandList = commandList;

  if (Object.keys(commandList).includes(requestedCommand)) {
    const command = commands[requestedCommand];

    return command.exec(context, request.splice(1), channel);
  }


  if (!context["display-name"]) {
    throw new Error("display-name is not supplied");
  }

  return `@${context["display-name"]}, enter a valid command.`;
}


export default execute;
