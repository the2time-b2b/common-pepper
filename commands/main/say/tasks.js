const fs = require("fs");
const path = require("path");

const logger = require("../../../utils/logger");


/**
 * A singleton which handles a list of tasks in accordance to the schema of the
 * local JSON database and reflects the same on the task scheduler.
 * TODO: Sync with the realtime task scheduler.
 */
class Tasks {
  static #databasePath = path.join(
    __dirname,
    `tasks-db${(process.env.NODE_ENV !== "test" ? "" : ".test")}.json`
  );


  /**
   * A dummy constructor invoked to create an empty local database.
  */
  static #dummyStaticConstructor = (function() {
    try {
      if (!fs.existsSync(Tasks.#databasePath)) {
        Tasks.#createJSONDatabase();
      }
    }
    catch (err) { console.error(err); }
  })();


  static get databasePath() {
    return this.#databasePath;
  }


  /**
   * Creates a new local database;
   */
  static #createJSONDatabase() {
    if (fs.existsSync(Tasks.#databasePath)) {
      throw new Error("The local database already exists.");
    }
  }


  /**
   * Checks if the local database exists.
   */
  static #checkJSONDatabase() {
    if (!fs.existsSync(Tasks.#databasePath)) {
      const error = new Error();
      error.message = "The local database doesn't exist or has been deleted: ";
      error.message += Tasks.#databasePath;

      throw error;

    }
  }


  /**
   * Stores a list of tasks in a JSON format on a local JSON database.
   * @param {import("./typedefs").DBSchema} dbTasks Local JSON database
   * compatible list of tasks.
   */
  static #storeTask(dbTasks) {
    Tasks.#checkJSONDatabase();
    fs.writeFileSync(Tasks.#databasePath, JSON.stringify(dbTasks, null, 4));
  }


  /**
   * Retrieves parsed list of tasks from the local JSON database.
   * @returns {import("./typedefs").DBTasks} List of database object in which
   * the key of each task corresponds to its task name.
   */
  static retrieveTasks() {
    Tasks.#checkJSONDatabase();

    const db = fs.readFileSync(Tasks.#databasePath);

    let JSONfile;
    try {
      JSONfile = JSON.parse(db);
      Tasks.validateJSON(JSONfile);
    }
    catch (err) {
      if (err instanceof SyntaxError) {
        err.message += " for the file in path: " + Tasks.#databasePath;
      }

      throw err;
    }

    const [taskObject] = JSONfile;

    return taskObject;
  }


  /**
   * Create a new task.
   * @param {import("./task")} task Task containing information on how the
   * to invoke a bot response.
   */
  static createTask(task) {
    const tasks = Tasks.retrieveTasks();
    if (tasks[task.name]) return `Task '${task.name}' already exists.`;
    const dbStructure = [tasks];
    tasks[task.name] = task.getDBStructuredRecord();

    Tasks.#storeTask(dbStructure);

    return `Task ${task.name} activated on channel ${task.channel}.`;
  }


  /**
   * Updates an existing task from the task list.
   * @param {string} taskName The name of the task that needs to be updated.
   * @param {import("./task")} task The new modified version of the task that is
   * to be replaced with old task.
   * @returns {string} Status of the task update.
   */
  static updateTask(taskName, task) {
    const tasks = Tasks.retrieveTasks();

    if (!tasks[taskName]) {
      return `The task '${taskName}' does not exists.`;
    }

    if (task.name) {
      const oldTaskName = taskName;
      const newTaskName = task.name;
      if (newTaskName !== oldTaskName) {
        tasks[newTaskName] = tasks[oldTaskName];
        delete tasks[oldTaskName]; // Deletes old task name
      }
    }
    else {
      const oldTask = tasks[taskName];
      const modified = { ...oldTask, ...task.getDBStructuredRecord() };

      tasks[taskName] = modified;
    }

    const dbStructure = [tasks];
    Tasks.#storeTask(dbStructure);

    return `Task ${taskName} successfully modified.`;
  }


  /**
   * Deletes a task from the task list.
   * @param {string} taskName The name of the task that is to be deleted.
   */
  static deleteTask(taskName) {
    const tasks = Tasks.retrieveTasks();

    if (!tasks[taskName]) {
      return `The task '${taskName}' does not exists.`;
    }

    delete tasks[taskName];

    const dbStructure = [tasks];

    Tasks.#storeTask(dbStructure);
    return `Task ${taskName} successfully removed.`;
  }


  /**
   * Clears the task list.
   */
  static clearTasks() {
    Tasks.#checkJSONDatabase();
    Tasks.#storeTask([{}]);
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
  static validateJSON(db, taskName = null) {
    const properJSONStructure = "A valid JSON structure should be of the " +
      "format:\n[\n\t{\n\t\t\"<task name>\": {\n\t\t\t\"totalWaitInterval\"" +
      ": <total_time_in_seconds>,\n\t\t\t\"channel\": \"<channel_name>\"," +
      "\n\t\t\t\"taskMessage\": \"<message>\"\n\t\t}\n\t\t\"<another task " +
      "name>\": {\n\t\t\t...\n\t\t}...\n\t}\n]";

    // eslint-disable-next-line max-len
    const taskList = /^(\[{(("[a-zA-Z0-9_-]{3,40}":{("totalWaitInterval":\d+,"channel":"[a-zA-Z0-9_]{4,25}","taskMessage":"(([^"]|(\\"))*)")},){0,}("[a-zA-Z0-9_-]{3,40}":{("totalWaitInterval":\d+,"channel":"[a-zA-Z0-9_]{4,25}","taskMessage":"(([^"]|(\\"))*)")}))*}\])$/;

    if (JSON.stringify(db).match(taskList)) return true;

    if (taskName) {
      const tasks = db;
      if (tasks[taskName] && Object.keys(tasks[taskName]).length !== 3) {
        console.error(
          "\n\x1b[31m%s\x1b[0m",
          `Unnecessary / missing attribute for the task '${taskName[0]}': `
        );
        console.error("\n\x1b[31m%s\x1b[0m", tasks[taskName]);
        logger.info();
      }
    }

    logger.info("\x1b[34m%s\x1b[0m", properJSONStructure);

    const error = new Error();
    error.name = "InvalidLocalJSONDatabase";
    error.message = "Invalid Task List. Clear the task list using ";
    error.message += `'${process.env.PREFIX} clear task list'.`;
    error.message += " Advanced: Either delete or manually format local DB.";

    throw error;
  }
}

module.exports = Tasks;

