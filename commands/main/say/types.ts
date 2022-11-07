import Command from "../../command";


export interface Say extends Command {
  /**
  * Changes the state of a task having a specified task name.
  * @param request List containing task name and its
  * corresponding atrributes to be modified.
  */
  modifyTask(request: Array<string>): string;
}


export enum TaskAttributes {
  Message = "say",
  Interval = "every",
  Channel = "on",
  TaskName = "named",
}


export type CreateTaskStructure = [
  intervalAttribute: TaskAttributes.Interval,
  interval: string,
  channelAttribute: TaskAttributes.Channel,
  channel: string,
  taskNameAttribute: TaskAttributes.TaskName,
  taskName: string,
];


type RawSeconds = `${number}`;
type RawMinutes = `${number}:${number}`;
type RawHours = `${number}:${number}:${number}`;

export type RawInterval = RawSeconds | RawMinutes | RawHours;


type ParsedSeconds = [seconds: number, minutes: null, hours: null];
type ParsedMinutes = [seconds: number, minutes: number, hours: null];
type ParsesHours = [seconds: number, minutes: number, hours: number];

export type ParsedInterval = ParsedSeconds | ParsedMinutes | ParsesHours;
