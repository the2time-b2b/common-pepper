import { AtLeastOne } from "../../../../utils/types";
import hasProperty from "../../../../utils/property-assert";

/** A trigger invoked for a set condition. */
export class Triggers<T extends keyof TriggerTypes> {
  /** Function to be called. */
  private callback: (() => void) | null = null;

  /** Invoke the assigned callback function. */
  protected trigger(): void {
    if (!this.callback) throw new Error("Callback needs to be supplied.");
    this.callback();
  }

  /**
   * Assign a function to be invoked when triggered.
   *
   * @param callback Function to be called when the trigger condition is
   * satisfied.
   */
  onTrigger(callback: () => void): void {
    this.callback = callback;
  }

  create(value: TriggerTypes[T]): number;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  create(_value: TriggerTypes[T]): number {
    throw new Error("Custom implementation must be provided.");
  }

  restart(id: number, startup: boolean): void;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  restart(_id: number, _startup: boolean): void {
    throw new Error("Custom implementation must be provided.");
  }

  delete(id: number): void;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  delete(_id: number): void {
    throw new Error("Custom implementation must be provided.");
  }

  update(
    id: number,
    value: AtLeastOne<TriggerTypes[T]>
  ): void;
  update(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _id: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _value: AtLeastOne<TriggerTypes[T]>
  ): void {
    throw new Error("Custom implementation must be provided.");
  }
}

export interface RepeatSchema {
  id: number,
  hours: number,
  minutes: number,
  seconds: number
}

export type ScheduleArgs = Omit<RepeatSchema, "id">;


/**
 * Check if the object has a compatible arguments for the 'Repeat' trigger.
 *
 * @param object Object to be validated.
 * @returns Whether the object property consists of a valid arguments for
 * 'Repeat' trigger.
 */
export function isSchedulable(object: unknown): object is ScheduleArgs {
  return (
    typeof object === "object" && object !== null &&
    hasProperty(object, "hours") && typeof object.hours === "number" &&
    hasProperty(object, "minutes") && typeof object.minutes === "number" &&
    hasProperty(object, "seconds") && typeof object.seconds === "number"
  );
}


export interface TriggerTypes {
  repeat: Omit<ScheduleArgs, "id">;
}

export interface TriggerTables {
  repeat: RepeatSchema
}

