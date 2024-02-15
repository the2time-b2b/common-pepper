import { MasterSchema, TasksDatabase } from "./types";
import Trigger from "./triggers";
import { TriggerFactory } from "./triggers/factory";
import { TriggerTypes } from "./triggers/types";
import Action, { ActionFactory } from "./actions";
import { ActionTypes } from "./actions/types";
import { ProcessError } from "../../../utils/error";

import hasProperty from "../../../utils/property-assert";
import { AtLeastOne } from "../../../utils/types";


export default class Task<
  T extends keyof TriggerTypes, U extends keyof ActionTypes
> {
  private database: TaskTable<T, U> = new TaskTable(this);

  /**
   * Check if the task name has required length and characters.
   * @param taskName Name of the task.
   */
  private checkTaskName(taskName: string): void {
    if (taskName.match(/^[a-zA-Z0-9_-]{3,40}$/)) return;
    throw new ProcessError(
      "Invalid task name.",
      { toUser: { status: true } }
    );
  }

  init(): void {
    this.database.init();
  }

  clear(): void {
    const names = this.database.getAllTasks();

    names.forEach((row: unknown) => {
      if (!hasIndexName(row)) {
        throw new Error("Cannot remove task. name is invalid.");
      }
      const task = new Task<T, U>();
      task.retreive(row.name);
      task.remove(row.name);
    });
  }

  create(name: string, trigger: Trigger<T>, action: Action<U>): void {
    this.checkTaskName(name);

    const rowExists = this.database.check(name);
    if (rowExists) {
      throw new ProcessError(
        "Task already exists.",
        { toUser: { status: true } }
      );
    }

    const newTrigger = new TriggerFactory(trigger.type);
    const newAction = new ActionFactory(action.type);
    const actionType = action.type;
    const triggerType = trigger.type;
    const actionID = newAction.action.create(action.value);
    const callback = newAction.action.toExecute(actionID);
    const triggerID = newTrigger.create(trigger.value, callback);

    this.database.createTask(
      name,
      triggerType,
      actionType,
      triggerID,
      actionID
    );
  }

  retreive(name: string): MasterSchema<T, U> {
    const row = this.database.retreive(name);
    return { ...row };
  }

  remove(name: string): void {
    this.checkTaskName(name);

    const task = this.database.remove(name);
    const triggerType = task.trigger_type;
    const actionType = task.action_type;
    const triggerID = task.trigger_id;
    const actionID = task.action_id;

    const updateTrigger = new TriggerFactory(triggerType);
    updateTrigger.delete(triggerID);
    const newAction = new ActionFactory(actionType);
    newAction.action.delete(actionID);
  }


  updateName(name: string): void {
    this.checkTaskName(name);

    this.database.update(name);
  }


  updateTrigger(taskName: string, triggerChanges: TriggerTypes[T]): void {
    const task = this.retreive(taskName);
    const triggerType = task.trigger_type;
    const triggerID = task.trigger_id;
    const actionType = task.action_type;
    const actionID = task.action_id;

    const newTrigger = new TriggerFactory(triggerType);
    const newAction = new ActionFactory(actionType);

    const callback = newAction.action.toExecute(actionID);
    newTrigger.update(triggerID, triggerChanges, callback);
  }


  updateAction(
    taskName: string,
    actionChanges: AtLeastOne<ActionTypes[U]>
  ): void {
    const task = this.retreive(taskName);
    const triggerType = task.trigger_type;
    const triggerID = task.trigger_id;
    const actionID = task.action_id;
    const actionType = task.action_type;

    const newTrigger = new TriggerFactory(triggerType);
    const newAction = new ActionFactory(actionType);
    newAction.action.update(actionID, actionChanges);

    const callback = newAction.action.toExecute(actionID);
    newTrigger.restart(triggerID, callback);

  }
}


class TaskTable<
  T extends keyof TriggerTypes, U extends keyof ActionTypes
