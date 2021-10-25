require("dotenv").config();
const tmi = require("tmi.js");

const { opts } = require("./config");


const SEND_INTERVAL = parseInt(process.env.SEND_INTERVAL) || 30;
const DUPMSG_CHAR = process.env.DUPMSG_CHAR;

let LAST_SENT = Date.now();
let DUPMSG_STATUS = process.env.DUPMSG_STATUS;


// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on("message", onMessageHandler);
client.on("connected", onConnectedHandler);

// Connect to Twitch:
client.connect();


// Called every time a message comes in
function onMessageHandler(target, context, msg, self) {
    const prefixLength = process.env.PREFIX.length;

    if (self) {
        DUPMSG_STATUS = DUPMSG_STATUS === "1" ? "0" : "1";
        return; // Ignore messages from the bot
    }

    // Ignore non-prefixed messages
    if (!(msg.substring(0, prefixLength) === process.env.PREFIX)) {
        return;
    }

    // Prevents intentional/unintentional global cooldown
    if (((Date.now() - LAST_SENT) / 1000) < SEND_INTERVAL) {
        return;
    }

    /* Trims whitespace on either side of the chat message and replaces multiple
       whitespaces, tabs or newlines between words with just one whitespace */
    const request = msg.trim().replace(/\s\s+/g, ' ').split(' ');
    let response = msg;

    if (DUPMSG_STATUS === "1") {
        // Circumvents Twitch's duplicate message filter 
        response = response + ` ${DUPMSG_CHAR}`;
    }

    if (request) {
        client.say(target, response);
        LAST_SENT = Date.now();

        console.log(`* Executed ${msg} command`);
    } else {
        console.log(`* Unknown command ${msg}`);
    }
}


// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
}