class sendIntervalError {
  name = "sendIntervalError";
  channel;
  message = "Message is being sent too quickly.";

  constructor(channel, message) {
    this.channel = channel;
    if (message) this.message = message;
  }
}


module.exports = { sendIntervalError };
