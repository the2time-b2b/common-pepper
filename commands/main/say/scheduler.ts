import {
  ToadScheduler,
  SimpleIntervalJob,
  Task as SchedulerTask
} from "toad-scheduler";
import Response from "./../../../types/response";
import Channel from "./../../../types/channel";
import Client from "./../../../types/client";

import { Task } from "./tasks";

import { opts } from "./../../../config";
import * as logger from "./../../../utils/logger";


class Scheduler {
  static #scheduler = new ToadScheduler();
  static #client = new Client(opts);


  /**
   * Initialize any saved tasks from the local JSON database.
   * @param tasks Tasks from the local JSON database that is to be initialized.
   */
  static async init(tasks: Array<ParsedTask>): Promise<void> {
    this.#client.on("connected", function(addr, port) {
      logger.info(`* Scheduler for 'say' command connected to ${addr}:${port}`);
    });
    this.#client.connect()
      .then(() => {
        tasks.forEach(task => Scheduler.addTask(task));
        Promise.resolve();
      })
      .catch(err => {
        console.error(err);
      });
  }


  /**
   * Add a task to the scheduler that needs to be activated in channel specified
   * by the task object.
   * @param task The task to be added.
   */
  static addTask(task: ParsedTask): void {
    const username = task.channel;
    const interval = task.interval;
    const message = task.message;

    let user;
    const isUserStateTracked = Channel.checkChannel(username);
    if (!isUserStateTracked) {
      try {
        user = new Channel(this.#client, username);
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
    else user = Channel.getChannel(username);

    const responseQueue = user.getResponseQueue();

    const toadTask = new SchedulerTask("Recurring Bot Response", () => {
      const request = "[scheduler -> command: say] Invoking task name: " +
        task.taskName;
      const response = new Response(request, username, message);
      responseQueue.enqueue(response);
    });

    const job = new SimpleIntervalJob(
      { seconds: interval },
      toadTask,
      task.taskName
    );

    Scheduler.#scheduler.addSimpleIntervalJob(job);
  }


  /**
   * Removes the task for the scheduler.
   * @param name The unique name of the task to be removed.
   */
  static removeTask(name: string): void {
    const status = Scheduler.#scheduler.removeById(name);
    if (!status) throw new Error(`Non-existant task ${name} cannot be removed`);
  }
}


export type ParsedTask = { "interval": number } & Omit<Task, "interval">;


export default Scheduler;
