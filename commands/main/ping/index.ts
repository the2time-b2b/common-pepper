import Command from "../../command";


const ping: Command = {
  exec(_context, request): string {
    const additionalRequest = request[0]; // Ignore the rest.
    if (additionalRequest === "help") {
      return "Checks if the bot is connected.";
    }
    if (additionalRequest === "usage") {
      return `"${process.env.PREFIX}ping" FailFish`;
    }

    return "R) 7";
  }
};


export default ping;
