import parrot from "../../../../commands/main/parrot";


test("parrot command should resend user's input messages", () => {
  const message = "this is a test message";
  const request = message.split(/\s+/);
  const response = parrot.exec({}, request);

  expect(response).toBe(message);
});
