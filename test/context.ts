import { ChatUserstate } from "tmi.js";

type userState = {
  user: { context: ChatUserstate, self: boolean },
  bot: { context: ChatUserstate, self: boolean }
};

const userState: userState = {
  user: {
    context: {
      "badge-info": undefined,
      badges: undefined,
      color: undefined,
      "display-name": "JustinTV",
      emotes: undefined,
      "first-msg": false,
      flags: undefined,
      id: "69ed5902-bfe6-4b25-ac52-1e9401b3ad9a",
      mod: false,
      "room-id": "12345678",
      subscriber: false,
      "tmi-sent-ts": "1635422176472",
      turbo: false,
      "user-id": "123456789",
      "user-type": undefined,
      "emotes-raw": undefined,
      "badge-info-raw": undefined,
      "badges-raw": undefined,
      username: "justintv",
      "message-type": "chat"
    },
    self: false
  },

  bot: {
    context: {
      "badge-info": undefined,
      badges: undefined,
      color: undefined,
      "display-name": "bot_lol",
      "emote-sets": null,
      mod: false,
      subscriber: false,
      "user-type": undefined,
      "badge-info-raw": undefined,
      "badges-raw": undefined,
      username: "bot_lol",
      emotes: {},
      "emotes-raw": undefined,
      "message-type": "chat"
    },
    self: true
  }
};


export default userState;
