import Tasks, { AtLeastOne, DBTask } from "../../../../commands/main/say/tasks";
import { CommandAttributes } from "../../../../commands/main/say/types";

import say from "../../../../commands/main/say";

import {
  checkAttributeStructure,
  validateModifyAttribute,
  checkInterval,
  checkChannelName,
  checkTaskName,
  validateInterval,
  parseInterval,
  convertToSeconds
} from "../../../../commands/main/say/service";

import description from "../../../../commands/main/say/description";


jest.mock("../../../../types/client", () => {
  return jest.fn().mockImplementation(() => {
    return {
      connect: jest.fn().mockResolvedValue(["", 0]),
      on: jest.fn()
    };
  });
});
jest.mock("../../../../commands/main/say/service");
jest.mock("../../../../commands/main/say/tasks");

// Preinitialize validators.
(checkAttributeStructure as unknown as jest.Mock).mockReturnValue(true);
(validateModifyAttribute as unknown as jest.Mock).mockReturnValue(true);
(checkInterval as unknown as jest.Mock).mockReturnValue(true);
(checkChannelName as jest.Mock).mockReturnValue(true);
(checkTaskName as jest.Mock).mockReturnValue(true);
(validateInterval as jest.Mock).mockReturnValue(true);
(parseInterval as jest.Mock).mockReturnValue([0, 0, 0]);


