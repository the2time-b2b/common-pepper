import {
  checkAttributeStructure,
  validateModifyAttribute,
  checkInterval,
  checkChannelName,
  checkTaskName,
  parseInterval,
  convertToSeconds,
  validateInterval
} from "../../../../commands/main/say/service";
import { ParsedInterval } from "../../../../commands/main/say/types";


describe("command attribute structure is properly validated", () => {
  test("valid attribute keys returns true", () => {
    const validAttributeKeys = [
      ["every", "1:30:15", "on", "justintv", "named", "test_task"],
      ["every", "", "on", "", "named", ""],
      ["every", "::", "on", "justintv", "named", "test_task"],
      ["every", "1:30:15", "on", "123", "named", "test_task"],
      ["every", "1:30:15", "on", "123", "named", "a"],
    ];

    validAttributeKeys.forEach(attributes => {
      const checkresult = checkAttributeStructure(attributes);
      expect(checkresult).toBeTruthy();
    });
  });

  test("invalid attributes keys returns false", () => {
    const invalidAttributeKeys = [
      ["time", "1:30:15", "on", "justintv", "named", "test_task"],
      ["every", "1:30:15", "channel", "justintv", "named", "test_task"],
      ["every", "1:30:15", "on", "justintv", "taskName", "test_task"],
      ["", "1:30:15", "on", "justintv", "named", "test_task"],
      ["every", "1:30:15", "", "justintv", "named", "test_task"],
      ["every", "1:30:15", "on", "justintv", "", "test_task"],
      ["on", "justintv", "every", "1:30:15", "named", "test_task"],
      ["every", "1:30:15", "named", "test_task", "on", "justintv"],
      ["named", "test_task", "on", "justintv", "every", "1:30:15"],
      ["on", "justintv", "named", "test_task"],
      ["every", "1:30:15", "named", "test_task"],
      ["every", "1:30:15", "on", "justintv"],
      ["every", "time", "1:30:15", "on", "justintv", "named", "test_task"],
      ["in", "every", "1:30:15", "on", "justintv", "named", "test_task"],
      ["every", "1:30:15", "on", "every", "justintv", "named", "test_task"],
      ["every", "1:30:15", "channel", "on", "justintv", "named", "test_task"],
      ["every", "1:30:15", "on", "justintv", "named", "task", "test_task"],
      ["every", "1:30:15", "on", "justintv", "task", "named", "test_task"],
    ];
    invalidAttributeKeys.forEach(attributes => {
      const checkResult = checkAttributeStructure(attributes);
      expect(checkResult).toBeFalsy();
    });
  });
});


describe("command for modifying a task is validated", () => {
  const validAttributes = ["say", "every", "on", "named"];
  const invalidAttributes = ["message", "interval", "channel", "taskName"];

  test("valid attribute keys returns true", () => {
    validAttributes.forEach(attribute => {
      const checkResult = validateModifyAttribute(attribute);
      expect(checkResult).toBeTruthy();
    });
  });

  test("valid attribute keys returns false", () => {
    invalidAttributes.forEach(attribute => {
      const checkResult = validateModifyAttribute(attribute);
      expect(checkResult).toBeFalsy();
    });
  });
});


describe("the interval should be properly structured", () => {
  test("valid intervals returns true", () => {
    const validIntervals = [
      "1:30:15", "15", "0:30:15", "0:0:15", "0:15",
    ];
    validIntervals.forEach(interval => {
      const checkResult = checkInterval(interval);
      expect(checkResult).toBeTruthy();
    });
  });

  test("invalid intervals returns false", () => {
    const invalidIntervals = [
      "1:0:0:0", "a:b:c", "-1:0:0", "1:0:b", "1.5:0:0", ":::", "1::", "1:0:",
      ":", "1:0:0:"
    ];
    invalidIntervals.forEach(interval => {
      const checkResult = checkInterval(interval);
      expect(checkResult).toBeFalsy();
    });
  });
});


