export class GotrylError extends Error {
  statusCode: number;
  code: string;
  details: unknown;

  constructor(
    statusCode: number,
    envelope: { error: { code: string; message: string; details?: unknown } },
  ) {
    super(envelope.error.message);
    this.name = 'GotrylError';
    this.statusCode = statusCode;
    this.code = envelope.error.code;
    this.details = envelope.error.details;
  }
}
