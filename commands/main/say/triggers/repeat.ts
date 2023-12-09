import {
  RawInterval,
  ParsedInterval
} from "../types";

import description from "../description";
import ValidationError from "../../../../utils/error";


export default class Repeat {
  private second: number;
  private minute: number | null;
  private hour: number | null;

  constructor(interval: string) {
    if (!checkInterval(interval)) {
      throw new ValidationError({response: description.interval});
    }

    const parsedInterval = parseInterval(interval);
    if (!validateInterval(parsedInterval)) {
      throw new ValidationError({response: description.interval});
    }

    [this.second, this.minute, this.hour] = parsedInterval;
  }


  get Seconds(): number {
    return convertToSeconds(this.second, this.minute, this.hour)
  }
}


/**
 * Check if the interval conforms to a defined structure delimted by `:`.
 * @param interval
 * @description
 * - Restricted combination of `hours`, `minutes` and `seconds` time units
 * delimited with a `: ` (colon) in a specific order.
 * - The formats are allowed to arranged in any of the following order:
 *    - `h: m: s`
 *    - `m: s`
 *    - `s`
 */
function checkInterval(interval: string): interval is RawInterval {
  if (interval.match(/^\d+$|^(\d+:){1,2}(\d+)$/)) return true;
  return false;
}


/**
 * Splits ':' delimited string interval to it's respective units of time.
 * @param interval
 * @returns Returns a list of parsed units time.
 */
function parseInterval(interval: RawInterval): ParsedInterval {
  const timeParts = interval.split(":");

  let parsedInterval: ParsedInterval;
  if (timeParts.length === 1) {
    parsedInterval = [parseInt(timeParts[0]), null, null];
  }
  else if (timeParts.length === 2) {
    parsedInterval = [parseInt(timeParts[1]), parseInt(timeParts[0]), null];
  }
  else {
    parsedInterval = [
      parseInt(timeParts[2]), parseInt(timeParts[1]), parseInt(timeParts[0])
    ];
  }
  return parsedInterval;
}


/** Checks if the range of the interval is valid in accordance to javascript. */
function validateInterval(interval: ParsedInterval): boolean {
  // Negative time parts are handled by regex.
  const [seconds, minutes, hours] = interval;
  const intervalInSeconds = convertToSeconds(seconds, minutes, hours);
  const maxPositiveSigned32bit: number = Math.pow(2, 31) - 1;

  if (intervalInSeconds === 0) return false;
  if (intervalInSeconds > maxPositiveSigned32bit) return false;

  return true;
}


/** Converts each respective time unit to seconds. */
function convertToSeconds(
  seconds: number, minutes: number | null, hours: number | null
): number {
  if (minutes) {seconds += (minutes * 60);}
  if (hours) {seconds += (hours * 60 * 60);}

  return seconds;
}

