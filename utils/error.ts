type ValidationError = {
  response: string;
  message?: string;
}


export default class CommonError extends Error  {
  public returnMesssage: string;

  constructor(error: ValidationError) {
    super(error.message);

    this.returnMesssage = error.response;
  }
}

