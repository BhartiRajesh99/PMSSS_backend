class ErrorResponse extends Error {
  constructor(
    message,
    statusCode,
    errorCode = null,
    response = null,
    message = "Something went wrong"
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.response = response;
    this.data = null;
    this.message = message;
  }
}

export { ErrorResponse };
