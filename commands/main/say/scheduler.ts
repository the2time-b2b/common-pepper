import { ToadScheduler, SimpleIntervalJob, Task } from "toad-scheduler";
import Response from "./../../../types/response";
import Channel from "./../../../types/channel";
import Client from "./../../../types/client";

import { DBTask } from "./tasks";

import { opts } from "./../../../config";
import * as logger from "./../../../utils/logger";


class Scheduler {
  static #scheduler = new ToadScheduler();
  static #client = new Client(opts);


  /**
   * Initialize any saved tasks from the local JSON database.
   * @param tasks Tasks from the local JSON database that is to be initialized.
   */
  static init(tasks: ParsedTasks): void {
    if (process.env.NODE_ENV === "test") return;

    this.#client.on("connected", function(addr, port) {
      logger.info(`* Scheduler for 'say' command connected to ${addr}:${port}`);
    });
    this.#client.connect()
      .then(() => {
        for (const taskName in tasks) {
          const task = tasks[taskName];
          Scheduler.addTask(task, taskName);
        }
      })
      .catch(err => { throw new Error(err); });
  }


  /**
   * Add a task to the scheduler that needs to be activated in channel specified
   * by the task object.
   * @param task The task to be added.
   * @param name Unique name for the task.
   */
  static addTask(task: ParsedTask, name: string): void {
    if (process.env.NODE_ENV === "test") return;

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

    const toadTask = new Task("Recurring Bot Response", () => {
      const request = "[scheduler -> command: say] Invoking task name: " + name;
      const response = new Response(request, username, message);
      responseQueue.enqueue(response);
    });

    const job = new SimpleIntervalJob({ seconds: interval }, toadTask, name);
    Scheduler.#scheduler.addSimpleIntervalJob(job);
  }


  /**
   * Removes the task for the scheduler.
   * @param name The unique name of the task to be removed.
   */
  static removeTask(name: string): void {
    if (process.env.NODE_ENV === "test") return;

    const status = Scheduler.#scheduler.removeById(name);
    if (!status) throw new Error(`Non-existant task ${name} cannot be removed`);
  }
}


export type ParsedTask = { "interval": number } & Omit<DBTask, "interval">;


export type ParsedTasks = Record<string, ParsedTask>;


export default Scheduler;
