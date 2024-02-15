import { ActionTypes, Actions, EchoArgs } from "../types";
import { isEchoable, EchoUpdatable } from "./validators";
import EchoTable from "./model";
import Channel from "../../../../../types/channel";
import Client from "../../../../../types/client";
import Response from "../../../../../types/response";
import { AtLeastOne } from "../../../../../utils/types";

import { opts } from "../../../../../config";
import { checkChannelName } from "../validator";
import { ProcessError } from "../../../../../utils/error";


/** Echos a message to a channel. */
export default class Echo<T extends keyof ActionTypes> extends Actions<T> {
  private static client = new Client(opts);
  private database = new EchoTable<T>(this);


  private retreive(id: number): EchoArgs {
    return this.database.retreive(id);
  }

  create(value: ActionTypes[T]): number {
    if (!isEchoable(value)) throw new Error();

    checkChannelForActions(value.channel);

    return this.database.create(value.channel, value.message);
  }

  /** Sends the message to a specified channel. */
  toExecute(id: number): () => void {
    const action = this.retreive(id);

    let user;
    const isUserStateTracked = Channel.checkChannel(action.channel);
    if (!isUserStateTracked) {
      try {
        user = new Channel(Echo.client, action.channel);
      }
      catch (err) {
        if (err instanceof Error) {
          if (err.message === "Listner is not defined.") {
            console.error(err);
            process.exit(1);
          }
          throw err;
        }

        console.error(new Error("Unexpected Error"));
        process.exit(1);
      }
    }
    else user = Channel.getChannel(action.channel);
    const username = user.username;
    const message = action.message;
    const responseQueue = user.getResponseQueue();
    // TODO: indicate which is the task currently being executed.
    const request = "[scheduler -> command: say] Invoking task name: ";
    return () => {
      const response = new Response(request, username, message);
      responseQueue.enqueue(response);
    };
  }

  delete(id: number): void {
    this.database.delete(id);
  }

  update(id: number, value: AtLeastOne<ActionTypes[T]>): void {
    if (!EchoUpdatable(value)) {
      throw new Error("Repeat trigger requires valid arguments.");
    }

    checkChannelForActions(value.channel);

    this.database.update(id, value);
  }
}




function checkChannelForActions(name: string): void {
  if (checkChannelName(name)) return;

  throw new ProcessError(
    "Invalid channel name.",
    { toUser: { status: true } }
  );
}


