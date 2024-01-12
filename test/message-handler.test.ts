import Channel from "../types/channel";
import Response from "../types/response";

import { onMessageHandler } from "../common-pepper";
import * as executeCommand from "../commands";

import entities from "./context";


// Prevents static auto-instantiation in '../commands/main/say/scheduler'.
jest.mock("../types/client", () => {
  return jest.fn().mockImplementation(() => {
    return {
      connect: jest.fn().mockResolvedValue(["", 0]),
      on: jest.fn()
    };
  });
});
jest.mock("../types/channel");
jest.mock("../commands");

const mockEnqueue = jest.fn();
Channel.getResponseQueue = jest.fn().mockReturnValue({ enqueue: mockEnqueue });


describe("message handler", () => {
  const testPrefix = "!";
  const target = "#test_target";
  const testResponse = "test response";

  const executeCommandSpy = jest.spyOn(executeCommand, "default");
  executeCommandSpy.mockImplementation(() => { return testResponse; });


  beforeEach(() => {
    process.env.PREFIX = testPrefix;
    process.env.USERNAME = entities.user.context["display-name"]?.toLowerCase();
  });


  describe("for a valid command with a response", () => {
    it("should log raw requests", () => {
      const { context, self } = entities.user;
      const request = `${testPrefix}command`;

      const loggerSpy = jest.spyOn(console, "info");
      loggerSpy.mockClear();

      onMessageHandler(target, context, request, self);
      expect(loggerSpy.mock.calls[0][0])
        .toBe(`\n* Raw request "${request}" Received`);
    });


    it("should push a response to intended channel's response queue", () => {
      const { context, self } = entities.user;
      const request = `${testPrefix}command`;

      onMessageHandler(target, context, request, self);
      expect(mockEnqueue.mock.calls.length).toBe(1);

      const mockEnqueueArgs: unknown = mockEnqueue.mock.calls[0];

      if (Array.isArray(mockEnqueueArgs)) {
        const responseState: unknown = mockEnqueueArgs[0];
        expect(responseState).toBeInstanceOf(Response);
        if (responseState instanceof Response) {
          expect(responseState.target).toBe(target);
          expect(responseState.request).toBe(request);
          expect(responseState.response).toBe(testResponse);
        }
        else {
          throw new Error("'responseState' must be of the type 'Response'.");
        }
      }
      else {
        throw new Error("Argument list must be an array.");
      }
    });


    it("must replace multiple whitespaces with a single whitespace", () => {
      const { context, self } = entities.user;
      const expectedRequest = `${process.env.PREFIX}command user test message`;
      const request = `${testPrefix}command             ` +
        "user             test message                     ";

      onMessageHandler(target, context, request, self);
      expect(executeCommandSpy.mock.calls.length).toBe(1);
      expect((executeCommandSpy.mock.calls[0][1]).join(" "))
        .toBe(expectedRequest);
    });
  });


  describe("for valid commands without a response", () => {
    it("should ignore messages from bot's own request", () => {
      const { context, self } = entities.bot;
      const request = `${testPrefix}command`;

      onMessageHandler(target, context, request, self);
      expect(executeCommandSpy.mock.calls.length).toBe(0);
    });


    it("throws an error if environment variable 'PREFIX' is not set", () => {
      const { context, self } = entities.user;
      const request = `${testPrefix}command`;

      delete process.env.PREFIX;

      expect(() => onMessageHandler(target, context, request, self))
        .toThrow("Environment variable 'PREFIX' is not set.");
    });


    it("throws an error if environment variable 'USERNAME' is not set", () => {
      const { context, self } = entities.user;
      const request = `${testPrefix}command`;

      delete process.env.USERNAME;

      expect(() => onMessageHandler(target, context, request, self))
        .toThrow("Environment variable 'USERNAME' is not set.");
    });


    it("throws an error for undefined context's display-name property", () => {
      const { context, self } = entities.user;
      const request = `${testPrefix}command`;

      const modifiedContext = { ...context, ["display-name"]: undefined };
      expect(() => onMessageHandler(target, modifiedContext, request, self))
        .toThrow("display name was not supplied.");
    });


    it("should ignore messages from unauthorized user", () => {
      const { context, self } = entities.user;
      const request = `${testPrefix}command`;

      const loggerSpy = jest.spyOn(console, "info");
      loggerSpy.mockClear();

      const username = process.env.USERNAME;
      const endUser = "notjustintv"; // Change authorization.
      process.env.USERNAME = endUser;

      onMessageHandler(target, context, request, self);
      expect(executeCommandSpy.mock.calls.length).toBe(0);
      expect(loggerSpy.mock.calls[0][0])
        .toBe(`\n* Environment variable 'USERNAME' is set to ${endUser}.`);
      expect(loggerSpy.mock.calls[1][0])
        .toBe(`* ${username} has no privilege to execute any command.`);
    });
  });


  describe("for invalid commands", () => {
    it("with no prefix should be ignored", () => {
      const { context, self } = entities.user;
      const request = "ping";

      onMessageHandler(target, context, request, self);
      expect(executeCommandSpy.mock.calls.length).toBe(0);
    });


    it("with an unknown prefix should be ignored", () => {
      const { context, self } = entities.user;

      process.env.PREFIX = "$"; // Change command prefix.
      const request = "!ping";

      onMessageHandler(target, context, request, self);
      expect(executeCommandSpy.mock.calls.length).toBe(0);
    });
  });


  afterEach(() => {
    executeCommandSpy.mockClear();
    mockEnqueue.mockClear();
  });
});

