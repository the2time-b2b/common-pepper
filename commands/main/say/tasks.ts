import fs from "fs";
import { default as Scheduler, ParsedTask } from "./scheduler";

import path from "path";
import { CommandAttributes, TaskAttribute } from "./types";

import * as logger from "../../../utils/logger";


/**
 * A singleton which handles a list of tasks in accordance to the schema of the
 * local JSON database and reflects the same on the task scheduler.
 */
class Tasks {
  static #databasePath = path.join(
    __dirname,
    `tasks-db${(process.env.NODE_ENV !== "test" ? "" : ".test")}.json`
  );


  static get databasePath(): string { return this.#databasePath; }


  /** Creates a new local database. */
  static #createJSONDatabase(): void {
    fs.writeFileSync(Tasks.#databasePath, JSON.stringify([{}], null, 4));
  }


  /** Checks if the local database exists. */
  static #checkJSONDatabase(): void {
    if (!fs.existsSync(Tasks.#databasePath)) {
      const error = new Error();
      error.message = "The local database doesn't exist or has been deleted: ";
      error.message += Tasks.#databasePath;

      throw error;
    }
  }


  /**
   * Stores a list of tasks in a JSON format on a local JSON database.
   * @param dbTasks Local JSON database compatible list of tasks.
   */
  static #storeTask(dbTasks: [DBTasks]): void {
    Tasks.#checkJSONDatabase();
    fs.writeFileSync(Tasks.#databasePath, JSON.stringify(dbTasks, null, 4));
  }


  /** Initialize pre-exisiting task saved in the local JSON database. */
  static init(): void {
    try {
      if (!fs.existsSync(Tasks.#databasePath)) Tasks.#createJSONDatabase();

      const tasks = Tasks.retrieveTasks();
      const taskNames = Object.keys(tasks);
      const taskList = Object.values(tasks);

      const parsedTasks = [];
      for (let i = 0; i < taskNames.length; i++) {
        const task = taskList[i];
        const parsedTask = {
          ...task,
          "interval": Number(task.interval),
          taskName: taskNames[i]
        };
        parsedTasks.push(parsedTask);
      }

      Scheduler.init(parsedTasks);
    }
    catch (err) { console.error(err); }
  }


  /**
   * Retrieves parsed list of tasks from the local JSON database.
   * @returns List of database object in which the key of each task corresponds
   * to its task name.
   */
  static retrieveTasks(): DBTasks {
    Tasks.#checkJSONDatabase();

    const db = fs.readFileSync(Tasks.#databasePath);

    const JSONfile = JSON.parse(db.toString());
    const isValidJSON = Tasks.validateJSON(JSONfile);
    if (!isValidJSON) {
      const properJSONStructure = `
      A valid JSON structure should be of the format:
      \n[\n\t{\n\t\t"<task name>": {
      \n\t\t\t"${CommandAttributes.interval}": <total_time_in_seconds>,
      \n\t\t\t"${CommandAttributes.channel}": "<channel_name>",
      \n\t\t\t"${CommandAttributes.message}": "<message>"
      \n\t\t}\n\t\t"<another task name>": {\n\t\t\t...\n\t\t}...\n\t}\n]`;
      logger.info(properJSONStructure);

      const error = new Error();
      error.message = "Invalid Task List. Clear the task list using ";
      error.message += `'${process.env.PREFIX} clear task list'.`;
      error.message += " Advanced: Either delete or manually format local DB.";

      throw error;
    }

    const [taskObject] = JSONfile;
    return taskObject;
  }


  /**
   * Create a new task.
   * @param task Task containing information on how bot response is invoked.
   */
  static createTask(task: Task): string {
    const tasks = Tasks.retrieveTasks();

    if (tasks[task.taskName])
      return `Task '${task.taskName}' already exists.`;

    const validTask = getDBTask(task);

    tasks[task.taskName] = validTask;
    Tasks.#storeTask([tasks]);

    const parsedTask: ParsedTask = {
      ...task, "interval": Number(task.interval)
    };
    Scheduler.addTask(parsedTask);

    return `Task ${task.taskName} activated on channel ${task.channel}.`;
  }


  /**
   * Updates an existing task from the task list.
   * @param taskName The name of the task that needs to be updated.
   * @param task The new modified version of the task that is to be replaced
   * with old task.
   * @returns Status of the task update.
   */
  static updateTask(taskName: string, task: Partial<Task>): string {
    if (Object.keys(task).length === 0)
      throw new Error("Specify an attribute to be modified.");

    const tasks = Tasks.retrieveTasks();

    if (!tasks[taskName]) {
      return `The task '${taskName}' does not exists.`;
    }

    const oldTask = tasks[taskName];

    const toModify: Partial<DBTask> = {};
    if (task.interval) toModify.interval = task.interval;
    if (task.channel) toModify.channel = task.channel;
    if (task.message) toModify.message = task.message;

    const modifiedTask = { ...oldTask, ...toModify };

    let modifiedTaskName = task.taskName;
    if (!modifiedTaskName) {
      modifiedTaskName = taskName;
    }
    else delete tasks[taskName]; // Deletes old task name

    Scheduler.removeTask(taskName);

    tasks[modifiedTaskName] = modifiedTask;
    Tasks.#storeTask([tasks]);

    const parsedTask: ParsedTask = {
      ...modifiedTask,
      "interval": Number(modifiedTask.interval),
      taskName: modifiedTaskName
    };
    Scheduler.addTask(parsedTask);

    return `Task ${taskName} successfully modified.`;
  }


  /**
   * Deletes a task from the task list.
   * @param taskName The name of the task that is to be deleted.
   */
  static deleteTask(taskName: string): string {
    const tasks = Tasks.retrieveTasks();

    if (!tasks[taskName]) {
      return `The task '${taskName}' does not exists.`;
    }

    delete tasks[taskName];

    Tasks.#storeTask([tasks]);

    Scheduler.removeTask(taskName);

    return `Task ${taskName} successfully removed.`;
  }


  /** Clears the task list. */
  static clearTasks(): void {
    const tasks = Tasks.retrieveTasks();
    const taskNames = Object.keys(tasks);

    Tasks.#checkJSONDatabase(); Tasks.#storeTask([{}]);

    taskNames.forEach(taskName => {
      Scheduler.removeTask(taskName);
    });
  }


  /**
   * Validates local JSON database for any invalid structures.
   * @example An example of a both a valid JSON parsing database along with
   * proper structure:
   * ```js
  * [
   * {
      *         "<task_name>": {
   *             "interval": "<total_time_in_seconds>",
   *             "channel": "<channel_name>",
   *             "message": "<message>"
   *         }...
   *     }
   * ]
  * ```
   * @param db
   * - Parsed JSON file.
   * - Set the value to be an empty string - `""`, if it's not to be validated.
   */
  static validateJSON(db: unknown): db is DBSchema {
    if (!Array.isArray(db)) return false;
    if (db.length !== 1) return false;
    if (typeof db[0] !== "object" || db[0] === null || Array.isArray(db[0]))
      return false;

    const taskList = Object.values(db[0]);
    if (taskList.length > 0) {
      for (let i = 0; i < taskList.length; i++) {
        const task = taskList[i];
        if (task === null) return false;
        if (typeof task !== "object") return false;
        const attributes = Object.keys(task);
        const validTaskAttributes: Array<TaskAttribute> = [
          "channel", "interval", "message"
        ];
        const validStringTaskAttributes: Array<string> = validTaskAttributes;

        if (attributes.length !== validTaskAttributes.length) return false;
        for (let i = 0; i < attributes.length; i++) {
          const attribute = attributes[i];

          const isValidAttribute = validStringTaskAttributes
            .includes(attribute);

          if (!isValidAttribute) return false;
        }
      }
    }

    return true;
  }
}

Tasks.init();


/**
 * Convert to a valid local JSON database task.
 * @param task Record of task attributes with its corresponding string values.
 */
export function getDBTask(task: Task): DBTask {
  return {
    "channel": task.channel,
    "interval": task.interval,
    "message": task.message,
  };
}


export type Task = Record<keyof typeof CommandAttributes, string>;


/** Schema of a task in the local JSON database. */
export type DBTask = Omit<Task, "taskName">;


/** Schema of the list of tasks in the local JSON database. */
export type DBTasks = Record<string, DBTask>;


/** Schema of the local JSON database. */
type DBSchema = [DBTasks];


export default Tasks;
