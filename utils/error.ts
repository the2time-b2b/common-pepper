interface SendOptions {
  status: boolean,
}

interface Options {
  toUser: SendOptions;
}

export class ProcessError extends Error {
  /** Should the error message be visible to the user as a feedback. */
  options: Options;


  constructor(
    message: string,
    options: Options = {
      toUser: {
        status: false,
      }
    }
  ) {
    super(message);
    this.name = "Input Error";
    this.options= options;
  }
}
