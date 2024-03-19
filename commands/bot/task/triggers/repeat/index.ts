import {
  ToadScheduler,
  SimpleIntervalJob,
  Task as SchedulerTask
} from "toad-scheduler";


import RepeatTable from "./model";
import {
  Triggers,
  ScheduleArgs,
  TriggerTypes,
  isSchedulable
} from "../types";
import { AtLeastOne } from "../../../../../utils/types";

import hasProperty from "../../../../../utils/property-assert";


/** Trigger after every specified interval */
export default class Repeat<T extends keyof TriggerTypes> extends Triggers<T> {
  private static scheduler = new ToadScheduler();
  private database = new RepeatTable<T>(this);
  private static jobIDs: number[] = [];

  static get activeJobs(): number { return Repeat.jobIDs.length; }
  static checkJob(id: number): boolean { return Repeat.jobIDs.includes(id); }
  static clearJobs(): void { Repeat.jobIDs = []; }

  /** Schedule when the trigger is invoked according to spceified interval.
   *
   * @param value Recurring interval for task invocation.
   * @returns ID of the created trigger.
   */
  create(value: TriggerTypes[T]): number {
    if (!isSchedulable(value)) throw new Error();
    const hours = value.hours;
    const minutes = value.minutes;
    const seconds = value.seconds;
    const toadTask = new SchedulerTask("Recurring Bot Response", () => {
      this.trigger();
    });

    const id = this.database.createSchedule(hours, minutes, seconds);
    if (Repeat.jobIDs.includes(id)) {
      this.database.deleteSchedule(id);
      throw new Error(`Job with '${id}' is already active.`);
    }

    const job = new SimpleIntervalJob(
      { seconds: convertToSeconds(hours, minutes, seconds) },
      toadTask,
      id.toString()
    );

    Repeat.scheduler.addSimpleIntervalJob(job);
    Repeat.jobIDs.push(id);

    return id;
  }

  restart(id: number, startup: boolean): void {
    let row: ScheduleArgs;
    try {
      row = this.database.getSchedule(id);
    }
    catch(error) {
      const message = `Trigger with ID '${id}' does not exists`;
      if (error instanceof Error && error.message === message) {
        const jobIDIndex = Repeat.jobIDs.indexOf(id);
        if (Repeat.scheduler.getById(id.toString()) || jobIDIndex !== -1) {
          console.error(`Ghost schedule with 'ID' ${id} is currently active.`);
          process.exit(1);
        }
      }
      throw error;
    }
    const hours = row.hours;
    const minutes = row.minutes;
    const seconds = row.seconds;

    const jobIDIndex = Repeat.jobIDs.indexOf(id);
    if (!startup) {
      if (jobIDIndex === -1) {
        throw new Error(`Job with ID '${id}' does not exists.`);
      }
      Repeat.scheduler.removeById(id.toString());
    }
    else {
      if (jobIDIndex !== -1) {
        console.error(`Job with ID '${id}' already exists during startup.`);
        process.exit(1);
      }
    }

    const toadTask = new SchedulerTask("Recurring Bot Response", () => {
      this.trigger();
    });

    const job = new SimpleIntervalJob(
      { seconds: convertToSeconds(hours, minutes, seconds) },
      toadTask,
      id.toString()
    );

    Repeat.scheduler.addSimpleIntervalJob(job);
    if (startup) Repeat.jobIDs.push(id);
  }


  delete(id: number): void {
    const jobIDIndex = Repeat.jobIDs.indexOf(id);
    if (jobIDIndex === -1) {
      throw new Error(`Job with '${id}' does not exists.`);
    }

    this.database.deleteSchedule(id);
    Repeat.scheduler.removeById(id.toString());
    Repeat.jobIDs.splice(jobIDIndex, 1);
  }

  update(id: number, value: TriggerTypes[T]): void {
    if (!isSchedulable(value)) throw new Error();

    const jobIDIndex = Repeat.jobIDs.indexOf(id);
    if (jobIDIndex === -1) {
      throw new Error(`Job with '${id}' does not exists.`);
    }

    const hours = value.hours;
    const minutes = value.minutes;
    const seconds = value.seconds;
    const toadTask = new SchedulerTask("Recurring Bot Response", () => {
      this.trigger();
    });

    Repeat.scheduler.removeById(id.toString());
    this.database.updateSchedule(id, hours, minutes, seconds);

    const job = new SimpleIntervalJob(
      { seconds: convertToSeconds(hours, minutes, seconds) },
      toadTask,
      id.toString()
    );

    Repeat.scheduler.addSimpleIntervalJob(job);
  }
}




/**
 * Converts each respective time unit to seconds.
 *
 * @returns Seconds equivalent.
 */
function convertToSeconds(
  hours: number,
  minutes: number,
  seconds: number
): number {
  seconds = seconds + (minutes * 60) + (hours * 60 * 60);

  const maxPositiveSigned32bit: number = Math.pow(2, 31) - 1;
  if (seconds !== 0 && seconds <= maxPositiveSigned32bit) return seconds;

  throw new Error("The interval is not valid.");
}

export function ScheduleUpdatable(
  object: unknown
): object is AtLeastOne<ScheduleArgs> {
  return (
    typeof object === "object" && object !== null && !("id" in object) &&
    (
      (hasProperty(object, "hours") && typeof object.hours === "number") ||
      (hasProperty(object, "minutes") && typeof object.minutes === "number") ||
      (hasProperty(object, "seconds") && typeof object.seconds === "number")
    )
  );
}

