import Command from "../commands/command";
import execute from "../commands";
import * as commandList from "../commands/helper";


type MockedCommand = Omit<Command, "exec"> & {exec: jest.Mock};
type MockedCommandList = {[commands: string]: MockedCommand};

jest.mock("../commands/helper", () => {
  return {
    command1: { exec: jest.fn().mockReturnValue("command1 invoked") }
  };
});

const mockedCommandList = commandList as unknown as MockedCommandList;

beforeEach(() => mockedCommandList.command1.exec.mockClear());


describe("when a command is sent and the handler is invoked", () => {
  const prefix = process.env.PREFIX;

  afterEach(() => {
    process.env.PREFIX = prefix;
  });

  describe("command is successfully executed", () => {
    const context = { ["display-name"]: "justintv" };
    const request = ["!command1", "test", "command"];
    let result: string;

    test("the prefixed command is sliced from the request", () => {
      result = execute(context, request);
      expect(mockedCommandList.command1.exec)
        .toHaveBeenCalledWith(context, ["test", "command"]);
    });
    test("and result is returned", () => {
      expect(result).toBe("command1 invoked");
    });
  });

  test("throw an error if the environment variable 'PREFIX is not set", () => {
    const context = { ["display-name"]: "justintv" };
    const request = ["dummy", "request"];
    process.env.PREFIX = "";

    expect(() => execute(context, request))
      .toThrow("Environment variable 'PREFIX' is not set.");
  });

  test("command is invalid", () => {
    const context = { ["display-name"]: "justintv" };
    const request = ["!command2"];

    const result = execute(context, request);

    expect(result).toBe(`@${context["display-name"]}, enter a valid command.`);
  });

  test("command is invalid but the display is not supplied", () => {
    const context = {};
    const request = ["!command2"];

    expect(() => execute(context, request))
      .toThrow("display-name is not supplied");
  });
});
