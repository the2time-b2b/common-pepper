import Repeat from "./repeat";
import { Triggers, TriggerTypes, } from "./types";

/**
 * Generates specified trigger type.
 * @extends Trigger
 */
export class TriggerFactory<T extends keyof TriggerTypes> {
  private manufacturedTrigger: Triggers<T>;
  private type: T;


  /**
   * Generate trigger on specified type along with it's conditional agrguments.
   *
   * @param trigger Type of trigger to be activated with specified arguments.
   * @param id Tnique trigger identifier.
   */
  constructor(trigger: T) {
    this.type = trigger;

    switch (this.type) {
      case "repeat": {
        this.manufacturedTrigger = new Repeat();
        break;
      }
      default:
        throw new Error(
          `FATAL: Trigger of type '${trigger}' could not be created.`
        );
    }

  }


  create(value: TriggerTypes[T], callback: () => void): number {
    this.manufacturedTrigger.onTrigger(callback);
    const id = this.manufacturedTrigger.create(value);

    return id;
  }

  restart(id: number, callback: () => void, startup = false): void {
    this.manufacturedTrigger.onTrigger(callback);
    this.manufacturedTrigger.restart(id, startup);
  }

  update(id: number, value: TriggerTypes[T], callback: () => void): void {
    this.manufacturedTrigger.onTrigger(callback);
    this.manufacturedTrigger.update(id, value);
  }

  delete(id: number): void {
    this.manufacturedTrigger.delete(id);
  }
}

