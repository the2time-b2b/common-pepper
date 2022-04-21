module.exports = async function response(client, request, target, result) {
  try {
    await client.say(target, result);
  }
  catch (err) {
    if (err.name !== "sendIntervalError") {
      console.error(err);
    }
  }
};
