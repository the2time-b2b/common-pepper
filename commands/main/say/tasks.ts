import fs from "fs";
import Database from "better-sqlite3";
import { default as Scheduler } from "./scheduler";

import path from "path";
import { CommandAttributes } from "./types";
import hasProperty from "../../../utils/property-assert";

import * as logger from "../../../utils/logger";

/** Create, modify and schedule tasks. */
class Tasks {
  #databaseDir = path.join(
    process.cwd(),
    "db",
  );

  #databasePath = path.join(
    this.#databaseDir,
    `tasks${(process.env.NODE_ENV !== "test" ? "" : ".test")}.db`
  );

  #database: ReturnType<typeof Database>;

  constructor() {
    if (!fs.existsSync(this.#databaseDir)) {
      fs.mkdirSync(this.#databaseDir);
    }

    let newDatabase = false;
    if (!fs.existsSync(this.#databasePath)) {
      logger.info("Database does not exist, new one will be created.");
      newDatabase = true;
    }

    const database = new Database(this.#databasePath);
    if (newDatabase) {
      try {
        database
          .prepare("CREATE TABLE tasks " +
            "(name TEXT, channel TEXT, message TEXT, interval INTEGER);")
          .run();
      }
      catch (error) {
        let message = "";
        if (error instanceof Database.SqliteError) {
          message += "code: " + error.code + "\n";
          message += "message: " + error.message + "\n";
        }
        message += "Cannot create 'tasks' table.";
        console.error(message);
      }
    }

    this.#database = database;
  }


  get databasePath(): string { return this.#databasePath; }
  get databaseDir(): string { return this.#databaseDir; }

  get database(): ReturnType<typeof Database> { return this.#database; }


  /** Initialize pre-exisiting task saved in the database. */
  init(): void {
    const statement = this.#database.prepare("SELECT * FROM tasks;");

    const parsedTasks: DBTask[] = [];
    for (const row of statement.iterate()) {
      if (!TaskSchema(row)) {
        throw new Error("The schema of the database is incompatible.");
      }

      parsedTasks.push(row);
    }

    Scheduler.init(parsedTasks);
  }


  /**
   * Create a new task.
   * @param task DBTask containing information on how bot response is invoked.
   */
  createTask(task: DBTask): string {
    const row: unknown = this.#database
      .prepare("SELECT name FROM tasks WHERE name = ?")
      .get(task.name);

    if (row) return `Task '${task.name}' already exists.`;

    this.#database
      .prepare(
        "INSERT INTO tasks (name, channel, interval, message) " +
        "VALUES (?, ?, ?, ?)",
      ).run(task.name, task.channel, task.interval, task.message);

    Scheduler.addTask({
      name: task.name,
      channel: task.channel,
      interval: Number(task.interval),
      message: task.message
    });

    return `Task ${task.name} activated on channel ${task.channel}.`;
  }


  /**
   * Updates an existing task.
   * @param name The name of the task that needs to be updated.
   * @param task The new modified version of the task that is to be replaced
   * with old task.
   * @returns Status of the task update.
   */
  updateTask(name: string, task: AtLeastOne<DBTask>): string {
    const row: unknown = this.#database
      .prepare(
        "SELECT name, channel, message, interval FROM tasks WHERE name = ?"
      )
      .get(name);

    if (!row) {
      return `The task '${name}' does not exists.`;
    }

    if (!TaskSchema(row)) {
      throw new Error("The schema of the database is incompatible.");
    }


    let sql = "UPDATE tasks SET ";
    const values = [] as unknown as [string | number];

    const taskKeyValues = Object.entries(task);
    taskKeyValues.forEach((keyValue, index) => {
      if (index === taskKeyValues.length - 1) sql += keyValue[0] + " = ? ";
      else sql += keyValue[0] + " = ?, ";
      values.push(keyValue[1]);
    });
    sql += " WHERE name = '" + name + "'";


    this.#database.prepare(sql).run(values);

    Scheduler.removeTask(name);

    Scheduler.addTask({ ...task, ...row });

    return `Task ${name} successfully modified.`;
  }


  /**
   * Deletes a task from the database and removes it from the scheduler.
   * @param name The name of the task that is to be deleted.
   */
  deleteTask(name: string): string {
    const row: Database.RunResult = this.#database
      .prepare("DELETE FROM tasks WHERE name = ?")
      .run(name);


    if (!row.changes) {
      return `The task '${name}' does not exists.`;
    }

    Scheduler.removeTask(name);

    return `Task ${name} successfully removed.`;
  }


  /** Clears the tasks from scheduler and the database */
  clearTasks(): string {
    const deleteTasks = this.#database.prepare("DELETE FROM tasks");

    const statement = this.#database.prepare("SELECT * FROM tasks;");

    let rowCount = 0;
    for (const row of statement.iterate()) {
      if (!TaskSchema(row)) {
        throw new Error("The schema of the database is incompatible.");
      }

      if (!RowName(row)) throw new Error();
      Scheduler.removeTask(row.name);
      rowCount++;
    }

    if (deleteTasks.run().changes !== rowCount) {
      console.error(
        "FATAL: Number of tasks deleted does not match with total tasks"
      );
      process.abort();
    }

    if (rowCount === 0) return "Tasks are already cleared.";

    return "Tasks are cleared.";
  }
}


/**
 * Validates a task object returned by database as object with expected types.
 * @param row task object.
 */
export function TaskSchema(row: unknown): row is DBTask {
  if (row === null) return false;
  if (typeof row !== "object") return false;

  if (!(hasProperty(row, "name"))) return false;
  if (!(hasProperty(row, "message"))) return false;
  if (!(hasProperty(row, "channel"))) return false;
  if (!(hasProperty(row, "interval"))) return false;
  if (typeof row.name!== "string") return false;
  if (typeof row.message !== "string") return false;
  if (typeof row.channel !== "string") return false;
  if (typeof row.interval !== "number") return false;


  return true;
}


function RowName(row: unknown): row is {name: string} {
  return row !== null &&
    typeof row === "object" &&
    hasProperty(row, "name") && typeof row.name === "string";
}


/** Schema of a task received from the user. */
export type Task = Record<keyof typeof CommandAttributes, string>;

/** Type compatible task with the database schema. */
export type DBTask = Omit<Task, "interval" | "taskName">
  & {interval: number, name: string};

/** Atleast one of the task parameter should be defined. */
export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> =
  Partial<T> & U[keyof U];

export default Tasks;

