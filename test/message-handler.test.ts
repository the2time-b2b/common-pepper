import Client from "../types/client";
import Channel from "../types/channel";


import { onMessageHandler } from "../common-pepper";
import * as executeCommand from "../commands";

import entities from "./context";

const dummyClient = new Client({});
const testChannel = new Channel(dummyClient, "test_target");
const responseQueue = testChannel.getResponseQueue();


describe("Message handler should", () => {
  describe("be able to ", () => {
    const executeCommandSpy = jest.spyOn(executeCommand, "default");

    it("respond if a prefixed messages is received", () => {
      const { context, self } = entities.user;
      const target = "#test_target";
      const msg = `${process.env.PREFIX}ping`;
      const response = "R) 7";

      onMessageHandler(target, context, msg, self);
      expect(executeCommandSpy.mock.calls.length).toBe(1);
      expect(executeCommandSpy.mock.results[0].value).toBe(response);
      responseQueue.dequeue();
    });


    it("ignores messages with no prefix", () => {
      const { context, self } = entities.user;
      const target = "#test_target";
      const msg = "ping";

      onMessageHandler(target, context, msg, self);
      expect(executeCommandSpy.mock.calls.length).toBe(0);
    });


    it("ignores unknown commands", () => {
      const { context, self } = entities.user;
      const target = "#test_target";
      const msg = `${process.env.PREFIX}someRandomCommand test message`;
      const response = `@${context["display-name"]}, enter a valid command.`;

      onMessageHandler(target, context, msg, self);
      expect(executeCommandSpy.mock.calls.length).toBe(1);
      expect(executeCommandSpy.mock.results[0].value).toBe(response);
      responseQueue.dequeue();
    });


    it("replace multiple whitespaces with a single whitespace", () => {
      const responseQueueEnqueueSpy = jest.spyOn(responseQueue, "enqueue");

      const { context, self } = entities.user;
      const target = "#test_target";
      const response = `@${context["display-name"]}, enter a valid command.`;
      const expectedRequest = `${process.env.PREFIX}testCmd user test message`;
      let msg = `${process.env.PREFIX}testCmd             `;
      msg += "user             test message                     ";

      onMessageHandler(target, context, msg, self);
      expect(executeCommandSpy.mock.calls.length).toBe(1);
      expect(executeCommandSpy.mock.results[0].value).toBe(response);
      expect((executeCommandSpy.mock.calls[0][1]).join(" "))
        .toBe(expectedRequest);

      expect(responseQueueEnqueueSpy.mock.calls.length).toBe(1);

      const responseState = responseQueueEnqueueSpy.mock.calls[0][0];
      expect(responseState.target).toBe(target);
      expect(responseState.request).toBe(expectedRequest);
      expect(responseState.response).toBe(response);
      responseQueue.dequeue();
    });


    it("ignore messages from bot's own request", () => {
      const { context, self } = entities.bot;
      const target = "#test_target";
      const msg = "!ping";

      onMessageHandler(target, context, msg, self);
      expect(executeCommandSpy.mock.calls.length).toBe(0);
    });

    afterEach(() => {
      executeCommandSpy.mockClear();
    });
  });


  afterAll(() => {
    // Empty response queue to avoid open handles.
    while (!responseQueue.isEmpty()) responseQueue.dequeue();
  });
});
