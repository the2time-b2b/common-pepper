import Command from "../../command";


export interface Say extends Command {
  /**
  * Changes the state of a task having a specified task name.
  * @param request List containing task name and its
  * corresponding atrributes to be modified.
  */
  modifyTask(request: Array<string>): string;
}


export const CommandAttributes = {
  message: "say",
  interval: "every",
  channel: "on",
  name: "named",
} as const;


export type CommandAttribute = keyof typeof CommandAttributes;
export type CommandAttributeValue = typeof CommandAttributes[CommandAttribute];


export type TaskAttribute = Exclude<CommandAttribute, "name">;


const IntervalTaskAttribute = { interval: CommandAttributes.interval } as const;
type IntervalAttribute = keyof typeof IntervalTaskAttribute;
type IntervalAttributeValue = typeof IntervalTaskAttribute[IntervalAttribute];

const ChannelTaskAttribute = { channel: CommandAttributes.channel } as const;
type ChannelAttribute = keyof typeof ChannelTaskAttribute;
type ChannelAttributeValue = typeof ChannelTaskAttribute[ChannelAttribute];

const TaskNameTaskAttribute = { taskName: CommandAttributes.name } as const;
type TaskNameAttribute = keyof typeof TaskNameTaskAttribute;
type TaskNameAttributeValue = typeof TaskNameTaskAttribute[TaskNameAttribute];


/** Ordered attribute structure used to create a task. */
export type TaskStructure = [
  intervalAttribute: IntervalAttributeValue,
  interval: string,
  channelAttribute: ChannelAttributeValue,
  channel: string,
  taskNameAttribute: TaskNameAttributeValue,
  taskName: string,
] |
[
  intervalAttribute: IntervalAttributeValue,
  interval: string,
  taskNameAttribute: TaskNameAttributeValue,
  taskName: string,
];


type RawSeconds = `${number}`;
type RawMinutes = `${number}:${number}`;
type RawHours = `${number}:${number}:${number}`;

/**
 * String literal of `:` seperated number supplied by the user respresenting an
 * interval.
 */
export type RawInterval = RawSeconds | RawMinutes | RawHours;

export type ParsedInterval = [hours: number, minutes: number, seconds: number];
