import { ActionTypes, Actions } from "./types";
import Echo from "./echo";


export default interface Action<T extends keyof ActionTypes> {
  type: T;
  value: ActionTypes[keyof ActionTypes];
}


export class ActionFactory<T extends keyof ActionTypes> {
  action: Actions<T>;

  constructor(action: T) {
    switch (action) {
      case "echo": {
        this.action = new Echo();
        break;
      }
      default:
        throw new Error(
          `FATAL: Action of type '${action}' could not be created.`
        );
    }
  }
}

