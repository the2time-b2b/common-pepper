const fs = require("fs");

const { onMessageHandler, configProps } = require("../../common-pepper");
const { user: userEntitity } = require("../context");
const testSets = require("./test-sets/say");
const { say, DB_PATH } = require("../../commands/main/say/index");
const { toBe } = require("../helper");


describe("The 'say' command should", () => {
  const { context, self } = userEntitity;
  const target = "#sven_snusberg";
  const cmdName = `${configProps.PREFIX}say `;

  beforeEach(() => {
    fs.writeFileSync(DB_PATH, JSON.stringify([{}], null, 4));
  });

  test("have a JSON database initialized if it doesn't exists", () => {
    expect(fs.existsSync(DB_PATH)).toBeTruthy();
    const db = fs.readFileSync(DB_PATH);
    expect(JSON.parse(db)).toEqual([{}]);
  });

  test("accept a well-crafted request", () => {
    const totalWaitIntervalList = [
      1 * 60 * 60,
      30 * 60,
      60
    ];

    for (let i = 0; i < testSets.validCommandList.length; i++) {
      let db = fs.readFileSync(DB_PATH);
      let [tasks] = JSON.parse(db);
      expect(Object.keys(tasks)).toHaveLength(i);

      const cmdParts = testSets.validCommandList[i].split(" ");
      const taskName = cmdParts[cmdParts.length - 1];
      const channel = cmdParts[cmdParts.length - 3];
      const sayMessage = cmdParts
        .splice(0, cmdParts.indexOf("every")).join(" ");
      const args = [context, cmdName + testSets.validCommandList[i], self];
      const client = toBe(
        target,
        `Task ${taskName} activated on channel ${channel.toLowerCase()}.`
      );

      onMessageHandler(client, target, ...args);

      const newTask = {
        totalWaitInterval: totalWaitIntervalList[i],
        channel: channel.toLowerCase(),
        taskMessage: sayMessage
      };

      db = fs.readFileSync(DB_PATH);
      [tasks] = JSON.parse(db);
      expect(Object.keys(tasks)).toHaveLength(i + 1);
      expect(tasks).toHaveProperty(taskName);
      expect(tasks[taskName]).toEqual(newTask);

    }
  });

  test("return command usage information", () => {
    testSets.commandInfoList.forEach(meta => {
      const args = [
        context, context["display-name"] + ", " + cmdName + meta, self
      ];
      const client = toBe(target, say[meta]);

      onMessageHandler(client, target, ...args);
    });
  });

  test("display the command usage format for badly formatted commands", () => {
    for (let i = 0; i < testSets.invalidCommandList.length; i++) {
      const args = [context, cmdName + testSets.invalidCommandList[i], self];
      const client = toBe(target, say.usage);

      onMessageHandler(client, target, ...args);
    }
  });

  describe("capture all regex mismatch", () => {
    const mismatchTypeResultPair = {
      "every": "Interval should be in h:m:s or m:s or s format.",
      "on": "Username should only contain alphanumeric and underscores, " +
        "ranging from 4-25 characters only.",
      "named": "Task names should only contain alphanumerics, hyphens and" +
        " underscores, ranging from 3-50 characters only."
    };

    for (const type in mismatchTypeResultPair) {
      test(`For the ${type}`, () => {
        let cmdPart1, cmdPart2, cmdPart3;
        switch (type) {
          case "every":
            cmdPart1 = "test message every ";
            cmdPart2 = testSets.invalidIntervalList;
            cmdPart3 = " on testChannel named task-name";
            break;
          case "on":
            cmdPart1 = "test message every 1:0:0 on ";
            cmdPart2 = testSets.invalidChannelList;
            cmdPart3 = " named task-name";
            break;
          case "named":
            cmdPart1 = "test message every 1:0:0 on testChannel named ";
            cmdPart2 = testSets.invalidTaskNameList;
            cmdPart3 = "";
            break;
        }

        for (let i = 0; i < cmdPart2.length; i++) {
          const args = [
            context, cmdName + (cmdPart1 + cmdPart2[i] + cmdPart3), self
          ];
          const client = toBe(target, mismatchTypeResultPair[type]);

          onMessageHandler(client, target, ...args);
        }
      });
    }

    test("when trying to modify a particular task", () => {
      let command = cmdName + "test msg every 1:0:0 on channel named task-name";
      const args = [context, command, self];
      const client = toBe(
        target, "Task task-name activated on channel channel."
      );

      onMessageHandler(client, target, ...args);

      const invalidCommandPartList = {
        every: testSets.invalidIntervalList,
        on: testSets.invalidChannelList,
        named: testSets.invalidTaskNameList
      };

      Object.keys(invalidCommandPartList).forEach(modifiedType => {
        command = cmdName + "modify task-name ";
        command += modifiedType + " ";

        for (let i = 0; i < invalidCommandPartList[modifiedType].length; i++) {
          const args = [
            context, command + invalidCommandPartList[modifiedType][i], self
          ];
          const client = toBe(target, mismatchTypeResultPair[modifiedType]);
          onMessageHandler(client, target, ...args);
        }
      });
    });
  });

  test("not accept invalid intervals", () => {
    let invNum = "1";
    for (let i = 0; i < 309; i++) {
      invNum += "0";
    }

    // Non-numeric entry restriction is tested by the regex-mismatch test.
    const commandList = [
      "test msg every 0:0:0 on channel named task-name",
      `test msg every ${invNum}:0:0 on channel named task-name`,
      `test msg every 0:${invNum}:0 on channel named task-name`,
      `test msg every 0:0:${invNum} on channel named task-name`,
      `test msg every ${invNum}:${invNum}:0 on channel named task-name`,
      `test msg every 0:${invNum}:${invNum} on channel named task-name`,
      `test msg every ${invNum}:0:${invNum} on channel named task-name`,
      `test msg every ${invNum}:${invNum}:${invNum} on channel named task-name`
    ];

    for (let i = 0; i < commandList.length; i++) {
      const args = [context, cmdName + commandList[i], self];
      const client = toBe(target, "Please enter a valid interval.");

      onMessageHandler(client, target, ...args);
    }
  });

  test("not allow duplicate task names", () => {
    const command = cmdName + "test msg every 1:0:0 on channel named task-name";
    const args = [context, command, self];
    let client = toBe(target, "Task task-name activated on channel channel.");

    onMessageHandler(client, target, ...args);

    client = toBe(target, "Task with name 'task-name' already exists.");

    onMessageHandler(client, target, ...args);
  });

  test("allow modification of already existing task names", () => {
    let command = cmdName + "test msg every 1:0:0 on channel named task-name";
    let args = [context, command, self];
    let client = toBe(target, "Task task-name activated on channel channel.");

    onMessageHandler(client, target, ...args);

    const commandPartList = {
      say: "this is not a test",
      every: "2:0:0",
      on: "anotherChannel",
      named: "another-task-name"
    };

    Object.keys(commandPartList).forEach(modifiedType => {
      command = cmdName + "modify task-name " + modifiedType + " ";
      command += commandPartList[modifiedType];
      args = [context, command, self];
      client = toBe(target, "Task task-name successfully modified.");

      onMessageHandler(client, target, ...args);

      const db = fs.readFileSync(DB_PATH);
      const [tasks] = JSON.parse(db);
      expect(Object.keys(tasks)).toHaveLength(1);
      expect(tasks).toHaveProperty(
        modifiedType !== "named" ? "task-name" : commandPartList["named"]
      ); // Concurrently test for modified task name.

      switch (modifiedType) {
        case "say":
          expect(tasks["task-name"].taskMessage).toBe("this is not a test");
          break;
        case "every":
          expect(tasks["task-name"].totalWaitInterval).toBe(7200);
          break;
        case "on":
          expect(tasks["task-name"].channel).toBe("anotherchannel");
          break;
      }
    });
  });

  test("not allow modifications with invalid argument", () => {
    let command = cmdName + "test msg every 1:0:0 on channel named task-name";
    let args = [context, command, self];
    let client = toBe(target, "Task task-name activated on channel channel.");

    onMessageHandler(client, target, ...args);

    const commandList = testSets.invalidModifyCommandList;

    commandList.forEach(type => {
      command = cmdName + type;
      args = [context, command, self];
      client = toBe(target, say.modify);

      onMessageHandler(client, target, ...args);

      const db = fs.readFileSync(DB_PATH);
      const [tasks] = JSON.parse(db);
      expect(Object.keys(tasks)).toHaveLength(1);
      expect(tasks).toHaveProperty("task-name");

      switch (type) {
        case "say":
          expect(tasks["task-name"].taskMessage).toBe("test msg");
          break;
        case "every":
          expect(tasks["task-name"].totalWaitInterval).toBe(3600);
          break;
        case "on":
          expect(tasks["task-name"].channel).toBe("channel");
          break;
      }
    });
  });

  test("allow deletion of already existing task names", () => {
    let command = cmdName + "test msg every 1:0:0 on channel named task-name";
    let args = [context, command, self];
    let client = toBe(target, "Task task-name activated on channel channel.");

    onMessageHandler(client, target, ...args);

    let db = fs.readFileSync(DB_PATH);
    let [tasks] = JSON.parse(db);
    expect(Object.keys(tasks)).toHaveLength(1);

    command = cmdName + "modify task-name delete";
    args = [context, command, self];
    client = toBe(target, "Task task-name successfully removed.");

    onMessageHandler(client, target, ...args);

    db = fs.readFileSync(DB_PATH);
    [tasks] = JSON.parse(db);
    expect(Object.keys(tasks)).toHaveLength(0);
  });

  test("allow users to clear the JSON database", () => {
    const command = cmdName + "clear task list";
    const args = [context, command, self];
    const client = toBe(target, "The task list has been wiped clean.");
    onMessageHandler(client, target, ...args);

    const db = fs.readFileSync(DB_PATH);
    expect(JSON.parse(db)).toEqual([{}]);
  });

  describe("handle JSON database error where", () => {
    test("there is an invalid JSON format", () => {
      fs.writeFileSync(DB_PATH, "[{}}]");

      const newTask = {
        totalWaitInterval: 3600,
        channel: "channel",
        taskMessage: "test message"
      };

      const func = jest.spyOn(console, "error");
      say.updateTaskList("task-name", "create", newTask);
      expect(func).toHaveBeenCalledWith(
        "Unexpected token } in JSON at position 3 for the file in path: "
        + DB_PATH
      );
    });

    test("the JSON database file does not exist", () => {
      fs.rmSync(DB_PATH);

      const newTask = {
        totalWaitInterval: 3600,
        channel: "channel",
        taskMessage: "test message"
      };

      const errorLog = jest.spyOn(console, "error");
      say.updateTaskList("task-name", "create", newTask);
      expect(errorLog).toHaveBeenCalledWith(
        `ENOENT: no such file or directory, open '${DB_PATH}'`
      );
    });

    describe("handle manual changes to JSOB DB directly where", () => {
      test("the entire task list is improperly structured", () => {
        testSets.invalidTaskListStructs.forEach(invalidTaskList => {
          fs.writeFileSync(DB_PATH, JSON.stringify(invalidTaskList, null, 2));
          const command = cmdName +
            "modify task-name say another test message";
          const args = [context, command, self];
          const client = toBe(target, "Invalid Task List.");

          onMessageHandler(client, target, ...args);
        });
      });
    });
  });


  afterAll(() => {
    if (fs.existsSync(DB_PATH)) {
      fs.rmSync(DB_PATH); // Remove JSON database used for testing.
    }
    expect(fs.existsSync(DB_PATH)).toBeFalsy();
  });
});
