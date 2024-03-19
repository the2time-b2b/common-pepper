import path from "path";
import fs from "fs";
import { Task, SimpleIntervalJob, ToadScheduler } from "toad-scheduler";

import Repeat from "../../../../../../commands/bot/task/triggers/repeat";
import RepeatTable from "../../../../../../commands/bot/task/triggers/repeat/model";
import {
  TriggerTypes,
  isSchedulable
} from "../../../../../../commands/bot/task/triggers/types";


jest.mock("toad-scheduler");
jest.mock("../../../../../../commands/bot/task/triggers/repeat/model");
jest.mock("../../../../../../commands/bot/task/triggers/types");

const mockedTask = Task as unknown as jest.Mock;
const mockedModel = RepeatTable as unknown as jest.Mock;
const mockedIsSchedulable = isSchedulable as unknown as jest.Mock;
const mockedSimpleIntervalJob = SimpleIntervalJob as unknown as jest.Mock;
const mockedToadScheduler = ToadScheduler as unknown as jest.Mock;
const createScheduleSpy = jest.spyOn(mockedModel.prototype, "createSchedule");
const getScheduleSpy = jest.spyOn(mockedModel.prototype, "getSchedule");
const updateScheduleSpy = jest.spyOn(mockedModel.prototype, "updateSchedule");
const mockedAddJob = jest
  .spyOn(mockedToadScheduler.prototype, "addSimpleIntervalJob");
const removeByIdSpy = jest.spyOn(mockedToadScheduler.prototype, "removeById");
const databaseDirectory = path.join(process.cwd(), "db",);
const databasePath = path.join(databaseDirectory, "triggers.test.db");

beforeAll(() => {
  mockedIsSchedulable.mockReturnValue(true);
});

afterAll(() => {
  // Delete test database.
  if (fs.existsSync(databasePath)) fs.rmSync(databasePath);
});

beforeEach(() => {
  jest.clearAllMocks();
  Repeat.clearJobs();
});


describe("When the trigger is inititalize", () => {
  test("A database is scheduled", () => {
    new Repeat();
    expect(mockedModel).toBeCalledTimes(1);
  });
});

describe("the trigger can be created", () => {
  const mockedValue = { hours: 1, minutes: 1, seconds: 1 };
  const primaryKey = 1;
  const repeat = new Repeat();

  createScheduleSpy.mockReturnValue(primaryKey);


  test("but throws an error if it is not scheduleable", () => {
    mockedIsSchedulable.mockReturnValueOnce(false);
    expect(() => { repeat.create(mockedValue); }).toThrowError();
  });

  it("creates a schedule", () => {
    expect(Repeat.activeJobs).toBe(0);

    const createdID = repeat.create(mockedValue);
    const scheduledTask = mockedTask.mock.instances[0] as Task;
    const job = mockedSimpleIntervalJob.mock.instances[0] as SimpleIntervalJob;
    const seconds = mockedValue.seconds+ (mockedValue.minutes * 60) +
      (mockedValue.hours * 60 * 60);

    expect(createdID).toBe(primaryKey);
    expect(mockedTask).toBeCalledTimes(1);
    expect(mockedTask)
      .toBeCalledWith("Recurring Bot Response", expect.any(Function));
    expect(mockedSimpleIntervalJob)
      .toBeCalledWith({ seconds }, scheduledTask, primaryKey.toString());
    expect(mockedAddJob).toBeCalledWith(job);
    expect(Repeat.activeJobs).toBe(1);
    expect(Repeat.checkJob(primaryKey)).toBeTruthy();
  });

  test("cannot start a schedule with an duplicate ID", () => {
    expect(Repeat.activeJobs).toBe(0);
    repeat.create(mockedValue);
    expect(Repeat.activeJobs).toBe(1);
    expect(() => { repeat.create(mockedValue); })
      .toThrow(`Job with '${primaryKey}' is already active.`);
    expect(Repeat.activeJobs).toBe(1);
  });
});

