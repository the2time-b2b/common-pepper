import { Options } from "tmi.js";


if (!process.env.USERNAME) {
  throw new Error("Environment variable 'USERNAME' is not set.");
}

if (!process.env.TOKEN) {
  throw new Error("Environment variable 'TOKEN' is not set.");
}

if (!process.env.CHANNEL) {
  throw new Error("Environment variable 'CHANNEL' is not set.");
}


// Define configuration options
export const opts: Options = {
  identity: {
    username: process.env.USERNAME.toLowerCase(),
    password: process.env.TOKEN
  },
  channels: [
    process.env.CHANNEL.toLowerCase()
  ]
};
