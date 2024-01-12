import fs from "fs";
import path from "path";
import Database, { Statement } from "better-sqlite3";

import {
  default as Tasks,
  DBTask,
  TaskSchema
} from "../../../../commands/main/say/tasks";
import { default as Scheduler } from "../../../../commands/main/say/scheduler";
import hasProperty from "../../../../utils/property-assert";

import * as logger from "../../../../utils/logger";


jest.mock("../../../../utils/logger");
jest.mock("../../../../commands/main/say/scheduler");

const SchedulerMock = Scheduler as jest.MockedClass<typeof Scheduler>;
const LoggerMock = logger as jest.Mocked<typeof logger>;

const prepareSpy = jest.spyOn(Database.prototype, "prepare");

const databaseParentDir = path.join(process.cwd(), "db");
const databaseFileName = "tasks.test.db";
const databasePath = path.join(databaseParentDir, databaseFileName);
if (fs.existsSync(databasePath)) fs.rmSync(databasePath);

afterAll(() => {
  if (fs.existsSync(databasePath)) fs.rmSync(databasePath);
});

describe("When managing the tasks for say command", () => {
  describe("database is initalized", () => {
    beforeEach(() => {
      if (fs.existsSync(databasePath)) fs.rmSync(databasePath);
      prepareSpy.mockClear();
      LoggerMock.info.mockClear();
    });

    test("at the expected database directory", () => {
      const tasks = new Tasks();

      expect(tasks.databasePath).toBe(databasePath);
      expect(tasks.databaseDir).toBe(databaseParentDir);
    });

    // Tables names per database are unique and a single row is expected.
    const checkTable = "SELECT name FROM sqlite_master " +
      "WHERE type='table' AND name='tasks'";
    const createTaskTable = "CREATE TABLE tasks " +
      "(name TEXT, channel TEXT, message TEXT, interval INTEGER);";

    it("prepare to create a database only when it does not exist", () => {
      new Tasks();

      expect(prepareSpy).toHaveBeenCalledTimes(1);
      expect(prepareSpy).toBeCalledWith(createTaskTable);

      const testConn = new Database(databasePath);
      const row: unknown = testConn.prepare(checkTable).get();
      expect(row).toBeDefined();
      if (row && typeof row === "object" && hasProperty(row, "name")) {
        expect(row.name).toBe("tasks");
      }
      expect(logger.info)
        .toBeCalledWith("Database does not exist, new one will be created.");
    });

    it("then the prepared statement returned is then executed", () => {
      const testDB = new Database(databasePath);
      const statement = testDB.prepare("SELECT NULL;");

      // Clear the mock data used to initalize the 'run' spy.
      prepareSpy.mockClear();
      if (fs.existsSync(databasePath)) fs.rmSync(databasePath);

      const runMock = jest.fn();
      prepareSpy.mockImplementationOnce(() => {
        const mockStatement: Statement = { ...statement, run: runMock };
        return mockStatement;
      });

      new Tasks();
      expect(prepareSpy).toHaveBeenCalledTimes(1);
      expect(prepareSpy).toBeCalledWith(createTaskTable);
      expect(runMock).toBeCalledTimes(1);
      expect(logger.info).toBeCalledTimes(1);
      expect(logger.info)
        .toBeCalledWith("Database does not exist, new one will be created.");
    });

    it("if the database already exists, returns database object", () => {
      new Tasks(); // Wait for database to initalize.

      expect(prepareSpy).toHaveBeenCalledTimes(1);
      expect(prepareSpy).toBeCalledWith(createTaskTable);

      // After Initialization, clear the mock.
      prepareSpy.mockClear();
      LoggerMock.info.mockClear();

      new Tasks();
      expect(prepareSpy).not.toBeCalled();

      const testConn = new Database(databasePath);
      const row: unknown = testConn.prepare(checkTable).get();
      expect(row).toBeDefined();
      if (row && typeof row === "object" && hasProperty(row, "name")) {
        expect(row.name).toBe("tasks");
      }
      expect(logger.info).not.toBeCalled();
    });
  });


  describe("while initializing tasks", () => {
    describe("where init method is invoked", () => {
      const schedulerInitSpy = jest.spyOn(SchedulerMock, "init");
      beforeEach(() => {
        schedulerInitSpy.mockClear();
      });


      test("it activates all tasks in the scheduler", () => {
        const tasks = new Tasks();

        const parsedTasks: Array<DBTask> = [];
        const totalTasks = 7;
        for (let i = 0; i < totalTasks; i++) {
          const task = {
            name: `task${i}`,
            channel: "test_channel1",
            interval: 12345,
            message: "hello :D"
          };

          const testConn = new Database(databasePath);
          testConn
            .prepare(
              "INSERT INTO tasks (name, channel, interval, message) " +
              "VALUES(?, ?, ?, ?)")
            .run(task.name, task.channel, task.interval, task.message);

          parsedTasks.push(task);
        }

        tasks.init();

        expect(schedulerInitSpy).toHaveBeenCalledTimes(1);
        expect(schedulerInitSpy).toBeCalledWith(parsedTasks);
      });
    });

    describe("but if the database is deleted", () => {
      test("reinitialization creates a new one", () => {
        fs.rmSync(databasePath);

        expect(fs.existsSync(databasePath)).toBeFalsy();
        new Tasks();
        expect(fs.existsSync(databasePath)).toBeTruthy();
      });
    });
  });


  describe("a single task", () => {
    const addTaskSpy = jest.spyOn(SchedulerMock, "addTask");
    const removeTaskSpy = jest.spyOn(SchedulerMock, "removeTask");

    beforeEach(() => {
      if (fs.existsSync(databasePath)) fs.rmSync(databasePath);
      addTaskSpy.mockClear();
      removeTaskSpy.mockClear();
    });


    describe("can be created ", () => {
      const testTask: DBTask = {
        name: "testTask",
        channel: "test_channel1",
        interval: 12345,
        message: "hello :D"
      };
      const checkTask = "SELECT name, channel, message, interval FROM tasks " +
        "WHERE name = ?";

      test("on a database and task is scheduled correspondingly", () => {
        const tasks = new Tasks();
        const testConn = new Database(databasePath);
        const specificTask = testConn.prepare(checkTask);

        expect(specificTask.all(testTask.name).length).toBe(0);

        const status = tasks.createTask(testTask);

        const row = testConn.prepare(checkTask).get(testTask.name);
        expect(specificTask.all(testTask.name).length).toBe(1);


        if (!TaskSchema(row)) throw new Error("schema is incompatible");
        expect(row.name).toBe(testTask.name);
        expect(row.channel).toBe(testTask.channel);
        expect(row.message).toBe(testTask.message);
        expect(row.interval).toBe(testTask.interval);

        expect(addTaskSpy).toBeCalledTimes(1);
        expect(addTaskSpy).toBeCalledWith(testTask);
        expect(status).toBe(
          `Task ${testTask.name} activated on channel ${testTask.channel}.`
        );
      });

      test("cannot create a task with a duplicate task name", () => {
        const tasks = new Tasks(); // Create table.
        const testConn = new Database(databasePath);

        const specificTask = testConn.prepare(checkTask);
        expect(specificTask.all(testTask.name).length).toBe(0);

        const insertTask = "INSERT INTO tasks " +
          "(name, channel, message, interval) VALUES (?, ?, ?, ?)";
        testConn.prepare(insertTask).run(
          testTask.name, testTask.channel, testTask.message, testTask.interval);
        expect(specificTask.all(testTask.name).length).toBe(1);

        const status = tasks.createTask(testTask);

        expect(specificTask.all(testTask.name).length).toBe(1);
        expect(addTaskSpy).not.toBeCalled();
        expect(status).toBe(`Task '${testTask.name}' already exists.`);
      });
    });

    describe("can be modified", () => {
      const taskLength = 10;
      const taskList: Record<string, DBTask> = {};

      let tasks: Tasks;
      let testConn: ReturnType<typeof Database>;
      let allTasks: ReturnType<typeof testConn.prepare>;

      beforeEach(() => {
        if (fs.existsSync(databasePath)) fs.rmSync(databasePath);
        tasks = new Tasks();
        testConn = new Database(databasePath);
        testConn.prepare("DELETE FROM tasks;").run();
        allTasks = testConn
          .prepare("SELECT name, message, channel, interval FROM tasks;");

        const insertTask = "INSERT INTO tasks " +
          "(name, channel, message, interval) VALUES (?, ?, ?, ?)";
        for (let i = 0; i < taskLength; i++) {
          const task: DBTask = {
            name: "task" + i.toString(),
            channel: "test_channel" + i.toString(),
            interval: 0 + i,
            message: "message" + i.toString()
          };
          testConn
            .prepare(insertTask)
            .run(task.name, task.channel, task.message, task.interval);

          taskList[task.name] = task;
        }

        const beforeModify = allTasks.all([]);
        expect(beforeModify.length).toBe(taskLength);
        beforeModify.forEach(task => {
          if (!TaskSchema(task)) throw new Error("schema is incompatible.");

          const isExists = taskList[task.name];
          expect(isExists).toBeDefined();
          expect(task.channel).toBe(isExists.channel);
          expect(task.message).toBe(isExists.message);
          expect(task.interval).toBe(isExists.interval);
        });

        prepareSpy.mockClear();
      });

      test("success message is returned and scheduler is also updated", () => {
        const updatedTask = {
          name: "task" + taskLength.toString(),
          channel: "test_channel4",
          interval: 2468,
          message: "modified message"
        };

        const checkTask = "SELECT name, channel, message, interval " +
          "FROM tasks WHERE name = ?";
        const specificTask = testConn.prepare(checkTask);
        const chooseTask = "task" + (taskLength / 2).toString();

        expect(specificTask.all(chooseTask).length).toBe(1);
        expect(specificTask.all(updatedTask.name).length).toBe(0);

        const status = tasks.updateTask(chooseTask, updatedTask);
        const addTaskCallOrder = addTaskSpy.mock.invocationCallOrder[0];
        const removeTaskCallOrder = removeTaskSpy.mock.invocationCallOrder[0];

        expect(removeTaskCallOrder).toBeLessThan(addTaskCallOrder);
        expect(specificTask.all(chooseTask).length).toBe(0);
        expect(specificTask.all(updatedTask.name).length).toBe(1);

        // Verify updated task exists.
        const row = specificTask.get(updatedTask.name);
        expect(row).toBeDefined();

        // Compare other properties of a specific task.
        const afterModify = allTasks.all([]);
        expect(afterModify.length).toBe(taskLength);
        afterModify.forEach(task => {
          if (!TaskSchema(task)) throw new Error("schema is incompatible.");

          expect(task.name).not.toBe(chooseTask);
          if (task.name === updatedTask.name) {
            // Already verified updated task name.
            expect(task.channel).toBe(updatedTask.channel);
            expect(task.message).toBe(updatedTask.message);
            expect(task.interval).toBe(updatedTask.interval);
          }
          else {
            const isExists = taskList[task.name];
            expect(isExists).toBeDefined();
            expect(task.channel).toBe(isExists.channel);
            expect(task.message).toBe(isExists.message);
            expect(task.interval).toBe(isExists.interval);
          }
        });

        expect(status).toBe(`Task ${chooseTask} successfully modified.`);
      });

      describe("but trying to modify an unknown task", () => {
        test("message is relayed indicating the task is non-existent", () => {
          const updatedTask = {
            name: "task" + taskLength.toString(),
            channel: "test_channel4",
            interval: 2468,
            message: "modified message"
          };

          const unknownTaskName = "task" + taskLength.toString();
          const status = tasks.updateTask(unknownTaskName, updatedTask);

          const afterModify = allTasks.all([]);
          expect(afterModify.length).toBe(taskLength);
          afterModify.forEach(task => {
            if (!TaskSchema(task)) throw new Error("schema is incompatible.");
            expect(task.name).not.toBe(unknownTaskName);
            const isExists = taskList[task.name];
            expect(isExists).toBeDefined();
            expect(task.channel).toBe(isExists.channel);
            expect(task.message).toBe(isExists.message);
            expect(task.interval).toBe(isExists.interval);
          });

          expect(status).toBe(`The task '${unknownTaskName}' does not exists.`);
          expect(addTaskSpy).not.toBeCalled();
          expect(removeTaskSpy).not.toBeCalled();
        });
      });

      describe("can be deleted from the database", () => {
        test("success message is returned and the scheduler is updated", () => {
          const testDB = new Database(databasePath);
          const statement = testDB.prepare("SELECT NULL;");
          const taskName = "deletetask";
          const runMock = jest.fn(() => ({ ...statement.run(), changes: 1 }));

          prepareSpy.mockImplementationOnce(() => {
            const mockStatement: Statement = {
              ...statement,
              run: runMock
            };
            return mockStatement;
          });

          const status = tasks.deleteTask(taskName);
          expect(prepareSpy).toBeCalledWith("DELETE FROM tasks WHERE name = ?");
          expect(runMock).toBeCalledWith(taskName);
          expect(removeTaskSpy).toBeCalledWith(taskName);
          expect(status).toBe(`Task ${taskName} successfully removed.`);
        });

        test("tasks is actually removed from the database", () => {
          const deleteTaskName = "task" + (taskLength / 2).toString();
          const status = tasks.deleteTask(deleteTaskName);
          const afterModify = allTasks.all([]);

          expect(prepareSpy).toBeCalledTimes(1);
          expect(prepareSpy).toBeCalledWith("DELETE FROM tasks WHERE name = ?");
          expect(afterModify.length).toBe(taskLength - 1);
          expect(removeTaskSpy).toBeCalledTimes(1);
          expect(removeTaskSpy).toHaveBeenCalledWith(deleteTaskName);
          expect(status).toBe(`Task ${deleteTaskName} successfully removed.`);
        });

        test("message is relayed back that the task is non-existent", () => {
          const taskName = "task" + taskLength.toString();
          const status = tasks.deleteTask(taskName);
          const afterModify = allTasks.all([]);

          expect(prepareSpy).toBeCalledTimes(1);
          expect(prepareSpy)
            .toBeCalledWith("DELETE FROM tasks WHERE name = ?");
          expect(afterModify.length).toBe(taskLength);
          expect(removeTaskSpy).not.toBeCalled();

          expect(status).toBe(`The task '${taskName}' does not exists.`);
        });

        test("every task can be cleared and removed from scheduler", () => {
          const status = tasks.clearTasks();
          const afterModify = allTasks.all([]);

          expect(prepareSpy).toBeCalledTimes(2);
          expect(prepareSpy).toBeCalledWith("DELETE FROM tasks");
          expect(afterModify.length).toBe(0);
          expect(removeTaskSpy).toBeCalledTimes(taskLength);
          for (let i = 0; i < taskLength; i++) {
            expect(removeTaskSpy).toHaveBeenCalledWith("task" + i.toString());
          }
          expect(status).toBe("Tasks are cleared.");
          // Clearing an empty task list.
          expect(tasks.clearTasks()).toBe("Tasks are already cleared.");
        });
      });
    });
  });
});