describe("the trigger can be restarted", () => {
  const repeat = new Repeat();
  const triggerID = 1;
  const mockedValue = {
    hours: 1,
    minutes: 1,
    seconds: 1
  } as TriggerTypes["repeat"];

  getScheduleSpy.mockReturnValue(mockedValue);
  createScheduleSpy.mockReturnValue(triggerID);

  beforeEach(() => {
    repeat.create(mockedValue);
  });

  test("for an ID", () => {
    let seconds = mockedValue.seconds;
    seconds += mockedValue.minutes * 60;
    seconds += mockedValue.hours * 60 * 60;

    mockedSimpleIntervalJob.mockRestore();
    mockedTask.mockReset();
    repeat.restart(triggerID, false);

    const job = mockedSimpleIntervalJob.mock.instances[0] as SimpleIntervalJob;
    const scheduledTask = mockedTask.mock.instances[0] as Task;

    expect(Repeat.activeJobs).toBe(1);
    expect(Repeat.checkJob(triggerID)).toBeTruthy();
    expect(getScheduleSpy).toBeCalledWith(triggerID);
    expect(mockedTask)
      .toBeCalledWith("Recurring Bot Response", expect.any(Function));
    expect(removeByIdSpy).toBeCalledWith(triggerID.toString());

    expect(mockedSimpleIntervalJob)
      .toBeCalledWith({ seconds }, scheduledTask, triggerID.toString());
    expect(mockedAddJob).toBeCalledWith(job);
  });

  test("trying to restart a non-existant job", () => {
    expect(() => { repeat.restart(triggerID + 1, false); })
      .toThrow(`Job with ID '${triggerID + 1}' does not exists.`);
  });

  it("inititalizes a job during startup", () => {
    Repeat.clearJobs();

    expect(Repeat.activeJobs).toBe(0);
    repeat.restart(triggerID, true);
    expect(Repeat.activeJobs).toBe(1);
    expect(Repeat.checkJob(triggerID)).toBeTruthy();
  });

  it("ID already exists during startup", () => {
    expect(Repeat.activeJobs).toBe(1);
    const exitSpy = jest.spyOn(process, "exit").mockImplementation();
    const consoleErrorSpy = jest.spyOn(console, "error");
    repeat.restart(triggerID, true);
    expect(consoleErrorSpy)
      .toBeCalledWith(
        `Job with ID '${triggerID}' already exists during startup.`
      );

    exitSpy.mockRestore();
  });
});

describe("the trigger can be deleted", () => {
  const triggerID = 1;
  const repeat = new Repeat();
  createScheduleSpy.mockReturnValue(triggerID);

  beforeEach(() => {
    const mockedValue = {
      hours: 1,
      minutes: 1,
      seconds: 1
    } as TriggerTypes["repeat"];
    repeat.create(mockedValue);
  });

  test("for a job with an ID", () => {
    expect(Repeat.activeJobs).toBe(1);
    repeat.delete(triggerID);
    expect(Repeat.activeJobs).toBe(0);
  });

  test("only for a job with an ID that exists", () => {
    expect(Repeat.activeJobs).toBe(1);
    expect(() => repeat.delete(triggerID + 1))
      .toThrow(`Job with '${triggerID + 1}' does not exists.`);

    expect(Repeat.activeJobs).toBe(1);
  });
});

describe("the trigger can be updated", () => {
  let triggerID: number;
  const repeat = new Repeat();

  test("using an ID and values to be updated", () => {
    const mockedValue = {
      hours: 1, minutes: 1, seconds: 1
    } as TriggerTypes["repeat"];

    triggerID = repeat.create(mockedValue);
    expect(Repeat.activeJobs).toBe(1);

    repeat.update(triggerID, mockedValue);

    const scheduledTask = mockedTask.mock.instances[0] as Task;
    const job = mockedSimpleIntervalJob.mock.instances[0] as SimpleIntervalJob;
    const seconds = mockedValue.seconds + (mockedValue.minutes * 60)
      + (mockedValue.hours * 60 * 60);

    expect(Repeat.activeJobs).toBe(1);
    expect(Repeat.checkJob(triggerID)).toBeTruthy();
    expect(removeByIdSpy).toBeCalledWith(triggerID.toString());
    expect(updateScheduleSpy).toBeCalledWith(
      triggerID,
      mockedValue.hours,
      mockedValue.minutes,
      mockedValue.seconds
    );
    expect(mockedTask)
      .toBeCalledWith("Recurring Bot Response", expect.any(Function));
    expect(mockedSimpleIntervalJob)
      .toBeCalledWith({ seconds }, scheduledTask, triggerID.toString());
    expect(mockedAddJob).toBeCalledWith(job);
  });

  test("trying to update a job that does not exists", () => {
    const mockedValue = {
      hours: 1, minutes: 1, seconds: 1
    } as TriggerTypes["repeat"];

    triggerID = repeat.create(mockedValue);
    expect(Repeat.activeJobs).toBe(1);
    mockedSimpleIntervalJob.mockClear();
    mockedAddJob.mockClear();

    expect(() => {
      repeat.update(triggerID + 1, mockedValue);
    }).toThrow(`Job with '${triggerID + 1}' does not exists.`);

    expect(Repeat.activeJobs).toBe(1);
    expect(Repeat.checkJob(triggerID)).toBeTruthy();
    expect(removeByIdSpy).not.toBeCalled();
    expect(updateScheduleSpy).not.toBeCalled();
    expect(mockedSimpleIntervalJob).not.toBeCalled();
    expect(mockedAddJob).not.toBeCalled();
  });
});

