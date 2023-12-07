import Command from "../../command";


const parrot: Command = {
  exec(_context, request) {
    if (request[1] === "usage") {
      return `Usage: ${process.env.PREFIX}parrot [message]`;
    }

    const parrotedMessage = request.join(" ");

    return parrotedMessage;
  }
};


export default parrot;
