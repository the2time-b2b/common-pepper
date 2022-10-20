// Define configuration options
module.exports = {
  identity: {
    username: process.env.USERNAME.toLowerCase(),
    password: process.env.TOKEN
  },
  channels: [
    process.env.CHANNEL.toLowerCase()
  ]
};
