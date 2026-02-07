export function normalizeLineBreaks(value: string): string {
  return value.replace(/\r\n?/g, '\n');
}
