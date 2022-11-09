import fs from "fs";
import { default as Scheduler, ParsedTask, ParsedTasks } from "./scheduler";

import path from "path";
import { TaskAttributes } from "./types";

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


  static get databasePath(): string {
    return this.#databasePath;
  }


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
      if (!fs.existsSync(Tasks.#databasePath)) {
        Tasks.#createJSONDatabase();
      }

      const tasks = Tasks.retrieveTasks();
      const taskNames = Object.keys(tasks);
      const taskList = Object.values(tasks);

      const parsedTasks: ParsedTasks = {};
      for (let i = 0; i < taskNames.length; i++) {
        const task = taskList[i];
        const parsedTask = {
          ...task,
          [TaskAttributes.Interval]: Number(task[TaskAttributes.Interval])
        };
        parsedTasks[`${taskNames[i]}`] = parsedTask;
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
      \n\t\t\t"${TaskAttributes.Interval}": <total_time_in_seconds>,
      \n\t\t\t"${TaskAttributes.Channel}": "<channel_name>",
      \n\t\t\t"${TaskAttributes.Message}": "<message>"
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
    if (tasks[task[TaskAttributes.TaskName]])
      return `Task '${task[TaskAttributes.TaskName]}' already exists.`;

    const validTask = getDBTask(task);

    tasks[task[TaskAttributes.TaskName]] = validTask;
    Tasks.#storeTask([tasks]);

    const parsedTask: ParsedTask = {
      ...task, [TaskAttributes.Interval]: Number(TaskAttributes.Interval)
    };
    Scheduler.addTask(parsedTask, task[TaskAttributes.TaskName]);

    return "Task " + task[TaskAttributes.TaskName] + " activated on channel "
      + task[TaskAttributes.Channel] + ".";
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
    if (task[TaskAttributes.Interval]) {
      toModify[TaskAttributes.Interval] = task[TaskAttributes.Interval];
    }
    if (task[TaskAttributes.Channel]) {
      toModify[TaskAttributes.Channel] = task[TaskAttributes.Channel];
    }
    if (task[TaskAttributes.Message]) {
      toModify[TaskAttributes.Message] = task[TaskAttributes.Message];
    }

    const modifiedTask = { ...oldTask, ...toModify };

    if (typeof task[TaskAttributes.TaskName] === "undefined") throw new Error();

    let modifiedTaskName = task[TaskAttributes.TaskName];
    if (!modifiedTaskName) {
      modifiedTaskName = taskName;
    }
    else delete tasks[taskName]; // Deletes old task name

    Scheduler.removeTask(taskName);

    tasks[modifiedTaskName] = modifiedTask;
    Tasks.#storeTask([tasks]);

    const parsedTask: ParsedTask = {
      ...modifiedTask,
      [TaskAttributes.Interval]: Number(modifiedTask[TaskAttributes.Interval])
    };
    Scheduler.addTask(parsedTask, modifiedTaskName);

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
    return `Task ${taskName} successfully removed.`;
  }


  /** Clears the task list. */
  static clearTasks(): void {
    Tasks.#checkJSONDatabase(); Tasks.#storeTask([{}]);
  }


  /**
   * Validates local JSON database for any invalid structures.
   * @example An example of a both a valid JSON parsing database along with
   * proper structure:
   * ```js
  * [
   * {
      *         "<task_name>": {
   *             "totalWaitInterval": "<total_time_in_seconds>",
      *             "channel": "<channel_name>",
      *             "taskMessage": "<message>"
   *         }...
   *     }
   * ]
  * ```
   * @param {import("./typedefs").DBSchema} db
   * - Parsed JSON file.
   * - Set the value to be an empty string - `""`, if it's not to be validated.
   * @param {string} taskName Name of the task for task specific validation.
   */
  static validateJSON(db: unknown): db is DBSchema {
    if (!Array.isArray(db)) return false;
    if (db.length !== 1) return false;

    const taskList = Object.values(db[0]);
    if (taskList.length > 0) {
      for (let i = 0; i < taskList.length; i++) {
        const task = taskList[i];
        if (task === null) return false;
        if (typeof task !== "object") return false;
        const attributes = Object.keys(task);
        const validAttributes = {
          interval: TaskAttributes.Interval,
          channel: TaskAttributes.Channel,
          message: TaskAttributes.Message,
        };

        const validStringAttributes = Object.values(validAttributes)
          .map(validAttribute => {
            if (typeof validAttribute !== "string")
              throw new ReferenceError("attribute should be a string");

            return validAttribute.toString();
          });

        if (attributes.length !== validStringAttributes.length) return false;
        for (let i = 0; i < attributes.length; i++) {
          const attribute = attributes[i];

          const isValidAttribute = validStringAttributes.includes(attribute);
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
function getDBTask(task: Task): DBTask {
  return {
    [TaskAttributes.Channel]: task[TaskAttributes.Channel],
    [TaskAttributes.Interval]: task[TaskAttributes.Interval],
    [TaskAttributes.Message]: task[TaskAttributes.Message]
  };
}


export type Task = Record<TaskAttributes, string>;


/** Schema of a task in the local JSON database. */
export type DBTask = Omit<Task, TaskAttributes.TaskName>;


/** Schema of the list of tasks in the local JSON database. */
type DBTasks = Record<string, DBTask>;


/** Schema of the local JSON database. */
type DBSchema = [DBTasks];


export default Tasks;
