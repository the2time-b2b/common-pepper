import {
  TriggerTypes
} from "./types";



/** Inititalize a trigger type by setting it's corresponding values. */
export default interface Trigger<T extends keyof TriggerTypes> {
  type: T;
  value: TriggerTypes[T];
}

