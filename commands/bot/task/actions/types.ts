import { AtLeastOne } from "../../../../utils/types";

export class Actions<T extends keyof ActionTypes> {
  id: number | null = null;

  create(value: ActionTypes[T]): number;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  create(_value: ActionTypes[T]): number {
    throw new Error("Custom implementation must be provided.");
  }

  toExecute(id: number): () => void;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toExecute(_id: number): () => void {
    throw new Error("Custom implementation must be provided.");
  }

  delete(id: number): void;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  delete(_id: number): void {
    throw new Error("Custom implementation must be provided.");
  }

  update(id: number, value: AtLeastOne<ActionTypes[T]>): void;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_id :number, _value: AtLeastOne<ActionTypes[T]>): void {
    throw new Error("Custom implementation must be provided.");
  }
}


export interface ActionTypes {
  echo: Omit<EchoSchema, "id">
}


export interface ActionTables {
  echo: EchoSchema
}

export interface EchoSchema {
  id: number
  channel: string,
  message: string
}

export type EchoArgs = Omit<EchoSchema, "id">;