describe("say command", () => {
  test("is a compatible commands that can be executed", () => {
    expect(say).toHaveProperty("exec");
  });


  describe("is executed successfully using a valid command", () => {
    const createTaskSpy = jest.spyOn(Tasks.prototype, "createTask");

    describe("to create a new task", () => {
      test("where the task is successfully created", () => {
        const dummyInterval = 0;
        const dummyStatus = "dummy status";

        createTaskSpy.mockReturnValue(dummyStatus);
        (convertToSeconds as jest.Mock).mockReturnValue(dummyInterval);

        const request = [
          "test",
          "message",
          "every",
          "1:2:3",
          "on",
          "justintv",
          "named",
          "task-name"
        ];
        const newTask = {
          message: "test message",
          interval: dummyInterval,
          channel: "justintv",
          name: "task-name"
        };

        const status = say.exec({}, request, "test_channel");

        expect(createTaskSpy).toBeCalledTimes(1);
        expect(createTaskSpy).toBeCalledWith(newTask);
        expect(status).toBe(dummyStatus);
      });
    });


    describe("to clear a task list", () => {
      test("where status is returned that the task list were removed", () => {
        const request = ["clear", "task", "list"];
        const status = say.exec({}, request, "test_channel");

        expect(createTaskSpy).toBeCalledTimes(1);
        expect(status).toBe("The task list has been wiped clean.");
      });
    });


    describe("to modify a task", () => {
      const dummyStatus = "dummy status";

      describe("where status of the task modified is returned ", () => {
        describe("back to the caller", () => {
          test("within the main execution method", () => {
            const modifyTaskSpy = jest.spyOn(say, "modifyTask");
            modifyTaskSpy.mockReturnValueOnce(dummyStatus);

            const request = ["modify", "test", "task", "attribute"];
            const modifyRequest = request.slice(1);
            const status = say.exec({}, request, "test_channel");

            expect(modifyTaskSpy).toBeCalledWith(modifyRequest);
            expect(status).toBe(dummyStatus);
          });


          describe("for both", () => {
            test("modify deletes, where it deletes the task", () => {
              const deleteRequests = [
                ["task-name", "delete"],
                ["task-name", "remove"]
              ];

              deleteRequests.forEach(request => {
                const deleteTaskSpy = jest.spyOn(Tasks.prototype, "deleteTask");
                deleteTaskSpy.mockReturnValueOnce(dummyStatus);

                const status = say.modifyTask(request);

                expect(deleteTaskSpy).toBeCalledWith("task-name");
                expect(status).toBe(dummyStatus);
              });
            });


            test("modify updates, where it updates the task", () => {
              const updateTaskSpy = jest.spyOn(Tasks.prototype, "updateTask");
              updateTaskSpy.mockReturnValueOnce(dummyStatus);
              (validateModifyAttribute as unknown as jest.Mock)
                .mockReturnValueOnce(true);

              const request = [
                "task-name",
                CommandAttributes.channel,
                "request"
              ];

              type SwappedObject<T extends Record<string, string>> = {
                [K in keyof T as T[K]]: K;
              };

              const attribute: SwappedObject<typeof CommandAttributes> = {
                every: "interval",
                named: "name",
                on: "channel",
                say: "message"
              };

              const modifiedTask: AtLeastOne<DBTask> = {
                [attribute[CommandAttributes.channel]]: request[2]
              };
              const status = say.modifyTask(request);

              expect(updateTaskSpy).toBeCalledWith("task-name", modifiedTask);
              expect(status).toBe(dummyStatus);
            });
          });
        });
      });


      describe("but fails validity checks", () => {
        // Validators are mock returned, no need to test actual attribute value.
        const testValue = "dummy";


        describe("when modifying a message but the length is zero", () => {
          test("returns how a message needs to be specified", () => {
            const status = say.modifyTask(["task-name", "say"]);
            expect(status).toBe(description.message);
          });
        });


        describe("when modifying the interval", () => {
          beforeEach(() => (validateInterval as jest.Mock).mockClear());


          describe("it is structurally invalid", () => {
            test("returns the way an interval is to be structured", () => {
              (checkInterval as unknown as jest.Mock)
                .mockReturnValueOnce(false);

              const status = say.modifyTask(["task-name", "every", testValue]);

              expect(checkInterval).toBeCalled();
              expect(validateInterval).not.toBeCalled();
              expect(status).toBe(description.interval);
            });
          });


          describe("it hass an illegal value range", () => {
            test("returns the rules for a valid interval", () => {
              (validateInterval as jest.Mock).mockReturnValueOnce(false);

              const status = say.modifyTask(["task-name", "every", testValue]);

              expect(validateInterval).toBeCalled();
              expect(status).toBe(description.interval);
            });
          });
        });


        describe("but channel name is structurally invalid", () => {
          test("returns the rules of a valid username", () => {
            (checkChannelName as jest.Mock).mockReturnValueOnce(false);

            const status = say.modifyTask(["task-name", "on", testValue]);

            expect(checkChannelName).toBeCalled();
            expect(status).toBe(description.channel);
          });
        });


        describe("but task name is invalid", () => {
          test("returns the rules of a valid task name", () => {
            (checkTaskName as jest.Mock).mockReturnValueOnce(false);

            const status = say.modifyTask(["task-name", "named", testValue]);

            expect(checkTaskName).toBeCalled();
            expect(status).toBe(description["task-name"]);
          });
        });
      });
    });
  });


  describe("has a request that is improperly formatted", () => {
    describe("when no attribute is supplied", () => {
      it("returns the command usage", () => {
        const status = say.exec({}, [], "test_channel");

        expect(status).toBe(description.usage);
      });
    });
  });


  describe("whose validity checks for the command does not pass", () => {
    const attributeLength = Object.values(CommandAttributes).length * 2;
    // Task message argument does not have a key in a create task request.
    const requestLength = attributeLength - 1;
    const request = Array<string>(requestLength).fill("dummy");
    const channel = "test_channel";


    describe("when attribute key-value length is less than required", () => {
      it("returns the command usage", () => {
        for (let i = 1; i < requestLength; i++) {
          const status = say.exec({}, Array<string>(i).fill("dummy"), channel);
          expect(status).toBe(description.usage);
        }
      });
    });


    describe("when command attributes are structured improperly", () => {
      it("returns the command usage", () => {
        (checkAttributeStructure as unknown as jest.Mock)
          .mockReturnValueOnce(false);

        const status = say.exec({}, [...request], channel);
        expect(status).toBe(description.usage);
      });
    });


    describe("when interval is structurally invalid", () => {
      it("returns the way in which interval is to be structured", () => {
        (checkInterval as unknown as jest.Mock).mockReturnValueOnce(false);

        const status = say.exec({}, [...request], channel);
        expect(status).toBe(description.interval);
      });
    });


    describe("when channel name is structurally invalid", () => {
      it("returns information on rules of a valid username", () => {
        (checkChannelName as jest.Mock).mockReturnValueOnce(false);

        const status = say.exec({}, [...request], channel);
        expect(status).toBe(description.channel);
      });
    });


    describe("but task name is invalid", () => {
      it("returns information on rules of a valid task name", () => {
        (checkTaskName as jest.Mock).mockReturnValueOnce(false);

        const status = say.exec({}, [...request], channel);
        expect(status).toBe(description["task-name"]);
      });
    });


    describe("when interval has a illegal value range", () => {
      it("returns information on rules of a valid interval", () => {
        (validateInterval as jest.Mock).mockReturnValueOnce(false);

        const status = say.exec({}, [...request], channel);
        expect(status).toBe(description.interval);
      });
    });
  });
});

