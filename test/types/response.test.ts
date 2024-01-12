import BotResponse from "../../types/response";


describe("for a response instance", () => {
  const request = "test request";
  const target = "#test_target";
  const response = "test reponse";
  const responseState = new BotResponse(request, target.substring(1), response);

  test("check if duplication filter bypass can be toggled", () => {
    responseState.activateDuplicationFilterByass(false);

    expect(responseState.response).toBe(response);

    responseState.activateDuplicationFilterByass(true);

    const filterByPassChar = "\udb40\udc00";
    expect(responseState.response).toBe(`${response} ${filterByPassChar}`);
  });


  test("check if the response state contains expected property values", () => {
    responseState.activateDuplicationFilterByass(false);

    const defaultResendCount = 0;

    expect(responseState.request).toBe(request);
    expect(responseState.target).toBe(target);
    expect(responseState.response).toBe(response);
    expect(responseState.resendCount).toBe(defaultResendCount);
  });
});

test("throw an error is DUPMSG_CHAR environment variable is not set", () => {
  process.env.DUPMSG_CHAR = "";

  const request = "test request";
  const target = "#test_target";
  const response = "test reponse";
  const responseState = new BotResponse(request, target.substring(1), response);

  responseState.activateDuplicationFilterByass(true);

  expect(() => responseState.response)
    .toThrow("Environment variable 'DUPMSG_CHAR' is not set.");
});

