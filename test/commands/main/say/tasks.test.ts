import fs from "fs";
import path from "path";
import {
  default as Tasks,
  getDBTask,
  Task,
  DBTask,
  DBTasks
} from "../../../../commands/main/say/tasks";
import {
  default as Scheduler,
  ParsedTask
} from "../../../../commands/main/say/scheduler";

import data from "./test-data/tasks.json";


jest.mock("../../../../commands/main/say/scheduler");
const MockedScheduler = Scheduler as jest.MockedClass<typeof Scheduler>;


describe("When managing the tasks for say command", () => {
  const databaseParentDir = path.join(process.cwd(), "commands", "main", "say");
  const databaseFileName = "tasks-db.test.json";
  const databasePath = path.join(databaseParentDir, databaseFileName);

  beforeEach(() => {
    fs.writeFileSync(databasePath, JSON.stringify([{}], null, 4));
  });

  afterAll(() => {
    if (fs.existsSync(databasePath)) fs.rmSync(databasePath);
  });


  describe("retrieving database path", () => {
    it("returns the expected database path", () => {
      expect(Tasks.databasePath).toBe(databasePath);
    });
  });

  describe("getDBTask function", () => {
    it("converts a task to be compatible with the database schema", () => {
      const task1: Task = {
        taskName: "task1",
        channel: "test_channel1",
        interval: "12345",
        message: "hello :D"
      };
      const dbTask1: DBTask = {
        channel: "test_channel1",
        interval: "12345",
        message: "hello :D"
      };

      expect(getDBTask(task1)).toStrictEqual(dbTask1);
    });
  });

  describe("while initializing tasks", () => {
    describe("where init method is invoked", () => {
      test("it activates all tasks in the scheduler", () => {
        const schedulerInitSpy = jest.spyOn(MockedScheduler, "init");
        const baseTaskAttributes: DBTask = {
          channel: "test_channel1",
          interval: "12345",
          message: "hello :D"
        };

        const dbTasks: DBTasks = {};
        const parsedTasks: Array<ParsedTask> = [];
        const totalTasks = 7;
        for (let i = 0; i < totalTasks; i++) {
          dbTasks[`task${i}`] = baseTaskAttributes;
          parsedTasks.push({
            ...baseTaskAttributes,
            interval: Number(baseTaskAttributes.interval),
            taskName: `task${i}`
          });
        }

        fs.writeFileSync(databasePath, JSON.stringify([dbTasks], null, 4));

        const db = fs.readFileSync(databasePath);
        const JSONfile = JSON.parse(db.toString());
        const [taskObject] = JSONfile;

        expect(taskObject).toStrictEqual(dbTasks);

        Tasks.init();

        expect(schedulerInitSpy).toBeCalledWith(parsedTasks);
      });
    });

    describe("but if the database is deleted", () => {
      test("it creates a new one", () => {
        fs.rmSync(databasePath);

        expect(fs.existsSync(databasePath)).toBeFalsy();
        Tasks.init();
        expect(fs.existsSync(databasePath)).toBeTruthy();
      });
    });
  });

  describe("while retrieving a task", () => {
    const taskObject: DBTasks = {
      "task1": {
        channel: "test_channel1",
        interval: "12345",
        message: "hello :D"
      },
      "task2": {
        channel: "test_channel2",
        interval: "56789",
        message: "hi :D"
      }
    };

    test("it returns an object with the task name as a key", () => {
      fs.writeFileSync(databasePath, JSON.stringify([taskObject], null, 4));

      const tasks = Tasks.retrieveTasks();
      expect(tasks).toStrictEqual(taskObject);
    });

    describe("But the database does not exists", () => {
      test("error is thrown indicating the same", () => {
        const fileExistanceSpy = jest.spyOn(fs, "existsSync");
        fileExistanceSpy.mockReturnValueOnce(false);

        expect(() => Tasks.retrieveTasks())
          .toThrow(
            "The local database doesn't exist or has been deleted: " +
            databasePath
          );
      });
    });

    describe("but the JSON structure of the task list is invalid", () => {
      test("error is thrown asking to clear tasks or fix it manually", () => {
        const validateJSONSpy = jest.spyOn(Tasks, "validateJSON");
        validateJSONSpy.mockReturnValueOnce(false);

        fs.writeFileSync(databasePath, JSON.stringify([taskObject], null, 4));
        let errorMsg = "Invalid Task List. Clear the task list using ";
        errorMsg += `'${process.env.PREFIX} clear task list'.`;
        errorMsg += " Advanced: Either delete or manually format local DB.";
        expect(() => Tasks.retrieveTasks()).toThrowError(errorMsg);
      });
    });
  });

  describe("a single task", () => {
    const task1: Task = {
      taskName: "task1",
      channel: "test_channel1",
      interval: "12345",
      message: "hello :D"
    };

    const addTaskSpy = jest.spyOn(MockedScheduler, "addTask");
    const removeTaskSpy = jest.spyOn(MockedScheduler, "removeTask");

    afterEach(() => {
      addTaskSpy.mockClear();
      removeTaskSpy.mockClear();
    });

    describe("can be created and the task is scheduled correspondingly", () => {
      test("on an empty database", () => {
        const newtask: Task = { ...task1 };
        const status = Tasks.createTask(newtask);

        const db = fs.readFileSync(databasePath);
        const JSONfile = JSON.parse(db.toString());
        const [taskObject] = JSONfile;

        const parsedTask = { ...task1, interval: Number(task1.interval) };
        const dbTask = { ...task1, taskName: undefined };
        delete dbTask.taskName;

        expect(status).toBe(
          `Task ${task1.taskName} activated on channel ${task1.channel}.`
        );
        expect(addTaskSpy).toBeCalledWith(parsedTask);
        expect(taskObject).toStrictEqual({ [task1.taskName]: dbTask });
      });

      test("on an database with an already existing task", () => {
        const dbTask1 = { ...task1, taskName: undefined };
        delete dbTask1.taskName;
        const dbTasks = { "task1": dbTask1 };
        fs.writeFileSync(databasePath, JSON.stringify([dbTasks], null, 4));

        const task2 = {
          taskName: "task2",
          channel: "test_channel2",
          interval: "56789",
          message: "hi :D"
        };
        const newtask: Task = { ...task2 };
        const status = Tasks.createTask(newtask);

        const db = fs.readFileSync(databasePath);
        const JSONfile = JSON.parse(db.toString());
        const [taskObject] = JSONfile;

        const parsedTask = { ...task2, interval: Number(task2.interval) };
        const dbTask2 = { ...task2, taskName: undefined };
        delete dbTask2.taskName;

        expect(status).toBe(
          `Task ${task2.taskName} activated on channel ${task2.channel}.`
        );
        expect(addTaskSpy).toBeCalledWith(parsedTask);
        expect(taskObject).toStrictEqual({
          [task1.taskName]: dbTask1,
          [task2.taskName]: dbTask2
        });
      });

      describe("but if the new task is not unique", () => {
        test("it tells the user than the task already exists", () => {
          const dbTask1 = { ...task1, taskName: undefined };
          delete dbTask1.taskName;
          const dbTasks = { "task1": dbTask1 };
          fs.writeFileSync(databasePath, JSON.stringify([dbTasks], null, 4));

          const task2 = {
            taskName: "task1",
            channel: "test_channel2",
            interval: "56789",
            message: "hi :D"
          };
          const newtask: Task = { ...task2 };
          expect(Tasks.createTask(newtask))
            .toBe(`Task '${task2.taskName}' already exists.`);
        });
      });
    });

    describe("can be updated", () => {
      test("success message is returned and scheduler is also updated", () => {
        let db, JSONfile, taskObject;

        const originalTask = {
          taskName: "task2",
          channel: "test_channel2",
          interval: "56789",
          message: "original message"
        };
        const dbTaskOriginal = { ...originalTask, taskName: undefined };
        delete dbTaskOriginal.taskName;
        const dbTask1 = { ...task1, taskName: undefined };
        delete dbTask1.taskName;
        const dbTasks = { "task1": dbTask1, "task2": dbTaskOriginal };
        fs.writeFileSync(databasePath, JSON.stringify([dbTasks], null, 4));

        db = fs.readFileSync(databasePath);
        JSONfile = JSON.parse(db.toString());
        [taskObject] = JSONfile;

        expect(taskObject).toStrictEqual({
          [task1.taskName]: dbTask1,
          [originalTask.taskName]: dbTaskOriginal
        });

        const modifiedTask = {
          taskName: "task3",
          channel: "test_channel4",
          interval: "2468",
          message: "modified message"
        };
        const status = Tasks.updateTask(originalTask.taskName, modifiedTask);

        db = fs.readFileSync(databasePath);
        JSONfile = JSON.parse(db.toString());
        [taskObject] = JSONfile;

        const addTaskCallOrder = addTaskSpy.mock.invocationCallOrder[0];
        const removeTaskCallOrder = removeTaskSpy.mock.invocationCallOrder[0];
        const parsedModifiedTask = {
          ...modifiedTask,
          interval: Number(modifiedTask.interval)
        };
        const dbTaskModified = { ...modifiedTask, taskName: undefined };
        delete dbTaskModified.taskName;

        expect(addTaskSpy).toBeCalledWith(parsedModifiedTask);
        expect(removeTaskSpy).toBeCalledWith(originalTask.taskName);
        expect(removeTaskCallOrder).toBeLessThan(addTaskCallOrder);
        expect(taskObject).toStrictEqual({
          [task1.taskName]: dbTask1,
          [modifiedTask.taskName]: dbTaskModified
        });
        expect(status)
          .toBe(`Task ${originalTask.taskName} successfully modified.`);
      });

      describe("but if no attribute to be modified is specifed", () => {
        test("error is thrown to specify an attribute", () => {
          expect(() => Tasks.updateTask("dummy-task-name", {}))
            .toThrow("Specify an attribute to be modified.");
          expect(addTaskSpy).not.toBeCalled();
          expect(removeTaskSpy).not.toBeCalled();
        });
      });

      describe("but trying to modify an unknown task", () => {
        test("message is relayed indicating the task is non-existent", () => {
          const dbTask1 = { ...task1, taskName: undefined };
          delete dbTask1.taskName;
          const dbTasks = { "task1": dbTask1 };
          fs.writeFileSync(databasePath, JSON.stringify([dbTasks], null, 4));

          const status = Tasks
            .updateTask(task1.taskName + "234", { interval: "9" });

          const db = fs.readFileSync(databasePath);
          const JSONfile = JSON.parse(db.toString());
          const [taskObject] = JSONfile;

          expect(status)
            .toBe(`The task '${task1.taskName}234' does not exists.`);
          expect(taskObject).toStrictEqual({ [task1.taskName]: dbTask1 });
          expect(addTaskSpy).not.toBeCalled();
          expect(removeTaskSpy).not.toBeCalled();
        });
      });
    });

    describe("can be deleted from the database", () => {
      test("success message is returned and the scheduler is updated", () => {
        let db, JSONfile, taskObject;

        const dbTask1 = { ...task1, taskName: undefined };
        delete dbTask1.taskName;
        const dbTasks = { "task1": dbTask1 };
        fs.writeFileSync(databasePath, JSON.stringify([dbTasks], null, 4));

        db = fs.readFileSync(databasePath);
        JSONfile = JSON.parse(db.toString());
        [taskObject] = JSONfile;

        expect(taskObject).toStrictEqual({ [task1.taskName]: dbTask1 });

        const status = Tasks.deleteTask(task1.taskName);

        db = fs.readFileSync(databasePath);
        JSONfile = JSON.parse(db.toString());
        [taskObject] = JSONfile;

        expect(status).toBe(`Task ${task1.taskName} successfully removed.`);
        expect(removeTaskSpy).toBeCalledWith(task1.taskName);
        expect(Object.keys(taskObject).length).toBe(0);
      });

      describe("but trying to remove an unknown task", () => {
        test("message is relayed back that the task is non-existent", () => {
          let db, JSONfile, taskObject;

          const dbTask1 = { ...task1, taskName: undefined };
          delete dbTask1.taskName;
          const dbTasks = { "task1": dbTask1 };
          fs.writeFileSync(databasePath, JSON.stringify([dbTasks], null, 4));

          db = fs.readFileSync(databasePath);
          JSONfile = JSON.parse(db.toString());
          [taskObject] = JSONfile;

          expect(taskObject).toStrictEqual({ [task1.taskName]: dbTask1 });

          const status = Tasks.deleteTask(task1.taskName + "23");

          db = fs.readFileSync(databasePath);
          JSONfile = JSON.parse(db.toString());
          [taskObject] = JSONfile;

          expect(status)
            .toBe(`The task '${task1.taskName}23' does not exists.`);
          expect(taskObject).toStrictEqual({ [task1.taskName]: dbTask1 });
          expect(removeTaskSpy).not.toBeCalled();
        });
      });
    });
  });

  describe("the database can be cleared", () => {
    const removeTaskSpy = jest.spyOn(MockedScheduler, "removeTask");

    afterEach(() => removeTaskSpy.mockClear());

    test("every task is removed from both database and the scheduler", () => {
      const baseTaskAttributes: DBTask = {
        channel: "test_channel1",
        interval: "12345",
        message: "hello :D"
      };

      const dbTasks: DBTasks = {};
      const taskNames: Array<string> = [];
      const totalTasks = 7;
      for (let i = 0; i < totalTasks; i++) {
        dbTasks[`task${i}`] = baseTaskAttributes;
        taskNames.push(`task${i}`);
      }

      fs.writeFileSync(databasePath, JSON.stringify([dbTasks], null, 4));

      let db, JSONfile, taskObject;
      db = fs.readFileSync(databasePath);
      JSONfile = JSON.parse(db.toString());
      [taskObject] = JSONfile;

      expect(taskObject).toStrictEqual(dbTasks);

      Tasks.clearTasks();

      db = fs.readFileSync(databasePath);
      JSONfile = JSON.parse(db.toString());
      [taskObject] = JSONfile;

      const removeTaskArgumentList = removeTaskSpy.mock.calls[0];

      expect(removeTaskSpy).toBeCalledTimes(totalTasks);
      for (let i = 0; i < removeTaskArgumentList.length; i++) {
        const taskName = removeTaskArgumentList[i];
        expect(taskName).toBe(taskNames[i]);
      }
      expect(Object.keys(taskObject).length).toBe(0);
    });
  });

  describe("the json database can be validated", () => {
    test("valid task list in the database returns true", () => {
      data.validTaskListStructs.forEach(taskList => {
        expect(Tasks.validateJSON(taskList)).toBeTruthy();
      });
    });

    test("invalid task list in the database returns false", () => {
      data.invalidTaskListStructs.forEach(taskList => {
        expect(Tasks.validateJSON(taskList)).toBeFalsy();
      });
    });
  });
});

