import { ActionTypes, Actions, EchoArgs } from "../types";
import { TasksDatabase } from "../../types";
import { AtLeastOne } from "../../../../../utils/types";
import { hasID } from "../../validator";
import { isEchoable } from "./validators";


/**
 * Create a echo action to relay supplied message to a channel.
 * @extends TasksDatabase
 */
export default class EchoTable
  <T extends keyof ActionTypes> extends TasksDatabase<"actions">
{
  static EchoSchema = "id INTEGER PRIMARY KEY, channel TEXT NOT NULL, " +
    "message TEXT NOT NULL";
  action: Actions<T>;

  /** Create an instance that can be used to relay message to a channel. */
  constructor(action: Actions<T>) {
    super("actions", EchoTable.EchoSchema, "echo");
    this.action = action;
  }


  /**
   * Create a new task.
   * @param task DBTask containing information on how bot response is invoked.
   */
  create(channel: string, message: string): number {
    this.db
      .prepare(
        `INSERT INTO ${this.tableName} (channel, message) ` +
        "VALUES (?, ?)",
      ).run(channel, message);

    const row = this.db
      .prepare(`SELECT id FROM ${this.tableName} order by id DESC LIMIT 1`)
      .get();

    if (!hasID(row)) {
      throw new Error("Query result set does not return 'id'.");
    }

    return row.id;
  }

  retreive(id: number): EchoArgs {
    const getEchoableData = `SELECT channel, message from ${this.tableName}` +
      " WHERE id = ?";
    const row: unknown = this.db.prepare(getEchoableData).get(id);

    if (typeof row === "undefined") {
      throw new Error(`Trigger with ID '${id}' does not exists`);
    }

    if (!isEchoable(row)) {
      throw new Error("Returned query values do not conform expected type.");
    }

    return row;
  }

  delete(id: number): void {
    if (!id) throw new Error("Cannot delete action. ID is undefined");

    const deleteAction = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const row = this.db.prepare(deleteAction).run(id);
    if (row.changes === 0) {
      throw new Error("ID does not exist.");
    }
  }

  update(id: number, value: AtLeastOne<ActionTypes[T]>): void {
    const getAction = `SELECT channel, message FROM ${this.tableName} ` +
      "WHERE id = ?";
    const exisitingAction = this.db.prepare(getAction).get(id);
    if (exisitingAction === undefined) {
      throw new Error(`Action with ID '${id}' does not exist.`);
    }
    if (!isEchoable(exisitingAction)) {
      console.error(exisitingAction);
      throw new Error("Returned result set has invalid schama");
    }

    const updatedAction = { ...exisitingAction, ...value };

    const updateAction = `UPDATE ${this.tableName} ` +
      "SET channel = ?, message = ? WHERE id = ?";
    const row = this.db
      .prepare(updateAction)
      .run(updatedAction.channel, updatedAction.message, id);

    if (row.changes === 0) {
      throw new Error("Trigger cannot be updated: ID does not exist.");
    }
  }
}
