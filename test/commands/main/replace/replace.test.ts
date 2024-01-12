import replace from "../../../../commands/main/replace";


describe("replaces a string with a replacement string", () => {
  test("returns the original message if the string is not found", () => {
    const message = "test real this is an actual message";
    const expectedResponse = "this is an actual message";
    const request = message.split(/\s+/);
    const response = replace.exec({}, request);

    expect(response).toBe(expectedResponse);
  });

  test("sub-strings are also replaced", () => {
    const message = "ipsum foo ipsum loremipsumdolor, Loremdolor ipsum";
    const expectedResponse = "foo loremfoodolor, Loremdolor foo";
    const request = message.split(/\s+/);
    const response = replace.exec({}, request);

    expect(response).toBe(expectedResponse);
  });
});


describe("replaces a word with a replacement word", () => {
  test("but returns the original message if the word is not found", () => {
    const message = "word test real this is an actual message";
    const expectedResponse = "this is an actual message";
    const request = message.split(/\s+/);
    const response = replace.exec({}, request);

    expect(response).toBe(expectedResponse);
  });

  test("sub-strings are not replaced as they are not words", () => {
    const message = "word ipsum foo ipsum loremipsumdolor, Loremdolor ipsum";
    const expectedResponse = "foo loremipsumdolor, Loremdolor foo";
    const request = message.split(/\s+/);
    const response = replace.exec({}, request);

    expect(response).toBe(expectedResponse);
  });
});
