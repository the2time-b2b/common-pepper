import { TasksDatabase } from "../../types";
import { hasID } from "../../validator";
import { ScheduleArgs, TriggerTypes, Triggers, isSchedulable } from "../types";


/**
 * A database instance for the 'Repeat' trigger.
 * @extends TasksDatabase
 */
export default class RepeatTable<T extends keyof TriggerTypes>
  extends TasksDatabase<"triggers"> {
  /** Schema (columns and corresponding types) for 'repeat' trigger table. */
  private static RepeatSchema = "id INTEGER PRIMARY KEY, " +
    "hours INTEGER NOT NULL, minutes INTEGER NOT NULL, " +
    "seconds INTEGER NOT NULL";

  trigger: Triggers<T>;

  /** Inititalize a database instance of a 'Repeat' trigger. */
  constructor(trigger: Triggers<T>) {
    super("triggers", RepeatTable.RepeatSchema, "repeat");
    this.trigger = trigger;
  }


  /**
   * Stores the interval of the trigger.
   *
   * @param hours The hour at which the trigger is invoked.
   * @param minutes The minute at which the trigger is invoked.
   * @param seconds The second at which the trigger is invoked.
   * @returns ID of the stored trigger.
   */
  createSchedule(hours: number, minutes: number, seconds: number): number {
    const tableName = this.tableName;

    this.db
      .prepare(
        `INSERT INTO ${tableName} (hours, minutes, seconds) VALUES (?, ?, ?)`,
      ).run(hours, minutes, seconds);

    const row = this.db
      .prepare(`SELECT id FROM ${tableName} order by id DESC LIMIT 1`)
      .get();


    if (!hasID(row)) {
      throw new Error("Query result set does not return 'id'.");
    }

    return row.id;
  }

  getSchedule(id: number): ScheduleArgs {
    const getSchedule = `SELECT hours, minutes, seconds from ${this.tableName}`
      + " WHERE id = ?";
    const row: unknown = this.db.prepare(getSchedule).get(id);

    if (typeof row === "undefined") {
      throw new Error(`Trigger with ID '${id}' does not exists`);
    }

    if (!isSchedulable(row)) {
      throw new Error("Returned query values do not conform expected type.");
    }

    return row;
  }

  deleteSchedule(id: number): void {
    const deleteSchedule = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const row = this.db.prepare(deleteSchedule).run(id);
    if (row.changes === 0) {
      throw new Error("Trigger cannot be deleted. ID does not exist.");
    }
  }

  /**
   * Updates the intervals of the trigger.
   *
   * @param id The ID of the trigger to be updated.
   * @param hours The hour of the trigger to be updated.
   * @param minutes The minute of the trigger to be updated.
   * @param seconds The second of the trigger to be updated.
   */
  updateSchedule(
    id: number,
    hours: number,
    minutes: number,
    seconds: number
  ): void {
    const updateSchedule = `UPDATE ${this.tableName} ` +
      "SET hours = ?, minutes = ?, seconds = ? WHERE id = ?";
    const row = this.db
      .prepare(updateSchedule)
      .run(hours, minutes, seconds, id);
    if (row.changes === 0) {
      throw new Error("Trigger cannot be updated: ID does not exist.");
    }
  }
}
