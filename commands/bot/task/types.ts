import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

import { TriggerTypes, TriggerTables } from "./triggers/types";
import { ActionTables, ActionTypes, } from "./actions/types";

import * as logger from "../../../utils/logger";

/** Create a database instance for bot's task functionality requirments. */
export class TasksDatabase
  <
    K extends keyof TaskDBSchema<keyof TriggerTypes, keyof ActionTypes>,
    T = TaskDBSchema<keyof TriggerTypes, keyof ActionTypes>[K]["tables"]
  > {
  /** Name of the database. */
  private databaseName: K;
  /** Name of the table . */
  protected tableName: T;
  /** Absolute path to the directory where the database resides.. */
  private databaseDirectory = path.join(process.cwd(), "db",);

  /**
   * Absolute path to the database.
   *
   * @param name Name of database which also is the database file identifier.
   * @returns Absolute path of the database.
   */
  private databasePath(name: string): string {
    return path.join(
      this.databaseDir,
      `${name}${(process.env.NODE_ENV !== "test" ? "" : ".test")}.db`
    );
  }

  /** Database object. */
  private database: ReturnType<typeof Database>;

  /**
   * Initalize a database instance for bot's task functionality requirments.
   *
   * @param databaseName Name of the database.
   * @param schema Schema of the table to be created withing the database.
   * @param tableName Name of the database table.
   */
  constructor(databaseName: K, schema: string, tableName: T) {
    this.databaseName = databaseName;
    this.tableName = tableName;
    if (!fs.existsSync(this.databaseDir)) {
      fs.mkdirSync(this.databaseDir);
    }

    let newDatabase = false;
    const databasePath = this.databasePath(databaseName);

    if (!fs.existsSync(databasePath)) {
      logger.info("Database does not exist, new one will be created.");
      newDatabase = true;
    }

    const database = new Database(databasePath);
    if (newDatabase) {
      try {
        database.prepare(`CREATE TABLE ${tableName} (${schema});`).run();
      }
      catch (error) {
        let message = "";
        if (error instanceof Database.SqliteError) {
          message += "code: " + error.code + "\n";
          message += "message: " + error.message + "\n";
        }
        message += `Cannot create '${tableName}' table.`;
        console.error(message);
      }
    }

    this.database = database;
  }


  get dbPath(): string { return this.databasePath(this.databaseName); }
  get databaseDir(): string { return this.databaseDirectory; }
  get db(): ReturnType<typeof Database> { return this.database; }
}

export interface MasterSchema<
  T extends keyof TriggerTypes, U extends keyof ActionTypes
> {
  name: string,
  trigger_type: T,
  action_type: U,
  trigger_id: number,
  action_id: number
}

interface MasterTables<
  T extends keyof TriggerTypes, U extends keyof ActionTypes
> {
  master: MasterSchema<T, U>
}

interface TaskDBSchema<
  T extends keyof TriggerTypes, U extends keyof ActionTypes
> {
  tasks: {
    tables: keyof MasterTables<T, U>
  },
  triggers: {
    tables: keyof TriggerTables
  },
  actions: {
    tables: keyof ActionTables
  },
}

