export type OutputFormat = 'human' | 'json';

export function printResult(data: unknown, format: OutputFormat): void {
  if (format === 'json') {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
  } else {
    if (typeof data === 'string') {
      console.log(data);
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

export function printError(code: string, message: string, format: OutputFormat): void {
  const envelope = { error: { code, message } };
  if (format === 'json') {
    process.stderr.write(JSON.stringify(envelope, null, 2) + '\n');
  } else {
    console.error(`Error [${code}]: ${message}`);
  }
}
