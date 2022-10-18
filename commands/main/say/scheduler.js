const { ToadScheduler, SimpleIntervalJob, Task } = require("toad-scheduler");
const Response = require("./../../../types/response");
const { Channel } = require("./../../../types/channel");
const Client = require("./../../../types/client");

const { opts } = require("./../../../config");
const logger = require("./../../../utils/logger");


const client = new Client(opts);
client.on("connected", function(addr, port) {
  logger.info(`* Scheduler for 'say' command connected to ${addr}:${port}`);
});
if (process.env.NODE_ENV !== "test") client.connect();


class Scheduler {
  static #scheduler = new ToadScheduler();


  /**
   * Initialize any saved tasks from the local JSON database when the program is
   * started or restarted.
   * @param {import("./typedefs").DBTasks} tasks Tasks from the local JSON
   * database that is to be initialized.
   */
  static init(tasks) {
    if (process.env.NODE_ENV === "test") return;

    for (const taskName in tasks) {
      const task = tasks[taskName];
      Scheduler.addTask(task, taskName);
    }
  }


  /**
   * Add a task to the scheduler that needs to be activated in channel specified
   * by the task object.
   * @param {import("./typedefs").DBTask} task The task to be added.
   * @param {string} name Unique name for the task.
   */
  static addTask(task, name) {
    if (process.env.NODE_ENV === "test") return;

    const username = task.channel;
    const interval = task.totalWaitInterval;
    const message = task.taskMessage;

    let user;
    const isUserStateTracked = Channel.checkChannel(username);
    if (!isUserStateTracked) user = new Channel(client, username);
    else user = Channel.getChannel(username);

    const responseQueue = user.getResponseQueue();

    const toadTask = new Task("Recurring Bot Response", () => {
      const request = "[scheduler -> command: say] Invoking task name: " + name;
      const response = new Response(request, username, message);
      responseQueue.enquqe(response);
    });

    const job = new SimpleIntervalJob({ seconds: interval }, toadTask, name);
    Scheduler.#scheduler.addSimpleIntervalJob(job);
  }


  /**
   * Removes the task for the scheduler.
   * @param {string} name The unique name of the task to be removed.
   */
  static removeTask(name) {
    if (process.env.NODE_ENV === "test") return;

    Scheduler.#scheduler.removeById(name);
  }
}


module.exports = Scheduler;