describe("username should be conforms twitch username requirments", () => {
  test("legal usernames returns true", () => {
    const validChannelList = [
      "justintv", "justin_tv", "justintv123", "justin_tv123",
      "thisis25characterusername"
    ];

    validChannelList.forEach(username => {
      const checkResult = checkChannelName(username);
      expect(checkResult).toBeTruthy();
    });
  });

  test("illegal usernames returns false", () => {
    const invalidChannelList = [
      "jim", "justin-tv", "thisis26chartwitchusername", "justintv#123",
      "justin tv"
    ];

    invalidChannelList.forEach(username => {
      const checkResult = checkChannelName(username);
      expect(checkResult).toBeFalsy();
    });
  });
});

describe("task name should conform to the set program defined rule", () => {
  test("valid task names returns true", () => {
    const validTaskNames = ["tasn_name", "tasn-name", "task-Name_123"];

    validTaskNames.forEach(name => {
      const checkResult = checkTaskName(name);
      expect(checkResult).toBeTruthy();
    });
  });

  test("invalid task names returns false", () => {
    const invalidTaskNames = [
      "tn",
      "thisisaunnecessaryforty1charactertaskname"
    ];

    invalidTaskNames.forEach(name => {
      const checkResult = checkTaskName(name);
      expect(checkResult).toBeFalsy();
    });
  });
});


describe("raw interval is parsed to an array of time units", () => {
  describe("intervals with supplied with seconds only", () => {
    test("first element is a number while the rest are null values", () => {
      const interval = "15";
      expect(parseInterval(interval)).toStrictEqual([15, null, null]);
    });
  });

  describe("intervals with supplied with seconds and minutes", () => {
    test("first two elements are numbers while rest are null values", () => {
      const interval = "30:15";
      expect(parseInterval(interval)).toStrictEqual([15, 30, null]);
    });
  });

  describe("intervals with supplied all three time units", () => {
    test("all three elements are numbers", () => {
      const interval = "1:30:15";
      expect(parseInterval(interval)).toStrictEqual([15, 30, 1]);
    });
  });
});


describe("units of time can be converted to seconds", () => {
  test("when the argument is supplied with individual units of time", () => {
    expect(convertToSeconds(15, null, null)).toBe(15);
    expect(convertToSeconds(15, 30, null)).toBe(15 + (30 * 60));
    expect(convertToSeconds(15, 30, 5)).toBe(15 + (30 * 60) + (5 * 60 * 60));
  });
});


describe("parsed interval is made sure to be valid", () => {
  describe("by returning false whose seconds equivalent to", () => {
    test("zero", () => {
      const parsedIntervals: Array<ParsedInterval> = [
        [0, null, null],
        [0, 0, null],
        [0, 0, 0]
      ];

      parsedIntervals.forEach(parsedInterval => {
        expect(validateInterval(parsedInterval)).toBeFalsy();
      });
    });

    test("more than maximum number a setInterval timeout takes", () => {
      const temp = Math.pow(2, 31); // Max negative 32 bit signed integer.
      const parsedIntervals: Array<ParsedInterval> = [
        [temp, null, null],
        [temp/2, temp/2, null],
        [temp/3, temp/3, temp/3],
      ];

      parsedIntervals.forEach(parsedInterval => {
        expect(validateInterval(parsedInterval)).toBeFalsy();
      });
    });
  });

  describe("by returning true whose seconds equivalent to", () => {
    test("non-zero", () => {
      const parsedIntervals: Array<ParsedInterval> = [
        [15, null, null],
        [15, 30, null],
        [15, 30, 45],
      ];

      parsedIntervals.forEach(parsedInterval => {
        expect(validateInterval(parsedInterval)).toBeTruthy();
      });
    });
    test("less than maximum number a setInterval timeout takes", () => {
      const temp = Math.pow(2, 31); // Max negative 32 bit signed integer.
      const parsedIntervals: Array<ParsedInterval> = [
        [1, null, null],
        [1, 0, null],
        [0, 1, null],
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
        [temp - 1, null, null],
        [temp/2, Math.floor((temp/(2 * 60))), null],
        [temp/3, Math.floor(temp/(3 * 60)), Math.floor(temp/(3 * 60 * 60))],
      ];

      parsedIntervals.forEach(parsedInterval => {
        expect(validateInterval(parsedInterval)).toBeTruthy();
      });
    });
  });
});