> extends TasksDatabase<"tasks"> {
  private static MasterSchema = "name TEXT PRIMARY KEY, " +
    "trigger_type TEXT NOT NULL, " + "action_type TEXT NOT NULL, " +
    "trigger_id INTEGER NOT NULL, action_id INTEGER NOT NULL";

  task: Task<T, U>;


  constructor(task: Task<T, U>) {
    super("tasks", TaskTable.MasterSchema, "master");
    this.task = task;
  }


  init(): void {
    const getAllIndex = `SELECT * FROM ${this.tableName}`;

    const indexes: unknown = this.db.prepare(getAllIndex).all();

    if (!(indexes instanceof Array)) {
      throw new Error("Querying mutiple indexes must return a list.");
    }
    indexes.forEach(index => {
      if (!hasIndexSchema(index)) {
        throw new Error("'index' table does not have a valid schema.");
      }

      const trigType = index.trigger_type;
      const trigID = index.trigger_id;
      const exisitingTrigger = new TriggerFactory(trigType);

      const actionType = index.action_type;
      const actionID = index.action_id;
      const exisitingAction = new ActionFactory(actionType);
      const callback = exisitingAction.action.toExecute(actionID);

      exisitingTrigger.restart(trigID, callback, true);
    });
  }

  getAllTasks(): unknown[] {
    const getAllIndexNames = `SELECT name FROM ${this.tableName};`;
    const names: unknown = this.db.prepare(getAllIndexNames).all();

    if (!(names instanceof Array)) {
      throw new Error("Querying mutiple names must return a list.");
    }

    return names;
  }

  createTask(
    name: string,
    triggerType: T,
    actionType: U ,
    triggerID: number,
    actionID: number
  ): void {
    const storeTask = `INSERT INTO ${this.tableName} ` +
      "(name, trigger_type, action_type, trigger_id, action_id)" +
      "VALUES (?, ?, ?, ?, ?)";
    this.db
      .prepare(storeTask)
      .run(
        name,
        triggerType,
        actionType,
        triggerID,
        actionID
      );
  }


  check(name: string): boolean {
    const uniqueTask = `SELECT name from ${this.tableName} WHERE name = ?`;
    const row: unknown = this.db.prepare(uniqueTask).get(name);

    if (typeof row === "undefined") {
      return false;
    }

    return true;
  }


  retreive(name: string): MasterSchema<T, U> {
    const uniqueTask = `SELECT * from ${this.tableName} WHERE name = ?`;
    const row: unknown = this.db.prepare(uniqueTask).get(name);

    if (typeof row === "undefined") {
      throw new ProcessError("Tasks does not exists", {
        toUser: { status: true }
      });
    }

    if (!hasIndexSchema<T, U>(row)) {
      throw new Error(`Table '${this.tableName}' has a invalid schema.`);
    }

    return row;
  }

  remove(name: string): MasterSchema<T, U> {
    const selectTask = `SELECT * from ${this.tableName} WHERE name = ?`;
    const task: unknown = this.db.prepare(selectTask).get(name);
    if (!hasIndexSchema<T, U>(task)) throw new Error();

    const deleteTask = `DELETE from ${this.tableName} WHERE name = ?`;
    const row = this.db.prepare(deleteTask).run(name);
    if (row.changes === 0) {
      throw new Error(`FATAL: Task '${name}' does not exists.`);
    }
    return task;
  }

  /**
   * Update the name of the task.
   *
   * @param name New name for the task.
   */
  update(name: string): void {
    const updateName = `UPDATE ${this.tableName} SET name = ? WHERE name = ?`;
    const changes = this.db
      .prepare(updateName)
      .run(name, name).changes;

    if (changes === 0) {
      throw new Error("Cannot update task. name is undefined");
    }
  }
}


function hasIndexSchema<
  T extends keyof TriggerTypes, U extends keyof ActionTypes
>(row: unknown): row is MasterSchema<T, U> {
  return (
    typeof row !== "undefined" && typeof row === "object" && row !== null &&
    hasProperty(row, "name") && hasProperty(row, "trigger_type")
    && hasProperty(row, "action_type") && hasProperty(row, "trigger_id") &&
    hasProperty(row, "action_id") && typeof row.name === "string" &&
    typeof row.trigger_id === "number" && typeof row.action_id === "number"
  );
}

function hasIndexName<
  T extends keyof TriggerTypes, U extends keyof ActionTypes
>(row: unknown): row is Pick<MasterSchema<T, U>, "name"> {
  return (
    typeof row !== "undefined" && typeof row === "object" &&
    row !== null && hasProperty(row, "name") && typeof row.name === "string"
  );
}

