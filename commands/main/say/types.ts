import Command from "../../command";


export interface Say extends Command {
  /**
  * Changes the state of a task having a specified task name.
  * @param request List containing task name and its
  * corresponding atrributes to be modified.
  */
  modifyTask(request: Array<string>): string;

  /**
   * Makes sure that the command is structured properly.
   * @param message A list of words intended to be sent based
   * on the conditions in the meta data.
   * @param meta The information list which specifies how the
   * message must be sent.
   * @returns Indicates if the command is properly structured or not.
   */
  checkCommandStructure(message: Array<string>, meta: Array<string>): boolean

  /**
   * @param taskAttribute Task attribute that contain information that dictate
   * how a message should be sent by a particular task.
   * @param attributeValue The value of the task attribute to be validated.
   * @returns Performs a regex check to validate the format of each task
   * attribute.
   */
  checkAttributeValue(
    taskAttribute: string, attributeValue: string
  ): boolean;

  /**
   * Check if the passed attribute keys are valid.
   * @param attributeKeys A attribute that needs to be validated.
   */
  checkAttributeKeys(attributeKeys: string): boolean;

  /**
   * Check if the passed attribute keys are valid.
   * @param attributeKeys Arrays of attributes that needs to be validated.
   */
  checkAttributeKeys(attributeKeys: Array<string>): boolean;

  /**
   * Splits ':' delimited string interval to it's respective units of time.
   * @param interval
   * - Restricted combination of `hours`, `minutes` and `seconds` time units
   * delimited with a `: ` (colon) in a specific order.
   * - The formats are allowed to arranged in any of the following order:
   *    - `h: m: s`
   *    - `m: s`
   *    - `s`
   *
   * ```js
  * const inSeconds = parseInterval("24:00:00"); // In h:m:s format
   *
   * // OR
   *
   * const inSeconds = parseInterval("60:00"); // In m:s format
   * ```
   * @returns Returns a list of parsed units time.
   */
  parseInterval(
    interval: string
  ): [seconds: number, minutes: number, hours: number];

  /**
   * Checks if the range of the interval is valid in accordance to javascript.
   */
  validateIntervalRange(
    seconds: number, minutes?: number | null, hours?: number | null
  ): boolean;

  /** Converts each respective time unit to seconds. */
  convertToSeconds(
    seconds: number, minutes?: number | null, hours?: number | null
  ): number;
}
