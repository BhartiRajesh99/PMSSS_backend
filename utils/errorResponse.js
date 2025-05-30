class ErrorResponse extends Error {
  constructor(
    message = "Something went wrong",
    statusCode,
    errorCode = null,
    response = null
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.response = response;
    this.data = null;
    this.message = message;
    this.success = false;
  }
}

export { ErrorResponse };
