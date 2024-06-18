export function getStatusCode(): number {
  return process.exitCode ?? 0;
}
