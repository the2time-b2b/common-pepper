import ping from "../../../commands/bot/ping";


describe("when a ping command is executed", () => {
  let initialBotUsername: string | undefined;
  const testBotUsername = "test_bot";

  beforeAll(() => {
    initialBotUsername = process.env.USERNAME;
    process.env.USERNAME = testBotUsername ;
  });

  afterEach(() => {
    process.env.USERNAME = testBotUsername;
  });

  afterAll(() => {
    process.env.USERNAME = initialBotUsername;
  });


  describe("which is invoked by a user", () => {
    it("returns a string with the display name", () => {
      const context = { ["display-name"]: "justintv" };
      const displayName = context["display-name"];

      const result = ping.exec(context, []);
      expect(result).toBe(`@${displayName.toLowerCase()}, R) 7`);
    });
  });

  describe("which is invoked by the bot itself", () => {
    it("returns 'R) 7'", () => {
      const context = { ["display-name"]: testBotUsername };

      const result = ping.exec(context, []);
      expect(result).toBe("R) 7");
    });
  });

  describe("but the display name is not supplied", () => {
    it("it throws an error", () => {
      const context = {};

      expect(() => ping.exec(context, []))
        .toThrow("The display name is not supplied.");
    });
  });

  describe("but the bot username is not set", () => {
    it("it throws an error", () => {
      process.env.USERNAME = "";

      const context = { ["display-name"]: "justintv" };

      expect(() => ping.exec(context, []))
        .toThrow("Environment variable 'USERNAME' is not set.");
    });
  });

  describe("with additional arguments such as", () => {
    describe("'help'", () => {
      it("returns a string explaining the command", () => {
        const context = { ["display-name"]: "justintv" };

        const result = ping.exec(context, ["help"]);
        expect(result).toBe("Checks if the bot is connected.");
      });
    });

    describe("'usage'", () => {
      it("returns a string indicating the usage format", () => {
        const context = { ["display-name"]: "justintv" };

        const result = ping.exec(context, ["usage"]);
        expect(result).toBe(`"${process.env.PREFIX}ping" FailFish`);
      });
    });
  });
});

