import Command from "../../command";


const replace: Command = {
  exec(_context, request) {
    switch (request[0]) {
      case "help":
        return "Replace two or more words.";

      case "usage":
        return `Usage: ${process.env.PREFIX}replace` +
          "[replaced word] [new word] [message]";
    }

    let re;
    if (request[0] === "word") {
      request.splice(0,1);
      re = new RegExp(`\\b${request[0]}\\b`, "g");
    }
    else {
      re = new RegExp(`${request[0]}`, "g");
    }

    const originalMessage = request.splice(2);
    const replacedMessage = originalMessage.join(" ");

    return replacedMessage.replace(re, request[1]);
  }
};


export default replace;
