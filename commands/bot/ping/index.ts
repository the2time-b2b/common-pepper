import Command from "../../command";


const ping: Command = {
  exec(context, request): string {
    const additionalRequest = request[0]; // Ignore the rest.
    if (additionalRequest === "help") {
      return "Checks if the bot is connected.";
    }
    if (additionalRequest === "usage") {
      return `"${process.env.PREFIX}ping" FailFish`;
    }

    const displayName = context["display-name"];
    if (!displayName) throw new Error("The display name is not supplied.");

    const botUsername = process.env.USERNAME;
    if (!botUsername) {
      throw new Error("Environment variable 'USERNAME' is not set.");
    }

    if (displayName.toLowerCase() === botUsername.toLowerCase()) return "R) 7";
    return `@${displayName.toLowerCase()}, R) 7`;
  }
};


export default ping;
