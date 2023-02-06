import { SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";
import {
  default as Scheduler,
  ParsedTask
} from "../../../../commands/main/say/scheduler";
import { DBTask } from "../../../../commands/main/say/tasks";
import Client from "../../../../types/client";
import Channel from "../../../../types/channel";


jest.mock("toad-scheduler");
jest.mock("../../../../types/client");
jest.mock("../../../../types/channel");


describe("Scheduler", () => {
  const MockedClient = Client as jest.MockedClass<typeof Client>;
  const clientConnectSpy = jest.spyOn(MockedClient.prototype, "connect");

  afterEach(() => {
    clientConnectSpy.mockClear();
    (Task as jest.Mock).mockClear();
    (SimpleIntervalJob as jest.Mock).mockClear();
  });


  describe("should schedule each task from the database", () => {
    test("when its init method is invoked", async() => {
      const addTaskSpy = jest.spyOn(Scheduler, "addTask");

      clientConnectSpy.mockResolvedValueOnce(["", 0]);

      const baseTaskAttributes: DBTask = {
        channel: "test_channel1",
        interval: "12345",
        message: "hello :D"
      };

      const parsedTasks: Array<ParsedTask> = [];
      const totalTasks = 10;
      for (let i = 0; i < totalTasks; i++) {
        parsedTasks.push({
          ...baseTaskAttributes,
          interval: Number(baseTaskAttributes.interval),
          taskName: `task${i}`
        });
      }

      await Scheduler.init(parsedTasks);

      const addTaskArgumentList = addTaskSpy.mock.calls[0];

      expect(clientConnectSpy).toBeCalled();
      expect(addTaskSpy).toBeCalledTimes(totalTasks);
      for (let i = 0; i < addTaskArgumentList.length; i++) {
        const task = addTaskArgumentList[i];
        expect(task).toBe(parsedTasks[i]);
      }
    });
  });


  describe("will add a task", () => {
    const MockedChannel = Channel as jest.MockedClass<typeof Channel>;

    const addSimpleIntervalJob = ToadScheduler.prototype.addSimpleIntervalJob;
    const mockGetChannel = MockedChannel.getChannel as jest.Mock;
    const mockCheckChannel = MockedChannel.checkChannel as jest.Mock;
    const mockSimpleIntervalJob = SimpleIntervalJob as jest.Mock;
    const mockAddIntervalJob = addSimpleIntervalJob as jest.Mock;

    mockGetChannel.mockImplementation(() => {
      return {
        getResponseQueue: jest.fn().mockReturnValue({
          enqueue: jest.fn()
        }),
      };
    });

    beforeEach(() => {
      MockedChannel.mockClear();
      mockGetChannel.mockClear();
      mockAddIntervalJob.mockClear();
      mockSimpleIntervalJob.mockClear();
    });

    describe("by scheduling it", () => {
      it("when the target channel is already initalized", () => {
        mockCheckChannel.mockReturnValue(true);

        const task: ParsedTask = {
          taskName: "task",
          channel: "channel",
          message: "message",
          interval: 60
        };

        Scheduler.addTask(task);

        expect(MockedChannel).not.toBeCalled();
        expect(mockAddIntervalJob).toBeCalled();
        expect(Task)
          .toHaveBeenCalledWith("Recurring Bot Response", expect.any(Function));
        expect(mockSimpleIntervalJob).toHaveBeenCalledWith(
          { seconds: task.interval },
          expect.any(Task),
          task.taskName
        );
        expect(addSimpleIntervalJob)
          .toBeCalledWith(mockSimpleIntervalJob.mock.instances[0]);
      });


      it("and creating a channel instance if it is not initalized", () => {
        mockCheckChannel.mockReturnValue(false);

        const task: ParsedTask = {
          taskName: "task",
          channel: "channel",
          message: "message",
          interval: 60
        };

        Scheduler.addTask(task);

        expect(MockedChannel).toBeCalledWith(expect.any(Client), task.channel);
        expect(mockGetChannel).not.toBeCalled();
      });
    });
  });


  describe("will remove a task", () => {
    const mockRemoveByID = ToadScheduler.prototype.removeById as jest.Mock;
    const taskName = "task name";

    beforeEach(() => mockRemoveByID.mockClear());


    test("when a task name is passed", () => {
      mockRemoveByID.mockReturnValue(true);

      Scheduler.removeTask(taskName);
      expect(mockRemoveByID).toBeCalledWith("task name");
    });


    test("but will throw an error if the task does not exists", () => {
      mockRemoveByID.mockReturnValue(false);


      expect(() => Scheduler.removeTask(taskName))
        .toThrow(`Non-existant task ${taskName} cannot be removed`);
    });
  });
});

